# EpiSensor App Template Architecture

## 📋 Separation of Concerns

This document defines the clear separation between `@episensor/app-framework` and `epi-app-template` to enable rapid development of EpiSensor internal applications.

### 🏗️ @episensor/app-framework (Generic Foundation)

The framework provides **generic, reusable services** that work across all EpiSensor applications:

#### **Core Services**
- **ConfigManager**: Schema validation, file watching, environment variable merging
- **enhancedLogger**: Structured logging with multiple transports
- **WebSocketManager**: Socket.IO management with rooms, authentication, Redis scaling
- **healthCheck**: Standard health monitoring endpoints
- **portUtils**: Dynamic port allocation and conflict detection

#### **Middleware**
- **auth**: JWT authentication, session management
- **cors**: Dynamic CORS configuration
- **validation**: Request/response validation with Zod
- **fileUpload**: Secure file handling with type validation
- **aiErrorHandler**: AI-powered error analysis and suggestions

#### **UI Components** (Framework UI Package)
- **AppShell**: Standard header, navigation, sidebar structure
- **layout components**: Page layouts, containers, responsive grids
- **NetworkInterfaceSelect**: Common network interface selection
- **SystemHealthMonitor**: Real-time system monitoring dashboard
- **TerminalLogViewer**: Log viewing with search and filtering
- **MetricCard**: Standardized metric display components

#### **Utilities**
- **startupBanner**: Consistent startup display across all apps
- **startupLogger**: Initialization logging and diagnostics
- **standardConfig**: Common configuration patterns
- **TestServer**: Testing utilities for API endpoints

### 🎨 epi-app-template (EpiSensor-Specific Template)

The template provides **EpiSensor-specific customizations** and **project structure** for rapid app development:

#### **EpiSensor Branding & Styling**
- **Brand colors**: EpiSensor color palette and themes
- **Logo assets**: Company logos, favicons, app icons
- **Typography**: Consistent font choices and styling
- **Component styling**: EpiSensor-specific component appearances

#### **Project Structure & Configuration**
- **Tauri configuration**: Desktop app packaging for macOS/Windows/Linux
- **CI/CD workflows**: GitHub Actions for testing, building, releasing
- **Package.json scripts**: Standardized npm scripts for development workflow
- **ESLint/Prettier**: Code formatting and linting rules
- **TypeScript config**: Consistent TypeScript project setup

#### **App-Specific Configurations**
- **app.json schema**: Template-specific configuration structure
- **Port allocation**: Default ports (8080 API, 5173 web) that get customized
- **Environment setup**: .env.example with common variables
- **Directory structure**: Data, logs, uploads, static asset folders

#### **Development Wireframes**
- **API routes structure**: Example endpoints and route organization
- **Service layer examples**: How to organize business logic
- **Database schemas**: SQLite setup with example tables
- **Test structure**: Jest configuration and example tests

## 🚀 Development Workflow

### For New EpiSensor Apps:

1. **Copy the template**:
   ```bash
   cp -r epi-app-template my-new-app
   cd my-new-app
   ```

2. **Customize basics**:
   ```bash
   # Update app.json
   {
     "name": "My New EpiSensor App",
     "ports": { "api": 3025, "web": 5178, "websocket": 3025 }
   }
   
   # Update package.json name, description
   # Update Tauri config in src-tauri/tauri.conf.json
   ```

3. **Start "vibe coding"**:
   - Framework handles: logging, config, WebSocket, health checks, middleware
   - Developer focuses on: business logic, UI components, API endpoints
   - All infrastructure is ready: desktop packaging, CI/CD, testing

### Example: Using Framework Services in Template

```typescript
// Template's src/config.ts - Uses framework ConfigManager
import { ConfigManager } from '@episensor/app-framework';

const configManager = new ConfigManager({
  schema: appSpecificSchema,    // Template defines app schema
  defaults: appDefaults,        // Template sets defaults
  configPath: './app.json',     // Template chooses config location
});

// Template's src/index.ts - Uses framework services
import { 
  createLogger,               // Framework provides logging
  WebSocketManager,          // Framework handles WebSocket
  startupBanner             // Framework displays startup
} from '@episensor/app-framework';

// Template provides EpiSensor-specific configuration
startupBanner({
  title: config.name,         // From template's app.json
  version: config.version,    // From template's package.json
  ports: config.ports        // Template's port allocation
});
```

## 🎯 Benefits of This Architecture

1. **Rapid Development**: Copy template → customize basics → start coding features
2. **Consistency**: All apps use same logging, config, WebSocket patterns
3. **Maintainability**: Framework updates propagate to all apps via npm update
4. **EpiSensor Identity**: Template ensures consistent branding and structure
5. **Best Practices**: Framework enforces security, performance, monitoring standards

## 🔄 Update Strategy

- **Framework updates**: `npm update @episensor/app-framework` pulls latest generic improvements
- **Template updates**: When template improves, developers can cherry-pick specific files
- **Breaking changes**: Framework maintains backward compatibility; template documents migration guides

This architecture enables developers to focus on **business value** while standing on a **rock-solid, consistent foundation**.