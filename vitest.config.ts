import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '*.config.ts',
        'src/index.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 15000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    isolate: true,
    threads: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{js,ts}'
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '*.config.ts',
      'coverage/'
    ],
    reporter: ['verbose', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml'
    }
  },
  resolve: {
    alias: {
      '@': '/src',
      '@tests': '/tests'
    }
  }
});