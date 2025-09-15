#!/usr/bin/env node

import { chromium } from 'playwright';

async function testApp(url, appName) {
  console.log(`\n🧪 Testing ${appName} at ${url}...`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  const warnings = [];

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    if (type === 'error') {
      errors.push(text);
      console.log(`  ❌ Error: ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`  ⚠️  Warning: ${text}`);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`  ❌ Page Error: ${error.message}`);
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for async operations

    // Check for WebSocket status element
    const statusText = await page.evaluate(() => {
      const statusEl = document.querySelector('[data-testid="socket-status"], .connection-status, .socket-status, [class*="connection"], [class*="socket"]');
      return statusEl ? statusEl.textContent : null;
    });

    if (statusText) {
      console.log(`  🔌 WebSocket Status: ${statusText}`);
    }

    console.log(`  ✅ ${errors.length} errors, ${warnings.length} warnings`);

  } catch (error) {
    console.log(`  ❌ Failed to load: ${error.message}`);
  } finally {
    await browser.close();
  }

  return { errors, warnings };
}

// Test all apps
const apps = [
  { url: 'http://localhost:7001', name: 'epi-cpcodebase' },
  { url: 'http://localhost:7501', name: 'epi-app-template' },
  { url: 'http://localhost:7021', name: 'epi-node-programmer' },
  { url: 'http://localhost:7011', name: 'epi-modbus-simulator' },
  { url: 'http://localhost:7006', name: 'epi-competitor-ai' }
];

console.log('🚀 Starting frontend console error tests...\n');

for (const app of apps) {
  await testApp(app.url, app.name);
}

console.log('\n✨ Tests complete!');
process.exit(0);