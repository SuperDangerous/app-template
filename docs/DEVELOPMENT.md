# Development Guide

## Getting Started

### Prerequisites

- **Node.js** 20.x or later
- **npm** 9.x or later
- **Rust** (for Tauri desktop builds)
- **Git** for version control

### Template Setup

1. **Create New App from Template**
   ```bash
   git clone https://github.com/SuperDangerous/epi-app-template.git my-new-app
   cd my-new-app
   rm -rf .git
   git init
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd web && npm install && cd ..
   ```

3. **Configure Your App**
   ```bash
   # Edit app.json with your app details
   nano app.json
   
   # Update package.json
   nano package.json
   nano web/package.json
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Project Structure

```
epi-app-template/
├── src/                    # Backend source code
│   ├── index.ts           # Main server entry point
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── utils/             # Utility functions
├── web/                   # Frontend source code
│   ├── src/               # React application
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.tsx        # Main application
│   └── public/            # Static assets
├── src-tauri/            # Desktop app configuration
├── docs/                 # Documentation
├── tests/                # Test files
├── assets/               # Application assets
└── app.json              # Application configuration
```

## Development Workflow

### Running Development Servers

```bash
# Start all services (recommended)
npm run dev

# Or start individually
npm run dev:backend     # Backend API server
npm run dev:frontend    # React development server
npm run dev:tauri       # Tauri desktop app
```

### Building for Production

```bash
# Build all components
npm run build

# Build specific components
npm run build:backend
npm run build:frontend
npm run build:tauri

# Tauri desktop builds
npm run tauri:build           # Current platform
npm run tauri:build:windows   # Windows
npm run tauri:build:macos     # macOS
npm run tauri:build:linux     # Linux
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Development Best Practices

### Code Organisation

#### Backend Structure

```typescript
// src/index.ts - Main server setup
import express from 'express';
import { ConfigManager, getLogger } from '@superdangerous/app-framework';

const app = express();
const config = ConfigManager.getInstance();
const logger = getLogger().createLogger('App');

// Load configuration
await config.loadConfig('app.json');

// Setup middleware and routes
// ...

export default app;
```

#### Service Layer Pattern

```typescript
// src/services/DataService.ts
export class DataService {
  private logger = getLogger().createLogger('DataService');

  async getData(filters: DataFilters): Promise<DataResponse> {
    this.logger.info('Fetching data', { filters });
    
    try {
      // Business logic here
      const data = await this.fetchData(filters);
      
      this.logger.info('Data fetched successfully', { 
        count: data.length 
      });
      
      return { success: true, data };
    } catch (error) {
      this.logger.error('Data fetch failed', { 
        error: error.message 
      });
      
      throw new DataFetchError('Failed to fetch data', { cause: error });
    }
  }
  
  private async fetchData(filters: DataFilters): Promise<DataItem[]> {
    // Implementation
  }
}
```

#### Frontend Component Structure

```typescript
// web/src/components/DataTable.tsx
import React, { useState, useEffect } from 'react';
import { DataService } from '../services/DataService';
import { useLogger } from '../hooks/useLogger';

interface DataTableProps {
  filters?: DataFilters;
  onItemSelect?: (item: DataItem) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ 
  filters, 
  onItemSelect 
}) => {
  const [data, setData] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const logger = useLogger('DataTable');

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    
    try {
      const response = await DataService.getData(filters);
      setData(response.data);
      logger.info('Data loaded', { count: response.data.length });
    } catch (error) {
      logger.error('Failed to load data', { error: error.message });
      // Handle error (show notification, etc.)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-table">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table>
          {/* Table implementation */}
        </table>
      )}
    </div>
  );
};
```

### Configuration Management

#### App Configuration

```json
{
  "name": "my-awesome-app",
  "displayName": "My Awesome App",
  "description": "An awesome SuperDangerous internal application",
  "version": "1.0.0",
  "ports": {
    "http": 3015,
    "websocket": 3016
  },
  "branding": {
    "primaryColour": "#E21350",
    "secondaryColour": "#2C3E50",
    "logo": "assets/my-app-logo.png"
  },
  "features": {
    "websockets": true,
    "authentication": false,
    "logging": true,
    "healthCheck": true,
    "tauri": true
  }
}
```

#### Environment Variables

```bash
# .env.development
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug

# Custom app settings
ENABLE_MOCK_DATA=true
ENABLE_DEBUG_ROUTES=true
MOCK_DELAY=500
```

### Testing Strategies

#### Unit Testing

```typescript
// tests/services/DataService.test.ts
import { DataService } from '../../src/services/DataService';

describe('DataService', () => {
  let dataService: DataService;

  beforeEach(() => {
    dataService = new DataService();
  });

  describe('getData', () => {
    it('should return data when filters are valid', async () => {
      const filters = { category: 'test' };
      
      const result = await dataService.getData(filters);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should throw error when filters are invalid', async () => {
      const invalidFilters = { category: '' };
      
      await expect(dataService.getData(invalidFilters))
        .rejects.toThrow('Invalid filters');
    });
  });
});
```

#### Integration Testing

```typescript
// tests/integration/api.test.ts
import request from 'supertest';
import app from '../../src/index';

describe('API Integration Tests', () => {
  describe('GET /api/v1/data', () => {
    it('should return data list', async () => {
      const response = await request(app)
        .get('/api/v1/data')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array)
      });
    });

    it('should handle query parameters', async () => {
      const response = await request(app)
        .get('/api/v1/data?category=test&limit=10')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });
});
```

#### Component Testing

```typescript
// web/src/components/__tests__/DataTable.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { DataTable } from '../DataTable';
import * as DataService from '../../services/DataService';

jest.mock('../../services/DataService');

describe('DataTable', () => {
  const mockDataService = DataService as jest.Mocked<typeof DataService>;

  beforeEach(() => {
    mockDataService.getData.mockReset();
  });

  it('should display loading state initially', () => {
    render(<DataTable />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display data when loaded', async () => {
    const mockData = [
      { id: 1, name: 'Test Item 1' },
      { id: 2, name: 'Test Item 2' }
    ];

    mockDataService.getData.mockResolvedValue({
      success: true,
      data: mockData
    });

    render(<DataTable />);

    await waitFor(() => {
      expect(screen.getByText('Test Item 1')).toBeInTheDocument();
      expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    });
  });
});
```

### Customisation Guide

#### Adding New Pages

1. **Create Page Component**
   ```typescript
   // web/src/pages/MyNewPage.tsx
   import React from 'react';
   
   export const MyNewPage: React.FC = () => {
     return (
       <div className="page">
         <h1>My New Page</h1>
         {/* Page content */}
       </div>
     );
   };
   ```

2. **Add Route**
   ```typescript
   // web/src/App.tsx
   import { MyNewPage } from './pages/MyNewPage';
   
   // Add to your routing configuration
   ```

3. **Update Navigation**
   ```typescript
   // Update navigation menu to include new page
   ```

#### Adding New API Endpoints

1. **Create Route Handler**
   ```typescript
   // src/routes/myNewRoute.ts
   import express from 'express';
   
   const router = express.Router();
   
   router.get('/my-endpoint', async (req, res) => {
     // Implementation
   });
   
   export default router;
   ```

2. **Register Route**
   ```typescript
   // src/index.ts
   import myNewRoute from './routes/myNewRoute';
   
   app.use('/api/v1', myNewRoute);
   ```

#### Custom Branding

1. **Update app.json**
   ```json
   {
     "branding": {
       "primaryColour": "#YOUR_PRIMARY_COLOUR",
       "secondaryColour": "#YOUR_SECONDARY_COLOUR",
       "logo": "assets/your-logo.png"
     }
   }
   ```

2. **Add Logo Assets**
   ```bash
   # Add your logo files to assets/
   cp your-logo.png assets/
   cp your-favicon.ico web/public/
   ```

3. **Update Tauri Configuration**
   ```json
   // src-tauri/tauri.conf.json
   {
     "tauri": {
       "bundle": {
         "identifier": "com.superdangerous.your-app",
         "icon": ["icons/your-icon.png"]
       }
     }
   }
   ```

### Performance Optimisation

#### Backend Optimisation

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Request caching
import { cacheManager } from '@superdangerous/app-framework';
const cache = cacheManager.createCache({ ttl: 300 }); // 5 minutes

app.get('/api/v1/data', async (req, res) => {
  const cacheKey = `data-${JSON.stringify(req.query)}`;
  
  let data = await cache.get(cacheKey);
  if (!data) {
    data = await DataService.getData(req.query);
    await cache.set(cacheKey, data);
  }
  
  res.json({ success: true, data });
});
```

#### Frontend Optimisation

```typescript
// Use React.memo for expensive components
export const DataTable = React.memo<DataTableProps>(({ filters, onItemSelect }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.filters) === JSON.stringify(nextProps.filters);
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => ({
    ...item,
    displayName: formatDisplayName(item.name),
    category: categoriseItem(item)
  }));
}, [data]);

// Use useCallback for event handlers
const handleItemClick = useCallback((item: DataItem) => {
  logger.info('Item clicked', { itemId: item.id });
  onItemSelect?.(item);
}, [onItemSelect]);
```

### Deployment Preparation

#### Environment-Specific Configuration

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info
ENABLE_DEBUG_ROUTES=false
ENABLE_MOCK_DATA=false
```

#### Build Optimisation

```typescript
// webpack.config.js (if customising build)
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        framework: {
          test: /[\\/]node_modules[\\/]@superdangerous[\\/]/,
          name: 'framework',
          chunks: 'all',
          priority: 10,
        }
      }
    }
  }
};
```

#### Docker Deployment

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY web/package*.json ./web/

# Install dependencies
RUN npm ci --only=production
RUN cd web && npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Contributing Guidelines

1. **Code Style**: Follow the established patterns and use the framework's utilities
2. **Testing**: Add tests for new functionality
3. **Documentation**: Update documentation for new features
4. **Commits**: Use clear, descriptive commit messages
5. **Pull Requests**: Include description of changes and testing performed

---
Copyright (C) SuperDangerous 2025
