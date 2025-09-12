import { z } from "zod";

export const RoleSchema = z.enum(["owner", "admin", "member", "staff", "viewer"]);
export type Role = z.infer<typeof RoleSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1).optional(),
  orgId: z.string().min(1).nullable(),
  role: RoleSchema,
  onboardingComplete: z.boolean().default(false),
  createdAt: z.string().datetime().optional(),
  lastLoginAt: z.string().datetime().optional()
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  displayName: z.string().min(1).optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  createdAt: z.string().datetime(),
  ownerId: z.string().min(1)
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const InviteSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  invitedBy: z.string().min(1),
  email: z.string().email().optional(),
  role: RoleSchema.default("member"),
  code: z.string().min(6),
  expiresAt: z.string().datetime(),
  usedAt: z.string().datetime().optional(),
  usedBy: z.string().min(1).optional()
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
  recurringPattern: z.string().optional()
});
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

// Re-export from other modules
export * from "./auth.js";
export * from "./onboarding.js";
