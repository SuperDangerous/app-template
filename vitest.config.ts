import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: [
      '**/tests/**/*.test.ts',
      '**/__tests__/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/index.ts',
      ],
      reporter: ['text', 'lcov', 'html'],
    },
  },
  resolve: {
    alias: {
      // Support for ESM module resolution
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
  },
});