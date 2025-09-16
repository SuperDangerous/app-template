/**
 * Playwright Global Setup
 * Prepares the environment before running E2E tests
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  // Launch browser for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🔧 Setting up E2E test environment...');

    // Wait for backend to be ready
    const backendUrl = 'http://localhost:8500';
    let backendReady = false;
    let attempts = 0;
    const maxAttempts = 30;

    while (!backendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get(`${backendUrl}/health`);
        if (response.ok()) {
          backendReady = true;
          console.log('✅ Backend is ready');
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for backend... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!backendReady) {
      throw new Error('Backend failed to start within expected time');
    }

    // Wait for frontend to be ready
    let frontendReady = false;
    attempts = 0;

    while (!frontendReady && attempts < maxAttempts) {
      try {
        const response = await page.request.get(baseURL || 'http://localhost:8502');
        if (response.ok()) {
          frontendReady = true;
          console.log('✅ Frontend is ready');
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for frontend... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!frontendReady) {
      throw new Error('Frontend failed to start within expected time');
    }

    // Reset application state for testing
    try {
      await page.request.post(`${backendUrl}/api/settings/reset`);
      console.log('🔄 Application state reset for testing');
    } catch (error) {
      console.warn('⚠️ Could not reset application state:', error);
    }

    // Verify API endpoints are responding
    const endpoints = [
      '/api/config',
      '/api/settings',
      '/api/features'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await page.request.get(`${backendUrl}${endpoint}`);
        if (!response.ok()) {
          console.warn(`⚠️ Endpoint ${endpoint} returned status ${response.status()}`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not verify endpoint ${endpoint}:`, error);
      }
    }

    console.log('✅ E2E test environment setup complete');

  } finally {
    await browser.close();
  }
}

export default globalSetup;