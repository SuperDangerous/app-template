# EpiSensor App Template

🚀 **Ready-to-go template for EpiSensor internal applications** - Copy, customize, and start building!

Built on `@episensor/app-framework` for consistent logging, config, WebSocket, and middleware across all EpiSensor apps.

## ✨ What's Included

### 🏗️ EpiSensor-Specific Template Features
- **🎨 EpiSensor Branding**: Colors, logos, typography, styling
- **📦 Tauri Desktop Packaging**: Cross-platform builds (macOS, Windows, Linux)
- **⚙️ Project Structure**: Organized folders, configs, and wireframes
- **🔄 CI/CD Workflows**: GitHub Actions for testing and releases
- **📝 Development Scripts**: npm scripts for dev, build, test, lint
- **🚀 Port Allocation**: Configured default ports (change for your app)

### 🛠️ Framework-Powered Foundation
- **📊 Logging**: Structured logging via `@episensor/app-framework`
- **⚙️ Configuration**: Zod validation, file watching, env merging
- **🔌 WebSocket**: Advanced Socket.IO management with rooms/auth
- **🏥 Health Monitoring**: Built-in health endpoints and metrics
- **🔒 Security**: CORS, authentication, request validation middleware
- **🎯 Best Practices**: Error handling, graceful shutdown, TypeScript

## 📁 Project Structure

```
epi-app-template/
├── app.json                 # Application configuration
├── package.json            # Backend dependencies and scripts
├── src/                    # Backend source code
│   ├── index.ts           # Main server (uses framework services)
│   ├── config.ts          # App-specific config schema
│   ├── api/               # API route examples
│   ├── services/          # Service layer examples
│   └── middleware/        # Custom middleware examples
├── web/                    # Frontend application
│   ├── package.json       # Frontend dependencies
│   ├── src/               # React source code
│   └── vite.config.ts     # Vite configuration
├── src-tauri/             # Tauri desktop wrapper
│   ├── Cargo.toml         # Rust dependencies
│   ├── tauri.conf.json    # Tauri configuration
│   └── src/main.rs        # Rust main file
└── .github/workflows/     # CI/CD workflows
    ├── ci.yml            # Continuous integration
    └── release.yml       # Release automation
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- Rust (latest stable)
- Platform-specific dependencies:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `libgtk-3-dev libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

### Quick Start

1. **Clone this template**:
   ```bash
   git clone https://github.com/episensor/epi-app-template.git my-new-app
   cd my-new-app
   ```

2. **Install dependencies**:
   ```bash
   npm run setup
   ```

3. **Customize for your app**:
   ```bash
   # Choose unique ports (see PORT_ALLOCATION.md)
   # Edit app.json
   {
     "name": "My EpiSensor App",
     "ports": { "api": 3025, "web": 5178, "websocket": 3025 }
   }
   
   # Update package.json name and description
   # Update src-tauri/tauri.conf.json with app metadata
   ```

4. **Start "vibe coding"**:
   ```bash
   npm run dev
   ```
   This starts the backend API, frontend dev server, and Tauri app simultaneously.
   
   🎯 **Focus on your business logic** - all infrastructure is ready!

## 🏗️ Architecture Overview

This template follows a clear separation of concerns:

- **`@episensor/app-framework`** = Generic services (logging, config, WebSocket, middleware)
- **`epi-app-template`** = EpiSensor branding + project structure + Tauri packaging

```typescript
// Your app uses framework services
import { createLogger, ConfigManager, WebSocketManager } from '@episensor/app-framework';

// Template provides EpiSensor-specific configuration
const logger = createLogger('MyApp');           // Framework logging
const config = new ConfigManager(appSchema);    // Template schema
```

**Benefits:**
- 🚀 **Rapid development**: Copy → customize → code features
- 🎨 **Consistent EpiSensor identity**: Same branding across all apps  
- 🔧 **Framework updates**: `npm update` pulls latest improvements
- 📋 **Best practices**: Security, monitoring, error handling built-in

📖 **See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed separation of concerns**

## ⚙️ Configuration

### app.json

The main configuration file controls all aspects of your application:

```json
{
  "name": "Your App Name",
  "version": "1.0.0",
  "ports": {
    "api": 8080,       // Backend API server
    "web": 5173,       // Frontend dev server
    "websocket": 8081  // WebSocket server
  },
  "development": {
    "autoStart": true,
    "logLevel": "info"
  },
  "security": {
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:5173", "tauri://localhost"]
    }
  }
}
```

### Port Management

Ports are automatically configured based on `app.json`:
- Backend server reads ports from config
- Frontend proxies API calls to the backend port
- Tauri wrapper connects to the correct API URL
- CORS is configured for the frontend port

## 🏗️ Development

### Available Scripts

#### Root Level (Backend)
- `npm run dev` - Start all services (API + Web + Tauri)
- `npm run dev:api` - Start backend API only
- `npm run build` - Build both backend and frontend
- `npm run build:api` - Build backend only
- `npm run test` - Run backend tests
- `npm run lint` - Lint backend code
- `npm run typecheck` - TypeScript type checking

#### Frontend (web/)
- `npm run dev` - Start frontend dev server
- `npm run build` - Build frontend for production
- `npm run preview` - Preview built frontend

#### Tauri
- `npm run tauri:dev` - Start Tauri in development mode
- `npm run tauri:build` - Build desktop application

### Adding New Features

1. **Backend API endpoints**: Add routes in `src/index.ts`
2. **Frontend pages**: Add components in `web/src/pages/`
3. **Real-time features**: Use Socket.IO connections
4. **Configuration**: Add settings to `app.json`
5. **Desktop features**: Extend `src-tauri/src/main.rs`

## 📦 Building & Deployment

### Development Build
```bash
npm run build
```

### Desktop Application
```bash
npm run tauri:build
```

Produces platform-specific installers:
- **macOS**: `.dmg` file
- **Windows**: `.msi` installer
- **Linux**: `.deb` package and `.AppImage`

### CI/CD

GitHub Actions automatically:
1. **On Push/PR**: Run tests, linting, and builds
2. **On Tag**: Create release with platform-specific installers

To create a release:
```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## 🔧 Customization

### Branding
1. Update `src-tauri/tauri.conf.json` with your app details
2. Replace icons in `src-tauri/icons/`
3. Update `app.json` with your app name and description
4. Customize theme in `web/src/App.tsx`

### Framework Integration
The template uses `@episensor/app-framework` for:
- Logging utilities
- UI components (React)
- Standard patterns and utilities

### Desktop Features
Extend `src-tauri/src/main.rs` to add:
- System tray functionality
- File system access
- Native notifications
- Auto-updater
- Custom window management

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Modify ports in `app.json`
2. **Permission errors**: Ensure proper file permissions
3. **Build failures**: Check platform-specific dependencies
4. **WebSocket issues**: Verify CORS configuration

### Development Tips

- Use `npm run dev` for hot-reloading during development
- Check browser dev tools for frontend issues
- View backend logs in the terminal
- Use Tauri dev tools for desktop debugging

## 📚 Documentation

- [Tauri Documentation](https://tauri.app/)
- [EpiSensor App Framework](https://github.com/episensor/epi-app-framework)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)

## 🤝 Contributing

1. Fork this template repository
2. Create your feature branch
3. Make your changes
4. Test thoroughly across platforms
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details.

---

**Happy Building!** 🎉

This template provides everything you need to create professional EpiSensor desktop applications with modern web technologies and native desktop capabilities.