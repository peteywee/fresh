import { z } from 'zod';

// Value used by Zod schemas
export const Role = z.enum(['owner', 'admin', 'member']);

// TypeScript type for convenience
export type Role = z.infer<typeof Role>;
