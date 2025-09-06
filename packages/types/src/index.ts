
import { z } from "zod";

/**
 * User of the scheduler system.
 * Can be an admin (manages org), staff (assigned to shifts), or viewer.
 */
export const UserSchema = z.object({
	id: z.string().uuid(),
	email: z.string().email(),
	orgId: z.string().uuid().nullable(),
	role: z.enum(["admin", "staff", "viewer"]),
	onboardingComplete: z.boolean()
});
export type User = z.infer<typeof UserSchema>;

/**
 * Organization that groups users together.
 * Created during onboarding.
 */
export const OrganizationSchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1),
	createdAt: z.string().datetime(),
	ownerId: z.string().uuid()
});
export type Organization = z.infer<typeof OrganizationSchema>;

/**
 * A single scheduled entry (e.g., a staff shift).
 */
export const ScheduleEntrySchema = z.object({
	id: z.string().uuid(),
	userId: z.string().uuid(),
	orgId: z.string().uuid(),
	startTime: z.string().datetime(),
	endTime: z.string().datetime(),
	role: z.string().min(1)
});
export type ScheduleEntry = z.infer<typeof ScheduleEntrySchema>;

