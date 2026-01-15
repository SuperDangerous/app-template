/**
 * Settings Configuration for SuperDangerous App Template
 * Uses the framework's settings service
 */

/**
 * Type for all valid setting values
 */
export type SettingValue = string | number | boolean;

/**
 * Type for setting keys
 */
export type SettingKey = keyof typeof defaultSettings;

/**
 * Settings record type
 */
export type SettingsRecord = Record<string, SettingValue>;

export const defaultSettings = {
  // Application
  'app.name': 'SuperDangerous App Template',
  'app.description': 'A comprehensive template for SuperDangerous applications',
  'app.theme': 'superdangerous',
  'app.language': 'en',
  'app.autoUpdate': true,
  'app.updateChannel': 'stable',
  
  // Network
  'network.apiPort': 7500,
  'network.webPort': 7501,
  'network.enableWebSocket': true,
  'network.corsOrigins': 'http://localhost:*,file://',
  'network.maxConnections': 100,
  'network.timeout': 30000,
  
  // Logging
  'logging.level': 'info',
  'logging.console': true,
  'logging.file': true,
  'logging.maxFileSize': 10,
  'logging.maxFiles': 5,
  'logging.retentionDays': 30,
  'logging.includeStackTrace': false,
  
  // Storage
  'storage.dataPath': './data',
  'storage.enableBackup': true,
  'storage.backupInterval': 'daily',
  'storage.maxBackups': 10,
  'storage.compressBackups': true,
  'storage.cacheSize': 100,
  
  // Security
  'security.enableAuth': false,
  'security.authMethod': 'token',
  'security.sessionTimeout': 30,
  'security.enableHttps': false,
  'security.tlsCert': '',
  'security.tlsKey': '',
  'security.rateLimit': true,
  'security.maxRequestsPerMinute': 60,
  
  // Advanced
  'advanced.debugMode': false,
  'advanced.performanceMonitoring': true,
  'advanced.telemetry': false,
  'advanced.experimental': false,
  'advanced.customScripts': '',
  'advanced.environment': 'production',

  // Email
  'email.enabled': false,
  'email.provider': 'smtp',
  'email.resendApiKey': '',
  'email.smtpHost': '',
  'email.smtpPort': 587,
  'email.smtpSecure': false,
  'email.smtpUser': '',
  'email.smtpPass': '',
  'email.fromAddress': 'SuperDangerous App <noreply@superdangerous.com>',
  'email.defaultRecipients': ''
};

export const settingsMetadata = {
  categories: [
    {
      id: 'app',
      label: 'Application',
      icon: 'settings',
      description: 'General application settings'
    },
    {
      id: 'network',
      label: 'Network',
      icon: 'network',
      description: 'Network and connectivity settings'
    },
    {
      id: 'logging',
      label: 'Logging',
      icon: 'logs',
      description: 'Logging configuration'
    },
    {
      id: 'storage',
      label: 'Storage',
      icon: 'database',
      description: 'Data storage settings'
    },
    {
      id: 'security',
      label: 'Security',
      icon: 'shield',
      description: 'Security and authentication'
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: 'advanced',
      description: 'Advanced configuration'
    },
    {
      id: 'email',
      label: 'Email',
      icon: 'mail',
      description: 'Email notifications and alerts'
    }
  ]
};