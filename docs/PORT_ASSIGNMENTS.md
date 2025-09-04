# EpiSensor App Port Assignments

## Standard Port Allocation

Each app is assigned a block of 5 ports in the 7000+ range to allow running multiple apps simultaneously.

### Port Assignment Scheme

Each app gets 5 consecutive ports:
- **Port +0**: Backend/API server
- **Port +1**: Frontend dev server (Vite)
- **Port +2**: WebSocket server (if separate from backend)
- **Port +3**: Reserved for future use
- **Port +4**: Reserved for future use

### Framework App Port Assignments

| App Name | Port Block | Backend | Frontend | WebSocket | Status |
|----------|------------|---------|----------|-----------|--------|
| **epi-cpcodebase** | 7000-7004 | 7000 | 7001 | 7000 | ✅ Active |
| **epi-competitor-ai** | 7005-7009 | 7005 | 7006 | 7005 | ✅ Active |
| **epi-modbus-simulator** | 7010-7014 | 7010 | 7011 | 7010 | ✅ Active |
| **epi-vpp-manager** | 7015-7019 | 7015 | 7016 | 7015 | ✅ Active |
| **epi-node-programmer** | 7020-7024 | 7020 | 7021 | 7020 | ✅ Active |
| **epi-app-template** | 7500-7504 | 7500 | 7501 | 7500 | 📋 Template |

### Non-Framework Apps (for reference only)
Other apps not using @episensor/app-framework should follow the same port block scheme but are managed independently.

### Port Allocation Guidelines

1. **Consistency**: Same ports used in dev, prod, and Tauri modes
2. **No Conflicts**: Each app has its own port block, allowing all apps to run simultaneously
3. **WebSocket**: Typically shares the backend port (same Express server)
4. **No Hardcoding**: Ports should be configurable, not hardcoded
5. **No Env Override**: Remove any PORT environment variable overrides in scripts

### Configuration

Each app configures its ports in multiple places:

1. **package.json** - `devServer` section for development:
```json
"devServer": {
  "backendPort": 3005,
  "frontendPort": 5173,
  "backendCommand": "tsx watch src/server/index.ts",
  "frontendCommand": "vite"
}
```

2. **Source code** - Default configuration:
```typescript
// src/config/index.ts or schema.ts
port: z.number().default(3005)
```

3. **Tauri config** - For desktop builds:
```json
// src-tauri/tauri.conf.json
"devUrl": "http://localhost:5173",
"beforeBuildCommand": "VITE_API_URL=http://localhost:3005 npm run build"
```

4. **Environment variables** - Runtime override:
```bash
PORT=3005  # Backend port
VITE_API_URL=http://localhost:3005  # Frontend API endpoint
```

### Important Notes

- Never use the same backend port for multiple apps
- Frontend port 5173 can be shared (Vite will auto-increment if occupied)
- Always update all configuration locations when changing ports
- Test dev, prod, and Tauri modes after port changes