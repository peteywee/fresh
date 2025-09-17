---
applyTo: 'apps/web/app/api/**/*.ts'
---

## API Route Guidelines

### Next.js App Router API Routes

All API routes in Fresh use the App Router pattern in `apps/web/app/api/`

### Route Structure

```typescript
// apps/web/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { getServerSession } from '@/lib/session';

// Define request schema
const RequestSchema = z.object({
  // Define expected input
});

export async function GET(request: NextRequest) {
  try {
    // Implementation
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Implementation
}
```

### Authentication Requirements

1. **Session Validation**: Use `getServerSession()` for protected routes
2. **Error Responses**: Return 401 for unauthorized requests
3. **User Context**: Extract user info from session for operations

### Input Validation

1. **Zod Schemas**: Always validate input with Zod schemas from `packages/types`
2. **Error Handling**: Return 400 for validation errors with descriptive messages
3. **Type Safety**: Use validated data throughout the handler

### Database Operations

1. **Admin SDK**: Use `adminDb()` from `@/lib/firebase.admin` for Firestore operations
2. **Error Handling**: Wrap database calls in try/catch blocks
3. **Transactions**: Use Firestore transactions for multi-document operations

### Response Patterns

```typescript
// Success responses
return NextResponse.json({
  success: true,
  data: result
});

// Error responses
return NextResponse.json({
  error: 'Descriptive error message'
}, { status: 400 });

// Validation errors
return NextResponse.json({
  error: 'Validation failed',
  details: validationErrors
}, { status: 400 });
```

### Session Management Routes

- `GET /api/session/current`: Return current user session
- `POST /api/session/login`: Exchange Firebase ID token for session cookie
- `POST /api/session/logout`: Clear session and redirect

### Security Practices

1. **CORS**: Configure appropriate CORS headers
2. **Rate Limiting**: Consider rate limiting for sensitive endpoints
3. **Input Sanitization**: Sanitize all user inputs
4. **Secret Management**: Use environment variables for sensitive data

### Performance Considerations

1. **Caching**: Use appropriate cache headers for static data
2. **Database Queries**: Optimize Firestore queries with proper indexing
3. **Response Size**: Keep response payloads minimal

### Testing Requirements

1. **Unit Tests**: Test each endpoint with valid/invalid inputs
2. **Integration Tests**: Test database operations and side effects
3. **Auth Tests**: Verify authentication and authorization logic
