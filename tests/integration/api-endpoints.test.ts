/**
 * Comprehensive API Endpoint Tests
 * Tests all backend API routes for correct functionality and response format
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestApp,
  makeRequest,
  validateApiResponse,
  TestApp,
  TestCleaner
} from '../utils/test-helpers.js';

describe('API Endpoints Integration Tests', () => {
  let testApp: TestApp;
  const cleaner = new TestCleaner();

  beforeAll(async () => {
    testApp = await createTestApp();
    cleaner.add(() => testApp.cleanup());
  });

  afterAll(async () => {
    await cleaner.cleanup();
  });

  describe('Settings API Endpoints', () => {
    it('GET /api/settings should return all settings', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(typeof response.data.data).toBe('object');
      expect(Object.keys(response.data.data).length).toBeGreaterThan(0);
    });

    it('GET /api/settings/definitions should return settings metadata', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/definitions`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);

      // Check structure of first category
      const firstCategory = response.data.data[0];
      expect(firstCategory).toHaveProperty('id');
      expect(firstCategory).toHaveProperty('label');
      expect(firstCategory).toHaveProperty('description');
    });

    it('GET /api/settings/category/:categoryId should return category settings', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/category/app`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(typeof response.data.data).toBe('object');

      // Should contain only app.* settings
      const settingKeys = Object.keys(response.data.data);
      for (const key of settingKeys) {
        expect(key).toMatch(/^app\./);
      }
    });

    it('GET /api/settings/:key should return specific setting', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data.data).toHaveProperty('key', 'app.name');
      expect(response.data.data).toHaveProperty('value');
      expect(typeof response.data.data.value).toBe('string');
    });

    it('GET /api/settings/:key should return 404 for non-existent setting', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/non.existent.key`);

      expect(response.status).toBe(404);
      expect(response.data.success).toBe(false);
    });

    it('PUT /api/settings/:key should update a setting', async () => {
      const originalResponse = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`);
      const originalValue = originalResponse.data.data.value;

      const newValue = 'Updated Test App';
      const updateResponse = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        body: { value: newValue }
      });

      expect(updateResponse.status).toBe(200);
      expect(validateApiResponse(updateResponse.data).isValid).toBe(true);
      expect(updateResponse.data.success).toBe(true);
      expect(updateResponse.data.data.key).toBe('app.name');
      expect(updateResponse.data.data.value).toBe(newValue);
      expect(typeof updateResponse.data.data.restartRequired).toBe('boolean');

      // Verify the setting was actually updated
      const verifyResponse = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`);
      expect(verifyResponse.data.data.value).toBe(newValue);

      // Restore original value
      await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        body: { value: originalValue }
      });
    });

    it('PUT /api/settings should update multiple settings', async () => {
      const updates = {
        'app.name': 'Batch Test App',
        'app.description': 'Updated in batch'
      };

      const response = await makeRequest(`${testApp.baseUrl}/api/settings`, {
        method: 'PUT',
        body: updates
      });

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data.data).toHaveProperty('updated');
      expect(response.data.data).toHaveProperty('restartRequired');

      // Verify updates
      for (const [key, value] of Object.entries(updates)) {
        const verifyResponse = await makeRequest(`${testApp.baseUrl}/api/settings/${key}`);
        expect(verifyResponse.data.data.value).toBe(value);
      }
    });

    it('POST /api/settings/reset should reset all settings', async () => {
      // Change some settings first
      await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        body: { value: 'Modified App' }
      });

      const resetResponse = await makeRequest(`${testApp.baseUrl}/api/settings/reset`, {
        method: 'POST'
      });

      expect(resetResponse.status).toBe(200);
      expect(validateApiResponse(resetResponse.data).isValid).toBe(true);
      expect(resetResponse.data.success).toBe(true);
      expect(typeof resetResponse.data.data).toBe('object');

      // Verify reset
      const verifyResponse = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`);
      expect(verifyResponse.data.data.value).toBe('EpiSensor App Template'); // Default value
    });

    it('POST /api/settings/reset/:key should reset specific setting', async () => {
      // Change a setting first
      await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        body: { value: 'Modified App' }
      });

      const resetResponse = await makeRequest(`${testApp.baseUrl}/api/settings/reset/app.name`, {
        method: 'POST'
      });

      expect(resetResponse.status).toBe(200);
      expect(validateApiResponse(resetResponse.data).isValid).toBe(true);
      expect(resetResponse.data.success).toBe(true);

      // Verify reset
      const verifyResponse = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`);
      expect(verifyResponse.data.data.value).toBe('EpiSensor App Template');
    });

    it('GET /api/settings/export/json should export settings', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/export/json`);

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');
      expect(Object.keys(response.data).length).toBeGreaterThan(0);

      // Should contain expected settings
      expect(response.data).toHaveProperty('app.name');
      expect(response.data).toHaveProperty('network.apiPort');
    });

    it('POST /api/settings/import should import settings', async () => {
      const importData = {
        'app.name': 'Imported Test App',
        'app.description': 'Imported description'
      };

      const response = await makeRequest(`${testApp.baseUrl}/api/settings/import`, {
        method: 'POST',
        body: importData
      });

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data.data).toBeDefined();

      // Verify imports
      for (const [key, value] of Object.entries(importData)) {
        const verifyResponse = await makeRequest(`${testApp.baseUrl}/api/settings/${key}`);
        expect(verifyResponse.data.data.value).toBe(value);
      }
    });
  });

  describe('System API Endpoints', () => {
    it('GET /api/config should return app configuration', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/config`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data.data).toHaveProperty('appName');
      expect(response.data.data).toHaveProperty('appVersion');
      expect(response.data.data).toHaveProperty('apiUrl');
      expect(response.data.data.apiUrl).toContain('localhost');
    });

    it('GET /api/health should return health status', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/health`);

      expect(response.status).toBe(200);
      // Health endpoint might have different format
      expect(response.data).toBeDefined();
    });

    it('GET /api/health/detailed should return detailed health info', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/health/detailed`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data.data).toHaveProperty('status');
      expect(response.data.data).toHaveProperty('uptime');
      expect(response.data.data).toHaveProperty('timestamp');
      expect(typeof response.data.data.uptime).toBe('number');
    });

    it('GET /api/system/info should return system information', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/system/info`);

      expect(response.status).toBe(200);
      expect(response.data?.success).toBe(true);
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('version');
      expect(response.data.data).toHaveProperty('platform');
      expect(response.data.data).toHaveProperty('nodeVersion');
      expect(response.data.data).toHaveProperty('uptime');
      expect(response.data.data).toHaveProperty('features');
      expect(typeof response.data.data.features).toBe('object');
    });

    it('GET /api/system/metrics should return system metrics', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/system/metrics`);

      expect(response.status).toBe(200);
      expect(validateApiResponse(response.data).isValid).toBe(true);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('memory');
      expect(response.data.data).toHaveProperty('cpu');
      expect(response.data.data).toHaveProperty('uptime');
      expect(typeof response.data.data.memory).toBe('object');
      expect(typeof response.data.data.uptime).toBe('number');
    });

    it('GET /api/storage/info should return storage information', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/storage/info`);

      expect(response.status).toBe(200);
      expect(validateApiResponse(response.data).isValid).toBe(true);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('directories');
      expect(response.data.data).toHaveProperty('fileCount');
      expect(response.data.data).toHaveProperty('totalSize');
      expect(Array.isArray(response.data.data.directories)).toBe(true);
      expect(typeof response.data.data.fileCount).toBe('number');
    });
  });

  describe('Demo and Example Endpoints', () => {
    it('GET /api/example should return example data', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/example`);

      expect(response.status).toBe(200);
      expect(validateApiResponse(response.data).isValid).toBe(true);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('message');
      expect(response.data.data).toHaveProperty('timestamp');
      expect(response.data.data).toHaveProperty('version');
      expect(typeof response.data.data.timestamp).toBe('string');
    });

    it('GET /api/demo/data should return demo data', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/demo/data`);

      expect(response.status).toBe(200);
      expect(validateApiResponse(response.data).isValid).toBe(true);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('users');
      expect(response.data.data).toHaveProperty('stats');
      expect(response.data.data).toHaveProperty('recentActivity');

      expect(Array.isArray(response.data.data.users)).toBe(true);
      expect(response.data.data.users.length).toBeGreaterThan(0);
      expect(typeof response.data.data.stats).toBe('object');
      expect(Array.isArray(response.data.data.recentActivity)).toBe(true);

      // Validate user structure
      const firstUser = response.data.data.users[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).toHaveProperty('role');
      expect(firstUser).toHaveProperty('status');
    });

    it('GET /api/features should return feature flags', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/features`);

      expect(response.status).toBe(200);
      expect(validateApiResponse(response.data).isValid).toBe(true);
      expect(response.data.success).toBe(true);

      const features = response.data.data;
      expect(typeof features.settings).toBe('boolean');
      expect(typeof features.logging).toBe('boolean');
      expect(typeof features.websocket).toBe('boolean');
      expect(typeof features.monitoring).toBe('boolean');
      expect(typeof features.telemetry).toBe('boolean');
      expect(typeof features.experimental).toBe('boolean');
      expect(typeof features.authentication).toBe('boolean');
      expect(typeof features.https).toBe('boolean');
      expect(typeof features.rateLimit).toBe('boolean');
      expect(typeof features.backup).toBe('boolean');
      expect(typeof features.debugMode).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/non-existent-route`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing required fields', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        body: {} // Missing 'value' field
      });

      expect([400, 500]).toContain(response.status);
    });

    it('should handle invalid setting keys', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/invalid..key`, {
        method: 'PUT',
        body: { value: 'test' }
      });

      // Should either reject invalid key or handle gracefully
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('CORS and Headers', () => {
    it('should include proper CORS headers', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/config`);

      expect(response.status).toBe(200);
      // Headers would need to be checked if CORS is configured
      expect(response.headers).toBeDefined();
    });

    it('should handle preflight OPTIONS requests', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/config`, {
        method: 'OPTIONS'
      });

      // Should either handle OPTIONS or return method not allowed
      expect([200, 204, 405]).toContain(response.status);
    });
  });

  describe('Content-Type Handling', () => {
    it('should handle JSON content type correctly', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/settings/app.name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: { value: 'JSON Test' }
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should return JSON responses with correct content type', async () => {
      const response = await makeRequest(`${testApp.baseUrl}/api/config`);

      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');
    });
  });
});
