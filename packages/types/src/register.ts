import { z } from 'zod';

export const RegistrationRequest = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1),
  orgChoice: z.enum(['create', 'join']),
  org: z
    .object({
      id: z.string().uuid().optional(),
      name: z.string().min(2).optional(),
      taxId: z
        .string()
        .regex(/^\d{2}-\d{7}$/)
        .optional(),
    })
    .optional(),
  w4: z.object({
    ssn: z.string().regex(/^\d{3}-\d{2}-\d{4}$/),
    address: z.string().min(5),
    withholdingAllowances: z.number().min(0),
  }),
});
export type RegistrationRequest = z.infer<typeof RegistrationRequest>;

export const RegistrationResponse = z.object({
  userId: z.string().uuid(),
  orgId: z.string().uuid(),
});
export type RegistrationResponse = z.infer<typeof RegistrationResponse>;

export const ForgotPasswordRequest = z.object({
  email: z.string().email(),
});
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequest>;

export const ForgotPasswordResponse = z.object({
  ok: z.boolean(),
  message: z.string(),
});
export type ForgotPasswordResponse = z.infer<typeof ForgotPasswordResponse>;
