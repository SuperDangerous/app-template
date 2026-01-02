# Tauri Desktop Application Setup

This template includes everything needed to build cross-platform desktop applications with Tauri.

## Prerequisites

- Node.js 18 or later
- Rust (for Tauri) - [Install from rustup.rs](https://rustup.rs/)
- Platform-specific build tools:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft C++ Build Tools
  - **Linux**: `build-essential`, `libwebkit2gtk-4.0-dev`, `libssl-dev`

## Quick Start

1. **Install dependencies:**
   ```bash
   npm run setup
   ```

2. **Development mode:**
   ```bash
   npm run dev
   ```
   This starts both the backend server and Tauri in development mode.

3. **Build for production:**
   ```bash
   npm run build
   npm run build:sidecar
   npm run tauri:build
   ```

## Project Structure

```
.
├── src/                 # Backend Node.js server code
├── web/                 # Frontend web application
├── src-tauri/          # Tauri configuration and Rust code
│   ├── binaries/       # Compiled server binaries
│   ├── icons/          # Application icons
│   └── tauri.conf.json # Tauri configuration
└── dist/               # Compiled backend code
```

## Configuration

### Ports

Update these consistently across all configuration files:

- `package.json`: devServer config
- `src-tauri/tauri.conf.json`: devUrl
- Backend server configuration

Default ports:
- API Server: 7000
- Frontend Dev: 7001

### Application Identity

Update in `src-tauri/tauri.conf.json`:

```json
{
  "productName": "Your App Name",
  "identifier": "com.yourcompany.yourapp",
  "version": "1.0.0"
}
```

## Building the Sidecar

The sidecar is the Node.js backend bundled for distribution with Tauri.

### Automatic Build

```bash
npm run build:sidecar
```

This:
1. Compiles TypeScript
2. Bundles with esbuild (excluding native modules)
3. Creates executables with pkg for all platforms
4. Renames binaries to match Tauri's expectations

### Platform-Specific Binaries

After building, you'll have:
- `server-aarch64-apple-darwin` - macOS ARM64
- `server-x86_64-pc-windows-msvc.exe` - Windows x64
- `server-x86_64-unknown-linux-gnu` - Linux x64

## Cross-Platform Data Storage

Use the framework utilities for platform-specific paths:

```typescript
import { getAppDataPath, isDesktopApp } from '@superdangerous/app-framework';

// Will use appropriate system directory when running as desktop app:
// macOS: ~/Library/Application Support/yourapp/
// Windows: %APPDATA%/yourapp/
// Linux: ~/.config/yourapp/
```

## Native Modules

If your app uses native Node.js modules:

1. Add them to the externals in `build:sidecar` script
2. For `serialport`, consider using alternatives or the no-serial-port variant
3. For `sharp`, ensure the binaries are bundled with your app

## Testing

### Test the binary directly:

```bash
# macOS
./src-tauri/binaries/server-aarch64-apple-darwin

# Windows
./src-tauri/binaries/server-x86_64-pc-windows-msvc.exe

# Linux
./src-tauri/binaries/server-x86_64-unknown-linux-gnu
```

### Run in Tauri development mode:

```bash
npm run tauri:dev
```

## Troubleshooting

### Module Not Found

If you see `ERR_MODULE_NOT_FOUND`:
- Ensure all dependencies are installed
- Check that native modules are marked as external
- Verify the bundle was created successfully

### Port Conflicts

Ensure no other applications are using your configured ports.

### Binary Not Starting

Check:
- Binary has execute permissions: `chmod +x src-tauri/binaries/server-*`
- Path is correct in Tauri configuration
- No antivirus blocking execution

## Distribution

### Building for Release

```bash
# Build everything
npm run build
npm run build:sidecar

# Create installer
npm run tauri:build
```

Outputs will be in `src-tauri/target/release/bundle/`.

### Code Signing

For distribution, you'll need to code sign your application:
- **macOS**: Apple Developer certificate
- **Windows**: Code signing certificate
- **Linux**: Not typically required

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [SuperDangerous App Framework](../epi-app-framework/docs/TAURI_DESKTOP_APPS.md)
- [Example Apps](https://github.com/SuperDangerous)