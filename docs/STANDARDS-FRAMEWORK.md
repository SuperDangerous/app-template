# Framework Enhancement Requirements

> **Purpose:** Define exact enhancements needed in @episensor/app-framework to achieve standardization goals

## Priority 1: Essential Framework Additions

### 1. Shared Configuration Service

**Current Gap:** Apps implement configuration differently, no standardized approach

**Required Enhancement:**
```typescript
// @episensor/app-framework/src/config/ConfigService.ts
import { z } from 'zod';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';

export class ConfigService<T> extends EventEmitter {
  private config: T;
  private watcher?: chokidar.FSWatcher;
  
  constructor(private options: {
    schema: z.ZodSchema<T>;
    configPath: string;
    defaults: T;
    envPrefix?: string;
    watchFile?: boolean;
    encryptedFields?: string[];
  }) {
    super();
  }
  
  async initialize(): Promise<void> {
    // 1. Load from file
    const fileConfig = await this.loadFile();
    
    // 2. Merge with environment
    const envConfig = this.loadEnvironment();
    
    // 3. Apply defaults
    const merged = this.deepMerge(this.options.defaults, fileConfig, envConfig);
    
    // 4. Validate schema
    this.config = this.options.schema.parse(merged);
    
    // 5. Decrypt sensitive fields
    if (this.options.encryptedFields) {
      await this.decryptFields();
    }
    
    // 6. Setup file watcher
    if (this.options.watchFile) {
      this.setupWatcher();
    }
  }
  
  get<K extends keyof T>(key?: K): K extends keyof T ? T[K] : T {
    if (key) {
      return this.config[key];
    }
    return this.config;
  }
  
  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    this.config[key] = value;
    await this.save();
    this.emit('change', { key, value });
  }
  
  private async loadFile(): Promise<Partial<T>> {
    try {
      return await fs.readJson(this.options.configPath);
    } catch {
      return {};
    }
  }
  
  private loadEnvironment(): Partial<T> {
    const env: any = {};
    const prefix = this.options.envPrefix || 'APP_';
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        const configKey = key.slice(prefix.length).toLowerCase().replace(/_/g, '.');
        this.setNestedValue(env, configKey, value);
      }
    }
    
    return env;
  }
  
  private setupWatcher(): void {
    this.watcher = chokidar.watch(this.options.configPath, {
      persistent: true,
      ignoreInitial: true
    });
    
    this.watcher.on('change', async () => {
      await this.reload();
      this.emit('reload', this.config);
    });
  }
}
```

### 2. Standardized Error Handler

**Current Gap:** Each app implements error handling differently

**Required Enhancement:**
```typescript
// @episensor/app-framework/src/middleware/ErrorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ErrorOptions {
  logErrors?: boolean;
  includeStack?: boolean;
  customHandlers?: Map<string, ErrorHandler>;
}

export class FrameworkError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
}

export class ValidationError extends FrameworkError {
  constructor(message: string, details: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends FrameworkError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
  }
}

export class AuthorizationError extends FrameworkError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends FrameworkError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export function createErrorHandler(options: ErrorOptions = {}) {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log if enabled
    if (options.logErrors) {
      console.error('Request error:', {
        error: err,
        request: {
          method: req.method,
          path: req.path,
          query: req.query,
          body: req.body
        }
      });
    }
    
    // Handle Zod validation errors
    if (err instanceof ZodError) {
      return res.status(400).json({
        error: {
          type: 'ValidationError',
          message: 'Request validation failed',
          status: 400,
          code: 'VALIDATION_ERROR',
          details: err.errors,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Handle framework errors
    if (err instanceof FrameworkError) {
      return res.status(err.status).json({
        error: {
          type: err.constructor.name,
          message: err.message,
          status: err.status,
          code: err.code,
          details: err.details,
          timestamp: new Date().toISOString()
        }
      });
    }
    
    // Check custom handlers
    if (options.customHandlers?.has(err.constructor.name)) {
      const handler = options.customHandlers.get(err.constructor.name);
      return handler(err, req, res, next);
    }
    
    // Default error
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
      error: {
        type: 'InternalError',
        message: isDev ? err.message : 'An internal error occurred',
        status: 500,
        code: 'INTERNAL_ERROR',
        ...(isDev && options.includeStack && { stack: err.stack }),
        timestamp: new Date().toISOString()
      }
    });
  };
}
```

### 3. API Documentation Generator

**Current Gap:** No apps have OpenAPI documentation

**Required Enhancement:**
```typescript
// @episensor/app-framework/src/docs/OpenAPIGenerator.ts
import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import swaggerUi from 'swagger-ui-express';
import { Express, Router } from 'express';

export class APIDocumentationService {
  private registry = new OpenAPIRegistry();
  
  registerEndpoint(config: {
    method: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    summary?: string;
    description?: string;
    tags?: string[];
    request?: {
      params?: z.ZodType<any>;
      query?: z.ZodType<any>;
      body?: z.ZodType<any>;
      headers?: z.ZodType<any>;
    };
    responses: {
      [statusCode: number]: {
        description: string;
        schema?: z.ZodType<any>;
      };
    };
  }): void {
    this.registry.registerPath({
      method: config.method,
      path: config.path,
      summary: config.summary,
      description: config.description,
      tags: config.tags,
      request: config.request ? {
        params: config.request.params,
        query: config.request.query,
        body: config.request.body ? {
          content: {
            'application/json': {
              schema: config.request.body
            }
          }
        } : undefined,
        headers: config.request.headers
      } : undefined,
      responses: Object.entries(config.responses).reduce((acc, [status, response]) => {
        acc[status] = {
          description: response.description,
          content: response.schema ? {
            'application/json': {
              schema: response.schema
            }
          } : undefined
        };
        return acc;
      }, {} as any)
    });
  }
  
  generateSpec(info: {
    title: string;
    version: string;
    description?: string;
  }): any {
    const generator = new OpenApiGeneratorV3(this.registry.definitions);
    return generator.generateDocument({
      openapi: '3.0.0',
      info,
      servers: [
        { url: '/api', description: 'API Server' }
      ]
    });
  }
  
  setupSwaggerUI(app: Express, path = '/api-docs'): void {
    const spec = this.generateSpec({
      title: 'API Documentation',
      version: '1.0.0'
    });
    
    app.use(path, swaggerUi.serve);
    app.get(path, swaggerUi.setup(spec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'API Documentation'
    }));
    
    // Also serve raw spec
    app.get(`${path}/spec`, (req, res) => {
      res.json(spec);
    });
  }
}

// Helper decorator for automatic registration
export function ApiEndpoint(config: any) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Register with documentation service
    // This would be connected to a global instance
  };
}
```

### 4. Authentication Middleware Suite

**Current Gap:** Inconsistent authentication across apps

**Required Enhancement:**
```typescript
// @episensor/app-framework/src/auth/AuthMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import basicAuth from 'express-basic-auth';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

export interface AuthConfig {
  type: 'basic' | 'session' | 'jwt' | 'apiKey';
  users?: Record<string, string>;
  secret?: string;
  sessionOptions?: any;
  apiKeys?: string[];
}

export class AuthenticationService {
  static createMiddleware(config: AuthConfig) {
    switch (config.type) {
      case 'basic':
        return this.createBasicAuth(config.users || {});
      case 'session':
        return this.createSessionAuth(config.secret!, config.sessionOptions);
      case 'jwt':
        return this.createJWTAuth(config.secret!);
      case 'apiKey':
        return this.createAPIKeyAuth(config.apiKeys || []);
      default:
        throw new Error(`Unknown auth type: ${config.type}`);
    }
  }
  
  private static createBasicAuth(users: Record<string, string>) {
    return basicAuth({
      users,
      challenge: true,
      realm: 'Application'
    });
  }
  
  private static createSessionAuth(secret: string, options: any) {
    return session({
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
      },
      ...options
    });
  }
  
  private static createJWTAuth(secret: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      try {
        const decoded = jwt.verify(token, secret);
        (req as any).user = decoded;
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
      }
    };
  }
  
  private static createAPIKeyAuth(validKeys: string[]) {
    const hashedKeys = validKeys.map(key => 
      createHash('sha256').update(key).digest('hex')
    );
    
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        return res.status(401).json({ error: 'No API key provided' });
      }
      
      const hashedKey = createHash('sha256').update(apiKey).digest('hex');
      
      if (!hashedKeys.includes(hashedKey)) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      
      next();
    };
  }
}
```

### 5. Test Utilities Package

**Current Gap:** Each app implements testing differently

**Required Enhancement:**
```typescript
// @episensor/app-framework/src/testing/TestUtils.ts
import { Express } from 'express';
import request from 'supertest';
import { vi } from 'vitest';

export class TestServer {
  private app: Express;
  
  constructor(app: Express) {
    this.app = app;
  }
  
  async get(path: string, headers?: Record<string, string>) {
    return request(this.app)
      .get(path)
      .set(headers || {});
  }
  
  async post(path: string, body?: any, headers?: Record<string, string>) {
    return request(this.app)
      .post(path)
      .send(body)
      .set(headers || {});
  }
  
  async put(path: string, body?: any, headers?: Record<string, string>) {
    return request(this.app)
      .put(path)
      .send(body)
      .set(headers || {});
  }
  
  async delete(path: string, headers?: Record<string, string>) {
    return request(this.app)
      .delete(path)
      .set(headers || {});
  }
}

export class MockFactory {
  static createConfigMock(overrides?: any) {
    return {
      get: vi.fn().mockReturnValue({
        app: { name: 'test', version: '1.0.0' },
        api: { port: 3000, host: 'localhost' },
        ...overrides
      }),
      set: vi.fn(),
      update: vi.fn(),
      validate: vi.fn().mockReturnValue({ valid: true })
    };
  }
  
  static createLoggerMock() {
    return {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
  }
  
  static createServiceMock(methods: string[]) {
    const mock: any = {};
    methods.forEach(method => {
      mock[method] = vi.fn();
    });
    return mock;
  }
}

export async function withTestDatabase<T>(
  fn: (db: any) => Promise<T>
): Promise<T> {
  // Setup test database
  const db = await setupTestDB();
  
  try {
    return await fn(db);
  } finally {
    // Cleanup
    await cleanupTestDB(db);
  }
}

export function createTestContext() {
  return {
    user: { id: 'test-user', role: 'admin' },
    logger: MockFactory.createLoggerMock(),
    config: MockFactory.createConfigMock()
  };
}
```

## Priority 2: Development Tool Enhancements

### 6. Shared ESLint Configuration

```bash
# New package: @episensor/eslint-config
npm init @episensor/eslint-config
```

```javascript
// @episensor/eslint-config/index.js
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_'
    }],
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' }
    }],
    'no-console': ['warn', { allow: ['warn', 'error'] }]
  }
};
```

### 7. Docker Template Generator

```typescript
// @episensor/app-framework/src/cli/docker.ts
export class DockerGenerator {
  static generateDockerfile(options: {
    nodeVersion?: string;
    port?: number;
    buildSteps?: string[];
  }): string {
    return `
FROM node:${options.nodeVersion || '20'}-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:${options.nodeVersion || '20'}-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY dist ./dist
${options.buildSteps?.join('\n') || ''}
EXPOSE ${options.port || 3000}
CMD ["node", "dist/index.js"]
`;
  }
  
  static generateDockerCompose(services: any[]): string {
    // Generate docker-compose.yml
  }
  
  static generateDockerIgnore(): string {
    return `
node_modules
npm-debug.log
.env
.env.local
dist
.git
.gitignore
README.md
.eslintrc
.prettierrc
coverage
.nyc_output
`;
  }
}
```

### 8. Metrics and Monitoring

```typescript
// @episensor/app-framework/src/monitoring/Metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export class MetricsService {
  private registry = new Registry();
  private metrics: Map<string, any> = new Map();
  
  constructor() {
    this.setupDefaultMetrics();
  }
  
  private setupDefaultMetrics() {
    // HTTP metrics
    this.metrics.set('http_requests_total', new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
      registers: [this.registry]
    }));
    
    this.metrics.set('http_request_duration_ms', new Histogram({
      name: 'http_request_duration_ms',
      help: 'HTTP request duration in ms',
      labelNames: ['method', 'path', 'status'],
      buckets: [10, 50, 100, 500, 1000, 5000],
      registers: [this.registry]
    }));
    
    // Business metrics
    this.metrics.set('business_operations_total', new Counter({
      name: 'business_operations_total',
      help: 'Total business operations',
      labelNames: ['operation', 'status'],
      registers: [this.registry]
    }));
  }
  
  recordHttpRequest(method: string, path: string, status: number, duration: number) {
    this.metrics.get('http_requests_total').inc({ method, path, status });
    this.metrics.get('http_request_duration_ms').observe({ method, path, status }, duration);
  }
  
  recordBusinessOperation(operation: string, status: 'success' | 'failure') {
    this.metrics.get('business_operations_total').inc({ operation, status });
  }
  
  middleware() {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.recordHttpRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration
        );
      });
      
      next();
    };
  }
  
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

## Priority 3: Advanced Features

### 9. Feature Flag System

```typescript
// @episensor/app-framework/src/features/FeatureFlags.ts
export class FeatureFlagService {
  private flags: Map<string, boolean> = new Map();
  
  initialize(flags: Record<string, boolean>) {
    Object.entries(flags).forEach(([key, value]) => {
      this.flags.set(key, value);
    });
  }
  
  isEnabled(flag: string): boolean {
    return this.flags.get(flag) || false;
  }
  
  middleware(flag: string) {
    return (req: any, res: any, next: any) => {
      if (!this.isEnabled(flag)) {
        return res.status(404).json({ error: 'Feature not available' });
      }
      next();
    };
  }
}
```

### 10. Database Migration System

```typescript
// @episensor/app-framework/src/database/Migrator.ts
export class DatabaseMigrator {
  async up(migrations: Migration[]): Promise<void> {
    // Run migrations
  }
  
  async down(steps: number = 1): Promise<void> {
    // Rollback migrations
  }
  
  async status(): Promise<MigrationStatus[]> {
    // Check migration status
  }
}
```

## Implementation Roadmap

### Phase 1: Core Services (Week 1)
1. ConfigService
2. ErrorHandler
3. AuthenticationService

### Phase 2: Documentation & Testing (Week 2)
4. APIDocumentationService
5. TestUtils
6. ESLint config package

### Phase 3: DevOps Tools (Week 3)
7. DockerGenerator
8. MetricsService

### Phase 4: Advanced Features (Week 4)
9. FeatureFlagService
10. DatabaseMigrator

## Usage After Implementation

```typescript
// Apps will use framework features like this:
import { 
  StandardServer,
  ConfigService,
  createErrorHandler,
  AuthenticationService,
  APIDocumentationService,
  MetricsService
} from '@episensor/app-framework';

const config = new ConfigService({
  schema: AppConfigSchema,
  configPath: './config/app.json',
  defaults: defaultConfig
});

const server = new StandardServer({
  // ... options
  onInitialize: async (app) => {
    // Error handling
    app.use(createErrorHandler({ logErrors: true }));
    
    // Authentication
    app.use('/api', AuthenticationService.createMiddleware({
      type: 'basic',
      users: { admin: 'password' }
    }));
    
    // Metrics
    const metrics = new MetricsService();
    app.use(metrics.middleware());
    
    // API Documentation
    const docs = new APIDocumentationService();
    docs.setupSwaggerUI(app);
  }
});
```

## Benefits After Implementation

1. **Consistency:** All apps use same patterns
2. **Reduced Code:** 40% less boilerplate per app
3. **Faster Development:** New apps in minutes, not hours
4. **Better Quality:** Tested, documented patterns
5. **Easier Maintenance:** Update framework, all apps benefit

---

*These enhancements will transform @episensor/app-framework into a comprehensive application framework, reducing app complexity while ensuring consistency.*