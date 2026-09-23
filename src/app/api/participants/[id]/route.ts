import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';
import { updateParticipantStatusSchema } from '@/lib/schemas';
import { CAPACITY } from '@/lib/constants';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'participants:view')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const participant = await prisma.participant.findUnique({
      where: { id },
    });

    if (!participant) {
      return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ participant });
  } catch (error) {
    console.error('Fetch participant detail error:', error);
    return NextResponse.json({ message: 'Failed to fetch participant details' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'participants:status_update')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const expectedVersion = typeof body.expectedVersion === 'number' ? body.expectedVersion : null;

    const parseResult = updateParticipantStatusSchema.safeParse({ ...body, participantId: id });
    if (!parseResult.success) {
      return NextResponse.json({ message: parseResult.error.errors[0]?.message || 'Invalid input' }, { status: 400 });
    }

    const { selectionStatus, registrationStatus, remarks } = parseResult.data;

    // Use transaction to ensure optimistic concurrency & capacity control
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.participant.findUnique({ where: { id } });
      if (!current) {
        throw new Error('PARTICIPANT_NOT_FOUND');
      }

      // Concurrency check
      if (expectedVersion !== null && current.version !== expectedVersion) {
        throw new Error('CONCURRENCY_CONFLICT');
      }

      // Verified payment lock check
      if (current.registrationStatus === 'REGISTERED' && current.selectionStatus === 'SELECTED' && selectionStatus === 'REJECTED') {
        throw new Error('VERIFIED_PAYMENT_LOCKED');
      }

      // Selection capacity check
      if (selectionStatus === 'SELECTED' && current.selectionStatus !== 'SELECTED') {
        const currentSelectedCount = await tx.participant.count({
          where: {
            academicCategory: current.academicCategory,
            selectionStatus: 'SELECTED',
          },
        });

        const categoryLimit = (CAPACITY as Record<string, number>)[current.academicCategory] || 60;
        if (currentSelectedCount >= categoryLimit) {
          throw new Error('CAPACITY_REACHED');
        }
      }

      const nextVersion = current.version + 1;
      const updatedParticipant = await tx.participant.update({
        where: { id, version: current.version },
        data: {
          ...(selectionStatus ? { selectionStatus } : {}),
          ...(registrationStatus ? { registrationStatus } : {}),
          ...(remarks !== undefined ? { remarks } : {}),
          version: nextVersion,
        },
      });

      return { current, updatedParticipant };
    });

    await createAuditLog({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'PARTICIPANT_STATUS_UPDATED',
      entityType: 'Participant',
      entityId: id,
      details: {
        oldSelectionStatus: updated.current.selectionStatus,
        newSelectionStatus: updated.updatedParticipant.selectionStatus,
        oldRegistrationStatus: updated.current.registrationStatus,
        newRegistrationStatus: updated.updatedParticipant.registrationStatus,
        version: updated.updatedParticipant.version,
        remarks,
      },
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true, participant: updated.updatedParticipant });
  } catch (error: any) {
    if (error.message === 'CONCURRENCY_CONFLICT') {
      return NextResponse.json(
        { message: 'Record was updated by another administrator. Please refresh and try again.' },
        { status: 409 }
      );
    }
    if (error.message === 'CAPACITY_REACHED') {
      return NextResponse.json(
        { message: 'Selection limit for this category has been reached.' },
        { status: 409 }
      );
    }
    if (error.message === 'VERIFIED_PAYMENT_LOCKED') {
      return NextResponse.json(
        { message: 'Cannot reject a participant with verified payment status without prior refund review.' },
        { status: 400 }
      );
    }
    if (error.message === 'PARTICIPANT_NOT_FOUND') {
      return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
    }

    console.error('Update participant error:', error);
    return NextResponse.json({ message: 'Failed to update participant' }, { status: 500 });
  }
}
