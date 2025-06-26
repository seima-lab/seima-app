# API Services Configuration

## Overview
Hệ thống API services được cấu hình để sử dụng với EAS Build environments khác nhau thông qua biến môi trường.

## Environment Configuration

### eas.json Setup
```json
{
  "build": {
    "development": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net",
        "EXPO_PUBLIC_API_TIMEOUT": "10000"
      }
    },
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net",
        "EXPO_PUBLIC_API_TIMEOUT": "10000"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net",
        "EXPO_PUBLIC_API_TIMEOUT": "10000"
      }
    }
  }
}
```

## Services Architecture

### 1. **config.ts** - Central Configuration
- Quản lý tất cả API URLs và endpoints
- Tự động detect environment (dev/staging/production)
- Cung cấp helper methods để build URLs

### 2. **apiService.ts** - HTTP Client
- Singleton pattern để manage HTTP requests
- Automatic token handling với SecureStore
- Support cho GET, POST, PUT, DELETE, FormData uploads
- Automatic timeout và error handling

### 3. **authService.ts** - Authentication
- Handle tất cả auth flows: login, register, OTP, forgot password
- Automatic token refresh
- Secure token storage

## Usage Examples

### Basic API Call
```typescript
import { apiService } from './services/apiService';
import { USER_ENDPOINTS } from './services/config';

// Get user profile
const response = await apiService.get(USER_ENDPOINTS.GET_PROFILE);
```

### Using Config Helper
```typescript
import { ApiConfig, TRANSACTION_ENDPOINTS } from './services/config';

// Build custom URL
const customUrl = ApiConfig.buildApiUrl('custom/endpoint');

// Use predefined endpoints
const transactions = await apiService.get(TRANSACTION_ENDPOINTS.LIST);
```

## Environment URLs

| Environment | URL | Usage |
|-------------|-----|--------|
| All Environments | `https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net` | Seima Server (Azure) |

**Note**: Tất cả environments hiện tại đều sử dụng cùng một Azure server.

## Building for Different Environments

```bash
# Development build
npx eas build --platform android --profile development

# Staging build  
npx eas build --platform android --profile preview

# Production build
npx eas build --platform android --profile production
```

## Security Notes

- Tất cả sensitive data được store trong SecureStore
- Tokens tự động refresh khi gần expired
- API calls tự động include Authorization headers
- Environment-specific URLs để tránh mix production/development data 