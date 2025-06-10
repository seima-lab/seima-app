// Types for API responses
export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
  error?: string;
}

// API Service Class
export class ApiService {
  private static instance: ApiService;
  private baseURL: string;
  private timeout: number;

  private constructor() {
    this.baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || '';
    this.timeout = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '');
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
      
      const defaultHeaders = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const config: RequestInit = {
        ...options,
        headers: defaultHeaders,
      };

      // Create AbortController for timeout
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

  // Auth token methods
  setAuthToken(token: string) {
    // Store token for future requests
    // You might want to use AsyncStorage here
  }

  removeAuthToken() {
    // Remove stored token
  }
}

// Export singleton instance
export const apiService = ApiService.getInstance(); 