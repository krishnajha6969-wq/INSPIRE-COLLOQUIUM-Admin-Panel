import { NextRequest, NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/session';
import { createAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const session = await getSession();

  if (session) {
    await createAuditLog({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'LOGOUT',
      entityType: 'User',
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });
  }

  await clearSessionCookie();

  return NextResponse.json({ success: true }, { status: 200 });
}
