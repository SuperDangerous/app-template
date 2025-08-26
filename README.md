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

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Configuration Not Loading

1. Check file path: `data/config/app.json`
2. Verify JSON syntax
3. Check file permissions
4. Enable debug logging: `LOG_LEVEL=debug npm start`

## Support

- Documentation: [Framework Docs](https://docs.episensor.com/framework)
- Issues: [GitHub Issues](https://github.com/episensor/epi-app-template/issues)
- Internal: Contact the Platform Team

## License

MIT © EpiSensor