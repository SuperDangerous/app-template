import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 10000,

    // Run tests sequentially to avoid port conflicts
    fileParallelism: false,
    sequence: {
      shuffle: false,
    },
    maxConcurrency: 1,
    maxWorkers: 1,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    include: [
      '**/tests/**/*.test.ts',
      '**/__tests__/**/*.test.ts',
    ],
    exclude: [
      '**/tests/e2e/**/*.test.ts',
      '**/node_modules/**',
      '**/dist/**',
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