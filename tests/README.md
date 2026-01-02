# Test Suite Documentation

## Overview

This comprehensive test suite covers all aspects of the SuperDangerous App Template, including:

- **Unit Tests**: Individual function and module testing
- **Integration Tests**: API endpoints, server startup, and service communication
- **E2E Tests**: Full application flow using Playwright
- **WebSocket Tests**: Real-time communication testing
- **Console Error Detection**: Frontend error monitoring

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual functions
│   ├── settings.test.ts     # Settings service and API tests
│   └── dataPaths.test.ts    # Data paths utility tests
├── integration/             # Integration tests
│   ├── server.test.ts       # Server startup and basic integration
│   ├── api-endpoints.test.ts # All API endpoint testing
│   ├── websocket.test.ts    # WebSocket connection tests
│   └── startup-ports.test.ts # Port verification and startup tests
├── e2e/                     # End-to-end tests with Playwright
│   ├── frontend-startup.test.ts      # Frontend startup and port tests
│   ├── console-errors.test.ts        # Console error detection
│   ├── frontend-integration.test.ts  # Frontend-backend integration
│   ├── global-setup.ts               # Test environment setup
│   └── global-teardown.ts            # Test environment cleanup
├── utils/                   # Test utilities and helpers
│   └── test-helpers.ts      # Common testing utilities
├── index.test.ts           # Main test suite entry point
└── README.md               # This documentation
```

## Running Tests

### Backend Tests (Vitest)

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests (headless)
npm run test:e2e

# Run E2E tests with browser UI
npm run test:e2e:headed

# Run E2E tests in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

### All Tests

```bash
# Run both backend and E2E tests
npm run test:all
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and modules in isolation.

**Coverage**:
- Settings service functionality
- Data path utilities
- Configuration validation
- Error handling

**Key Files**:
- `unit/settings.test.ts` - Tests the settings service and all its methods
- `unit/dataPaths.test.ts` - Tests path utilities for different environments

### 2. Integration Tests

**Purpose**: Test how different parts of the system work together.

**Coverage**:
- API endpoint functionality
- Server startup processes
- WebSocket connections
- Port configuration
- Service communication

**Key Files**:
- `integration/api-endpoints.test.ts` - Comprehensive API testing
- `integration/websocket.test.ts` - WebSocket connection and events
- `integration/startup-ports.test.ts` - Port verification and startup
- `integration/server.test.ts` - Basic server integration

### 3. E2E Tests

**Purpose**: Test the complete application flow from user perspective.

**Coverage**:
- Frontend application loading
- Port verification (8500 backend, 8502 frontend)
- Console error detection
- Frontend-backend integration
- Real user workflows

**Key Files**:
- `e2e/frontend-startup.test.ts` - Frontend startup and port tests
- `e2e/console-errors.test.ts` - JavaScript error detection
- `e2e/frontend-integration.test.ts` - Full integration testing

## Test Utilities

### Test Helpers (`utils/test-helpers.ts`)

Provides common utilities for all tests:

- `createTestApp()` - Creates isolated test application instance
- `createTestWebSocketClient()` - Creates WebSocket test client
- `makeRequest()` - HTTP request utility with proper error handling
- `validateApiResponse()` - Validates API response structure
- `TestCleaner` - Manages test resource cleanup
- `waitFor()` - Waits for conditions to be met
- `isPortInUse()` - Checks if a port is in use

## Port Configuration

The application uses the following ports:

- **Backend API**: 8500
- **Frontend**: 8502
- **WebSocket**: 8500 (same as backend)

Tests verify that:
- Services start on correct ports
- Ports don't conflict
- Services are accessible on expected ports
- WebSocket connections work properly

## Test Requirements Verification

### ✅ Unit Tests for Server Functions
- Settings service (all CRUD operations)
- Data path utilities (all functions)
- Configuration validation
- Error handling and edge cases

### ✅ Startup Tests
- App starts on correct ports (8500, 8502)
- Port availability checking
- Service health verification
- Startup performance monitoring

### ✅ API Endpoint Tests
- All settings endpoints (`/api/settings/*`)
- System endpoints (`/api/system/*`, `/api/config`, `/api/health`)
- Demo endpoints (`/api/demo/*`, `/api/example`)
- Error handling and validation
- Response format consistency

### ✅ WebSocket Tests
- Connection establishment
- Event handling (ping/pong, subscribe/unsubscribe)
- Multiple client support
- Error handling and timeouts

### ✅ Frontend-Backend Integration
- API communication
- Configuration loading
- Real-time WebSocket integration
- Error state handling

### ✅ Console Error Detection
- JavaScript error monitoring
- Page load error detection
- Navigation error tracking
- Resource loading verification
- Performance warning detection

### ✅ Port Verification Tests
- Backend runs on port 8500
- Frontend runs on port 8502
- WebSocket works on port 8500
- No port conflicts
- Service accessibility

### ✅ Health Check Endpoints
- `/api/health` basic health check
- `/api/health/detailed` comprehensive status
- Service availability verification
- Response time monitoring

## Configuration Files

### Vitest Configuration (`vitest.config.ts`)
- Configured for Node.js environment
- Coverage reporting with v8 provider
- Test file patterns and exclusions
- Module resolution for ESM

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile viewport testing
- Automatic server startup
- Test reporting and artifacts
- Global setup/teardown

## Best Practices

1. **Test Isolation**: Each test can run independently
2. **Resource Cleanup**: Automatic cleanup with `TestCleaner`
3. **Error Handling**: Graceful handling of service unavailability
4. **Performance Monitoring**: Response time validation
5. **Comprehensive Coverage**: All functions have return value tests
6. **Edge Cases**: Error conditions and invalid inputs tested

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Tests handle port conflicts gracefully
2. **Services Not Running**: Tests skip integration tests when services unavailable
3. **Timeout Issues**: Configurable timeouts for different test types
4. **WebSocket Connection Failures**: Proper error handling and retry logic

### Debug Mode

Run tests in debug mode to investigate issues:

```bash
# Backend tests with detailed output
npm run test -- --reporter=verbose

# E2E tests in debug mode
npm run test:e2e:debug
```

## Coverage Goals

- **Unit Tests**: 100% function coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All user workflows covered
- **Error Scenarios**: All error conditions tested

The test suite ensures comprehensive verification of the SuperDangerous App Template functionality while maintaining fast execution and reliable results.