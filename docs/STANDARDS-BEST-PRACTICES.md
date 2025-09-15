# Best Practices Reference Guide

> **Purpose:** Document the best implementation of each standardization area from across all EpiSensor applications

## Best Practice Champions by Category

### 🏆 Startup & Initialization
**Winner: epi-app-template**

```typescript
// src/index.ts - BEST PRACTICE
import { StandardServer, createLogger } from '@episensor/app-framework';
import { initializeConfig, getAllConfig } from './config/index.js';
import { setupApp } from './setupApp.js';

const logger = createLogger('Main');

(async () => {
  try {
    // 1. Initialize configuration first
    await initializeConfig();
    const config = getAllConfig();
    
    // 2. Create server with comprehensive options
    const server = new StandardServer({
      appName: config.app.name,
      appVersion: config.app.version,
      description: config.app.description,
      port: config.api.port,
      host: config.api.host,
      enableWebSocket: true,
      enableDesktop: process.env.DESKTOP === 'true',
      
      onInitialize: async (app) => {
        await setupApp(app);
      },
      
      onStart: async () => {
        logger.info('Server started successfully');
        // Initialize background services
      }
    });
    
    // 3. Initialize and start
    await server.initialize();
    await server.start();
    
    // 4. Graceful shutdown handlers
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
})();
```

### 🏆 Configuration Management
**Winner: epi-modbus-simulator**

```typescript
// src/config/schema.ts - BEST PRACTICE
import { z } from 'zod';

export const ConfigSchema = z.object({
  app: z.object({
    name: z.string().default('Modbus Simulator'),
    version: z.string(),
    description: z.string()
  }),
  
  api: z.object({
    port: z.number().default(3001),
    host: z.string().default('0.0.0.0')
  }),
  
  web: z.object({
    port: z.number().default(3002),
    devPort: z.number().default(3003)
  }),
  
  modbus: z.object({
    devices: z.array(z.object({
      id: z.string(),
      name: z.string(),
      host: z.string(),
      port: z.number(),
      unitId: z.number(),
      registers: z.record(z.any())
    })).default([])
  }),
  
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    file: z.object({
      enabled: z.boolean().default(true),
      path: z.string().default('./data/logs'),
      maxSize: z.string().default('10m'),
      maxFiles: z.number().default(7)
    })
  }),
  
  supervisor: z.object({
    enabled: z.boolean().default(false),
    checkInterval: z.number().default(30000),
    services: z.array(z.string()).default([])
  })
});

export type AppConfig = z.infer<typeof ConfigSchema>;
```

```typescript
// src/config/index.ts - BEST PRACTICE
import { ConfigManager, SettingsService } from '@episensor/app-framework';
import { ConfigSchema, type AppConfig } from './schema.js';
import { getConfigFilePath } from '../utils/dataPaths.js';

let configManager: ConfigManager<AppConfig>;
let settingsService: SettingsService;

export async function initializeConfig(): Promise<AppConfig> {
  // 1. Create config manager with schema
  configManager = new ConfigManager({
    configPath: getConfigFilePath('app.json'),
    schema: ConfigSchema,
    defaults: ConfigSchema.parse({}),
    watchFile: process.env.NODE_ENV === 'development',
    mergeEnv: true
  });
  
  // 2. Initialize and load
  await configManager.initialize();
  
  // 3. Setup settings service for runtime changes
  settingsService = new SettingsService({
    storagePath: getConfigFilePath('settings.json'),
    autoSave: true,
    saveDebounce: 1000,
    encryptSensitive: true,
    sensitiveFields: ['api.key', 'database.password']
  });
  
  // 4. Register settings categories
  settingsService.registerCategory({
    id: 'general',
    label: 'General Settings',
    fields: [
      { key: 'app.name', type: 'string', label: 'Application Name' },
      { key: 'api.port', type: 'number', label: 'API Port' }
    ]
  });
  
  // 5. Load and merge settings
  await settingsService.load();
  const settings = settingsService.getAll();
  if (settings) {
    await configManager.update(settings);
  }
  
  // 6. Watch for changes
  settingsService.on('change', async ({ key, value }) => {
    await configManager.set(key, value);
    logger.info(`Setting changed: ${key}`);
  });
  
  return configManager.get();
}

export function getConfig(): AppConfig {
  return configManager.get();
}
```

### 🏆 TypeScript Configuration
**Winner: epi-competitor-ai**

```json
// tsconfig.json - BEST PRACTICE
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "rootDir": "./src",
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "noEmit": false,
    "incremental": true,
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "allowSyntheticDefaultImports": true,
    "paths": {
      "@/*": ["./src/*"],
      "@config": ["./src/config/index.js"],
      "@api/*": ["./src/api/*"],
      "@services/*": ["./src/services/*"],
      "@utils/*": ["./src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"],
  "ts-node": {
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

### 🏆 ESLint Configuration
**Winner: epi-modbus-simulator**

```javascript
// eslint.config.js - BEST PRACTICE (ESLint 9+ flat config)
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': typescript,
      'import': importPlugin
    },
    rules: {
      // TypeScript specific
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports'
      }],
      
      // Import organization
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index'
        ],
        'newlines-between': 'always',
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'import/no-duplicates': 'error',
      
      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error'
    }
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  }
];
```

### 🏆 Testing Configuration
**Winner: epi-modbus-simulator**

```typescript
// vitest.config.ts - BEST PRACTICE
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', 'web'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '*.config.ts',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        'tests/',
        'web/'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 1000,
    isolate: true,
    threads: true,
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './src/config'),
      '@api': path.resolve(__dirname, './src/api'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils')
    }
  }
});
```

```typescript
// tests/setup.ts - BEST PRACTICE
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { server } from './mocks/server';

// Start mock server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers
afterEach(() => server.resetHandlers());

// Clean up
afterAll(() => server.close());

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test utilities
global.testUtils = {
  async waitFor(condition: () => boolean, timeout = 5000): Promise<void> {
    const start = Date.now();
    while (!condition()) {
      if (Date.now() - start > timeout) {
        throw new Error('Timeout waiting for condition');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
};
```

### 🏆 API Structure
**Winner: epi-cpcodebase**

```typescript
// src/api/index.ts - BEST PRACTICE
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '@episensor/app-framework';

import projectRoutes from './projects.js';
import analysisRoutes from './analysis.js';
import healthRoutes from './health.js';

const router = Router();

// Mount sub-routers
router.use('/projects', projectRoutes);
router.use('/analysis', analysisRoutes);
router.use('/health', healthRoutes);

// Global error handler
router.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message,
      status,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

export default router;
```

```typescript
// src/api/projects.ts - BEST PRACTICE
import { Router } from 'express';
import { z } from 'zod';
import { validateRequest, asyncHandler } from '@episensor/app-framework';
import { ProjectService } from '../services/ProjectService.js';

const router = Router();
const projectService = new ProjectService();

// Schemas
const CreateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    config: z.record(z.any()).optional()
  })
});

const ProjectParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

// Routes
router.get('/', asyncHandler(async (req, res) => {
  const projects = await projectService.listProjects();
  res.json({ data: projects });
}));

router.get('/:id', 
  validateRequest(ProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ data: project });
  })
);

router.post('/',
  validateRequest(CreateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.body);
    res.status(201).json({ data: project });
  })
);

router.put('/:id',
  validateRequest(ProjectParamsSchema),
  validateRequest(CreateProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.body);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ data: project });
  })
);

router.delete('/:id',
  validateRequest(ProjectParamsSchema),
  asyncHandler(async (req, res) => {
    const deleted = await projectService.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).send();
  })
);

export default router;
```

### 🏆 Logging Pattern
**Winner: epi-app-template**

```typescript
// src/utils/logger.ts - BEST PRACTICE
import { createLogger } from '@episensor/app-framework';

// Create categorized loggers
export const loggers = {
  main: createLogger('Main'),
  api: createLogger('API'),
  service: createLogger('Service'),
  database: createLogger('Database'),
  websocket: createLogger('WebSocket'),
  auth: createLogger('Auth'),
  scheduler: createLogger('Scheduler')
};

// Structured logging helper
export function logRequest(req: Request, res: Response, duration: number): void {
  loggers.api.info('Request completed', {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
}

export function logError(error: Error, context?: Record<string, any>): void {
  loggers.main.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
}

export function logMetric(name: string, value: number, tags?: Record<string, string>): void {
  loggers.main.info('Metric', {
    metric: name,
    value,
    tags,
    timestamp: Date.now()
  });
}
```

### 🏆 Error Handling
**Winner: epi-vpp-manager**

```typescript
// src/middleware/errorHandler.ts - BEST PRACTICE
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logError } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logError(err, {
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });
  
  // Handle different error types
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        status: 400,
        code: 'VALIDATION_ERROR',
        details: err.errors
      }
    });
  } else if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        message: err.message,
        status: err.status,
        code: err.code,
        details: err.details
      }
    });
  } else {
    // Generic error
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: {
        message: isDev ? err.message : 'Internal server error',
        status: 500,
        code: 'INTERNAL_ERROR',
        ...(isDev && { stack: err.stack })
      }
    });
  }
}
```

### 🏆 Frontend Build Setup
**Winner: epi-competitor-ai**

```typescript
// vite.config.ts - BEST PRACTICE
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: './web',
  build: {
    outDir: '../dist/web',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'utils': ['axios', 'date-fns', 'zod']
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './web/src'),
      '@components': path.resolve(__dirname, './web/src/components'),
      '@hooks': path.resolve(__dirname, './web/src/hooks'),
      '@utils': path.resolve(__dirname, './web/src/utils'),
      '@api': path.resolve(__dirname, './web/src/api')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
});
```

## Quick Reference Cheat Sheet

| What | Best Practice From | Key Takeaway |
|------|-------------------|--------------|
| Server startup | epi-app-template | Use StandardServer with full config |
| Config schema | epi-modbus-simulator | Comprehensive Zod schemas |
| Config management | epi-modbus-simulator | ConfigManager + SettingsService |
| TypeScript config | epi-competitor-ai | NodeNext module resolution |
| ESLint setup | epi-modbus-simulator | Flat config with TypeScript |
| Test framework | epi-modbus-simulator | Vitest with coverage |
| API structure | epi-cpcodebase | Clean route separation |
| Error handling | epi-vpp-manager | Typed errors with details |
| Logging | epi-app-template | Categorized structured logs |
| Frontend build | epi-competitor-ai | Vite with optimizations |

## Implementation Priority

1. **Copy these exact patterns** when standardizing
2. **Don't reinvent** - use the proven implementations
3. **Adapt minimally** - only change what's app-specific
4. **Document deviations** - explain why if you must differ

---

*These patterns have been battle-tested across production applications. Use them as your reference implementation.*