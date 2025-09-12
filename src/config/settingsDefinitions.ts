/**
 * Application Settings Definitions
 * Using the new framework settings approach
 */

import { SettingDefinition } from '@episensor/app-framework';

export const settingsDefinitions: SettingDefinition[] = [
  // General Settings
  {
    key: 'app.name',
    label: 'Application Name',
    type: 'text',
    defaultValue: 'EpiSensor App Template',
    description: 'The name of your application',
    group: 'General',
    order: 1,
    required: true,
    validation: {
      minLength: 3,
      maxLength: 50
    }
  },
  {
    key: 'app.theme',
    label: 'Theme',
    type: 'select',
    defaultValue: 'system',
    options: [
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
      { label: 'System', value: 'system' }
    ],
    description: 'Choose the application theme',
    group: 'General',
    order: 2
  },
  {
    key: 'app.autoStart',
    label: 'Auto Start',
    type: 'boolean',
    defaultValue: false,
    description: 'Start the application automatically on system boot',
    group: 'General',
    order: 3
  },
  
  // Logging Settings
  {
    key: 'logging.level',
    label: 'Log Level',
    type: 'select',
    defaultValue: 'info',
    options: [
      { label: 'Error', value: 'error' },
      { label: 'Warning', value: 'warn' },
      { label: 'Info', value: 'info' },
      { label: 'Debug', value: 'debug' }
    ],
    description: 'Set the minimum log level to capture',
    group: 'Logging',
    order: 1
  },
  {
    key: 'logging.maxFileSize',
    label: 'Max Log File Size',
    type: 'number',
    defaultValue: 10,
    description: 'Maximum size of log files in MB',
    group: 'Logging',
    order: 2,
    validation: {
      min: 1,
      max: 100
    },
    unit: 'MB'
  },
  {
    key: 'logging.retention',
    label: 'Log Retention',
    type: 'number',
    defaultValue: 30,
    description: 'Number of days to keep log files',
    group: 'Logging',
    order: 3,
    validation: {
      min: 1,
      max: 365
    },
    unit: 'days'
  },
  {
    key: 'logging.enableCompression',
    label: 'Compress Old Logs',
    type: 'boolean',
    defaultValue: true,
    description: 'Compress log files older than 7 days',
    group: 'Logging',
    order: 4
  },
  
  // Network Settings
  {
    key: 'network.apiUrl',
    label: 'API URL',
    type: 'text',
    defaultValue: 'http://localhost:7500',
    description: 'The base URL for API requests',
    group: 'Network',
    order: 1,
    validation: {
      pattern: '^https?://',
      message: 'Must be a valid URL starting with http:// or https://'
    }
  },
  {
    key: 'network.timeout',
    label: 'Request Timeout',
    type: 'number',
    defaultValue: 30,
    description: 'Request timeout in seconds',
    group: 'Network',
    order: 2,
    validation: {
      min: 5,
      max: 300
    },
    unit: 'seconds'
  },
  {
    key: 'network.retries',
    label: 'Max Retries',
    type: 'number',
    defaultValue: 3,
    description: 'Maximum number of retries for failed requests',
    group: 'Network',
    order: 3,
    validation: {
      min: 0,
      max: 10
    }
  },
  {
    key: 'network.enableProxy',
    label: 'Use Proxy',
    type: 'boolean',
    defaultValue: false,
    description: 'Enable proxy for network requests',
    group: 'Network',
    order: 4
  },
  {
    key: 'network.proxyUrl',
    label: 'Proxy URL',
    type: 'text',
    defaultValue: '',
    description: 'Proxy server URL',
    group: 'Network',
    order: 5,
    showIf: (settings) => settings['network.enableProxy'] === true,
    validation: {
      pattern: '^https?://',
      message: 'Must be a valid URL'
    }
  },
  
  // Advanced Settings
  {
    key: 'advanced.debugMode',
    label: 'Debug Mode',
    type: 'boolean',
    defaultValue: false,
    description: 'Enable debug mode for detailed logging',
    group: 'Advanced',
    order: 1,
    confirmMessage: 'Enabling debug mode may impact performance. Continue?'
  },
  {
    key: 'advanced.experimentalFeatures',
    label: 'Experimental Features',
    type: 'boolean',
    defaultValue: false,
    description: 'Enable experimental features (may be unstable)',
    group: 'Advanced',
    order: 2,
    confirmMessage: 'Experimental features may cause instability. Enable anyway?'
  },
  {
    key: 'advanced.customConfig',
    label: 'Custom Configuration',
    type: 'json',
    defaultValue: '{}',
    description: 'Advanced JSON configuration (for experts only)',
    group: 'Advanced',
    order: 3,
    rows: 10,
    hint: 'Enter valid JSON configuration',
    validation: {
      custom: (value: string) => {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return 'Must be valid JSON';
        }
      }
    }
  }
];

export default settingsDefinitions;