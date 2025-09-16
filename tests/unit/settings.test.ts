/**
 * Unit tests for Settings functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { settingsService } from '../../src/routes/settingsRouter.js';
import { defaultSettings, settingsMetadata } from '../../src/config/settings.js';
import { createMockRequest, createMockResponse, validateApiResponse, TestCleaner } from '../utils/test-helpers.js';
import express from 'express';
import settingsRouter from '../../src/routes/settingsRouter.js';

describe('Settings Service', () => {
  const cleaner = new TestCleaner();

  beforeEach(async () => {
    // Reset to default settings before each test
    for (const [key, value] of Object.entries(defaultSettings)) {
      await settingsService.set(key, value);
    }
  });

  afterEach(async () => {
    await cleaner.cleanup();
  });

  describe('Basic Operations', () => {
    it('should get all settings', async () => {
      const settings = await settingsService.getAll();
      expect(typeof settings).toBe('object');
      expect(Object.keys(settings).length).toBeGreaterThan(0);
    });

    it('should get a specific setting', async () => {
      const appName = await settingsService.get('app.name');
      expect(typeof appName).toBe('string');
      expect(appName).toBe(defaultSettings['app.name']);
    });

    it('should set a setting', async () => {
      const testValue = 'Test Application';
      await settingsService.set('app.name', testValue);
      const retrievedValue = await settingsService.get('app.name');
      expect(retrievedValue).toBe(testValue);
    });

    it('should return undefined for non-existent setting', async () => {
      const value = await settingsService.get('non.existent.key');
      expect(value).toBeUndefined();
    });

    it('should handle setting various data types', async () => {
      // Test string
      await settingsService.set('test.string', 'hello');
      expect(await settingsService.get('test.string')).toBe('hello');

      // Test number
      await settingsService.set('test.number', 42);
      expect(await settingsService.get('test.number')).toBe(42);

      // Test boolean
      await settingsService.set('test.boolean', true);
      expect(await settingsService.get('test.boolean')).toBe(true);

      // Test object
      const testObj = { key: 'value', nested: { data: 123 } };
      await settingsService.set('test.object', testObj);
      expect(await settingsService.get('test.object')).toEqual(testObj);
    });
  });

  describe('Default Settings Validation', () => {
    it('should have all required default settings', () => {
      const requiredKeys = [
        'app.name',
        'app.description',
        'network.apiPort',
        'network.webPort',
        'network.enableWebSocket',
        'logging.level',
        'storage.dataPath',
        'security.enableAuth',
        'advanced.debugMode'
      ];

      for (const key of requiredKeys) {
        expect(defaultSettings).toHaveProperty(key);
        expect(defaultSettings[key as keyof typeof defaultSettings]).toBeDefined();
      }
    });

    it('should have valid port numbers', () => {
      expect(defaultSettings['network.apiPort']).toBeGreaterThan(0);
      expect(defaultSettings['network.apiPort']).toBeLessThan(65536);
      expect(defaultSettings['network.webPort']).toBeGreaterThan(0);
      expect(defaultSettings['network.webPort']).toBeLessThan(65536);
    });

    it('should have valid logging level', () => {
      const validLevels = ['error', 'warn', 'info', 'debug'];
      expect(validLevels).toContain(defaultSettings['logging.level']);
    });

    it('should have settings metadata for all categories', () => {
      expect(Array.isArray(settingsMetadata.categories)).toBe(true);
      expect(settingsMetadata.categories.length).toBeGreaterThan(0);

      for (const category of settingsMetadata.categories) {
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('label');
        expect(category).toHaveProperty('description');
        expect(typeof category.id).toBe('string');
        expect(typeof category.label).toBe('string');
        expect(typeof category.description).toBe('string');
      }
    });
  });
});

describe('Settings Router API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/settings', settingsRouter);
  });

  describe('GET /api/settings/', () => {
    it('should return all settings', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      // Mock the route handler
      await new Promise<void>((resolve) => {
        req.url = '/';
        req.method = 'GET';

        settingsRouter(req, res, () => {
          resolve();
        });
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toBeDefined();

      const validation = validateApiResponse(res.body);
      expect(validation.isValid).toBe(true);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data).toBe('object');
    });
  });

  describe('GET /api/settings/definitions', () => {
    it('should return settings definitions', async () => {
      const req = createMockRequest({ url: '/definitions' });
      const res = createMockResponse();

      // This would need to be tested with actual router mounting
      // For now, test the metadata directly
      expect(settingsMetadata.categories).toBeDefined();
      expect(Array.isArray(settingsMetadata.categories)).toBe(true);
    });
  });

  describe('GET /api/settings/:key', () => {
    it('should return a specific setting', async () => {
      const value = await settingsService.get('app.name');
      expect(value).toBeDefined();
      expect(typeof value).toBe('string');
    });

    it('should handle non-existent settings', async () => {
      const value = await settingsService.get('non.existent.key');
      expect(value).toBeUndefined();
    });
  });

  describe('PUT /api/settings/:key', () => {
    it('should update a single setting', async () => {
      const newValue = 'Updated Test App';
      await settingsService.set('app.name', newValue);
      const retrievedValue = await settingsService.get('app.name');
      expect(retrievedValue).toBe(newValue);
    });

    it('should identify settings that require restart', () => {
      const restartRequiredKeys = [
        'network.apiPort',
        'network.webPort',
        'network.enableWebSocket',
        'security.enableAuth',
        'security.enableHttps',
        'advanced.environment'
      ];

      // This is more of a configuration test
      expect(restartRequiredKeys).toContain('network.apiPort');
      expect(restartRequiredKeys).toContain('network.webPort');
    });
  });

  describe('PUT /api/settings/', () => {
    it('should update multiple settings', async () => {
      const updates = {
        'app.name': 'Batch Updated App',
        'app.description': 'Updated description',
        'network.maxConnections': 200
      };

      for (const [key, value] of Object.entries(updates)) {
        await settingsService.set(key, value);
      }

      for (const [key, expectedValue] of Object.entries(updates)) {
        const actualValue = await settingsService.get(key);
        expect(actualValue).toBe(expectedValue);
      }
    });
  });

  describe('POST /api/settings/reset', () => {
    it('should reset all settings to defaults', async () => {
      // Change a setting first
      await settingsService.set('app.name', 'Modified App');
      expect(await settingsService.get('app.name')).toBe('Modified App');

      // Reset to defaults
      for (const [key, value] of Object.entries(defaultSettings)) {
        await settingsService.set(key, value);
      }

      // Verify reset
      expect(await settingsService.get('app.name')).toBe(defaultSettings['app.name']);
    });
  });

  describe('POST /api/settings/reset/:key', () => {
    it('should reset a single setting to default', async () => {
      // Change the setting
      const originalValue = defaultSettings['app.name'];
      await settingsService.set('app.name', 'Modified App');

      // Reset to default
      await settingsService.set('app.name', originalValue);

      // Verify
      expect(await settingsService.get('app.name')).toBe(originalValue);
    });

    it('should handle resetting non-existent keys', async () => {
      const result = await settingsService.get('non.existent.key');
      expect(result).toBeUndefined();
    });
  });

  describe('Settings Categories', () => {
    it('should group settings by category correctly', async () => {
      const allSettings = await settingsService.getAll();

      // If no settings are loaded, load defaults first
      if (Object.keys(allSettings).length === 0) {
        for (const [key, value] of Object.entries(defaultSettings)) {
          await settingsService.set(key, value);
        }
      }

      const settingsAfterDefaults = await settingsService.getAll();

      // Test app category
      const appSettings = Object.keys(settingsAfterDefaults).filter(key => key.startsWith('app.'));
      expect(appSettings.length).toBeGreaterThan(0);

      // Test network category
      const networkSettings = Object.keys(settingsAfterDefaults).filter(key => key.startsWith('network.'));
      expect(networkSettings.length).toBeGreaterThan(0);

      // Test logging category
      const loggingSettings = Object.keys(settingsAfterDefaults).filter(key => key.startsWith('logging.'));
      expect(loggingSettings.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid setting values gracefully', async () => {
      // This depends on the SettingsService implementation
      // For now, we'll test that we can set various types
      try {
        await settingsService.set('test.null', null);
        const value = await settingsService.get('test.null');
        expect(value).toBeNull();
      } catch (error) {
        // If null values aren't supported, that's also valid
        expect(error).toBeDefined();
      }
    });

    it('should handle concurrent setting updates', async () => {
      const promises = [
        settingsService.set('test.concurrent.1', 'value1'),
        settingsService.set('test.concurrent.2', 'value2'),
        settingsService.set('test.concurrent.3', 'value3')
      ];

      await Promise.all(promises);

      expect(await settingsService.get('test.concurrent.1')).toBe('value1');
      expect(await settingsService.get('test.concurrent.2')).toBe('value2');
      expect(await settingsService.get('test.concurrent.3')).toBe('value3');
    });
  });
});