---
applyTo: 'packages/types/src/**/*.ts'
---

## Shared Types & Schemas Guidelines

### Package Architecture

The `packages/types` package provides shared TypeScript types and Zod validation schemas across the monorepo.

### File Organization

```typescript
// Individual schema files
// packages/types/src/auth.ts
import { z } from 'zod';

// packages/types/src/index.ts - Main export file
export * from './auth.js';
export * from './onboarding.js';
export * from './api.js';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
```

### Zod Schema Patterns

1. **Validation First**: Define Zod schemas before TypeScript types
2. **Type Inference**: Use `z.infer<typeof Schema>` for TypeScript types
3. **Composition**: Build complex schemas from simpler ones
4. **Transforms**: Use `.transform()` for data normalization

### Cross-Package Imports

**CRITICAL**: All imports between packages must use explicit `.js` extensions:

```typescript
// ✅ Correct
import { UserSchema } from '../../../packages/types/src/auth.js';

// ❌ Incorrect
import { UserSchema } from '../../../packages/types/src/auth';
```

### Schema Design Principles

1. **Strict Validation**: Be explicit about required vs optional fields
2. **Error Messages**: Provide clear validation error messages
3. **Future Compatibility**: Design schemas to be extensible
4. **Performance**: Keep schemas efficient for runtime validation

### Common Schema Patterns

```typescript
// Base schemas for reuse
export const IdSchema = z.string().min(1);
export const EmailSchema = z.string().email();
export const TimestampSchema = z.date().or(z.string().transform(s => new Date(s)));

// API request/response schemas
export const CreateUserRequestSchema = z.object({
  email: EmailSchema,
  displayName: z.string().optional(),
});

export const CreateUserResponseSchema = z.object({
  success: z.boolean(),
  user: UserSchema.optional(),
  error: z.string().optional(),
});
```

### Firestore Integration

1. **Document Schemas**: Create schemas that match Firestore document structure
2. **Subcollections**: Define schemas for nested collections
3. **Timestamps**: Handle Firestore timestamp conversion properly

### Build Configuration

1. **ESM Output**: Package builds to ESM for NodeNext compatibility
2. **Type Declarations**: Generate `.d.ts` files for TypeScript consumers
3. **Validation**: Ensure schemas work at both build and runtime

### Testing Schemas

1. **Valid Data**: Test schemas with expected valid inputs
2. **Invalid Data**: Test with various invalid inputs to verify error handling
3. **Edge Cases**: Test boundary conditions and edge cases
4. **Performance**: Test schema validation performance with large datasets

### Version Management

1. **Breaking Changes**: Use semantic versioning for schema changes
2. **Deprecation**: Mark deprecated fields clearly before removal
3. **Migration**: Provide migration guides for schema updates
