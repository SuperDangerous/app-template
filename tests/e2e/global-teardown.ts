/**
 * Playwright Global Teardown
 * Cleans up the environment after running E2E tests
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  // Any cleanup tasks would go here
  // For example:
  // - Clearing test data
  // - Resetting application state
  // - Cleaning up temporary files

  console.log('✅ E2E test environment cleanup complete');
}

export default globalTeardown;