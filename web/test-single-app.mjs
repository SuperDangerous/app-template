#!/usr/bin/env node

import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:5173';
const appName = process.argv[3] || 'App';

console.log(`Testing ${appName} at ${url}...`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const warnings = [];

page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();

  if (type === 'error') {
    errors.push(text);
    console.log(`❌ Error: ${text}`);
  } else if (type === 'warning') {
    warnings.push(text);
    console.log(`⚠️  Warning: ${text}`);
  }
});

page.on('pageerror', error => {
  errors.push(error.message);
  console.log(`❌ Page Error: ${error.message}`);
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log(`\n✅ Summary: ${errors.length} errors, ${warnings.length} warnings`);
} catch (error) {
  console.log(`❌ Failed: ${error.message}`);
}

await browser.close();
process.exit(errors.length > 0 ? 1 : 0);