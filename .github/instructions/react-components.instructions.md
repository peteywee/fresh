---
applyTo: 'apps/web/components/**/*.{ts,tsx}'
---

## React Component Guidelines

When creating or modifying React components in Fresh, follow these patterns:

### Component Architecture

1. **Server Components by Default**: Components are server components unless they need client-side interactivity
2. **Client Component Marking**: Use `'use client'` directive only when necessary (event handlers, state, effects)
3. **Performance First**: Consider bundle size impact and use dynamic imports for heavy client components

### TypeScript Patterns

1. **Strict Typing**: Define explicit prop interfaces, avoid `any`
2. **Shared Types**: Import types from `packages/types/src/index.js` with `.js` extension
3. **Component Props**: Use descriptive prop names and include JSDoc comments for complex props

### File Organization

```typescript
// Component structure example
'use client';

// Only if needed
import { type ComponentProps } from 'react';

import { SomeSharedType } from '../../../packages/types/src/index.js';

// Component structure example

// Component structure example

interface Props {
  // Define props here
}

export default function ComponentName({ ...props }: Props) {
  // Component implementation
}

// Named export for flexibility
export { ComponentName };
```

### Authentication Integration

1. **Session Access**: Use `getServerSession()` in server components for auth state
2. **Client Auth**: Use dynamic imports for Firebase client SDK when needed
3. **Conditional Rendering**: Handle both authenticated and unauthenticated states

### Performance Standards

1. **Bundle Size**: Keep client components minimal, prefer server rendering
2. **PWA Compliance**: Ensure components work offline when applicable
3. **Core Web Vitals**: Avoid layout shifts, optimize loading states

### Testing Requirements

1. **Component Tests**: Write tests for complex logic and user interactions
2. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
3. **Error Boundaries**: Handle error states gracefully

### Common Patterns

- **Form Components**: Use Zod validation with proper error handling
- **Layout Components**: Support responsive design and PWA requirements
- **Data Components**: Handle loading/error states consistently
