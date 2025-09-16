/**
 * Frontend Console Error Detection Tests
 * Comprehensive testing for JavaScript errors, warnings, and console issues
 */

import { test, expect, Page } from '@playwright/test';

interface ConsoleMessage {
  type: string;
  text: string;
  location: string;
  timestamp: number;
}

interface PageError {
  message: string;
  stack: string;
  name: string;
  filename: string;
  line: number;
  column: number;
}

test.describe('Console Error Detection Tests', () => {
  let consoleMessages: ConsoleMessage[] = [];
  let pageErrors: PageError[] = [];

  test.beforeEach(async ({ page }) => {
    // Reset arrays for each test
    consoleMessages = [];
    pageErrors = [];

    // Set up console message monitoring
    page.on('console', (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()?.url || 'unknown',
        timestamp: Date.now()
      });
    });

    // Set up page error monitoring
    page.on('pageerror', (error) => {
      pageErrors.push({
        message: error.message,
        stack: error.stack || '',
        name: error.name,
        filename: error.stack?.split('\n')[1]?.trim() || 'unknown',
        line: 0,
        column: 0
      });
    });

    // Set up request failure monitoring
    page.on('requestfailed', (request) => {
      console.log(`❌ Request failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Set up response monitoring for API errors
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes('/api/')) {
        console.log(`❌ API Error: ${response.status()} ${response.url()}`);
      }
    });
  });

  test('should have no console errors on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const errors = consoleMessages.filter(msg => msg.type === 'error');
    const filteredErrors = filterIgnorableErrors(errors);

    if (filteredErrors.length > 0) {
      console.log('Console errors found:', filteredErrors);
    }

    expect(filteredErrors).toHaveLength(0);
  });

  test('should have no page errors on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (pageErrors.length > 0) {
      console.log('Page errors found:', pageErrors);
    }

    expect(pageErrors).toHaveLength(0);
  });

  test('should load all static resources without errors', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      // Only track failures for static resources
      const url = request.url();
      if (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.ico')) {
        failedRequests.push(`${request.method()} ${url}: ${request.failure()?.errorText}`);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    if (failedRequests.length > 0) {
      console.log('Failed resource requests:', failedRequests);
    }

    expect(failedRequests).toHaveLength(0);
  });

  test('should handle navigation without console errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear any startup messages
    const startupErrors = consoleMessages.filter(msg => msg.type === 'error').length;

    // Try to navigate (this depends on your app's routing structure)
    // For now, we'll test navigation to common routes
    const routes = ['/', '#settings', '#about'];

    for (const route of routes) {
      try {
        if (route.startsWith('#')) {
          // Hash-based routing
          await page.evaluate((hash) => {
            window.location.hash = hash.substring(1);
          }, route);
        } else {
          await page.goto(route);
        }

        await page.waitForTimeout(1000); // Give time for any errors to surface
      } catch (error) {
        // Route might not exist, which is fine for this test
      }
    }

    const navigationErrors = consoleMessages
      .filter(msg => msg.type === 'error' && msg.timestamp > Date.now() - 30000)
      .filter(error => !isIgnorableError(error));

    if (navigationErrors.length > 0) {
      console.log('Navigation errors found:', navigationErrors);
    }

    expect(navigationErrors).toHaveLength(0);
  });

  test('should handle API interactions without console errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear startup messages
    consoleMessages = [];
    pageErrors = [];

    // Simulate API interactions
    await page.evaluate(async () => {
      try {
        // Test config endpoint
        await fetch('/api/config');

        // Test features endpoint
        await fetch('/api/features');

        // Test settings endpoint
        await fetch('/api/settings');
      } catch (error) {
        console.error('API test error:', error);
      }
    });

    await page.waitForTimeout(2000);

    const apiErrors = consoleMessages.filter(msg => msg.type === 'error');
    const filteredApiErrors = filterIgnorableErrors(apiErrors);

    if (filteredApiErrors.length > 0) {
      console.log('API interaction errors found:', filteredApiErrors);
    }

    expect(filteredApiErrors).toHaveLength(0);
    expect(pageErrors).toHaveLength(0);
  });

  test('should handle WebSocket connections without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Clear startup messages
    consoleMessages = [];
    pageErrors = [];

    // Test WebSocket connection
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        try {
          const ws = new WebSocket('ws://localhost:8500/socket.io/?EIO=4&transport=websocket');

          ws.onopen = () => {
            ws.close();
            resolve();
          };

          ws.onerror = () => {
            resolve();
          };

          setTimeout(() => {
            ws.close();
            resolve();
          }, 5000);
        } catch (error) {
          resolve();
        }
      });
    });

    await page.waitForTimeout(1000);

    const wsErrors = consoleMessages.filter(msg => msg.type === 'error');
    const filteredWsErrors = filterIgnorableErrors(wsErrors);

    if (filteredWsErrors.length > 0) {
      console.log('WebSocket errors found:', filteredWsErrors);
    }

    expect(filteredWsErrors).toHaveLength(0);
  });

  test('should monitor for memory leaks and performance warnings', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const performanceWarnings = consoleMessages.filter(msg =>
      msg.type === 'warning' &&
      (msg.text.toLowerCase().includes('memory') ||
       msg.text.toLowerCase().includes('performance') ||
       msg.text.toLowerCase().includes('leak'))
    );

    if (performanceWarnings.length > 0) {
      console.log('Performance warnings found:', performanceWarnings);
      // Performance warnings are logged but not failing the test unless severe
    }

    // Check for severe performance issues
    const severeIssues = performanceWarnings.filter(warning =>
      warning.text.toLowerCase().includes('memory leak') ||
      warning.text.toLowerCase().includes('severe')
    );

    expect(severeIssues).toHaveLength(0);
  });

  test('should capture and analyze all console output types', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait for some activity
    await page.waitForTimeout(3000);

    // Categorize all console messages
    const messagesByType = {
      error: consoleMessages.filter(msg => msg.type === 'error'),
      warning: consoleMessages.filter(msg => msg.type === 'warning'),
      log: consoleMessages.filter(msg => msg.type === 'log'),
      info: consoleMessages.filter(msg => msg.type === 'info'),
      debug: consoleMessages.filter(msg => msg.type === 'debug')
    };

    // Log summary for debugging
    console.log('Console message summary:', {
      total: consoleMessages.length,
      errors: messagesByType.error.length,
      warnings: messagesByType.warning.length,
      logs: messagesByType.log.length,
      info: messagesByType.info.length,
      debug: messagesByType.debug.length
    });

    // Filter out ignorable errors
    const realErrors = filterIgnorableErrors(messagesByType.error);

    expect(realErrors).toHaveLength(0);
  });
});

/**
 * Filter out errors that are expected or ignorable in test environment
 */
function filterIgnorableErrors(errors: ConsoleMessage[]): ConsoleMessage[] {
  return errors.filter(error => !isIgnorableError(error));
}

/**
 * Check if an error is ignorable (common development/testing noise)
 */
function isIgnorableError(error: ConsoleMessage): boolean {
  const ignorablePatterns = [
    // Development tools
    /devtools/i,
    /chrome-extension/i,
    /extensions\//i,

    // Common favicon 404s
    /favicon/i,

    // WebSocket connection issues in tests
    /websocket.*connection.*failed/i,
    /socket\.io.*error/i,

    // React development warnings that aren't errors
    /warning.*react/i,

    // Hot module replacement
    /hmr/i,
    /hot.*reload/i,

    // Vite development warnings
    /vite/i,

    // Network timeouts in test environment
    /network.*timeout/i,
    /fetch.*timeout/i,

    // CORS issues in test environment
    /cors/i,

    // Console.clear() calls
    /console was cleared/i,

    // Source map warnings
    /source.*map/i,

    // Third-party library warnings that don't affect functionality
    /third.*party/i,

    // Test runner specific messages
    /playwright/i,
    /test.*runner/i
  ];

  return ignorablePatterns.some(pattern => pattern.test(error.text));
}