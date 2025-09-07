
import { z } from "zod";

export const Role = z.enum(["manager", "user"]);
export type Role = z.infer<typeof Role>;

export const LoginRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  email: z.string().email(),
  role: Role
});
export type LoginResponse = z.infer<typeof LoginResponse>;

export const Organization = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  taxId: z.string().regex(/^\d{2}-\d{7}$/, "Must match format: 12-3456789")
});
export type Organization = z.infer<typeof Organization>;

export const I9Info = z.object({
  ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, "SSN format: 123-45-6789"),
  citizenshipStatus: z.enum(["citizen", "permanent_resident", "authorized_worker"])
});
export type I9Info = z.infer<typeof I9Info>;

export const UserProfile = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
  orgId: z.string().uuid().optional(),
  i9: I9Info.optional()
});
export type UserProfile = z.infer<typeof UserProfile>;

export const OnboardingRequest = z.object({
  user: UserProfile.omit({ id: true, orgId: true }),
  org: Organization.omit({ id: true })
});
export type OnboardingRequest = z.infer<typeof OnboardingRequest>;
