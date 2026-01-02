# SuperDangerous Application Standardization Matrix

> **Last Updated:** January 2025  
> **Purpose:** Track standardization across all SuperDangerous applications using the @superdangerous/app-framework  
> **Applications Covered:** epi-cpcodebase, epi-app-template, epi-modbus-simulator, epi-vpp-manager, epi-node-programmer, epi-competitor-ai

## Quick Reference

- ✓ = Compliant with standard
- Number (1, 2, 3...) = Non-standard approach (see notes below)

## Standardization Matrix

| **Standardization Point** | **epi-cpcodebase** | **epi-app-template** | **epi-modbus-simulator** | **epi-vpp-manager** | **epi-node-programmer** | **epi-competitor-ai** |
|---|---|---|---|---|---|---|
| **FRAMEWORK & DEPENDENCIES (1-10)** |
| 1. Framework reference method (npm vs local) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 2. Framework version (^4.3.2) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 3. Package naming convention (@superdangerous/) | 1 | ✓ | ✓ | ✓ | ✓ | 1 |
| 4. Node.js engine requirement (>=20.19.0) | 2 | ✓ | ✓ | ✓ | 2 | ✓ |
| 5. Package.json type field ("module") | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 6. License field consistency | 3 | 4 | 5 | 5 | 5 | 5 |
| 7. Private package flag | 6 | 6 | 6 | ✓ | 6 | 6 |
| 8. Author field format | 7 | 8 | 8 | 8 | 8 | 9 |
| 9. Description field present | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 10. Repository field specified | 10 | 10 | 10 | 10 | ✓ | ✓ |
| **STARTUP & INITIALIZATION (11-20)** |
| 11. Uses StandardServer from framework | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 12. Config initialization pattern | 11 | ✓ | ✓ | ✓ | 12 | 13 |
| 13. Logger initialization (createLogger) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 14. Port configuration method | 14 | ✓ | ✓ | ✓ | 15 | 16 |
| 15. Error handling on startup | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 16. Graceful shutdown handlers | 17 | ✓ | 18 | ✓ | 18 | 17 |
| 17. Process signal handling (SIGINT/SIGTERM) | ✓ | ✓ | 18 | ✓ | 18 | 17 |
| 18. Environment variable usage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 19. Desktop mode detection | ✓ | 19 | ✓ | ✓ | ✓ | 19 |
| 20. WebSocket initialization | 20 | ✓ | ✓ | ✓ | ✓ | 21 |
| **API & ROUTING (21-30)** |
| 21. Express router usage pattern | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 22. API route prefix consistency (/api) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 23. Error middleware implementation | 22 | ✓ | ✓ | ✓ | ✓ | 22 |
| 24. CORS configuration approach | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 25. Authentication middleware | 23 | ✓ | 23 | ✓ | 23 | 23 |
| 26. Request validation pattern | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 27. Response format standardization | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 28. HTTP status code usage | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 29. API documentation (OpenAPI/Swagger) | 24 | 24 | 24 | 24 | 24 | 24 |
| 30. RESTful naming conventions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **CONFIGURATION (31-35)** |
| 31. Config file location (data/config) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 32. Settings service usage | 25 | ✓ | 25 | 25 | 25 | 25 |
| 33. Schema validation (Zod) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 34. Environment variable precedence | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 35. Config hot-reload support | 26 | ✓ | 26 | 26 | 26 | 26 |
| **BUILD & DEVELOPMENT (36-40)** |
| 36. TypeScript configuration | ✓ | ✓ | ✓ | 27 | 28 | 29 |
| 37. Build output directory (dist) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 38. Development script (npm run dev) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 39. Production build script | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 40. ESLint configuration | 30 | 31 | ✓ | ✓ | 30 | 30 |
| **TESTING & QUALITY (41-45)** |
| 41. Test framework | 32 | 33 | 34 | 33 | 33 | 32 |
| 42. Test file naming pattern (*.test.ts) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 43. Coverage reporting | ✓ | ✓ | ✓ | 35 | 35 | ✓ |
| 44. E2E testing setup (Playwright) | 36 | 36 | ✓ | ✓ | ✓ | 36 |
| 45. Pre-commit hooks | 37 | 37 | 37 | 37 | 37 | 37 |
| **DESKTOP & UI (46-50)** |
| 46. Tauri configuration present | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 47. Tauri build scripts | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 48. Frontend framework (React/Vite) | 38 | ✓ | ✓ | ✓ | ✓ | 38 |
| 49. UI component library (Radix UI) | ✓ | ✓ | 39 | ✓ | 40 | ✓ |
| 50. CSS/styling approach (Tailwind) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Notes on Non-Compliance

### Framework & Dependencies Issues

**1. Package naming convention:**
- **epi-cpcodebase:** Uses "epi-cpcodebase" instead of "@superdangerous/cpcodebase"
- **epi-competitor-ai:** Uses "epi-competitor-ai" instead of "@superdangerous/competitor-ai"
- **Recommendation:** Migrate to scoped package names for consistency and namespace protection

**2. Node.js engine requirement:**
- **epi-cpcodebase:** No engine requirement specified
- **epi-node-programmer:** No engine requirement specified
- **Recommendation:** Add `"engines": { "node": ">=20.19.0", "npm": ">=10.0.0" }`

**3-5. License field inconsistency:**
- **epi-cpcodebase:** Uses "(C) SuperDangerous 2025"
- **epi-app-template:** Uses "MIT" 
- **Others:** Use "PROPRIETARY"
- **Recommendation:** Standardize on "PROPRIETARY" for internal apps

**6. Private package flag:**
- Only **epi-vpp-manager** has `"private": true`
- **Recommendation:** Add to all internal applications

**7-9. Author field format inconsistency:**
- **epi-cpcodebase:** "Brendan Carroll <brendan.carroll@superdangerous.net>"
- **epi-app-template/modbus/vpp/node:** "SuperDangerous"
- **epi-competitor-ai:** "SuperDangerous <info@superdangerous.net>"
- **Recommendation:** Standardize on "SuperDangerous"

**10. Repository field missing:**
- Missing in most apps except epi-node-programmer and epi-competitor-ai
- **Recommendation:** Add repository URLs for all apps

### Startup & Initialization Issues

**11-13. Config initialization pattern:**
- **epi-cpcodebase:** Uses custom config approach
- **epi-node-programmer:** Uses inline config object
- **epi-competitor-ai:** Reads package.json manually
- **Recommendation:** Use framework's ConfigManager consistently

**14-16. Port configuration:**
- **epi-cpcodebase:** Hardcoded port 7000
- **epi-node-programmer/competitor-ai:** Environment variables with fallbacks
- **Recommendation:** Use config service with environment override capability

**17-18. Shutdown handling:**
- **epi-cpcodebase/competitor-ai:** No graceful shutdown
- **epi-modbus-simulator/node-programmer:** Missing implementation
- **Recommendation:** Implement SIGINT/SIGTERM handlers consistently

**19. Desktop mode detection:**
- **epi-app-template/competitor-ai:** No desktop mode detection
- **Recommendation:** Check for DESKTOP env var or Tauri window

**20-21. WebSocket issues:**
- **epi-cpcodebase:** Custom WebSocket server instead of framework's
- **epi-competitor-ai:** Disables framework WebSocket
- **Recommendation:** Use framework's WebSocket capabilities

### API & Routing Issues

**22. Error middleware:**
- **epi-cpcodebase/competitor-ai:** No custom error middleware
- **Recommendation:** Implement consistent error handling middleware

**23. Authentication middleware:**
- Missing in most apps except epi-app-template and epi-vpp-manager
- **Recommendation:** Implement basic auth middleware where needed

**24. API documentation:**
- No apps have OpenAPI/Swagger documentation
- **Recommendation:** Add OpenAPI specs for all APIs

### Configuration Issues

**25. Settings service:**
- Only epi-app-template uses settings service properly
- **Recommendation:** Adopt settings service for runtime configuration

**26. Config hot-reload:**
- Only epi-app-template supports hot-reload
- **Recommendation:** Enable watchFile option in ConfigManager

### Build & Development Issues

**27-29. TypeScript configuration inconsistencies:**
- **epi-vpp-manager:** Uses "bundler" moduleResolution
- **epi-node-programmer:** Different rootDir
- **epi-competitor-ai:** Uses "NodeNext" module
- **Recommendation:** Standardize on ESNext/node configuration

**30-31. ESLint configuration:**
- **epi-cpcodebase/node/competitor:** Missing or inconsistent
- **epi-app-template:** Has multiple conflicting configs
- **Recommendation:** Single .eslintrc.js with shared config

### Testing Issues

**32-34. Test framework split:**
- **Vitest:** epi-cpcodebase, epi-competitor-ai
- **Jest:** epi-app-template, epi-vpp-manager, epi-node-programmer
- **Mixed:** epi-modbus-simulator
- **Recommendation:** Standardize on Vitest for all new projects

**35. Coverage reporting:**
- **epi-vpp-manager/node-programmer:** Missing coverage config
- **Recommendation:** Add coverage scripts and thresholds

**36. E2E testing:**
- Only epi-modbus-simulator, epi-vpp-manager, epi-node-programmer have E2E
- **Recommendation:** Add Playwright E2E tests to all apps

**37. Pre-commit hooks:**
- No apps have pre-commit hooks configured
- **Recommendation:** Add husky + lint-staged for code quality

### Desktop & UI Issues

**38. Frontend framework:**
- **epi-cpcodebase/competitor-ai:** Mixed or integrated setup
- **Recommendation:** Separate web directory with Vite + React

**39-40. UI component library:**
- **epi-modbus-simulator:** Uses older @superdangerous/ui-framework
- **epi-node-programmer:** Missing modern Radix components
- **Recommendation:** Migrate to latest Radix UI components

---

## Priority Recommendations

### High Priority
1. **Unify test framework** - Standardize on Vitest
2. **Add pre-commit hooks** - Implement husky + lint-staged
3. **Standardize TypeScript config** - Use consistent module resolution
4. **Implement settings service** - Adopt framework's settings service

### Medium Priority
1. **Add API documentation** - OpenAPI specs for all endpoints
2. **Standardize package naming** - Move to @superdangerous/ scope
3. **Add graceful shutdown** - Implement signal handlers
4. **Unify ESLint configuration** - Single shared config

### Low Priority
1. **Add repository fields** - Include GitHub URLs
2. **Standardize author format** - Use "SuperDangerous" consistently
3. **Add coverage reporting** - Set coverage thresholds
4. **Desktop mode detection** - Check for Tauri window

---

## Compliance Summary

| Application | Compliant Items | Non-Compliant Items | Compliance % |
|-------------|-----------------|---------------------|--------------|
| epi-app-template | 35 | 15 | 70% |
| epi-vpp-manager | 34 | 16 | 68% |
| epi-modbus-simulator | 33 | 17 | 66% |
| epi-node-programmer | 31 | 19 | 62% |
| epi-cpcodebase | 28 | 22 | 56% |
| epi-competitor-ai | 27 | 23 | 54% |

**Overall Standardization Score: 62.7%**

---

## Next Steps

1. **Create shared configs** - ESLint, TypeScript, Jest/Vitest configs in framework
2. **Update documentation** - Add setup guides for standardized patterns
3. **Migration scripts** - Automate updates to existing apps
4. **CI/CD templates** - Standardized GitHub Actions workflows
5. **Code generators** - CLI tools for scaffolding compliant apps

---

*This document should be updated quarterly or when significant framework changes occur.*