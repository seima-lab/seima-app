// services/ApiService.ts

import * as SecureStore from 'expo-secure-store';

// Types for API responses
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private timeout: number;

  private constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.example.com';
    this.timeout = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000');
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

      if (response.ok) {
        console.log(`✅ API Success: ${url}`, result);
        return result;
      } else {
        console.error(`❌ API Error: ${url}`, result);
        throw new Error(result.message || 'API request failed');
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
