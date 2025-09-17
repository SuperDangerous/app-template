/**
 * Unit tests for Settings functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { settingsService } from '../../src/routes/settingsRouter.js';
import { defaultSettings, settingsMetadata } from '../../src/config/settings.js';

describe('Settings Service', () => {
  beforeEach(async () => {
    for (const [key, value] of Object.entries(defaultSettings)) {
      await settingsService.set(key, value);
    }
  });

  describe('Basic Operations', () => {
    it('should get all settings', async () => {
      const settings = await settingsService.getAll();
      expect(typeof settings).toBe('object');
      expect(Object.keys(settings).length).toBeGreaterThan(0);
    });

    it('should get a specific setting', async () => {
      const appName = await settingsService.get('app.name');
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
      await settingsService.set('test.string', 'hello');
      expect(await settingsService.get('test.string')).toBe('hello');

      await settingsService.set('test.number', 42);
      expect(await settingsService.get('test.number')).toBe(42);

      await settingsService.set('test.boolean', true);
      expect(await settingsService.get('test.boolean')).toBe(true);

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
        'advanced.debugMode',
      ];

      for (const key of requiredKeys) {
        expect(defaultSettings).toHaveProperty(key);
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
    });
  });

  describe('Settings Categories', () => {
    it('should expose key category prefixes', async () => {
      const settings = await settingsService.getAll();
      expect(settings).toHaveProperty('app.name');
      expect(settings).toHaveProperty('network.apiPort');
      expect(settings).toHaveProperty('logging.level');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid setting values gracefully', async () => {
      await settingsService.set('test.null', null);
      const value = await settingsService.get('test.null');
      expect(value).toBeNull();
    });

    it('should handle concurrent setting updates', async () => {
      await Promise.all([
        settingsService.set('test.concurrent.1', 'value1'),
        settingsService.set('test.concurrent.2', 'value2'),
        settingsService.set('test.concurrent.3', 'value3'),
      ]);

      expect(await settingsService.get('test.concurrent.1')).toBe('value1');
      expect(await settingsService.get('test.concurrent.2')).toBe('value2');
      expect(await settingsService.get('test.concurrent.3')).toBe('value3');
    });
  });
});
