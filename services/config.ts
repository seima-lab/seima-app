// services/config.ts
// Central configuration for API services

/**
 * API Configuration
 * 
 * Environment variables from eas.json:
 * - All environments: https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net
 * - Timeout: 10000ms
 */

export class ApiConfig {
  // Base URL configuration
  public static readonly BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net';
  
  // API versioning
  public static readonly API_VERSION = 'v1';
  public static readonly API_PREFIX = `/api/${ApiConfig.API_VERSION}`;
  
  // Timeout configuration
  public static readonly DEFAULT_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000');
  
  // Environment detection
  public static readonly IS_DEV = __DEV__;
  public static readonly IS_PROD = process.env.EXPO_PUBLIC_API_BASE_URL?.includes('api.seimaapp.com');
  public static readonly IS_STAGING = process.env.EXPO_PUBLIC_API_BASE_URL?.includes('staging-api.seimaapp.com');
  
  // Build full URL with API prefix
  public static buildUrl(endpoint: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${ApiConfig.BASE_URL}/${cleanEndpoint}`;
  }
  
  // Build API URL with version prefix
  public static buildApiUrl(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${ApiConfig.BASE_URL}${ApiConfig.API_PREFIX}/${cleanEndpoint}`;
  }
  
  // Log configuration on initialization
  public static logConfig(): void {
    console.log('🌐 API Configuration:');
    console.log(`  Base URL: ${ApiConfig.BASE_URL}`);
    console.log(`  API Prefix: ${ApiConfig.API_PREFIX}`);
    console.log(`  Environment: ${ApiConfig.IS_PROD ? 'Production' : ApiConfig.IS_STAGING ? 'Staging' : 'Development'}`);
    console.log(`  Timeout: ${ApiConfig.DEFAULT_TIMEOUT}ms`);
  }
}

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  GOOGLE_LOGIN: `${ApiConfig.API_PREFIX}/auth/google`,
  EMAIL_LOGIN: `${ApiConfig.API_PREFIX}/auth/login`,
  REGISTER: `${ApiConfig.API_PREFIX}/auth/register`,
  VERIFY_OTP: `${ApiConfig.API_PREFIX}/auth/verify-otp`,
  RESEND_OTP: `${ApiConfig.API_PREFIX}/auth/resend-otp`,
  FORGOT_PASSWORD: `${ApiConfig.API_PREFIX}/auth/forgot-password`,
  RESET_PASSWORD: `${ApiConfig.API_PREFIX}/auth/reset-password`,
  RESEND_FORGOT_PASSWORD_OTP: `${ApiConfig.API_PREFIX}/auth/resend-forgot-password-otp`,
  VERIFY_FORGOT_PASSWORD_OTP: `${ApiConfig.API_PREFIX}/auth/verify-forgot-password-otp`,
  SET_NEW_PASSWORD_AFTER_VERIFICATION: `${ApiConfig.API_PREFIX}/auth/set-new-password-after-verification`,
  CHANGE_PASSWORD: `${ApiConfig.API_PREFIX}/auth/change-password`,
  REFRESH_TOKEN: `${ApiConfig.API_PREFIX}/auth/refresh`,
  LOGOUT: `${ApiConfig.API_PREFIX}/auth/logout`,
} as const;

// User endpoints
export const USER_ENDPOINTS = {
  GET_PROFILE: `${ApiConfig.API_PREFIX}/users/me`,
  UPDATE_PROFILE: `${ApiConfig.API_PREFIX}/users/update`,
  UPLOAD_AVATAR: `${ApiConfig.API_PREFIX}/users/upload-avatar`,
} as const;

// Transaction endpoints
export const TRANSACTION_ENDPOINTS = {
  LIST: `${ApiConfig.API_PREFIX}/transactions`,
  CREATE: `${ApiConfig.API_PREFIX}/transactions`,
  SCAN_INVOICE: `${ApiConfig.API_PREFIX}/transactions/scan-invoice`,
} as const;

// Wallet endpoints
export const WALLET_ENDPOINTS = {
  LIST: `${ApiConfig.API_PREFIX}/wallets`,
  CREATE: `${ApiConfig.API_PREFIX}/wallets`,
  GET_BY_ID: (id: string) => `${ApiConfig.API_PREFIX}/wallets/${id}`,
  UPDATE: (id: string) => `${ApiConfig.API_PREFIX}/wallets/${id}`,
  DELETE: (id: string) => `${ApiConfig.API_PREFIX}/wallets/${id}`,
} as const;

// Category endpoints  
export const CATEGORY_ENDPOINTS = {
  LIST: `${ApiConfig.API_PREFIX}/categories`,
  CREATE: `${ApiConfig.API_PREFIX}/categories`,
  GET_BY_ID: (id: string) => `${ApiConfig.API_PREFIX}/categories/${id}`,
  UPDATE: (id: string) => `${ApiConfig.API_PREFIX}/categories/update/${id}`,
  DELETE: (id: string) => `${ApiConfig.API_PREFIX}/categories/delete/${id}`,
  GET_SYSTEM_BY_TYPE: (type: string) => `${ApiConfig.API_PREFIX}/categories/system-categories/${type}`,
  GET_BY_TYPE_AND_USER: (type: string, userId: string, groupId: string) => `${ApiConfig.API_PREFIX}/categories/type/${type}/user/${userId}/group/${groupId}`,
  GET_BY_USER: (userId: string, groupId: string) => `${ApiConfig.API_PREFIX}/categories/user/${userId}/group/${groupId}`,
} as const;

// AI Chat endpoints
export const AI_CHAT_ENDPOINTS = {
  SEND_MESSAGE: 'https://andt20042003.app.n8n.cloud/webhook/seima_chatbot',
} as const;

// Budget endpoints
export const BUDGET_ENDPOINTS = {
  LIST: `${ApiConfig.API_PREFIX}/budgets`,
  CREATE: `${ApiConfig.API_PREFIX}/budgets`,
  GET_BY_ID: (id: string) => `${ApiConfig.API_PREFIX}/budgets/${id}`,
  UPDATE: (id: string) => `${ApiConfig.API_PREFIX}/budgets/${id}`,
  DELETE: (id: string) => `${ApiConfig.API_PREFIX}/budgets/${id}`,
} as const;

// Initialize configuration logging
ApiConfig.logConfig(); 