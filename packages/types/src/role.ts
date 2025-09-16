import { z } from 'zod';

export const RoleSchema = z.enum(['owner', 'admin', 'member', 'staff', 'viewer']);
export type Role = z.infer<typeof RoleSchema>;
