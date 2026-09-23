import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { UserRole } from '@/lib/enums';

const SESSION_COOKIE_NAME = 'inspire_session';
const SESSION_EXPIRY_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  expiresAt: number;
  issuedAt: number;
}

export function base64UrlEncode(str: string | Uint8Array): string {
  const buffer = typeof str === 'string' ? Buffer.from(str) : Buffer.from(str);
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

export function signToken(payload: SessionPayload): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const secret = process.env.JWT_SECRET || 'inspire-colloquium-default-super-secret-key-change-in-prod-32-chars';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataToSign);
  const signature = base64UrlEncode(hmac.digest());

  return `${dataToSign}.${signature}`;
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const dataToSign = `${encodedHeader}.${encodedPayload}`;

    const secret = process.env.JWT_SECRET || 'inspire-colloquium-default-super-secret-key-change-in-prod-32-chars';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(dataToSign);
    const expectedSignature = base64UrlEncode(hmac.digest());

    if (signature !== expectedSignature) {
      return null;
    }

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload));

    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: Omit<SessionPayload, 'expiresAt' | 'issuedAt'>): Promise<string> {
  const now = Date.now();
  const fullPayload: SessionPayload = {
    ...payload,
    issuedAt: now,
    expiresAt: now + SESSION_EXPIRY_MS,
  };

  const token = signToken(fullPayload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_MS / 1000,
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  return verifyToken(token);
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
