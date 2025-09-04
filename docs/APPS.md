# EpiSensor Internal Applications

## Port Assignments

| Application | Backend | Frontend Dev | Frontend Prod | Status |
|------------|---------|--------------|---------------|---------|
| epi-cpcodebase | 7000 | 7001 | 7001 | ❌ Empty app.json |
| epi-modbus-simulator | 7010 | 7011 | 7011 | ⚠️ To verify |
| epi-vpp-manager | 7015 | 7016 | 7016 | ✅ Configured |
| epi-node-programmer | 7020 | 7021 | 7021 | ⚠️ To verify |
| epi-competitor-ai | 7005 | 7006 | 7006 | ⚠️ To verify |

## Configuration Status

### epi-cpcodebase
- **package.json**: backendPort: 7000, frontendPort: 7001
- **app.json**: api.port: 7000, web.port: 7001, web.devPort: 7001
- **Status**: ✅ Fixed - now properly configured

### epi-modbus-simulator  
- **package.json**: backendPort: 7010, frontendPort: 7011
- **app.json**: server.port: 7010, server.webPort: 7011
- **Status**: ✅ Configured (uses server.* keys)

### epi-vpp-manager
- **package.json**: backendPort: 7015, frontendPort: 7016
- **app.json**: api.port: 7015, web.port: 7016, web.devPort: 7016
- **Status**: ✅ Properly configured

### epi-node-programmer
- **package.json**: backendPort: 7020, frontendPort: 7021  
- **app.json**: server.port: 7020, server.webPort: 7021
- **Status**: ✅ Configured (uses server.* keys)

### epi-competitor-ai
- **package.json**: backendPort: 7005, frontendPort: 7006
- **app.json**: api.port: 7005, web.port: 7006, web.devPort: 7006
- **Status**: ✅ Fixed - now properly configured

## Framework Feature Adoption

| Feature | cpcodebase | modbus-sim | vpp-manager | node-prog | competitor-ai |
|---------|------------|------------|-------------|-----------|---------------|
| StandardServer | ✅ | ✅ | ✅ | ✅ | ✅ |
| createLogger | ✅ | ✅ | ✅ | ✅ | ✅ |
| ConfigManager | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| UI Components | ✅ | ✅ | ✅ | ✅ | ✅ |
| Error Handler | ❌ | ❌ | ❌ | ❌ | ❌ |
| Desktop Support | ✅ | ✅ | ✅ | ✅ | ⚠️ |

## Standard app.json Template

```json
{
  "app": {
    "name": "App Name",
    "version": "1.0.0",
    "description": "App Description"
  },
  "api": {
    "port": 7000,
    "host": "0.0.0.0"
  },
  "web": {
    "port": 7001,
    "devPort": 7001,
    "host": "0.0.0.0"
  }
}
```
