#!/usr/bin/env node

/**
 * Simple Playwright script to test frontend for console errors
 * Usage: node test-frontend.js [url]
 */

import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173';
const appName = process.argv[3] || 'App';

console.log(`\n🧪 Testing ${appName} frontend at ${url}...\n`);

const browser = await chromium.launch({
  headless: true
});

const context = await browser.newContext();
const page = await context.newPage();

// Collect console messages
const consoleMessages = [];
const errors = [];

page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();

  consoleMessages.push({ type, text });

  if (type === 'error') {
    errors.push(text);
    console.log(`❌ Console Error: ${text}`);
  } else if (type === 'warning') {
    console.log(`⚠️  Console Warning: ${text}`);
  }
});

page.on('pageerror', error => {
  errors.push(error.message);
  console.log(`❌ Page Error: ${error.message}`);
});

try {
  // Navigate to the page
  console.log('📍 Navigating to page...');
  await page.goto(url, {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  // Wait a bit for any async operations
  await page.waitForTimeout(2000);

  // Check for WebSocket connection status if the element exists
  const socketStatus = await page.locator('[data-testid="socket-status"], .socket-status, .connection-status').first().textContent().catch(() => null);
  if (socketStatus) {
    console.log(`\n🔌 WebSocket Status: ${socketStatus}`);
    if (socketStatus.toLowerCase().includes('disconnected')) {
      errors.push('WebSocket shows disconnected status');
    }
  }

  // Check page title
  const title = await page.title();
  console.log(`\n📄 Page Title: ${title}`);

  // Take a screenshot for debugging
  const screenshotPath = `/tmp/${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-screenshot.png`;
  await page.screenshot({ path: screenshotPath });
  console.log(`📸 Screenshot saved to: ${screenshotPath}`);

  // Check for specific framework elements
  const hasReactRoot = await page.locator('#root, #app, [id="root"], [id="app"]').count() > 0;
  console.log(`\n⚛️  React/Vue root element found: ${hasReactRoot ? 'Yes' : 'No'}`);

  // Final summary
  console.log('\n' + '='.repeat(50));
  if (errors.length === 0) {
    console.log('✅ No console errors detected!');
  } else {
    console.log(`❌ Found ${errors.length} error(s):`);
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }
  console.log('='.repeat(50) + '\n');

  process.exit(errors.length > 0 ? 1 : 0);

} catch (error) {
  console.error(`\n❌ Test failed: ${error.message}\n`);
  process.exit(1);
} finally {
  await browser.close();
}