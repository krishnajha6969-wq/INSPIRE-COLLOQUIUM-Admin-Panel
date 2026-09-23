import { UserRole } from '@/lib/enums';

export type Permission =
  | 'participants:view'
  | 'participants:create'
  | 'participants:edit'
  | 'participants:delete'
  | 'participants:export'
  | 'participants:import'
  | 'participants:status_update'
  | 'desk:checkin'
  | 'users:manage'
  | 'audit:view'
  | 'settings:manage';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'participants:view',
    'participants:create',
    'participants:edit',
    'participants:delete',
    'participants:export',
    'participants:import',
    'participants:status_update',
    'desk:checkin',
    'users:manage',
    'audit:view',
    'settings:manage',
  ],
  ADMIN: [
    'participants:view',
    'participants:create',
    'participants:edit',
    'participants:export',
    'participants:import',
    'participants:status_update',
    'desk:checkin',
    'audit:view',
  ],
  DESK_OPERATOR: ['participants:view', 'desk:checkin'],
  VOLUNTEER: ['participants:view', 'desk:checkin'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: Role ${role} lacks permission ${permission}`);
  }
}
