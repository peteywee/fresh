import { z } from "zod";
import { RoleSchema } from "./index.js";

export const OnboardingStepSchema = z.enum([
  "welcome",
  "personal-info", 
  "organization-choice",
  "create-organization",
  "join-organization",
  "preferences",
  "complete"
]);
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

export const PersonalInfoSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().default("UTC"),
  profilePicture: z.string().url().optional()
});
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

export const OrganizationDetailsSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  displayName: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.enum([
    "technology",
    "healthcare",
    "finance", 
    "education",
    "retail",
    "manufacturing",
    "consulting",
    "non-profit",
    "government",
    "other"
  ]).optional(),
  size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional()
});
export type OrganizationDetails = z.infer<typeof OrganizationDetailsSchema>;

export const CreateOrgRequestSchema = z.object({
  user: PersonalInfoSchema,
  org: OrganizationDetailsSchema,
  type: z.literal("create").default("create")
});
export type CreateOrgRequest = z.infer<typeof CreateOrgRequestSchema>;

export const JoinOrgRequestSchema = z.object({
  user: PersonalInfoSchema,
  inviteCode: z.string().min(6, "Invite code must be at least 6 characters"),
  type: z.literal("join").default("join")
});
export type JoinOrgRequest = z.infer<typeof JoinOrgRequestSchema>;

export const OnboardingPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  browserNotifications: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  language: z.string().default("en"),
  workingHours: z.object({
    start: z.string().default("09:00"),
    end: z.string().default("17:00"),
    timezone: z.string().default("UTC"),
    workDays: z.array(z.number().min(0).max(6)).default([1, 2, 3, 4, 5])
  }).optional()
});
export type OnboardingPreferences = z.infer<typeof OnboardingPreferencesSchema>;

export const OnboardingStateSchema = z.object({
  currentStep: OnboardingStepSchema.default("welcome"),
  completedSteps: z.array(OnboardingStepSchema).default([]),
  personalInfo: PersonalInfoSchema.optional(),
  organizationChoice: z.enum(["create", "join"]).optional(),
  organizationDetails: OrganizationDetailsSchema.optional(),
  inviteCode: z.string().optional(),
  preferences: OnboardingPreferencesSchema.optional(),
  isComplete: z.boolean().default(false)
});
export type OnboardingState = z.infer<typeof OnboardingStateSchema>;

export const OnboardingResponseSchema = z.object({
  success: z.boolean(),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    displayName: z.string(),
    role: RoleSchema
  }),
  organization: z.object({
    id: z.string().min(1),
    name: z.string().min(2),
    role: RoleSchema
  }),
  nextStep: z.string().optional(),
  error: z.string().optional()
});
export type OnboardingResponse = z.infer<typeof OnboardingResponseSchema>;
