# Configuration Guide

## Overview

The EpiSensor App Template provides a comprehensive configuration system built on the @episensor/app-framework, enabling rapid development of internal applications with consistent settings and behaviour.

## Application Configuration

### app.json Configuration

The `app.json` file is the primary configuration for your application:

```json
{
  "name": "Your App Name",
  "displayName": "Your App Display Name",
  "description": "Brief description of your application",
  "version": "1.0.0",
  "ports": {
    "http": 3010,
    "websocket": 3011
  },
  "branding": {
    "primaryColour": "#E21350",
    "secondaryColour": "#2C3E50",
    "logo": "assets/logo.png"
  },
  "features": {
    "websockets": true,
    "authentication": false,
    "logging": true,
    "healthCheck": true
  }
}
```

### Environment Configuration

Create a `.env` file in the project root for local development:

```bash
# Application Settings
NODE_ENV=development
APP_NAME=Your App Name
APP_VERSION=1.0.0

# Server Configuration
HTTP_PORT=3010
WEBSOCKET_PORT=3011
HOST=localhost

# Framework Configuration
FRAMEWORK_DEBUG=false
FRAMEWORK_LOG_LEVEL=info

# Logging Configuration
LOG_LEVEL=debug
LOG_TO_FILE=true
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10MB
LOG_MAX_FILES=5

# Development Settings
ENABLE_HOT_RELOAD=true
ENABLE_MOCK_DATA=true
ENABLE_DEBUG_ROUTES=true

# Tauri Configuration (Desktop)
TAURI_ENABLED=true
TAURI_AUTO_START=true
TAURI_WINDOW_TITLE=Your App Name
TAURI_WINDOW_WIDTH=1200
TAURI_WINDOW_HEIGHT=800
```

### Production Environment

For production deployment, create a `.env.production`:

```bash
NODE_ENV=production
APP_NAME=Your App Name
APP_VERSION=1.0.0

# Production Server Settings
HTTP_PORT=80
WEBSOCKET_PORT=81
HOST=0.0.0.0

# Security Settings
ENABLE_DEBUG_ROUTES=false
FRAMEWORK_DEBUG=false

# Production Logging
LOG_LEVEL=warn
LOG_TO_FILE=true
LOG_FILE_PATH=/var/log/your-app/app.log

# Performance Settings
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
CACHE_TTL=3600

# Tauri Production Settings
TAURI_ENABLED=true
TAURI_AUTO_START=false
```

## Framework Integration

### ConfigManager Usage

The app template uses the framework's ConfigManager for centralised configuration:

```typescript
import { ConfigManager } from '@episensor/app-framework';

// Load configuration
const config = ConfigManager.getInstance();
await config.loadConfig('app.json');

// Access configuration values
const appName = config.get('name');
const httpPort = config.get('ports.http');
const primaryColour = config.get('branding.primaryColour');

// Environment variable override
const actualPort = config.get('HTTP_PORT') || config.get('ports.http');
```

### Configuration Schema

Define your configuration schema for validation:

```typescript
import { z } from 'zod';

const AppConfigSchema = z.object({
  name: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  ports: z.object({
    http: z.number().int().min(1000).max(65535),
    websocket: z.number().int().min(1000).max(65535)
  }),
  branding: z.object({
    primaryColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondaryColour: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    logo: z.string().optional()
  }),
  features: z.object({
    websockets: z.boolean().default(true),
    authentication: z.boolean().default(false),
    logging: z.boolean().default(true),
    healthCheck: z.boolean().default(true)
  })
});

// Apply schema validation
config.setSchema(AppConfigSchema);
```

## Branding and Theming

### Colour Palette Configuration

Configure your application's colour scheme:

```typescript
// In your main application file
const brandingConfig = {
  colours: {
    primary: config.get('branding.primaryColour') || '#E21350',
    secondary: config.get('branding.secondaryColour') || '#2C3E50',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    headingFontFamily: 'Inter, system-ui, sans-serif'
  }
};
```

### CSS Custom Properties

The template automatically generates CSS custom properties from your configuration:

```css
:root {
  --color-primary: #E21350;
  --color-secondary: #2C3E50;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
}
```

## Logging Configuration

### Enhanced Logger Setup

Configure structured logging with the framework's enhanced logger:

```typescript
import { enhancedLogger } from '@episensor/app-framework';

const logger = enhancedLogger.createLogger({
  level: config.get('LOG_LEVEL') || 'info',
  service: config.get('name'),
  version: config.get('version'),
  transports: [
    {
      type: 'console',
      format: 'simple',
      colorize: true
    },
    {
      type: 'file',
      filename: config.get('LOG_FILE_PATH') || './logs/app.log',
      maxsize: config.get('LOG_MAX_SIZE') || '10MB',
      maxFiles: config.get('LOG_MAX_FILES') || 5
    }
  ]
});
```

### Log Categories

Use structured logging categories for better organisation:

```typescript
logger.info('Application started', {
  category: 'startup',
  port: httpPort,
  environment: process.env.NODE_ENV
});

logger.debug('Processing user request', {
  category: 'api',
  endpoint: '/api/data',
  userId: 'user123'
});

logger.error('Database connection failed', {
  category: 'database',
  error: error.message,
  stack: error.stack
});
```

## WebSocket Configuration

### WebSocket Manager Setup

Configure real-time communication:

```typescript
import { WebSocketManager } from '@episensor/app-framework';

const wsManager = new WebSocketManager({
  port: config.get('ports.websocket'),
  cors: {
    origin: config.get('CORS_ORIGIN') || 'http://localhost:3000',
    credentials: true
  },
  authentication: config.get('features.authentication')
});

// Configure namespaces
wsManager.createNamespace('/app', {
  requireAuth: false,
  rooms: ['general', 'notifications']
});
```

### Client Configuration

Configure the WebSocket client in your frontend:

```typescript
import { io } from 'socket.io-client';

const socket = io(`ws://localhost:${websocketPort}/app`, {
  transports: ['websocket'],
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

## Tauri Desktop Configuration

### Tauri Settings

Configure desktop application behaviour in `src-tauri/tauri.conf.json`:

```json
{
  "package": {
    "productName": "Your App Name",
    "version": "1.0.0"
  },
  "tauri": {
    "windows": [
      {
        "title": "Your App Name",
        "width": 1200,
        "height": 800,
        "minWidth": 800,
        "minHeight": 600,
        "resizable": true,
        "center": true
      }
    ],
    "bundle": {
      "identifier": "com.episensor.your-app-name",
      "category": "Utility",
      "shortDescription": "Brief description",
      "longDescription": "Detailed description of your application"
    }
  }
}
```

### Desktop-Specific Configuration

Handle desktop-specific settings:

```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { appWindow } from '@tauri-apps/api/window';

// Configure window behaviour
if (window.__TAURI__) {
  await appWindow.setTitle(config.get('name'));
  await appWindow.setSize({
    width: config.get('TAURI_WINDOW_WIDTH') || 1200,
    height: config.get('TAURI_WINDOW_HEIGHT') || 800
  });
}
```

## Development vs Production

### Development Configuration

Development-specific settings for optimal developer experience:

```typescript
if (process.env.NODE_ENV === 'development') {
  // Enable hot reload
  if (config.get('ENABLE_HOT_RELOAD')) {
    setupHotReload();
  }
  
  // Enable debug routes
  if (config.get('ENABLE_DEBUG_ROUTES')) {
    app.use('/debug', debugRouter);
  }
  
  // Enable mock data
  if (config.get('ENABLE_MOCK_DATA')) {
    loadMockData();
  }
}
```

### Production Optimisations

Production-specific configuration for performance and security:

```typescript
if (process.env.NODE_ENV === 'production') {
  // Enable compression
  if (config.get('ENABLE_COMPRESSION')) {
    app.use(compression());
  }
  
  // Enable security headers
  app.use(helmet());
  
  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }));
}
```

## Configuration Best Practices

### Security Considerations

1. **Environment Variables**: Never commit sensitive values to version control
2. **Validation**: Always validate configuration with schemas
3. **Defaults**: Provide sensible defaults for optional settings
4. **Documentation**: Document all configuration options

### Performance Optimisation

1. **Lazy Loading**: Load configuration only when needed
2. **Caching**: Cache frequently accessed configuration values
3. **Hot Reload**: Support configuration changes without restart
4. **Minimal Config**: Keep configuration files small and focused

### Maintenance

1. **Version Control**: Track configuration changes
2. **Migration**: Provide migration scripts for configuration updates
3. **Testing**: Test configuration in different environments
4. **Monitoring**: Monitor configuration-related errors

---
Copyright (C) EpiSensor 2025