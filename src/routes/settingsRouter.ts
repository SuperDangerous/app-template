/**
 * Settings Router
 * Provides API endpoints for settings management
 */

import { Router } from 'express';
import { SettingsService } from '@superdangerous/app-framework';
import { defaultSettings, settingsMetadata } from '../config/settings.js';

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

// Helper for API responses
const apiResponse = {
  success: (res: any, data: any, message: string) => {
    res.json({ success: true, data, message });
  },
  error: (res: any, message: string, status: number = 500, details?: any) => {
    res.status(status).json({ success: false, message, error: details });
  }
};

// Get all settings
router.get('/', async (_req, res) => {
  try {
    const settings = await settingsService.getAll();
    apiResponse.success(res, settings, 'Settings retrieved successfully');
  } catch (error: any) {
    apiResponse.error(res, 'Failed to retrieve settings', 500, error.message);
  }
});

// Get settings definitions/metadata
router.get('/definitions', async (_req, res) => {
  try {
    apiResponse.success(res, settingsMetadata.categories, 'Settings definitions retrieved');
  } catch (error: any) {
    apiResponse.error(res, 'Failed to retrieve definitions', 500, error.message);
  }
});

// Get settings by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const allSettings = await settingsService.getAll();
    
    // Filter settings by category prefix
    const categorySettings: Record<string, any> = {};
    const prefix = `${categoryId}.`;
    
    for (const [key, value] of Object.entries(allSettings)) {
      if (key.startsWith(prefix)) {
        categorySettings[key] = value;
      }
    }
    
    apiResponse.success(res, categorySettings, `Settings for category ${categoryId} retrieved`);
  } catch (error: any) {
    apiResponse.error(res, 'Failed to retrieve category settings', 500, error.message);
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
  } catch (error: any) {
    apiResponse.error(res, 'Failed to retrieve setting', 500, error.message);
  }
});

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
    
    // Check if restart is required (hardcoded for certain keys)
    const restartRequired = [
      'network.apiPort',
      'network.webPort',
      'network.enableWebSocket',
      'security.enableAuth',
      'security.enableHttps',
      'advanced.environment'
    ].includes(key);
    
    apiResponse.success(res, { 
      key, 
      value, 
      restartRequired 
    }, 'Setting updated successfully');
  } catch (error: any) {
    apiResponse.error(res, 'Failed to update setting', 400, error.message);
  }
});

// Update multiple settings
router.put('/', async (req, res) => {
  try {
    const settings = req.body;
    const errors: Record<string, string> = {};
    const updated: Record<string, any> = {};
    const restartRequired: string[] = [];
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      try {
        await settingsService.set(key, value);
        updated[key] = value;
        
        // Check if restart is required
        if ([
          'network.apiPort',
          'network.webPort',
          'network.enableWebSocket',
          'security.enableAuth',
          'security.enableHttps',
          'advanced.environment'
        ].includes(key)) {
          restartRequired.push(key);
        }
      } catch (error: any) {
        errors[key] = error.message;
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
  } catch (error: any) {
    apiResponse.error(res, 'Failed to update settings', 500, error.message);
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
  } catch (error: any) {
    apiResponse.error(res, 'Failed to reset settings', 500, error.message);
  }
});

// Reset single setting to default
router.post('/reset/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const defaultValue = (defaultSettings as any)[key];
    
    if (defaultValue === undefined) {
      return apiResponse.error(res, `Setting ${key} not found`, 404);
    }
    
    await settingsService.set(key, defaultValue);
    apiResponse.success(res, { key, value: defaultValue }, 'Setting reset to default');
  } catch (error: any) {
    apiResponse.error(res, 'Failed to reset setting', 500, error.message);
  }
});

// Export settings
router.get('/export/json', async (_req, res) => {
  try {
    const settings = await settingsService.getAll();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="settings.json"');
    res.json(settings);
  } catch (error: any) {
    apiResponse.error(res, 'Failed to export settings', 500, error.message);
  }
});

// Import settings
router.post('/import', async (req, res) => {
  try {
    const importedSettings = req.body;
    const errors: Record<string, string> = {};
    const imported: Record<string, any> = {};
    
    // Validate and import each setting
    for (const [key, value] of Object.entries(importedSettings)) {
      try {
        await settingsService.set(key, value);
        imported[key] = value;
      } catch (error: any) {
        errors[key] = error.message;
      }
    }
    
    if (Object.keys(errors).length > 0) {
      apiResponse.error(res, 'Some settings failed to import', 400, { errors, imported });
    } else {
      apiResponse.success(res, imported, 'Settings imported successfully');
    }
  } catch (error: any) {
    apiResponse.error(res, 'Failed to import settings', 500, error.message);
  }
});

export default router;
export { settingsService };
