# EpiSensor App Template

🚀 **Ready-to-go template for EpiSensor internal applications**

This is the official template for creating new EpiSensor desktop applications. It provides a complete setup with our standard branding, colors, and architecture patterns.

## 📖 Documentation

See the [full documentation](./docs/README.md) for:
- Getting started guide
- Architecture overview  
- Port assignments
- Tauri setup instructions

## 🚀 Quick Start

```bash
# Clone this template
git clone https://github.com/episensor/epi-app-template.git my-new-app
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

- **EpiSensor Branding**: Company colors (#E21350), logos, and styling
- **Standard Layout**: Navigation, connection status, app shell
- **Framework Integration**: Built on @episensor/app-framework
- **Desktop Packaging**: Cross-platform Tauri builds
- **Real-time Support**: WebSocket connections built-in
- **Logging & Config**: Production-ready from the start

## 🛠️ Customization

1. Update `app.json` with your app name and ports
2. Modify navigation and pages in `web/src/App.tsx`
3. Add your business logic to `src/index.ts`
4. Build for distribution with `npm run tauri:build`

---

Built with ❤️ for EpiSensor internal applications
