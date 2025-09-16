/**
 * Settings Page using the framework's SettingsPage component
 */

import React from 'react';
import { SettingsPage as FrameworkSettingsPage, defaultSettingsCategories } from '@episensor/app-framework/ui';
import { Settings, Network, FileText, Shield, Bell } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

// Define app-specific settings categories
const appCategories = [
  {
    id: 'general',
    label: 'General',
    description: 'Basic application settings',
    icon: <Settings className="h-4 w-4" />,
    settings: [
      {
        key: 'app.name',
        label: 'Application Name',
        description: 'The name displayed in the UI',
        type: 'text' as const,
        defaultValue: 'App Template'
      },
      {
        key: 'app.theme',
        label: 'Theme',
        description: 'Choose your preferred theme',
        type: 'select' as const,
        defaultValue: 'light',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
          { value: 'system', label: 'System' }
        ]
      },
      {
        key: 'app.autoUpdate',
        label: 'Auto Update',
        description: 'Automatically check for updates',
        type: 'boolean' as const,
        defaultValue: true
      }
    ]
  },
  {
    id: 'network',
    label: 'Network',
    description: 'Network and connectivity settings',
    icon: <Network className="h-4 w-4" />,
    settings: [
      {
        key: 'network.apiUrl',
        label: 'API URL',
        description: 'Backend API endpoint',
        type: 'text' as const,
        defaultValue: 'http://localhost:7500',
        validation: (value: string) => {
          if (!value) return 'API URL is required';
          try {
            new URL(value);
            return null;
          } catch {
            return 'Invalid URL format';
          }
        }
      },
      {
        key: 'network.timeout',
        label: 'Request Timeout (ms)',
        description: 'Maximum time to wait for API requests',
        type: 'number' as const,
        defaultValue: 30000,
        min: 1000,
        max: 120000
      },
      {
        key: 'network.retryAttempts',
        label: 'Retry Attempts',
        description: 'Number of times to retry failed requests',
        type: 'number' as const,
        defaultValue: 3,
        min: 0,
        max: 10
      }
    ]
  },
  {
    id: 'logging',
    label: 'Logging',
    description: 'Logging configuration',
    icon: <FileText className="h-4 w-4" />,
    settings: [
      {
        key: 'logging.level',
        label: 'Log Level',
        description: 'Minimum level of logs to capture',
        type: 'select' as const,
        defaultValue: 'info',
        options: [
          { value: 'error', label: 'Error' },
          { value: 'warn', label: 'Warning' },
          { value: 'info', label: 'Info' },
          { value: 'debug', label: 'Debug' },
          { value: 'verbose', label: 'Verbose' }
        ],
        requiresRestart: true
      },
      {
        key: 'logging.console',
        label: 'Console Output',
        description: 'Show logs in browser console',
        type: 'boolean' as const,
        defaultValue: true
      },
      {
        key: 'logging.maxFiles',
        label: 'Max Log Files',
        description: 'Maximum number of log files to keep',
        type: 'number' as const,
        defaultValue: 5,
        min: 1,
        max: 20
      }
    ]
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Security settings',
    icon: <Shield className="h-4 w-4" />,
    settings: [
      {
        key: 'security.sessionTimeout',
        label: 'Session Timeout (minutes)',
        description: 'Automatically log out after inactivity',
        type: 'number' as const,
        defaultValue: 30,
        min: 5,
        max: 1440
      },
      {
        key: 'security.enableHttps',
        label: 'Force HTTPS',
        description: 'Redirect all HTTP traffic to HTTPS',
        type: 'boolean' as const,
        defaultValue: false,
        requiresRestart: true
      }
    ]
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Notification preferences',
    icon: <Bell className="h-4 w-4" />,
    settings: [
      {
        key: 'notifications.desktop',
        label: 'Desktop Notifications',
        description: 'Show desktop notifications for important events',
        type: 'boolean' as const,
        defaultValue: true
      },
      {
        key: 'notifications.sound',
        label: 'Sound Alerts',
        description: 'Play sound for notifications',
        type: 'boolean' as const,
        defaultValue: false
      }
    ]
  }
];

export function SettingsPage() {
  const [values, setValues] = React.useState<Record<string, any>>({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showRestartBanner, setShowRestartBanner] = React.useState(false);

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/settings');
      setValues(response.data || {});
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newValues: Record<string, any>) => {
    try {
      setSaving(true);
      
      // Check which settings require restart
      const changedKeys = Object.keys(newValues).filter(
        key => JSON.stringify(newValues[key]) !== JSON.stringify(values[key])
      );
      
      const requiresRestart = changedKeys.some(key => {
        for (const category of appCategories) {
          const setting = category.settings.find(s => s.key === key);
          if (setting?.requiresRestart) return true;
        }
        return false;
      });

      await api.put('/api/settings', newValues);
      setValues(newValues);
      toast.success('Settings saved successfully');
      
      if (requiresRestart) {
        setShowRestartBanner(true);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    loadSettings();
  };

  const handleRestart = async () => {
    try {
      await api.post('/api/system/restart');
      toast.success('Application restarting...');
      setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      toast.error('Failed to restart application');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <FrameworkSettingsPage
      categories={appCategories}
      values={values}
      loading={loading}
      saving={saving}
      onSave={handleSave}
      onReset={handleReset}
      onRestart={handleRestart}
      showRestartBanner={showRestartBanner}
      title="Application Settings"
    />
  );
}