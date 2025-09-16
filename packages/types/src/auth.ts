import { z } from 'zod';

import { RoleSchema } from './role.js';

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  orgChoice: z.enum(['create', 'join']).default('create'),
  org: z
    .object({
      name: z.string().min(2),
      id: z.string().optional(),
    })
    .optional(),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const SessionSchema = z.object({
  sub: z.string().min(1), // Firebase user ID
  email: z.string().email(),
  displayName: z.string().optional(),
  role: RoleSchema.optional(),
  orgId: z.string().optional(),
  orgName: z.string().optional(),
  onboardingComplete: z.boolean().default(false),
  iat: z.number().optional(),
  exp: z.number().optional(),
});
export type Session = z.infer<typeof SessionSchema>;

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: z
    .object({
      id: z.string().min(1),
      email: z.string().email(),
      displayName: z.string().optional(),
      role: RoleSchema.optional(),
      onboardingComplete: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
  token: z.string().optional(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
