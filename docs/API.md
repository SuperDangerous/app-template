# API Reference

## Overview

The EpiSensor App Template provides a foundation for building REST APIs and WebSocket services using the @episensor/app-framework. This document covers the standard API patterns, framework integration, and example implementations.

## Framework Integration

### Express.js Setup

The template uses the framework's standardised Express.js setup:

```typescript
import express from 'express';
import { 
  ConfigManager, 
  enhancedLogger, 
  healthCheck,
  cors,
  auth 
} from '@episensor/app-framework';

const app = express();
const config = ConfigManager.getInstance();
const logger = enhancedLogger.createLogger({ service: 'your-app' });

// Standard middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(config.get('cors')));

// Framework health check
app.use('/health', healthCheck);

// Your API routes
app.use('/api', apiRouter);
```

### Base API Structure

Standard API endpoint structure:

```
/api/v1/
├── /health          # Health check endpoint
├── /status          # Application status
├── /config          # Configuration endpoints
├── /websocket       # WebSocket connection info
└── /[your-routes]   # Your application-specific routes
```

## Standard Endpoints

### Health Check

**GET** `/health`

Framework-provided health monitoring:

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-14T10:00:00Z",
  "uptime": 3600,
  "version": "1.0.0",
  "checks": {
    "memory": "ok",
    "cpu": "ok",
    "disk": "ok"
  }
}
```

### Application Status

**GET** `/api/v1/status`

Application-specific status information:

```typescript
app.get('/api/v1/status', (req, res) => {
  res.json({
    success: true,
    data: {
      name: config.get('name'),
      version: config.get('version'),
      environment: process.env.NODE_ENV,
      features: config.get('features'),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ports: {
        http: config.get('ports.http'),
        websocket: config.get('ports.websocket')
      }
    }
  });
});
```

### Configuration Management

**GET** `/api/v1/config`

Retrieve public configuration:

```typescript
app.get('/api/v1/config', (req, res) => {
  const publicConfig = {
    name: config.get('name'),
    version: config.get('version'),
    branding: config.get('branding'),
    features: config.get('features')
  };
  
  res.json({
    success: true,
    data: publicConfig
  });
});
```

**PUT** `/api/v1/config`

Update configuration (if enabled):

```typescript
app.put('/api/v1/config', auth.requireAdmin, async (req, res) => {
  try {
    await config.update(req.body);
    
    res.json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    logger.error('Configuration update failed', { error: error.message });
    
    res.status(400).json({
      success: false,
      error: 'Configuration update failed',
      details: error.message
    });
  }
});
```

## WebSocket API

### Connection Management

The template provides WebSocket integration through the framework:

```typescript
import { WebSocketManager } from '@episensor/app-framework';

const wsManager = new WebSocketManager({
  port: config.get('ports.websocket'),
  cors: { origin: '*' }
});

// Create application namespace
const appNamespace = wsManager.createNamespace('/app');

// Handle connections
appNamespace.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });
  
  // Join general room
  socket.join('general');
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});
```

### WebSocket Events

#### Client to Server Events

**`join_room`**
```typescript
socket.on('join_room', (data) => {
  const { room } = data;
  socket.join(room);
  
  socket.emit('joined_room', { 
    room, 
    message: `Joined ${room} successfully` 
  });
  
  // Notify others in the room
  socket.to(room).emit('user_joined', { 
    socketId: socket.id,
    room 
  });
});
```

**`leave_room`**
```typescript
socket.on('leave_room', (data) => {
  const { room } = data;
  socket.leave(room);
  
  socket.emit('left_room', { 
    room, 
    message: `Left ${room} successfully` 
  });
  
  // Notify others in the room
  socket.to(room).emit('user_left', { 
    socketId: socket.id,
    room 
  });
});
```

**`send_message`**
```typescript
socket.on('send_message', (data) => {
  const { room, message, type = 'text' } = data;
  
  const messageData = {
    id: generateId(),
    socketId: socket.id,
    message,
    type,
    timestamp: new Date().toISOString()
  };
  
  // Send to all clients in room
  appNamespace.to(room).emit('message_received', messageData);
  
  logger.info('Message sent', { room, messageId: messageData.id });
});
```

#### Server to Client Events

**`status_update`**
```typescript
// Broadcast status updates to all clients
const broadcastStatus = (status) => {
  appNamespace.emit('status_update', {
    status,
    timestamp: new Date().toISOString()
  });
};
```

**`notification`**
```typescript
// Send notifications to specific rooms or all clients
const sendNotification = (notification, room = null) => {
  const target = room ? appNamespace.to(room) : appNamespace;
  
  target.emit('notification', {
    id: generateId(),
    type: notification.type || 'info',
    title: notification.title,
    message: notification.message,
    timestamp: new Date().toISOString()
  });
};
```

**`error`**
```typescript
// Send error information to clients
const sendError = (socket, error) => {
  socket.emit('error', {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message,
    timestamp: new Date().toISOString()
  });
};
```

### WebSocket Client Integration

Frontend WebSocket client setup:

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketClient {
  private socket: Socket;
  
  constructor(serverUrl: string) {
    this.socket = io(`${serverUrl}/app`, {
      transports: ['websocket'],
      autoConnect: true
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.joinRoom('general');
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    this.socket.on('message_received', (data) => {
      this.handleMessage(data);
    });
    
    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });
    
    this.socket.on('status_update', (data) => {
      this.handleStatusUpdate(data);
    });
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
  
  joinRoom(room: string) {
    this.socket.emit('join_room', { room });
  }
  
  leaveRoom(room: string) {
    this.socket.emit('leave_room', { room });
  }
  
  sendMessage(room: string, message: string, type = 'text') {
    this.socket.emit('send_message', { room, message, type });
  }
  
  private handleMessage(data: any) {
    // Handle incoming messages
    console.log('Message received:', data);
  }
  
  private handleNotification(data: any) {
    // Handle notifications
    console.log('Notification:', data);
  }
  
  private handleStatusUpdate(data: any) {
    // Handle status updates
    console.log('Status update:', data);
  }
}
```

## Error Handling

### Standardised Error Responses

All API endpoints should return consistent error responses:

```typescript
const sendError = (res: Response, error: any, statusCode = 500) => {
  logger.error('API Error', { 
    error: error.message, 
    stack: error.stack,
    statusCode 
  });
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      timestamp: new Date().toISOString()
    }
  });
};
```

### Error Middleware

Global error handling middleware:

```typescript
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { 
    error: error.message,
    path: req.path,
    method: req.method
  });
  
  sendError(res, error);
});
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_ERROR`: Server-side error
- `CONFIG_ERROR`: Configuration-related error
- `WEBSOCKET_ERROR`: WebSocket connection error

## Authentication Integration

### Framework Auth Middleware

Using the framework's authentication system:

```typescript
import { auth } from '@episensor/app-framework';

// Protect routes that require authentication
app.use('/api/v1/admin', auth.requireAuth);

// Protect routes that require specific roles
app.use('/api/v1/config', auth.requireRole('admin'));

// Optional authentication (user info if available)
app.use('/api/v1/user', auth.optionalAuth);
```

### JWT Token Management

```typescript
// Generate tokens
const token = auth.generateToken({
  userId: 'user123',
  email: 'user@example.com',
  roles: ['user']
});

// Verify tokens
const payload = auth.verifyToken(token);
```

## Example API Implementation

### Complete Example Route

```typescript
import express from 'express';
import { auth, validation } from '@episensor/app-framework';
import { z } from 'zod';

const router = express.Router();

// Validation schema
const CreateItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.enum(['type1', 'type2', 'type3'])
});

// GET /api/v1/items
router.get('/items', async (req, res) => {
  try {
    // Your business logic here
    const items = await getItems();
    
    res.json({
      success: true,
      data: items,
      count: items.length
    });
  } catch (error) {
    sendError(res, error);
  }
});

// POST /api/v1/items
router.post('/items', 
  auth.requireAuth,
  validation.body(CreateItemSchema),
  async (req, res) => {
    try {
      const newItem = await createItem(req.body);
      
      // Broadcast to WebSocket clients
      wsManager.broadcast('item_created', newItem);
      
      res.status(201).json({
        success: true,
        data: newItem,
        message: 'Item created successfully'
      });
    } catch (error) {
      sendError(res, error, 400);
    }
  }
);

// GET /api/v1/items/:id
router.get('/items/:id', async (req, res) => {
  try {
    const item = await getItemById(req.params.id);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Item not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    sendError(res, error);
  }
});

export default router;
```

---
Copyright (C) EpiSensor 2025