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

} as const;

// Transaction endpoints
export const TRANSACTION_ENDPOINTS = {
  
  VIEW_REPORT_BY_CATEGORY: (id: string, type: string, startDate?: string, endDate?: string) => {
    let url = `${ApiConfig.API_PREFIX}/transactions/view-report/category/${id}?type=${type}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return url;
  },
  VIEW_REPORT_CATEGORY_DETAIL: (id: string, startDate?: string, endDate?: string) => {
    let url = `${ApiConfig.API_PREFIX}/transactions/view-report/category-detail/${id}`;
    if (startDate) url += `?startDate=${startDate}`;
    if (endDate) url += `${startDate ? '&' : '?'}endDate=${endDate}`;
    return url;
  },
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
export const GROUP_MEMBER_ENDPOINTS = {
  GET_MEMBERS_PENDING:(groupId: string) => `${ApiConfig.API_PREFIX}/groups/${groupId}/invited-members`,
  CANCEL_PENDING_GROUP: `${ApiConfig.API_PREFIX}/groups/cancel-join`,
  PENDING_GROUPS: `${ApiConfig.API_PREFIX}/groups/pending`,
  EXIT_GROUP: (groupId: string) => `${ApiConfig.API_PREFIX}/group-members/group/${groupId}/exit`,
  GET_OPTIONS: (groupId: string) => `${ApiConfig.API_PREFIX}/group-members/group/${groupId}/owner-exit-options`,
  GET_MEMBERS: (groupId: string) => `${ApiConfig.API_PREFIX}/group-members/group/${groupId}/eligible-for-ownership`,
  TRANSFER: (groupId: string) => `${ApiConfig.API_PREFIX}/group-members/group/${groupId}/transfer-ownership`,
  DELETE_GROUP: (groupId: string) => `${ApiConfig.API_PREFIX}/groups/${groupId}`, 
} as const;
// AI Chat endpoints
export const AI_CHAT_ENDPOINTS = {
  SEND_MESSAGE: 'https://vyntthe173293.app.n8n.cloud/webhook/seima_chatbot',
} as const;

// Budget endpoints
export const BUDGET_ENDPOINTS = {
  LIST: `${ApiConfig.API_PREFIX}/budgets`,
  CREATE: `${ApiConfig.API_PREFIX}/budgets`,
  GET_BY_ID: (id: string) => `${ApiConfig.API_PREFIX}/budgets/${id}`,
  UPDATE: (id: string) => `${ApiConfig.API_PREFIX}/budgets/update/${id}`,
  DELETE: (id: string) => `${ApiConfig.API_PREFIX}/budgets/delete/${id}`,
} as const;

// Notification endpoints
export const NOTIFICATION_ENDPOINTS = {
  list: `${ApiConfig.API_PREFIX}/notifications`,
  unread_count: `${ApiConfig.API_PREFIX}/notifications/unread-count`,
  mark_as_read: (notification_id: number | string) => `${ApiConfig.API_PREFIX}/notifications/${notification_id}/read`,
  mark_all_as_read: `${ApiConfig.API_PREFIX}/notifications/read-all`,
  delete: (notification_id: number | string) => `${ApiConfig.API_PREFIX}/notifications/${notification_id}`,
  delete_all: `${ApiConfig.API_PREFIX}/notifications/all`,
} as const;

// Financial Health Status endpoints
export const STATUS_ENDPOINTS = {
  GET_HEALTH_STATUS: `${ApiConfig.API_PREFIX}/transactions/financial-health`,
} as const;

// Transcription endpoints
export const TRANSCRIPTION_ENDPOINTS = {
  UPLOAD: `${ApiConfig.API_PREFIX}/transcription/upload`,
} as const;

// Initialize configuration logging
ApiConfig.logConfig(); 