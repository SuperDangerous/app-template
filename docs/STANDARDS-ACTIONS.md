# Standardization Action Plans

> **Purpose:** Detailed, executable action plans for achieving 85%+ standardization across all EpiSensor applications

## Critical Actions (Week 1)

### 1. Unify Test Framework → Vitest

**Why Vitest:** Modern, fast, better ESM support, TypeScript-first, compatible with Jest API

**Migration Plan:**
```bash
# For each app using Jest (epi-app-template, epi-vpp-manager, epi-node-programmer):
1. npm uninstall jest @types/jest ts-jest babel-jest
2. npm install -D vitest @vitest/ui c8
3. Rename jest.config.js → vitest.config.ts
4. Update test scripts in package.json
5. Replace jest.mock with vi.mock
6. Update test imports
```

**Vitest Config Template:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '*.config.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 2. Standardize Package Names

**Action for each non-compliant app:**

```bash
# epi-cpcodebase → @episensor/cpcodebase
1. Update package.json name field
2. Update all imports in dependent projects
3. Update CI/CD references
4. Update documentation

# epi-competitor-ai → @episensor/competitor-ai
1. Update package.json name field
2. Update all imports
3. Update build scripts
```

### 3. Implement ConfigManager in All Apps

**Remove hardcoded configs from:**
- epi-cpcodebase
- epi-node-programmer  
- epi-competitor-ai

**Standard Config Implementation:**
```typescript
// src/config/index.ts
import { ConfigManager } from '@episensor/app-framework';
import { z } from 'zod';

const ConfigSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    port: z.number().default(3000),
    host: z.string().default('localhost')
  }),
  database: z.object({
    url: z.string().optional(),
    poolSize: z.number().default(10)
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    file: z.boolean().default(true)
  })
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export async function initializeConfig(): Promise<AppConfig> {
  const configManager = new ConfigManager({
    configPath: './data/config/app.json',
    schema: ConfigSchema,
    defaults: {
      app: {
        name: process.env.APP_NAME || 'app',
        version: process.env.npm_package_version || '1.0.0',
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost'
      }
    }
  });
  
  await configManager.initialize();
  return configManager.get();
}
```

## High Priority Actions (Week 2)

### 4. Add OpenAPI Documentation

**Framework Enhancement:**
```typescript
// @episensor/app-framework additions
import { OpenAPIGenerator } from '@asteasolutions/zod-to-openapi';

export class APIDocGenerator {
  generateSpec(routes: Route[]): OpenAPISpec {
    // Auto-generate from Zod schemas
  }
  
  serveSwaggerUI(app: Express): void {
    // Serve Swagger UI at /api-docs
  }
}
```

**App Implementation:**
```typescript
// src/api/docs.ts
import { z } from 'zod';
import { registry } from '@episensor/app-framework';

registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  request: {
    params: z.object({ id: z.string() })
  },
  responses: {
    200: {
      description: 'User details',
      content: {
        'application/json': {
          schema: UserSchema
        }
      }
    }
  }
});
```

### 5. Implement Pre-commit Hooks

**Install in all apps:**
```bash
npm install -D husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**Standard lint-staged config:**
```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "vitest related --run"
  ],
  "*.{json,md,yml}": [
    "prettier --write"
  ]
}
```

### 6. Unify ESLint Configuration

**Create @episensor/eslint-config package:**
```javascript
// packages/eslint-config/index.js
export default [
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      'import': importPlugin
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'import/order': ['error', {
        'groups': ['builtin', 'external', 'internal'],
        'newlines-between': 'always',
        'alphabetize': { 'order': 'asc' }
      }]
    }
  }
];
```

**App usage:**
```javascript
// eslint.config.js
import episensorConfig from '@episensor/eslint-config';

export default [
  ...episensorConfig,
  // App-specific overrides if needed
];
```

## Medium Priority Actions (Week 3)

### 7. Add Docker Support

**Standard Dockerfile:**
```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
COPY data ./data
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    volumes:
      - ./data:/app/data
    environment:
      NODE_ENV: production
```

### 8. Standardize CI/CD

**GitHub Actions Template:**
```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
```

### 9. Implement Monitoring

**Framework additions:**
```typescript
// @episensor/app-framework/monitoring
import { Counter, Histogram, register } from 'prom-client';

export class MetricsCollector {
  private httpDuration: Histogram;
  private httpRequests: Counter;
  
  constructor() {
    this.httpDuration = new Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in ms',
      labelNames: ['method', 'route', 'status']
    });
    
    this.httpRequests = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status']
    });
  }
  
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.httpDuration.observe({ 
          method: req.method, 
          route: req.route?.path || 'unknown',
          status: res.statusCode 
        }, duration);
        this.httpRequests.inc({ 
          method: req.method,
          route: req.route?.path || 'unknown', 
          status: res.statusCode 
        });
      });
      next();
    };
  }
  
  getMetrics() {
    return register.metrics();
  }
}
```

## Framework Enhancements Required

### 1. Configuration Service Enhancements
```typescript
// Add to @episensor/app-framework
export class ConfigService {
  // Schema validation
  validateSchema<T>(schema: ZodSchema<T>): T;
  
  // Environment-specific configs
  loadEnvironment(env: 'dev' | 'test' | 'prod'): void;
  
  // Secret management
  encryptSecrets(fields: string[]): void;
  decryptSecrets(): void;
  
  // Hot reload
  watch(callback: (config: T) => void): void;
}
```

### 2. Error Handler Middleware
```typescript
// Add to @episensor/app-framework
export class ErrorHandler {
  static middleware() {
    return (err: Error, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || 500;
      const response = {
        error: {
          message: err.message,
          status,
          timestamp: new Date().toISOString(),
          path: req.path,
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
      };
      logger.error('Request error', { error: err, request: req.path });
      res.status(status).json(response);
    };
  }
}
```

### 3. Authentication Middleware
```typescript
// Add to @episensor/app-framework
export class AuthMiddleware {
  static basic(users: Record<string, string>) {
    return basicAuth({ users, challenge: true });
  }
  
  static session(options: SessionOptions) {
    return session({
      secret: options.secret,
      resave: false,
      saveUninitialized: false,
      store: new RedisStore(options.redis)
    });
  }
  
  static jwt(secret: string) {
    return expressjwt({ 
      secret, 
      algorithms: ['HS256'] 
    });
  }
}
```

## Migration Scripts

### Package Rename Script
```bash
#!/bin/bash
# rename-package.sh
OLD_NAME=$1
NEW_NAME=$2

# Update package.json
sed -i "s/\"name\": \"$OLD_NAME\"/\"name\": \"$NEW_NAME\"/" package.json

# Update imports
find . -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/$OLD_NAME/$NEW_NAME/g"

# Update CI/CD
find .github -type f -name "*.yml" | xargs sed -i "s/$OLD_NAME/$NEW_NAME/g"

echo "Package renamed from $OLD_NAME to $NEW_NAME"
```

### Jest to Vitest Migration Script
```bash
#!/bin/bash
# migrate-to-vitest.sh

# Uninstall Jest
npm uninstall jest @types/jest ts-jest babel-jest

# Install Vitest
npm install -D vitest @vitest/ui c8

# Rename config
mv jest.config.js vitest.config.ts 2>/dev/null || true

# Update package.json scripts
sed -i 's/"test": "jest"/"test": "vitest"/' package.json
sed -i 's/"test:watch": "jest --watch"/"test:watch": "vitest watch"/' package.json
sed -i 's/"test:coverage": "jest --coverage"/"test:coverage": "vitest --coverage"/' package.json

# Update imports in test files
find . -type f -name "*.test.ts" -o -name "*.spec.ts" | xargs sed -i "s/from 'jest'/from 'vitest'/g"
find . -type f -name "*.test.ts" -o -name "*.spec.ts" | xargs sed -i "s/jest.mock/vi.mock/g"
find . -type f -name "*.test.ts" -o -name "*.spec.ts" | xargs sed -i "s/jest.fn/vi.fn/g"

echo "Migration to Vitest complete"
```

## Validation Checklist

After implementing each action, verify:

- [ ] Tests pass with >80% coverage
- [ ] TypeScript compiles without errors
- [ ] ESLint passes with no warnings
- [ ] Application starts successfully
- [ ] API endpoints respond correctly
- [ ] Configuration loads properly
- [ ] Logs are structured and complete
- [ ] Docker image builds and runs
- [ ] CI/CD pipeline passes
- [ ] Documentation is updated

## Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | Unified testing, package names, config service |
| 2 | Quality | API docs, pre-commit hooks, ESLint |
| 3 | Infrastructure | Docker, CI/CD, monitoring |
| 4 | Polish | Documentation, migration guides, validation |

## Success Metrics

- **Before:** 58.3% standardization
- **Target:** 85% standardization
- **Deadline:** 4 weeks
- **Validation:** Automated compliance checker

---

*Execute these actions systematically, validating each step before proceeding to the next.*