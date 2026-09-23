import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/rbac';
import { createAuditLog } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'settings:manage')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const settings = await prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return NextResponse.json({ message: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !hasPermission(session.role, 'settings:manage')) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value, description } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ message: 'Key is required' }, { status: 400 });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value: String(value), ...(description ? { description } : {}) },
      create: { key, value: String(value), description: description || '' },
    });

    await createAuditLog({
      actorId: session.userId,
      actorEmail: session.email,
      actorRole: session.role,
      action: 'SYSTEM_SETTING_UPDATED',
      entityType: 'SystemSetting',
      entityId: setting.id,
      details: { key, value },
      ipAddress: req.headers.get('x-forwarded-for'),
      userAgent: req.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('Update setting error:', error);
    return NextResponse.json({ message: 'Failed to update setting' }, { status: 500 });
  }
}
