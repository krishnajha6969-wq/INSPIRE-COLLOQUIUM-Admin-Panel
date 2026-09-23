import { prisma } from './db';
import { UserRole } from '@/lib/enums';

export interface AuditLogOptions {
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: UserRole | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function createAuditLog(options: AuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: options.actorId ?? null,
        actorEmail: options.actorEmail ?? 'SYSTEM',
        actorRole: options.actorRole ?? null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? null,
        details: options.details ? JSON.stringify(options.details) : null,
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
  }
}
