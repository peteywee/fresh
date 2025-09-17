---
applyTo: '**/*.{test,spec}.{ts,tsx}'
---

## Testing Guidelines for Fresh

### Testing Framework

- **Vitest**: Primary testing framework configured in `vitest.config.ts`
- **Coverage**: Run `pnpm test:coverage` for coverage reports
- **Watch Mode**: Use `pnpm test:watch` during development

### Test File Organization

```typescript
// tests/example.test.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should describe expected behavior', () => {
    // Test implementation
  });
});
```

### Authentication Testing

1. **Mock Sessions**: Mock `getServerSession()` for testing protected components
2. **Firebase Mocking**: Use Firebase test utilities for auth flows
3. **API Testing**: Test session endpoints (`/api/session/*`) thoroughly

### Database Testing

1. **Firestore Emulator**: Use Firebase emulator for integration tests
2. **Mock Admin SDK**: Mock `adminDb()` calls for unit tests
3. **Data Validation**: Test Zod schemas with valid/invalid inputs

### API Route Testing

1. **Request/Response**: Test all API endpoints under `apps/web/app/api/`
2. **Error Handling**: Verify proper error responses and status codes
3. **Session Validation**: Test protected routes with/without valid sessions

### Component Testing

1. **Server Components**: Test rendering logic and prop handling
2. **Client Components**: Test user interactions and state changes
3. **Integration**: Test component integration with authentication system

### Performance Testing

1. **Bundle Size**: Test that components don't exceed bundle budgets
2. **Load Times**: Verify page load performance meets PWA standards
3. **Memory**: Test for memory leaks in client components

### Test Data Management

1. **Fixtures**: Create reusable test data in `tests/fixtures/`
2. **Factories**: Use factory functions for generating test objects
3. **Cleanup**: Ensure tests clean up after themselves

### Best Practices

1. **Descriptive Names**: Use clear, descriptive test names
2. **Single Responsibility**: Each test should verify one specific behavior
3. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification
4. **Error Cases**: Test both success and failure scenarios
5. **Async Testing**: Properly handle async operations with await/promises
