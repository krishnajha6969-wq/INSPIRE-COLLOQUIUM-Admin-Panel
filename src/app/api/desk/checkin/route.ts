import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { deskCheckInSchema } from '@/lib/schemas';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'desk:checkin')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parseResult = deskCheckInSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.errors[0]?.message || 'Invalid check-in data' },
        { status: 400 }
      );
    }

    const { identifier, issuedKit, issuedCertificate, notes } = parseResult.data;

    // Search by ID, deskToken, applicationSeqNo, or email
    const participant = await prisma.participant.findFirst({
      where: {
        OR: [
          { id: identifier },
          { deskToken: identifier.trim() },
          { applicationSeqNo: identifier.trim() },
          { email: identifier.trim().toLowerCase() },
        ],
      },
    });

    if (!participant) {
      return NextResponse.json({ message: 'Participant not found with the provided identifier' }, { status: 404 });
    }

    if (participant.isCheckInCompleted) {
      return NextResponse.json(
        {
          message: `Participant ${participant.name} was already checked in on ${participant.checkInTime ? new Date(participant.checkInTime).toLocaleTimeString('en-IN') : 'earlier'}.`,
          alreadyCheckedIn: true,
          participant,
        },
        { status: 409 }
      );
    }

    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        isCheckInCompleted: true,
        checkInTime: new Date(),
        checkedInByUserId: session.userId,
        issuedKit,
        issuedCertificate,
        remarks: notes ? `${participant.remarks || ''}\n[Desk Note]: ${notes}`.trim() : participant.remarks,
      },
    });

    await createAuditLog({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'DESK_CHECKIN_COMPLETED',
      entityType: 'Participant',
      entityId: participant.id,
      details: {
        participantName: participant.name,
        issuedKit,
        issuedCertificate,
        deskToken: participant.deskToken,
      },
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully checked in ${updated.name}`,
      participant: updated,
    });
  } catch (error) {
    console.error('Desk check-in error:', error);
    return NextResponse.json({ message: 'Failed to process desk check-in' }, { status: 500 });
  }
}
