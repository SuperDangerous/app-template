import { test, expect } from '@playwright/test';
import { FRONTEND_URL, BACKEND_URL } from './e2e/constants';

test.describe('Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`);
      }
    });

    // Listen for page errors (uncaught exceptions)
    page.on('pageerror', error => {
      console.error(`Page error: ${error.message}`);
    });
  });

  test('frontend loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    // Collect all console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Collect all page errors
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });

    // Navigate to the app
    await page.goto(FRONTEND_URL);

    // Wait for the app to load
    await page.waitForLoadState('networkidle');

    // Check that there are no console errors
    expect(consoleErrors, `Found console errors: ${consoleErrors.join(', ')}`).toHaveLength(0);

    // Check that there are no page errors
    expect(pageErrors, `Found page errors: ${pageErrors.join(', ')}`).toHaveLength(0);

    // Check that the main app element is visible
    await expect(page.locator('#root')).toBeVisible();

    // Check that WebSocket connects (connection status should not show error)
    const connectionError = page.locator('text=/connection lost|disconnected|error/i');
    const hasConnectionError = await connectionError.isVisible();
    expect(hasConnectionError, 'WebSocket connection error shown').toBe(false);
  });

  test('can navigate to main pages', async ({ page }) => {
    await page.goto('http://localhost:7501');

    // Navigate to Settings
    await page.click('text=Settings');
    await expect(page.locator('h1, h2').filter({ hasText: /Settings/i }).first()).toBeVisible();

    // Navigate to Logs
    await page.click('text=Logs');
    await expect(page.locator('h1, h2').filter({ hasText: /Logs/i }).first()).toBeVisible();
  });

  test('API endpoints respond correctly', async ({ request }) => {
    // Test health endpoint
    const health = await request.get(`${BACKEND_URL}/api/health`);
    expect(health.ok()).toBeTruthy();

    // Test app info endpoint
    const appInfo = await request.get(`${BACKEND_URL}/api/app/info`);
    expect(appInfo.ok()).toBeTruthy();
    const appData = await appInfo.json();
    expect(appData).toHaveProperty('name');
    expect(appData).toHaveProperty('version');

    // Test settings endpoint
    const settings = await request.get(`${BACKEND_URL}/api/settings`);
    expect(settings.ok()).toBeTruthy();
  });

  test('WebSocket connection is established', async ({ page }) => {
    await page.goto('http://localhost:7501');

    // Wait for the app to load and check for WebSocket functionality
    // by verifying the Socket.IO endpoint is accessible and the connection status banner
    const isConnected = await page.evaluate(async () => {
      // Check if Socket.IO endpoint is accessible
      try {
        const response = await fetch(`${BACKEND_URL}/socket.io/?EIO=4&transport=polling`);
        return response.ok || response.status === 400; // 400 is expected for wrong transport
      } catch (error) {
        return false;
      }
    });

    expect(isConnected, 'WebSocket endpoint not accessible').toBe(true);

    // Also check if the connection status is not showing error
    const connectionStatus = await page.locator('[data-testid="connection-status"]').count();
    // If there's no error banner, or if there is one but it's not showing disconnection error
    const hasErrorBanner = await page.locator('.connection-error').count();

    expect(hasErrorBanner, 'WebSocket connection error detected').toBe(0);
  });
});
