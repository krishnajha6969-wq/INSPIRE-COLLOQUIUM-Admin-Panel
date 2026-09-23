import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { generateCsv } from '@/lib/export';
import { createAuditLog } from '@/lib/audit';
import { AcademicCategory, SelectionStatus, RegistrationStatus } from '@/lib/enums';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'participants:export')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as AcademicCategory | null;
    const selectionStatus = searchParams.get('selectionStatus') as SelectionStatus | null;
    const registrationStatus = searchParams.get('registrationStatus') as RegistrationStatus | null;
    const search = searchParams.get('search') || '';

    const where: Prisma.ParticipantWhereInput = {};
    if (category) where.academicCategory = category;
    if (selectionStatus) where.selectionStatus = selectionStatus;
    if (registrationStatus) where.registrationStatus = registrationStatus;
    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { applicationSeqNo: { contains: q } },
        { collegeName: { contains: q } },
        { paperTitle: { contains: q } },
      ];
    }

    const participants = await prisma.participant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const headers = [
      { key: 'applicationSeqNo' as const, label: 'Application Seq No' },
      { key: 'deskToken' as const, label: 'Desk Token' },
      { key: 'name' as const, label: 'Name' },
      { key: 'email' as const, label: 'Email' },
      { key: 'phone' as const, label: 'Phone' },
      { key: 'academicCategory' as const, label: 'Category' },
      { key: 'collegeName' as const, label: 'College / Institution' },
      { key: 'degree' as const, label: 'Degree' },
      { key: 'paperTitle' as const, label: 'Paper Title' },
      { key: 'selectionStatus' as const, label: 'Selection Status' },
      { key: 'registrationStatus' as const, label: 'Registration Status' },
      { key: 'amountPaid' as const, label: 'Amount Paid' },
      { key: 'transactionId' as const, label: 'Transaction ID' },
      { key: 'isCheckInCompleted' as const, label: 'Desk Checked In' },
      { key: 'checkInTime' as const, label: 'Check In Timestamp' },
      { key: 'issuedKit' as const, label: 'Issued Kit' },
      { key: 'createdAt' as const, label: 'Registered At' },
    ];

    const csvContent = generateCsv(participants as any[], headers);

    await createAuditLog({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'CSV_EXPORT_DOWNLOADED',
      entityType: 'Participant',
      details: { recordCount: participants.length, categoryFilter: category },
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    return new NextResponse('\uFEFF' + csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="INSPIRE-Participants-${dateStr}.csv"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('CSV Export error:', error);
    return NextResponse.json({ message: 'Failed to export CSV' }, { status: 500 });
  }
}
