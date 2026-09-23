export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DESK_OPERATOR' | 'VOLUNTEER';
export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN' as UserRole,
  ADMIN: 'ADMIN' as UserRole,
  DESK_OPERATOR: 'DESK_OPERATOR' as UserRole,
  VOLUNTEER: 'VOLUNTEER' as UserRole,
};

export type AcademicCategory = 'UG' | 'PG' | 'PHD' | 'PPG';
export const AcademicCategory = {
  UG: 'UG' as AcademicCategory,
  PG: 'PG' as AcademicCategory,
  PHD: 'PHD' as AcademicCategory,
  PPG: 'PPG' as AcademicCategory,
};

export type SelectionStatus = 'UNDER_REVIEW' | 'SELECTED' | 'REJECTED' | 'WAITLISTED';
export const SelectionStatus = {
  UNDER_REVIEW: 'UNDER_REVIEW' as SelectionStatus,
  SELECTED: 'SELECTED' as SelectionStatus,
  REJECTED: 'REJECTED' as SelectionStatus,
  WAITLISTED: 'WAITLISTED' as SelectionStatus,
};

export type RegistrationStatus = 'APPLIED' | 'REGISTERED' | 'CANCELLED';
export const RegistrationStatus = {
  APPLIED: 'APPLIED' as RegistrationStatus,
  REGISTERED: 'REGISTERED' as RegistrationStatus,
  CANCELLED: 'CANCELLED' as RegistrationStatus,
};
