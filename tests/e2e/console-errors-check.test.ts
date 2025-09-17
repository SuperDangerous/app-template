import { test, expect } from '@playwright/test';

test.describe('Console Error Check', () => {
  test('app should start without console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known development warnings
        if (!text.includes('Download the React DevTools') && 
            !text.includes('ExperimentalWarning')) {
          consoleErrors.push(text);
        }
      }
    });
    
    // Navigate to app
    await page.goto('http://localhost:7501');
    
    // Wait for app to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Give React time to render
    
    // Check if the main app element is present
    await expect(page.locator('main')).toBeVisible();
    
    // Report any console errors found
    if (consoleErrors.length > 0) {
      console.log('Console errors found:');
      consoleErrors.forEach(error => console.log(' -', error));
    }
    
    // Check for console errors
    expect(consoleErrors).toHaveLength(0);
  });
  
  test('settings page should load without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Download the React DevTools') && 
            !text.includes('ExperimentalWarning')) {
          consoleErrors.push(text);
        }
      }
    });
    
    await page.goto('http://localhost:7501/settings');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if settings page loaded
    await expect(page.locator('h1')).toContainText('Settings');
    
    if (consoleErrors.length > 0) {
      console.log('Settings page console errors:');
      consoleErrors.forEach(error => console.log(' -', error));
    }
    
    expect(consoleErrors).toHaveLength(0);
  });
  
  test('logs page should load without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Download the React DevTools') && 
            !text.includes('ExperimentalWarning')) {
          consoleErrors.push(text);
        }
      }
    });
    
    await page.goto('http://localhost:7501/logs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check if logs page loaded
    await expect(page.locator('h1')).toContainText('Logs');
    
    if (consoleErrors.length > 0) {
      console.log('Logs page console errors:');
      consoleErrors.forEach(error => console.log(' -', error));
    }
    
    expect(consoleErrors).toHaveLength(0);
  });
});
