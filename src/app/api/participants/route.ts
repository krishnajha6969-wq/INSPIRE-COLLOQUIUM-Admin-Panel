import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { AcademicCategory, RegistrationStatus, SelectionStatus } from '@/lib/enums';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '@/lib/audit';
import { participantSchema } from '@/lib/schemas';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'participants:view')) {
      return NextResponse.json({ message: 'Unauthorized access to participant directory' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') as AcademicCategory | null;
    const selectionStatus = searchParams.get('selectionStatus') as SelectionStatus | null;
    const registrationStatus = searchParams.get('registrationStatus') as RegistrationStatus | null;
    const isCheckInCompletedParam = searchParams.get('isCheckInCompleted');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const skip = (page - 1) * limit;

    const where: Prisma.ParticipantWhereInput = {};

    if (category) {
      where.academicCategory = category;
    }
    if (selectionStatus) {
      where.selectionStatus = selectionStatus;
    }
    if (registrationStatus) {
      where.registrationStatus = registrationStatus;
    }
    if (isCheckInCompletedParam !== null && isCheckInCompletedParam !== undefined) {
      where.isCheckInCompleted = isCheckInCompletedParam === 'true';
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { applicationSeqNo: { contains: q } },
        { collegeName: { contains: q } },
        { paperTitle: { contains: q } },
        { deskToken: { contains: q } },
      ];
    }

    const [participants, total] = await Promise.all([
      prisma.participant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.participant.count({ where }),
    ]);

    // Calculate capacity counts
    const selectedCounts = await prisma.participant.groupBy({
      by: ['academicCategory'],
      where: { selectionStatus: 'SELECTED' },
      _count: { _all: true },
    });

    const selectedByCat = selectedCounts.reduce(
      (acc, item) => {
        acc[item.academicCategory] = item._count._all;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      participants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalParticipants: total,
        selectedUG: selectedByCat['UG'] || 0,
        selectedPG: selectedByCat['PG'] || 0,
        selectedPhD: selectedByCat['PHD'] || 0,
      },
      complete: true,
    });
  } catch (error) {
    console.error('Fetch participants error:', error);
    return NextResponse.json({ message: 'Failed to retrieve participants' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'participants:create')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = participantSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Check duplicate application sequence number or email
    const existing = await prisma.participant.findFirst({
      where: {
        OR: [{ applicationSeqNo: data.applicationSeqNo }, { email: data.email.toLowerCase() }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Participant with this application number or email already exists' },
        { status: 409 }
      );
    }

    // Generate unique desk token
    const deskToken = `INSPIRE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const participant = await prisma.participant.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
        deskToken,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'PARTICIPANT_CREATED',
      entityType: 'Participant',
      entityId: participant.id,
      details: { name: participant.name, email: participant.email, category: participant.academicCategory },
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true, participant }, { status: 201 });
  } catch (error) {
    console.error('Create participant error:', error);
    return NextResponse.json({ message: 'Failed to create participant' }, { status: 500 });
  }
}
