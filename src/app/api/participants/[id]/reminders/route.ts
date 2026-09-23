import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { sendEmail } from '@/lib/email';
import { createAuditLog } from '@/lib/audit';

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours between reminders

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'participants:status_update')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const participant = await prisma.participant.findUnique({ where: { id } });

    if (!participant) {
      return NextResponse.json({ message: 'Participant not found' }, { status: 404 });
    }

    if (participant.selectionStatus !== 'SELECTED') {
      return NextResponse.json({ message: 'Only selected participants can receive payment reminders' }, { status: 400 });
    }

    if (participant.registrationStatus === 'REGISTERED') {
      return NextResponse.json({ message: 'Participant has already completed payment registration' }, { status: 400 });
    }

    // Cooldown check
    if (participant.lastReminderAt) {
      const elapsed = Date.now() - participant.lastReminderAt.getTime();
      if (elapsed < REMINDER_COOLDOWN_MS) {
        const hoursLeft = Math.ceil((REMINDER_COOLDOWN_MS - elapsed) / (60 * 60 * 1000));
        return NextResponse.json(
          { message: `Reminder was sent recently. Please wait ${hoursLeft} hours before sending another.` },
          { status: 429 }
        );
      }
    }

    const emailSent = await sendEmail({
      to: participant.email,
      subject: `INSPIRE Colloquium — Selection Notification & Payment Reminder`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #173635;">
          <h2>Congratulations, ${participant.name}!</h2>
          <p>Your abstract <strong>"${participant.paperTitle}"</strong> for the <strong>INSPIRE Colloquium 2026</strong> (${participant.academicCategory} category) has been <strong>SELECTED</strong>.</p>
          <p>To finalize your registration, please complete the payment step.</p>
          <p><strong>Desk Registration Token:</strong> <code>${participant.deskToken || participant.applicationSeqNo}</code></p>
          <p>Thank you,<br/>INSPIRE Colloquium Organising Committee</p>
        </div>
      `,
    });

    if (emailSent) {
      await prisma.participant.update({
        where: { id },
        data: { lastReminderAt: new Date() },
      });

      await createAuditLog({
        actorId: session.userId,
        actorEmail: session.email,
        actorRole: session.role,
        action: 'PAYMENT_REMINDER_SENT',
        entityType: 'Participant',
        entityId: id,
        details: { recipientEmail: participant.email },
        ipAddress: req.headers.get('x-forwarded-for'),
        userAgent: req.headers.get('user-agent'),
      });

      return NextResponse.json({ status: 'sent', message: 'Payment reminder sent successfully' });
    }

    return NextResponse.json({ status: 'queued', message: 'Payment reminder queued for delivery' });
  } catch (error) {
    console.error('Send payment reminder error:', error);
    return NextResponse.json({ message: 'Failed to send payment reminder' }, { status: 500 });
  }
}
