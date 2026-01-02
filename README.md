# SuperDangerous App Template

🚀 **Ready-to-go template for SuperDangerous internal applications**

This is the official template for creating new SuperDangerous desktop applications. It provides a complete setup with our standard branding, colours, and architecture patterns.

## 📖 Documentation

- [ARCHITECTURE](docs/ARCHITECTURE.md) - System architecture and design patterns
- [CONFIGURATION](docs/CONFIGURATION.md) - Environment setup and configuration
- [API](docs/API.md) - API endpoints and framework integration
- [DEVELOPMENT](docs/DEVELOPMENT.md) - Development guide and contribution guidelines
- [Complete Documentation](./docs/README.md) - Full documentation index

## 🚀 Quick Start

```bash
# Clone this template
git clone https://github.com/SuperDangerous/epi-app-template.git my-new-app
cd my-new-app

# Install dependencies
npm install
cd web && npm install && cd ..

# Start development
npm run dev
```

This will start:
- Backend API server
- Frontend dev server  
- Tauri desktop app

## 📦 What's Included

- **SuperDangerous Branding**: Company colours (#E21350), logos, and styling
- **Standard Layout**: Navigation, connection status, app shell
- **Framework Integration**: Built on @superdangerous/app-framework
- **Desktop Packaging**: Cross-platform Tauri builds
- **Real-time Support**: WebSocket connections built-in
- **Logging & Config**: Production-ready from the start

## 🛠️ Customisation

1. Update `app.json` with your app name and ports
2. Modify navigation and pages in `web/src/App.tsx`
3. Add your business logic to `src/index.ts`
4. Build for distribution with `npm run tauri:build`

---

Built with ❤️ for SuperDangerous internal applications

Copyright (C) SuperDangerous 2025
