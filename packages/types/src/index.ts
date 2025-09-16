import { z } from 'zod';

import { RoleSchema } from './role.js';

export * from './role.js';

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).optional(),
  orgId: z.string().min(1).nullable(),
  role: RoleSchema,
  onboardingComplete: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  lastLoginAt: z.string().datetime().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).optional(),
  createdAt: z.string().datetime(),
  ownerId: z.string().min(1),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const InviteSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  invitedBy: z.string().min(1),
  email: z.string().email().optional(),
  role: RoleSchema.default('member'),
  code: z.string().min(6),
  expiresAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  usedBy: z.string().min(1).optional(),
});
export type Invite = z.infer<typeof InviteSchema>;

export const ScheduleEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  orgId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  role: z.string().min(1).optional(),
  location: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
});
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

// New lightweight schedule schema matching current app calendar implementation
// (Existing calendar routes store fields named start/end (ms timestamps) not startTime/endTime ISO strings.)
export const ScheduleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  start: z.number().optional(), // epoch ms
  end: z.number().optional(), // epoch ms
  createdBy: z.string().optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
  updatedBy: z.string().optional(),
  confirmed: z.boolean().default(false),
  confirmedAt: z.number().optional(),
  confirmedBy: z.string().optional(),
  declined: z.boolean().default(false),
  declinedAt: z.number().optional(),
  declinedBy: z.string().optional(),
  declineReason: z.string().optional(),
});
export type Schedule = z.infer<typeof ScheduleSchema>;

// Utility filters (kept here so they can be used on both client & server without duplication)
export function filterCalendarVisible(schedules: Schedule[]): Schedule[] {
  return schedules.filter(s => s.confirmed && !s.declined);
}

export function splitByStatus(schedules: Schedule[]) {
  return {
    confirmed: schedules.filter(s => s.confirmed && !s.declined),
    pending: schedules.filter(s => !s.confirmed && !s.declined),
    declined: schedules.filter(s => s.declined),
  };
}

// Simple notification schema (currently only used for decline alerts). Can be expanded later.
export const NotificationSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  type: z.enum(['schedule.declined']),
  scheduleId: z.string().min(1),
  actorId: z.string().min(1),
  createdAt: z.number(),
  message: z.string().min(1),
  reason: z.string().optional(),
  read: z.boolean().default(false),
});
export type Notification = z.infer<typeof NotificationSchema>;

// Re-export from other modules
export * from './auth.js';
export * from './onboarding.js';
