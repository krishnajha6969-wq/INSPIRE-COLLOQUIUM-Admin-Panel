import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'DESK_OPERATOR', 'VOLUNTEER']),
  password: z.string().min(10, 'Password must be at least 10 characters'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const participantSchema = z.object({
  applicationSeqNo: z.string().min(1, 'Application Sequence No is required'),
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  collegeName: z.string().min(2, 'College name is required'),
  degree: z.string().min(1, 'Degree is required'),
  academicCategory: z.enum(['UG', 'PG', 'PHD', 'PPG']),
  paperTitle: z.string().min(2, 'Paper title is required'),
  registrationStatus: z.enum(['APPLIED', 'REGISTERED', 'CANCELLED']).default('APPLIED'),
  selectionStatus: z.enum(['UNDER_REVIEW', 'SELECTED', 'REJECTED', 'WAITLISTED']).default('UNDER_REVIEW'),
  amountPaid: z.number().min(0).default(0),
  transactionId: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
});

export type ParticipantInput = z.infer<typeof participantSchema>;

export const updateParticipantStatusSchema = z.object({
  participantId: z.string(),
  selectionStatus: z.enum(['UNDER_REVIEW', 'SELECTED', 'REJECTED', 'WAITLISTED']).optional(),
  registrationStatus: z.enum(['APPLIED', 'REGISTERED', 'CANCELLED']).optional(),
  remarks: z.string().optional(),
});

export const deskCheckInSchema = z.object({
  identifier: z.string().min(1, 'Participant ID, Token, or Email is required'),
  issuedKit: z.boolean().default(false),
  issuedCertificate: z.boolean().default(false),
  notes: z.string().optional(),
});

export const participantFilterSchema = z.object({
  search: z.string().optional(),
  academicCategory: z.enum(['UG', 'PG', 'PHD', 'PPG']).optional(),
  selectionStatus: z.enum(['UNDER_REVIEW', 'SELECTED', 'REJECTED', 'WAITLISTED']).optional(),
  registrationStatus: z.enum(['APPLIED', 'REGISTERED', 'CANCELLED']).optional(),
  isCheckInCompleted: z.boolean().optional(),
  collegeName: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ParticipantFilterInput = z.infer<typeof participantFilterSchema>;
