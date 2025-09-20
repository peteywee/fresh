import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // Only include our test files, exclude everything else
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'e2e/**', 'dist/**', 'build/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'apps/web/app/**/*',
        'apps/web/lib/**/*',
        'services/api/src/**/*',
        'packages/types/src/**/*',
      ],
      exclude: ['node_modules/', 'tests/', 'e2e/', '**/*.d.ts', '**/*.config.*', '**/coverage/**'],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'apps/web'),
      '@/lib': resolve(__dirname, 'apps/web/lib'),
      '@/components': resolve(__dirname, 'apps/web/components'),
      '@packages/types': resolve(__dirname, 'packages/types/src'),
    },
  },
});
