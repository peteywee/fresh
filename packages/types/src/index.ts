import { z } from "zod";

export const Role = z.enum(["owner", "admin", "member"]);
export type Role = z.infer<typeof Role>;

export const Organization = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  createdAt: z.string()
});
export type Organization = z.infer<typeof Organization>;

export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  orgId: z.string().uuid().optional(),
  role: Role.optional()
});
export type User = z.infer<typeof User>;

export const OnboardingRequest = z.object({
  user: z.object({
    email: z.string().email(),
    displayName: z.string().min(1)
  }),
  org: z.object({
    name: z.string().min(2)
  })
});
export type OnboardingRequest = z.infer<typeof OnboardingRequest>;

export const OnboardingResponse = z.object({
  user: User,
  org: Organization
});
export type OnboardingResponse = z.infer<typeof OnboardingResponse>;
