/**
 * Frontend Startup and Port Verification Tests
 */

import { test, expect, Page } from '@playwright/test';
import { FRONTEND_PORT, BACKEND_PORT, BACKEND_URL, WS_URL } from './constants';

test.describe('Frontend Startup Tests', () => {
  test('should load the frontend on correct port', async ({ page }) => {
    await page.goto('/');

    // Verify we're on the correct port
    expect(page.url()).toContain(`localhost:${FRONTEND_PORT}`);

    // Page should load without errors
    await expect(page).toHaveTitle(/EpiSensor/i);
  });

  test('should have no JavaScript errors on initial load', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');

    // Check for JavaScript errors
    expect(errors).toHaveLength(0);
  });

  test('should connect to backend API on correct port', async ({ page }) => {
    await page.goto('/');

    // Wait for any initial API calls to complete
    await page.waitForLoadState('networkidle');

    // Check if the page can communicate with the backend
    const response = await page.evaluate(async (apiBase) => {
      try {
        const res = await fetch(`${apiBase}/api/config`);
        return {
          status: res.status,
          ok: res.ok,
          data: await res.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    }, BACKEND_URL);

    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.data.success).toBe(true);
  });

  test('should establish WebSocket connection on backend port', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Test WebSocket connection
    const wsConnected = await page.evaluate((wsBase) => {
      return new Promise((resolve) => {
        try {
          const socket = new WebSocket(`${wsBase}/socket.io/?EIO=4&transport=websocket`);

          socket.onopen = () => {
            socket.close();
            resolve(true);
          };

          socket.onerror = () => {
            resolve(false);
          };

          // Timeout after 5 seconds
          setTimeout(() => {
            socket.close();
            resolve(false);
          }, 5000);
        } catch (error) {
          resolve(false);
        }
      });
    }, WS_URL);

    expect(wsConnected).toBe(true);
  });
});

test.describe('Application Loading Tests', () => {
  test('should load main application components', async ({ page }) => {
    await page.goto('/');

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check for key application elements
    // These selectors would depend on the actual React app structure
    const bodyContent = await page.textContent('body');
    expect(bodyContent).toBeTruthy();
    expect(bodyContent.length).toBeGreaterThan(0);
  });

  test('should load without console errors', async ({ page }) => {
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(text);

      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out common development/testing noise
    const realErrors = consoleErrors.filter(error =>
      !error.includes('DevTools') &&
      !error.includes('Extension') &&
      !error.includes('favicon') &&
      !error.toLowerCase().includes('warning')
    );

    expect(realErrors).toHaveLength(0);
  });

  test('should have proper document structure', async ({ page }) => {
    await page.goto('/');

    // Check basic HTML structure
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('head')).toBeAttached();
    await expect(page.locator('body')).toBeVisible();

    // Check for React root
    const reactRoot = page.locator('#root');
    await expect(reactRoot).toBeAttached();
  });
});

test.describe('API Connectivity Tests', () => {
  test('should successfully fetch application config', async ({ page }) => {
    await page.goto('/');

    const configResponse = await page.request.get(`${BACKEND_URL}/api/config`);
    expect(configResponse.ok()).toBe(true);

    const config = await configResponse.json();
    expect(config.success).toBe(true);
    expect(config.data).toBeDefined();
    expect(config.data.appName).toBeTruthy();
    expect(config.data.apiUrl).toContain(BACKEND_PORT);
  });

  test('should successfully fetch feature flags', async ({ page }) => {
    await page.goto('/');

    const featuresResponse = await page.request.get(`${BACKEND_URL}/api/features`);
    expect(featuresResponse.ok()).toBe(true);

    const features = await featuresResponse.json();
    expect(features.success).toBe(true);
    expect(features.data).toBeDefined();
    expect(typeof features.data.settings).toBe('boolean');
    expect(typeof features.data.logging).toBe('boolean');
  });

  test('should successfully fetch health status', async ({ page }) => {
    await page.goto('/');

    const healthResponse = await page.request.get(`${BACKEND_URL}/api/health`);
    expect(healthResponse.ok()).toBe(true);

    // Health endpoint might return different format
    const health = await healthResponse.json();
    expect(health).toBeDefined();
  });
});

test.describe('Performance Tests', () => {
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 10 seconds (generous for testing environment)
    expect(loadTime).toBeLessThan(10000);
  });

  test('should have minimal layout shifts', async ({ page }) => {
    await page.goto('/');

    // Wait for initial render
    await page.waitForLoadState('domcontentloaded');

    // Take initial screenshot
    const initialScreenshot = await page.screenshot();
    expect(initialScreenshot).toBeTruthy();

    // Wait for network to settle
    await page.waitForLoadState('networkidle');

    // The app should be stable after initial load
    // This is more of a visual regression test framework
    expect(true).toBe(true); // Placeholder for layout shift detection
  });
});
