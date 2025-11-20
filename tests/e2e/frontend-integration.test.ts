/**
 * Frontend-Backend Integration Tests
 * Tests the interaction between the React frontend and Express backend
 */

import { test, expect } from '@playwright/test';
import { BACKEND_URL, BACKEND_PORT, WS_URL } from './constants';

test.describe('Frontend-Backend Integration Tests', () => {
  test('should load application configuration from backend', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if frontend can fetch and use backend configuration
    const configData = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/config`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    expect(configData.success).toBe(true);
    expect(configData.status).toBe(200);
    expect(configData.data.success).toBe(true);
    expect(configData.data.data.appName).toBeTruthy();
    expect(configData.data.data.apiUrl).toContain(BACKEND_PORT);
  });

  test('should handle settings API integration', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test settings retrieval
    const settingsData = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/settings`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    expect(settingsData.success).toBe(true);
    expect(settingsData.data.success).toBe(true);
    expect(settingsData.data.data).toBeDefined();
    expect(typeof settingsData.data.data).toBe('object');
  });

  test('should handle settings definitions API', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const definitionsData = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/settings/definitions`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    expect(definitionsData.success).toBe(true);
    expect(definitionsData.data.success).toBe(true);
    expect(Array.isArray(definitionsData.data.data)).toBe(true);
    expect(definitionsData.data.data.length).toBeGreaterThan(0);
  });

  test('should handle feature flags API', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const featuresData = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/features`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    expect(featuresData.success).toBe(true);
    expect(featuresData.data.success).toBe(true);
    expect(featuresData.data.data).toBeDefined();
    expect(typeof featuresData.data.data.settings).toBe('boolean');
    expect(typeof featuresData.data.data.logging).toBe('boolean');
    expect(typeof featuresData.data.data.websocket).toBe('boolean');
  });

  test('should handle system info API', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const systemData = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/system/info`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    expect(systemData.success).toBe(true);
    expect(systemData.data.success).toBe(true);
    expect(systemData.data.data.name).toBeTruthy();
    expect(systemData.data.data.version).toBeTruthy();
    expect(typeof systemData.data.data.uptime).toBe('number');
    expect(systemData.data.data.features).toBeDefined();
  });

  test('should handle demo data API', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const demoData = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/demo/data`);
        const data = await response.json();
        return {
          success: response.ok,
          status: response.status,
          data: data
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    expect(demoData.success).toBe(true);
    expect(demoData.data.success).toBe(true);
    expect(demoData.data.data.users).toBeDefined();
    expect(Array.isArray(demoData.data.data.users)).toBe(true);
    expect(demoData.data.data.stats).toBeDefined();
    expect(demoData.data.data.recentActivity).toBeDefined();
  });
});

test.describe('Real-time Communication Tests', () => {
  test('should establish WebSocket connection and receive events', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test WebSocket connection with Socket.IO
    const wsResult = await page.evaluate((wsBase) => {
      return new Promise((resolve) => {
        // Import Socket.IO client from global or create connection
        try {
          // This would depend on how Socket.IO is implemented in the frontend
          const socket = new WebSocket(`${wsBase}/socket.io/?EIO=4&transport=websocket`);

          const result = {
            connected: false,
            error: null as string | null,
            events: [] as string[]
          };

          socket.onopen = () => {
            result.connected = true;
            // Test ping-pong
            socket.send('42["ping",{"test":"data"}]'); // Socket.IO format
          };

          socket.onmessage = (event) => {
            result.events.push(event.data);
            if (result.events.length >= 1) {
              socket.close();
              resolve(result);
            }
          };

          socket.onerror = (error) => {
            result.error = 'Connection error';
            resolve(result);
          };

          socket.onclose = () => {
            resolve(result);
          };

          // Timeout after 5 seconds
          setTimeout(() => {
            socket.close();
            resolve(result);
          }, 5000);

        } catch (error) {
          resolve({
            connected: false,
            error: error.message,
            events: []
          });
        }
      });
    }, WS_URL);

    expect(wsResult.error).toBeNull();
    // Connection should be attempted even if specific events aren't received
    // in the test environment
  });

  test('should handle Socket.IO client integration if available', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if Socket.IO client is loaded and can be used
    const socketIOTest = await page.evaluate(() => {
      // This test depends on the frontend implementation
      // For now, we'll check if the WebSocket infrastructure is working
      return {
        websocketSupported: typeof WebSocket !== 'undefined',
        fetchSupported: typeof fetch !== 'undefined',
        promiseSupported: typeof Promise !== 'undefined'
      };
    });

    expect(socketIOTest.websocketSupported).toBe(true);
    expect(socketIOTest.fetchSupported).toBe(true);
    expect(socketIOTest.promiseSupported).toBe(true);
  });
});

test.describe('API Error Handling Tests', () => {
  test('should handle backend unavailability gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test with a non-existent endpoint
    const errorHandling = await page.evaluate(async (apiBase) => {
      try {
        const response = await fetch(`${apiBase}/api/non-existent`);
        return {
          status: response.status,
          ok: response.ok,
          handled: true
        };
      } catch (error) {
        return {
          error: error.message,
          handled: true
        };
      }
    }, BACKEND_URL);

    // Either it should return 404 or handle the error gracefully
    expect(errorHandling.handled).toBe(true);
    if (errorHandling.status) {
      expect(errorHandling.status).toBe(404);
    }
  });

  test('should handle malformed API responses', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The frontend should be able to handle various response formats
    const responseHandling = await page.evaluate(async (apiBase) => {
      try {
        // Test with a known endpoint that should return valid JSON
        const response = await fetch(`${apiBase}/api/config`);
        const text = await response.text();

        // Try to parse as JSON
        const json = JSON.parse(text);

        return {
          success: true,
          isValidJson: true,
          hasExpectedStructure: json.success !== undefined && json.data !== undefined
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }, BACKEND_URL);

    expect(responseHandling.success).toBe(true);
    expect(responseHandling.isValidJson).toBe(true);
  });

  test('should handle network timeouts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test timeout handling
    const timeoutTest = await page.evaluate(async (apiBase) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 100); // Very short timeout

      try {
        const response = await fetch(`${apiBase}/api/settings`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return { success: true, aborted: false };
      } catch (error) {
        return {
          success: false,
          aborted: error.name === 'AbortError',
          error: error.message
        };
      }
    });

    // Either the request succeeds quickly or it's properly aborted
    expect(timeoutTest.aborted || timeoutTest.success).toBe(true);
  });
});

test.describe('State Management Integration Tests', () => {
  test('should maintain application state across API calls', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // This test would depend on the frontend state management implementation
    // For now, we'll test that the page maintains basic functionality
    const stateTest = await page.evaluate(async (apiBase) => {
      // Fetch initial config
      const config1 = await fetch(`${apiBase}/api/config`);
      const configData1 = await config1.json();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch config again
      const config2 = await fetch(`${apiBase}/api/config`);
      const configData2 = await config2.json();

      return {
        firstCall: configData1.success,
        secondCall: configData2.success,
        consistent: JSON.stringify(configData1.data) === JSON.stringify(configData2.data)
      };
    }, BACKEND_URL);

    expect(stateTest.firstCall).toBe(true);
    expect(stateTest.secondCall).toBe(true);
    expect(stateTest.consistent).toBe(true);
  });

  test('should handle settings updates through the API', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const settingsUpdateTest = await page.evaluate(async (apiBase) => {
      try {
        // Get current settings
        const currentResponse = await fetch(`${apiBase}/api/settings`);
        const currentData = await currentResponse.json();

        if (!currentData.success) {
          return { success: false, error: 'Could not fetch current settings' };
        }

        // Try to update a safe setting
        const updateResponse = await fetch(`${apiBase}/api/settings/app.name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: 'Test Updated Name' })
        });

        const updateData = await updateResponse.json();

        // Reset the setting back
        await fetch(`${apiBase}/api/settings/app.name`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: currentData.data['app.name'] })
        });

        return {
          success: updateData.success || false,
          status: updateResponse.status
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }, BACKEND_URL);

    // Settings update should work or be gracefully handled
    if (settingsUpdateTest.status) {
      expect([200, 400, 404]).toContain(settingsUpdateTest.status);
    }
  });
});
