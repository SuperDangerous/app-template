/**
 * Comprehensive Test Suite for SuperDangerous App Template
 * Entry point for all backend unit and integration tests
 */
import { describe, it, expect } from 'vitest';

describe('SuperDangerous App Template Test Suite', () => {
  it('should have test environment configured correctly', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(typeof describe).toBe('function');
    expect(typeof it).toBe('function');
    expect(typeof expect).toBe('function');
  });

  it('should have access to Node.js APIs', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.version).toBe('string');
    expect(typeof process.platform).toBe('string');
  });

  it('should be able to import project modules', async () => {
    // Test that we can import our project modules
    try {
      const { defaultSettings } = await import('../src/config/settings.js');
      expect(defaultSettings).toBeDefined();
      expect(typeof defaultSettings).toBe('object');
    } catch (error) {
      throw new Error(`Failed to import project modules: ${error.message}`);
    }
  });

  it('should have correct project structure', () => {
    const fs = require('fs');
    const path = require('path');

    const projectRoot = path.join(__dirname, '..');
    const expectedDirs = ['src', 'tests', 'web'];
    const expectedFiles = ['package.json', 'tsconfig.json', 'vitest.config.ts'];

    for (const dir of expectedDirs) {
      const dirPath = path.join(projectRoot, dir);
      expect(fs.existsSync(dirPath), `Directory ${dir} should exist`).toBe(true);
    }

    for (const file of expectedFiles) {
      const filePath = path.join(projectRoot, file);
      expect(fs.existsSync(filePath), `File ${file} should exist`).toBe(true);
    }
  });

  it('should have test directories configured', () => {
    const fs = require('fs');
    const path = require('path');

    const testRoot = __dirname;
    const expectedTestDirs = ['unit', 'integration', 'utils', 'e2e'];

    for (const dir of expectedTestDirs) {
      const dirPath = path.join(testRoot, dir);
      expect(fs.existsSync(dirPath), `Test directory ${dir} should exist`).toBe(true);
    }
  });

  it('should have all test utilities available', async () => {
    try {
      const {
        createTestApp,
        createTestWebSocketClient,
        makeRequest,
        validateApiResponse,
        TestCleaner
      } = await import('./utils/test-helpers.js');

      expect(typeof createTestApp).toBe('function');
      expect(typeof createTestWebSocketClient).toBe('function');
      expect(typeof makeRequest).toBe('function');
      expect(typeof validateApiResponse).toBe('function');
      expect(typeof TestCleaner).toBe('function');
    } catch (error) {
      throw new Error(`Test utilities not available: ${error.message}`);
    }
  });
});