import React from 'react';
import { SettingsFramework } from '@episensor/app-framework/ui';
import { api } from '../lib/api';

// Define your app's settings schema
const settingsCategories = [
  {
    id: 'general',
    label: 'General',
    description: 'Basic application settings',
    settings: [
      {
        key: 'app.name',
        label: 'Application Name',
        type: 'text' as const,
        defaultValue: 'My App',
        description: 'The name displayed in the application',
        validation: {
          required: true,
          minLength: 1,
          maxLength: 50,
        },
      },
      {
        key: 'app.theme',
        label: 'Theme',
        type: 'select' as const,
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' },
        ],
        defaultValue: 'system',
        description: 'Choose your preferred color theme',
      },
      {
        key: 'app.autoSave',
        label: 'Auto Save',
        type: 'boolean' as const,
        defaultValue: true,
        description: 'Automatically save changes',
      },
    ],
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Advanced configuration options',
    settings: [
      {
        key: 'logging.level',
        label: 'Log Level',
        type: 'select' as const,
        options: [
          { value: 'error', label: 'Error' },
          { value: 'warn', label: 'Warning' },
          { value: 'info', label: 'Info' },
          { value: 'debug', label: 'Debug' },
        ],
        defaultValue: 'info',
        description: 'Minimum log level to display',
      },
      {
        key: 'api.timeout',
        label: 'API Timeout (seconds)',
        type: 'number' as const,
        defaultValue: 30,
        min: 5,
        max: 300,
        description: 'Request timeout for API calls',
      },
    ],
  },
];

export function SettingsPage() {
  const handleSave = async (values: Record<string, any>) => {
    try {
      await api.post('/api/settings', values);
      // Show success toast or handle success
      console.log('Settings saved:', values);
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error; // Let SettingsFramework handle the error
    }
  };

  const handleLoad = async () => {
    try {
      const settings = await api.get('/api/settings');
      return settings;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return {}; // Return empty object on error
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your application preferences and behavior.
        </p>
      </div>

      <SettingsFramework
        categories={settingsCategories}
        onSave={handleSave}
        onLoad={handleLoad}
      />
    </div>
  );
}
