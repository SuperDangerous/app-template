/**
 * EpiSensor App Template Configuration
 * Uses framework ConfigManager with app-specific schema and defaults
 */

import { z } from 'zod';
import { ConfigManager } from '@episensor/app-framework';

// App-specific configuration schema
const appConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  ports: z.object({
    api: z.number().min(1024).max(65535),
    web: z.number().min(1024).max(65535),
    websocket: z.number().min(1024).max(65535)
  }),
  development: z.object({
    autoStart: z.boolean().default(true),
    openBrowser: z.boolean().default(false),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info')
  }).optional(),
  production: z.object({
    bundleBackend: z.boolean().default(true),
    autoStart: z.boolean().default(true),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('warn')
  }).optional(),
  database: z.object({
    path: z.string().default('./data/app.db'),
    backup: z.boolean().default(true)
  }).optional(),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    file: z.string().optional(),
    maxSize: z.string().default('10MB'),
    maxFiles: z.number().default(10),
    console: z.boolean().default(true)
  }),
  security: z.object({
    cors: z.object({
      enabled: z.boolean().default(true),
      origins: z.array(z.string()).default(['http://localhost:5173', 'tauri://localhost'])
    })
  }),
  features: z.object({
    websocket: z.boolean().default(true),
    healthCheck: z.boolean().default(true),
    metrics: z.boolean().default(false),
    authentication: z.boolean().default(false)
  }).optional()
});

export type AppConfig = z.infer<typeof appConfigSchema>;

// App-specific defaults
const defaultConfig: Partial<AppConfig> = {
  ports: {
    api: 8080,
    web: 5173,
    websocket: 8080
  },
  development: {
    autoStart: true,
    openBrowser: false,
    logLevel: 'info'
  },
  production: {
    bundleBackend: true,
    autoStart: true,
    logLevel: 'warn'
  },
  logging: {
    level: 'info',
    console: true,
    maxSize: '10MB',
    maxFiles: 10
  },
  security: {
    cors: {
      enabled: true,
      origins: ['http://localhost:5173', 'tauri://localhost']
    }
  },
  features: {
    websocket: true,
    healthCheck: true,
    metrics: false,
    authentication: false
  }
};

// Initialize ConfigManager with app-specific settings
const configManager = new ConfigManager({
  schema: appConfigSchema,
  defaults: defaultConfig,
  configPath: './app.json',
  watchFile: true,
  mergeEnv: true
});

// Initialize synchronously for now - in a real app you'd want to await this
await configManager.initialize();

// Re-export framework functions with proper typing
export const getConfig = (): AppConfig => {
  const config = configManager.get();
  if (!config || !config.ports) {
    throw new Error('Configuration not loaded properly');
  }
  return config as AppConfig;
};

export const getPort = (type: keyof AppConfig['ports']): number => {
  const config = getConfig();
  // WebSocket typically runs on same port as API
  if (type === 'websocket' && config.ports.websocket === config.ports.api) {
    return config.ports.api;
  }
  return config.ports[type];
};

export const isDevelopment = (): boolean => process.env.NODE_ENV !== 'production';
export const isProduction = (): boolean => process.env.NODE_ENV === 'production';

export const getLogLevel = (): string => {
  const config = getConfig();
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL.toLowerCase();
  }
  return config.logging.level;
};

export const getCorsOrigins = (): string[] => {
  const config = getConfig();
  const origins = [...config.security.cors.origins];
  
  if (isDevelopment()) {
    origins.push(`http://localhost:${config.ports.web}`);
    origins.push(`http://127.0.0.1:${config.ports.web}`);
    origins.push('http://localhost:1420'); // Tauri dev server
  }
  
  return [...new Set(origins)];
};

// Listen for config changes
configManager.on('change', (event) => {
  console.log(`Configuration changed: ${event.key}`);
});

export { configManager };
export type { AppConfig };