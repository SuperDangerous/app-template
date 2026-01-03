/**
 * Settings Router
 * Provides API endpoints for settings management
 */

import { Router, Response } from 'express';
import { SettingsService } from '@superdangerous/app-framework';
import { defaultSettings, settingsMetadata, SettingKey, SettingValue, SettingsRecord } from '../config/settings.js';

const router = Router();

const settingsService = new SettingsService({
  storagePath: './data/settings.json',
  autoSave: true
});

// Initialize with defaults
(async () => {
  const existing = await settingsService.getAll();
  if (Object.keys(existing).length === 0) {
    for (const [key, value] of Object.entries(defaultSettings)) {
      await settingsService.set(key, value);
    }
  }
})();

/**
 * Helper to extract error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error occurred';
}

// Helper for API responses
const apiResponse = {
  success: <T>(res: Response, data: T, message: string): void => {
    res.json({ success: true, data, message });
  },
  error: (res: Response, message: string, status: number = 500, details?: unknown): void => {
    res.status(status).json({ success: false, message, error: details });
  }
};

// Get all settings
router.get('/', async (_req, res) => {
  try {
    const settings = await settingsService.getAll();
    apiResponse.success(res, settings, 'Settings retrieved successfully');
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to retrieve settings', 500, getErrorMessage(error));
  }
});

// Get settings definitions/metadata
router.get('/definitions', async (_req, res) => {
  try {
    apiResponse.success(res, settingsMetadata.categories, 'Settings definitions retrieved');
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to retrieve definitions', 500, getErrorMessage(error));
  }
});

// Get settings by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const allSettings = await settingsService.getAll();

    // Filter settings by category prefix
    const categorySettings: SettingsRecord = {};
    const prefix = `${categoryId}.`;

    for (const [key, value] of Object.entries(allSettings)) {
      if (key.startsWith(prefix)) {
        categorySettings[key] = value as SettingValue;
      }
    }

    apiResponse.success(res, categorySettings, `Settings for category ${categoryId} retrieved`);
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to retrieve category settings', 500, getErrorMessage(error));
  }
});

// Get single setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = await settingsService.get(key);

    if (value === undefined) {
      return apiResponse.error(res, `Setting ${key} not found`, 404);
    }

    apiResponse.success(res, { key, value }, 'Setting retrieved successfully');
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to retrieve setting', 500, getErrorMessage(error));
  }
});

// Keys that require restart when changed
const RESTART_REQUIRED_KEYS = [
  'network.apiPort',
  'network.webPort',
  'network.enableWebSocket',
  'security.enableAuth',
  'security.enableHttps',
  'advanced.environment'
] as const;

// Update single setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      apiResponse.error(res, 'Value is required', 400, { key });
      return;
    }

    await settingsService.set(key, value);

    // Check if restart is required
    const restartRequired = RESTART_REQUIRED_KEYS.includes(key as typeof RESTART_REQUIRED_KEYS[number]);

    apiResponse.success(res, {
      key,
      value,
      restartRequired
    }, 'Setting updated successfully');
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to update setting', 400, getErrorMessage(error));
  }
});

// Update multiple settings
router.put('/', async (req, res) => {
  try {
    const settings = req.body as SettingsRecord;
    const errors: Record<string, string> = {};
    const updated: SettingsRecord = {};
    const restartRequired: string[] = [];

    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      try {
        await settingsService.set(key, value);
        updated[key] = value;

        // Check if restart is required
        if (RESTART_REQUIRED_KEYS.includes(key as typeof RESTART_REQUIRED_KEYS[number])) {
          restartRequired.push(key);
        }
      } catch (innerError: unknown) {
        errors[key] = getErrorMessage(innerError);
      }
    }

    if (Object.keys(errors).length > 0) {
      apiResponse.error(res, 'Some settings failed to update', 400, { errors, updated });
    } else {
      apiResponse.success(res, {
        updated,
        restartRequired
      }, 'Settings updated successfully');
    }
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to update settings', 500, getErrorMessage(error));
  }
});

// Reset settings to defaults
router.post('/reset', async (_req, res) => {
  try {
    for (const [key, value] of Object.entries(defaultSettings)) {
      await settingsService.set(key, value);
    }
    const settings = await settingsService.getAll();
    apiResponse.success(res, settings, 'Settings reset to defaults');
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to reset settings', 500, getErrorMessage(error));
  }
});

// Reset single setting to default
router.post('/reset/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const defaultValue = defaultSettings[key as SettingKey];

    if (defaultValue === undefined) {
      return apiResponse.error(res, `Setting ${key} not found`, 404);
    }

    await settingsService.set(key, defaultValue);
    apiResponse.success(res, { key, value: defaultValue }, 'Setting reset to default');
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to reset setting', 500, getErrorMessage(error));
  }
});

// Export settings
router.get('/export/json', async (_req, res) => {
  try {
    const settings = await settingsService.getAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="settings.json"');
    res.json(settings);
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to export settings', 500, getErrorMessage(error));
  }
});

// Import settings
router.post('/import', async (req, res) => {
  try {
    const importedSettings = req.body as SettingsRecord;
    const errors: Record<string, string> = {};
    const imported: SettingsRecord = {};

    // Validate and import each setting
    for (const [key, value] of Object.entries(importedSettings)) {
      try {
        await settingsService.set(key, value);
        imported[key] = value;
      } catch (innerError: unknown) {
        errors[key] = getErrorMessage(innerError);
      }
    }

    if (Object.keys(errors).length > 0) {
      apiResponse.error(res, 'Some settings failed to import', 400, { errors, imported });
    } else {
      apiResponse.success(res, imported, 'Settings imported successfully');
    }
  } catch (error: unknown) {
    apiResponse.error(res, 'Failed to import settings', 500, getErrorMessage(error));
  }
});

export default router;
export { settingsService };
