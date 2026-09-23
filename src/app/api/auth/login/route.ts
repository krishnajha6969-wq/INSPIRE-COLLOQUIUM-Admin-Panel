import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionCookie } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';
import { loginSchema } from '@/lib/schemas';
import { UserRole } from '@/lib/enums';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Rate limit: 5 attempts per IP per minute
    const rateLimitResult = rateLimit(`login:${ip}`, { limit: 5, windowMs: 60 * 1000 });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Too many login attempts. Please wait 1 minute before trying again.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { message: parseResult.error.errors[0]?.message || 'Invalid login payload' },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      await createAuditLog({
        action: 'LOGIN_FAILED',
        entityType: 'User',
        details: { email, reason: 'Invalid email or inactive user' },
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ message: 'Invalid credentials or account disabled' }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await createAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role as UserRole,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        details: { reason: 'Incorrect password' },
        ipAddress: ip,
        userAgent,
      });
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role as UserRole,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error during authentication' }, { status: 500 });
  }
}
