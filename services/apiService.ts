// services/ApiService.ts

import * as SecureStore from 'expo-secure-store';
import { ApiConfig } from './config';

// Types for API responses
export interface ApiResponse<T = any> {
  status_code: number;
  message: string;
  data?: T;
  error?: string;
}

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private timeout: number;

  private constructor() {
    // Use centralized API configuration
    this.baseURL = ApiConfig.BASE_URL;
    this.timeout = ApiConfig.DEFAULT_TIMEOUT;
    console.log('🌐 API Service initialized with baseURL:', this.baseURL);
  }

  // Singleton pattern
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Build full URL
  private buildUrl(endpoint: string): string {
    return `${this.baseURL}${endpoint}`;
  }

  // Generic HTTP request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint);

      // Default headers
      const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Safely merge headers
      if (options.headers) {
        const headersObj = options.headers as Record<string, string>;
        Object.assign(defaultHeaders, headersObj);
      }

      // Get token from secure store
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        ...options,
        headers: defaultHeaders,
      };

      // Setup timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const result: ApiResponse<T> = await response.json();
      console.log(`📥 Raw API result:`, JSON.stringify(result, null, 2));
      console.log(`📥 Result type:`, typeof result);
      console.log(`📥 Result keys:`, Object.keys(result));
      console.log(`📥 HTTP Status:`, response.status);
      console.log(`📥 Response OK:`, response.ok);
      console.log(`📥 Result status_code:`, result.status_code);

      // Check both HTTP status and API status_code
      if (response.ok && result.status_code < 400) {
        console.log(`✅ API Success: ${url}`, result);
        return result;
      } else {
        console.error(`❌ API Error: ${url}`, result);
        // Preserve the original error message from the API
        const errorMessage = result.message || result.error || 'API request failed';
        console.log(`🎯 Throwing error with message:`, errorMessage);
        // Attach backend payload so callers can map field errors
        const err: any = new Error(errorMessage);
        err.status_code = result.status_code;
        err.data = result.data;
        err.raw = result;
        throw err;
      }
    } catch (error: any) {
      console.error(`🔴 API Request Error:`, error);
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    console.log('🔄 === API SERVICE PUT METHOD ===');
    console.log('🌐 Endpoint:', endpoint);
    console.log('📤 Data to send:', JSON.stringify(data, null, 2));
    console.log('📋 Headers:', headers);
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  // Post FormData for multipart uploads
  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint);

      // Default headers (don't set Content-Type for FormData, let browser set it with boundary)
      const defaultHeaders: Record<string, string> = {};

      // Get token from secure store
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
        console.log(`🔐 Token added to FormData headers for POST ${url}`);
        console.log(`🔐 Token preview: ${token.substring(0, 20)}...`);
      } else {
        console.log(`⚠️ No token found for FormData POST ${url}`);
      }

      // Merge additional headers
      if (headers) {
        Object.assign(defaultHeaders, headers);
      }

      const config: RequestInit = {
        method: 'POST',
        headers: defaultHeaders,
        body: formData,
      };

      // Setup timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      console.log(`🌐 API FormData Request: POST ${url}`);
      console.log(`📋 FormData headers:`, defaultHeaders);

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const result: ApiResponse<T> = await response.json();

      if (response.ok) {
        console.log(`✅ API FormData Success: ${url}`, result);
        return result;
      } else {
        console.error(`❌ API FormData Error: ${url}`, result);
        throw new Error(result.message || 'API FormData request failed');
      }
    } catch (error: any) {
      console.error(`🔴 API FormData Request Error:`, error);
      throw error;
    }
  }

  // Put FormData for multipart uploads
  async putFormData<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint);

      // Default headers (don't set Content-Type for FormData, let browser set it with boundary)
      const defaultHeaders: Record<string, string> = {};

      // Get token from secure store
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
        console.log(`🔐 Token added to FormData headers for PUT ${url}`);
        console.log(`🔐 Token preview: ${token.substring(0, 20)}...`);
      } else {
        console.log(`⚠️ No token found for FormData PUT ${url}`);
      }

      // Merge additional headers
      if (headers) {
        Object.assign(defaultHeaders, headers);
      }

      const config: RequestInit = {
        method: 'PUT',
        headers: defaultHeaders,
        body: formData,
      };

      // Setup timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      config.signal = controller.signal;

      console.log(`🌐 API FormData Request: PUT ${url}`);
      console.log(`📋 FormData headers:`, defaultHeaders);

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const result: ApiResponse<T> = await response.json();

      if (response.ok) {
        console.log(`✅ API FormData Success: ${url}`, result);
        return result;
      } else {
        console.error(`❌ API FormData Error: ${url}`, result);
        throw new Error(result.message || 'API FormData request failed');
      }
    } catch (error: any) {
      console.error(`🔴 API FormData Request Error:`, error);
      throw error;
    }
  }

  // Special method for transcription with longer timeout
  async postFormDataWithLongTimeout<T>(
    endpoint: string,
    formData: FormData,
    headers?: Record<string, string>,
    timeout: number = 60000 // 60 seconds default for transcription
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.buildUrl(endpoint);

      // Default headers for FormData
      const defaultHeaders: Record<string, string> = {};

      // Safely merge headers
      if (headers) {
        Object.assign(defaultHeaders, headers);
      }

      // Get token from secure store
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        method: 'POST',
        body: formData,
        headers: defaultHeaders,
      };

      // Setup timeout with longer duration for transcription
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      config.signal = controller.signal;

      console.log(`🌐 Transcription Request: POST ${url} (timeout: ${timeout}ms)`);
      console.log(`📋 Request headers:`, defaultHeaders);
      console.log(`📦 FormData fields:`, formData);

      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      console.log(`📥 Response status: ${response.status} (${response.statusText})`);
      console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(`❌ Non-JSON response (${contentType}):`, textResponse);
        throw new Error(`Server trả về lỗi: ${response.status} - ${textResponse.substring(0, 200)}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (response.ok) {
        console.log(`✅ Transcription Success: ${url}`, result);
        return result;
      } else {
        console.error(`❌ Transcription Error: ${url}`, result);
        throw new Error(result.message || 'Transcription request failed');
      }
    } catch (error: any) {
      console.error(`🔴 Transcription Request Error:`, error);
      throw error;
    }
  }

  // Auth token helpers
  async setAuthToken(token: string) {
    await SecureStore.setItemAsync('access_token', token);
  }

  async removeAuthToken() {
    await SecureStore.deleteItemAsync('access_token');
  }

  async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('access_token');
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance();
