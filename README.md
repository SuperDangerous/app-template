# EpiSensor Application Template

A production-ready template for building internal EpiSensor applications using the @episensor/app-framework.

## Features

- 🚀 **StandardServer** - Production-ready Express server with built-in best practices
- 🔧 **ConfigManager** - Configuration management with Zod validation and hot-reload
- 📊 **Health Monitoring** - Real-time system metrics (CPU, memory, disk)
- 📝 **Enhanced Logging** - Structured logging with multiple transports
- 🔌 **WebSocket Support** - Real-time communication with Socket.io
- 🔐 **Session Management** - Secure session handling
- 🎯 **TypeScript** - Full type safety and modern JavaScript features
- 🧪 **Testing** - Unit and integration testing setup with Vitest
- 📦 **Desktop Ready** - Can be packaged as desktop application

## Quick Start

```bash
# Clone this template
git clone https://github.com/episensor/epi-app-template.git my-app
cd my-app

# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Project Structure

```
my-app/
├── src/
│   ├── api/              # API route handlers
│   │   ├── example.ts    # Example CRUD endpoints
│   │   └── data.ts       # Data streaming endpoints
│   ├── middleware/       # Express middleware
│   │   └── errorHandler.ts
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   ├── index.ts          # Application entry point
│   └── setupApp.ts       # Express app configuration
├── data/
│   ├── config/           # Configuration files
│   └── logs/             # Application logs
├── tests/
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── web/                  # Frontend application (optional)
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests
- `npm run lint` - Check code style
- `npm run typecheck` - Check TypeScript types
- `npm run format` - Format code with Prettier
- `npm run desktop` - Run in desktop mode

## Configuration

The application uses a layered configuration approach:

1. **Default Configuration** - Built into the code
2. **Config File** - `data/config/app.json`
3. **Environment Variables** - Override any setting
4. **Hot Reload** - Changes to config file are applied automatically

Example configuration:

```json
{
  "app": {
    "name": "My Application",
    "version": "1.0.0",
    "description": "My EpiSensor Application"
  },
  "server": {
    "port": 3000,
    "webPort": 3001
  },
  "features": {
    "enableWebSocket": true,
    "enableAuth": false,
    "enableMetrics": true
  }
}
```

## API Development

### Creating a New API Route

1. Create a new file in `src/api/`:

```typescript
// src/api/devices.ts
import { Router } from 'express';
import { createLogger } from '@episensor/app-framework';

const logger = createLogger('DevicesAPI');

export function createDevicesRouter(): Router {
  const router = Router();
  
  router.get('/', (req, res) => {
    // Your logic here
    res.json({ success: true, data: [] });
  });
  
  return router;
}
```

2. Register it in `src/setupApp.ts`:

```typescript
import { createDevicesRouter } from './api/devices.js';

// In setupApp function
app.use('/api/devices', createDevicesRouter());
```

## Health Monitoring

The framework provides built-in health monitoring:

- `GET /api/health` - Basic health check
- `GET /api/health/metrics` - Detailed system metrics
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

Add custom health checks:

```typescript
const healthRouter = createHealthCheckRouter({
  version: config.app.version,
  customChecks: [
    {
      name: 'database',
      check: async () => ({
        name: 'database',
        status: db.isConnected() ? 'healthy' : 'unhealthy',
        message: 'Database connection status'
      })
    }
  ]
});
```

## WebSocket Integration

Enable real-time communication:

```typescript
// In your setup
const wsManager = new WebSocketManager(server);

// Register namespace
wsManager.registerNamespace('/data', {
  onConnection: (socket) => {
    console.log('Client connected:', socket.id);
  },
  onMessage: (socket, data) => {
    // Handle messages
  }
});

// Broadcast to all clients
wsManager.broadcast('update', { value: 123 });
```

## Testing

Write tests using Vitest:

```typescript
// tests/unit/example.test.ts
import { describe, it, expect } from 'vitest';

describe('Example API', () => {
  it('should return items', async () => {
    const response = await fetch('http://localhost:3000/api/example');
    const data = await response.json();
    
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

## Desktop Application

Package as desktop app using Electron:

```bash
# Install electron dependencies
npm install --save-dev electron electron-builder

# Add desktop entry point
# Create electron/main.js

# Run in desktop mode
npm run desktop

# Build desktop app
npm run build:desktop
```

## Production Deployment

### Environment Variables

```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-secret-key
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=warn
```

### Process Management

Use PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "my-app" -- start

# Monitor
pm2 monit

# Logs
pm2 logs my-app
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Best Practices

1. **Error Handling** - Use the provided error middleware
2. **Validation** - Use Zod schemas for input validation
3. **Logging** - Use framework logger, not console.log
4. **Configuration** - Store sensitive data in environment variables
5. **Security** - Enable CORS and session security in production
6. **Testing** - Write tests for all API endpoints
7. **Documentation** - Document your APIs with comments

## Common Patterns

### Authentication Middleware

```typescript
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required' 
    });
  }
  next();
}
```

### Background Jobs

```typescript
import { QueueService } from '@episensor/app-framework';

const queue = new QueueService();

// Register job handler
queue.registerHandler('send-email', async (data) => {
  await sendEmail(data);
});

// Queue a job
await queue.enqueue('send-email', { to: 'user@example.com' });
```

## CI/CD

### GitHub Actions Pipeline
Production-ready continuous integration and deployment:
- **Automated Testing**: Comprehensive unit and integration test execution
- **Code Quality**: ESLint, Prettier, and TypeScript strict mode validation
- **Security Scanning**: Dependency vulnerability audits and SAST analysis
- **Build Verification**: Multi-environment build testing and validation
- **Performance Testing**: API response time and memory usage monitoring
- **Docker Integration**: Multi-stage container builds with security scanning

### Deployment Strategy
1. **Development**: Feature branch development with automated testing
2. **Staging**: Automated deployment to staging environment for integration testing
3. **Production**: Blue-green deployment with zero-downtime releases
4. **Monitoring**: Real-time health checks and performance monitoring
5. **Rollback**: Instant rollback capability for production issues

### Release Management
- **Semantic Versioning**: Automated version management with conventional commits
- **Release Automation**: Tagged releases with automated changelog generation
- **Environment Promotion**: Automated promotion from staging to production
- **Feature Flags**: Configuration-driven feature rollout and A/B testing

## Architecture

### System Architecture Overview
```
┌─────────────────────────┐    ┌─────────────────────────┐
│     Web Interface       │◄──►│      API Server         │
│   (Optional Frontend)   │    │    (Express.js)         │
│   ┌─────────────────┐   │    │   ┌─────────────────┐   │
│   │ React/Vue/HTML  │   │    │   │ REST APIs       │   │
│   │ User Interface  │   │    │   │ Business Logic  │   │
│   │ Admin Panels    │   │    │   │ Data Processing │   │
│   └─────────────────┘   │    │   └─────────────────┘   │
└─────────────────────────┘    └─────────────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│   WebSocket Manager     │    │   Configuration System  │
│   (Real-time Updates)   │    │   (Hot-reload Config)   │
└─────────────────────────┘    └─────────────────────────┘
             │                              │
             ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     Core Services       │    │      Data Storage       │
│   ┌─────────────────┐   │    │   ┌─────────────────┐   │
│   │ Health Monitor  │   │    │   │ Database/Files  │   │
│   │ Session Mgmt    │   │    │   │ Configuration   │   │
│   │ Error Handling  │   │    │   │ Logs & Metrics  │   │
│   │ Security Layer  │   │    │   │ Cache Layer     │   │
│   └─────────────────┘   │    │   └─────────────────┘   │
└─────────────────────────┘    └─────────────────────────┘
```

### Framework Integration
Built on the @episensor/app-framework foundation:

#### StandardServer
- **Express.js Integration**: Pre-configured Express server with best practices
- **Middleware Stack**: Security, CORS, rate limiting, request logging
- **Error Handling**: Centralized error processing with structured logging
- **Health Endpoints**: Built-in health checks for monitoring and load balancing

#### Configuration Management
- **Layered Config**: Default → File → Environment variable override
- **Hot Reload**: Runtime configuration updates without restart
- **Schema Validation**: Zod-based configuration validation
- **Environment-Aware**: Automatic development/production configuration

#### Monitoring & Observability
- **Health Checks**: System health, dependencies, and custom checks
- **Metrics Collection**: CPU, memory, disk, and custom business metrics
- **Structured Logging**: Winston-based logging with multiple transports
- **Request Tracing**: Request/response logging with correlation IDs

### Security Architecture
- **Session Management**: Secure session handling with configurable storage
- **CORS Configuration**: Environment-aware cross-origin request handling
- **Input Validation**: Zod schema validation for all API inputs
- **Error Sanitization**: Secure error responses preventing information leakage

## Testing

### Test Strategy Overview
Comprehensive testing approach for production readiness:
- **Unit Tests**: Service layer and business logic validation
- **Integration Tests**: API endpoint and database integration testing
- **Contract Tests**: API contract validation and backward compatibility
- **Performance Tests**: Load testing and memory leak detection
- **Security Tests**: Vulnerability scanning and penetration testing

### Test Execution
```bash
# Complete test suite
npm test

# Specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage reporting
npm run test:watch         # Development watch mode

# Performance and load testing
npm run test:load          # Load testing with custom scenarios
npm run test:memory        # Memory leak detection
```

### Quality Metrics
- **Code Coverage**: Minimum 80% line coverage requirement
- **Performance**: API response times under 100ms for simple endpoints
- **Reliability**: 99.9% uptime requirement for production deployments
- **Security**: Zero high-severity vulnerabilities in dependencies

## Troubleshooting

### Common Development Issues

#### Port Conflicts
```bash
# Find process using port
lsof -i :3000
kill -9 <PID>

# Or use different port
PORT=3001 npm start

# Check configured ports
npm run check:ports
```

#### Configuration Issues
1. **Config Not Loading**: Check file path `data/config/app.json`
2. **JSON Syntax**: Validate JSON syntax with online validator
3. **File Permissions**: Ensure read access to config directory
4. **Debug Logging**: Enable verbose logging `LOG_LEVEL=debug npm start`

#### Framework Integration Problems
- **Module Resolution**: Ensure @episensor/app-framework is properly installed
- **Version Compatibility**: Check framework version compatibility
- **TypeScript Issues**: Verify TypeScript configuration and types

### Production Troubleshooting
```bash
# Health check endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health/metrics
curl http://localhost:3000/api/health/ready

# Log analysis
tail -f data/logs/application.log
grep -i error data/logs/application.log

# Performance monitoring
npm run monitor:performance
```

## Contributing

### Development Standards
1. **TypeScript**: Full type safety with strict configuration
2. **Code Style**: ESLint and Prettier with EpiSensor standards
3. **Testing**: Comprehensive test coverage for all new features
4. **Documentation**: Inline JSDoc and README updates
5. **Security**: Secure coding practices and dependency management

### Development Workflow
1. **Fork Template**: Create new repository from this template
2. **Feature Development**: Use feature branches with conventional commits
3. **Local Testing**: Run full test suite before committing
4. **Code Review**: Peer review for all changes
5. **Integration**: Ensure CI/CD pipeline passes

### Framework Contributions
For contributions to the underlying framework:
1. Submit issues to @episensor/app-framework repository
2. Follow framework contribution guidelines
3. Maintain backward compatibility
4. Update template examples as needed

### Issue Classification
- `bug`: Software defects or unexpected behavior
- `enhancement`: New features or improvements
- `framework`: Issues related to @episensor/app-framework
- `template`: Template-specific issues or improvements
- `documentation`: Documentation updates or clarifications

## Support

### Documentation Resources
- **Framework Documentation**: [EpiSensor App Framework Docs](../epi-app-framework/README.md)
- **API Reference**: Complete REST API documentation with examples
- **Configuration Guide**: Detailed configuration options and environment setup
- **Deployment Guide**: Production deployment best practices and procedures
- **Troubleshooting**: Common issues and resolution procedures

### Support Channels
- **GitHub Issues**: [Template Issues](https://github.com/episensor/epi-app-template/issues)
- **Framework Issues**: [@episensor/app-framework Issues](../epi-app-framework/issues)
- **Internal Support**: Platform Team for EpiSensor-specific questions
- **Community**: Internal developer community and knowledge sharing

### Training & Resources
- **Video Tutorials**: Framework overview and template usage examples
- **Best Practices**: EpiSensor development standards and patterns
- **Code Examples**: Real-world implementation examples and patterns
- **Architecture Reviews**: Guidance on application architecture decisions

## License

**MIT License**

Copyright (c) 2025 EpiSensor Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.