import { apiService } from './apiService';

export interface UserProfileResponseDto {
  user_id: number;
  user_full_name: string;
  user_email: string;
  user_dob: string; // ISO date string format
  user_gender: boolean; // true = male, false = female
  user_phone_number: string;
  user_avatar_url: string;
}

// API response structure
interface ApiUserResponse {
  status_code: number;
  message: string;
  data: {
    user_id: number;
    user_full_name: string;
    user_email: string;
    user_dob: string | null;
    user_gender: boolean | null;
    user_phone_number: string | null;
    user_avatar_url: string | null;
  };
}

// Cấu trúc phản hồi API chung
interface ApiResponseData<T = any> {
  status_code?: number;
  statusCode?: number;
  message?: string;
  data?: T;
}

// Cấu trúc request tạo user mới cho Google users (snake_case)
export interface UserCreationRequestDto {
  email: string;
  full_name: string;
  birth_date: string; // ISO date string format (YYYY-MM-DD)
  phone_number: string;
  avatar_url?: string;
  gender: boolean; // true = male, false = female
}

// Cấu trúc request update user profile theo backend format mới
export interface UserUpdateRequestDto {
  full_name?: string;
  birth_date?: string; // ISO date string format (YYYY-MM-DD)
  phone_number?: string;
  avatar_url?: string;
  gender?: boolean; // true = male, false = female
}

// Alternative interface for camelCase format
export interface UserUpdateRequestDtoAlt {
  fullName?: string;
  birthDate?: string; // ISO date string format (YYYY-MM-DD)
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: boolean; // true = male, false = female
}

// Chuyển đổi từ API response sang dạng dễ sử dụng hơn trong UI
export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  date_of_birth: Date | null;
  gender: 'male' | 'female' | '';
  phone_number: string;
  avatar_url: string | null;
  // Raw API fields for compatibility with SettingScreen
  user_id: number;
  user_full_name: string;
  user_email: string;
  user_dob: string | null;
  user_gender: boolean | null;
  user_phone_number: string;
  user_avatar_url: string | null;
}

export const mapApiResponseToUserProfile = (data: any): UserProfile => {
  console.log('🔄 Mapping API response to UserProfile:', JSON.stringify(data, null, 2));
  
  // Handle both response formats - keep raw data structure similar to SettingScreen
  if ('user_id' in data) {
    return {
      id: data.user_id,
      full_name: data.user_full_name || '',
      email: data.user_email || '',
      date_of_birth: data.user_dob ? new Date(data.user_dob) : null,
      gender: data.user_gender === true ? 'male' : data.user_gender === false ? 'female' : '',
      phone_number: data.user_phone_number || '',
      avatar_url: data.user_avatar_url || null,
      // Keep raw API fields for compatibility
      user_id: data.user_id,
      user_full_name: data.user_full_name || '',
      user_email: data.user_email || '',
      user_dob: data.user_dob || null,
      user_gender: data.user_gender,
      user_phone_number: data.user_phone_number || '',
      user_avatar_url: data.user_avatar_url || null,
    };
  }
  
  // Handle legacy camelCase format (fallback)
  return {
    id: data.userId || data.user_id || 0,
    full_name: data.userFullName || data.user_full_name || '',
    email: data.userEmail || data.user_email || '',
    date_of_birth: (data.userDob || data.user_dob) ? new Date(data.userDob || data.user_dob) : null,
    gender: (data.userGender === true || data.user_gender === true) ? 'male' : (data.userGender === false || data.user_gender === false) ? 'female' : '',
    phone_number: data.userPhoneNumber || data.user_phone_number || '',
    avatar_url: data.userAvatarUrl || data.user_avatar_url || null,
    // Keep raw API fields
    user_id: data.userId || data.user_id || 0,
    user_full_name: data.userFullName || data.user_full_name || '',
    user_email: data.userEmail || data.user_email || '',
    user_dob: data.userDob || data.user_dob || null,
    user_gender: data.userGender !== undefined ? data.userGender : data.user_gender,
    user_phone_number: data.userPhoneNumber || data.user_phone_number || '',
    user_avatar_url: data.userAvatarUrl || data.user_avatar_url || null,
  };
};

export class UserService {
  private static instance: UserService;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  // Test method để debug
  async testApiConnection(): Promise<void> {
    try {
      console.log('🧪 Testing API connection...');
      const response = await apiService.get<ApiResponseData>('/api/v1/users/me');
      console.log('✅ API connection test successful:', response);
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      throw error;
    }
  }

  // Lấy thông tin người dùng hiện tại
  async getCurrentUserProfile(forceRefresh: boolean = false): Promise<UserProfile> {
    try {
      if (forceRefresh) {
        console.log('🔄 Force refreshing user profile...');
      }
      console.log('🔄 Calling API: /api/v1/users/me');
      const response = await apiService.get<ApiResponseData>('/api/v1/users/me');
      
      console.log('📊 API Response:', JSON.stringify(response, null, 2));
      
      // Xử lý cấu trúc API response có data lồng nhau
      if (response.data) {
        console.log('✅ User data received');
        
        // Nếu response.data là object có chứa data lồng nhau (API format)
        if (response.data.data) {
          console.log('📦 Found nested data structure');
          return mapApiResponseToUserProfile(response.data.data);
        }
        
        // Nếu response.data là object trực tiếp (DTO format)
        console.log('📦 Found direct data structure');
        return mapApiResponseToUserProfile(response.data);
      }
      
      console.error('❌ API returned no data');
      throw new Error('No user data received');
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      throw error;
    }
  }

  // Tạo user mới cho Google users
  async createUser(payload: UserCreationRequestDto): Promise<void> {
    try {
      console.log('🔄 Starting user creation for Google user...');
      console.log('📋 Input payload:', JSON.stringify(payload, null, 2));
      
      // Send request to create endpoint
      console.log('🚀 Attempting to create user...');
      const response = await apiService.post<ApiResponseData>('/api/v1/users/create', payload);
      
      console.log('📥 Response received:', JSON.stringify(response, null, 2));
      
      // Check response status - API returns status_code directly in response
      const responseData = response as any;
      if (responseData && (responseData.status_code === 200 || responseData.statusCode === 200)) {
        console.log('✅ User created successfully');
        return;
      }
      
      // Also check nested data structure if exists
      if (response.data && (response.data.statusCode === 200 || response.data.status_code === 200)) {
        console.log('✅ User created successfully (nested)');
        return;
      }
      
      throw new Error('Failed to create user');
      
    } catch (error: any) {
      console.error('❌ User creation failed:', error.message);
      if (error.response) {
        console.error('📊 Error response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // Cập nhật thông tin người dùng với snake_case payload
  async updateUserProfile(payload: any): Promise<UserProfile> {
    try {
      console.log('🔄 Starting profile update...');
      console.log('📋 Input payload:', JSON.stringify(payload, null, 2));
      
      // Check if payload is empty
      if (!payload || Object.keys(payload).length === 0) {
        throw new Error('No fields to update. Please provide at least one field to update.');
      }
      
      // Send request directly with snake_case payload
      console.log('🚀 Attempting to update user profile...');
      const response = await apiService.put<ApiResponseData>('/api/v1/users/update', payload);
      
      console.log('📥 Response received:', JSON.stringify(response, null, 2));
      
      // Xử lý response
      if (response.data) {
        const userData = response.data.data || response.data;
        console.log('✅ User data updated:', JSON.stringify(userData, null, 2));
        return mapApiResponseToUserProfile(userData);
      }
      
      throw new Error('No data received from server');
      
    } catch (error: any) {
      console.error('❌ Update failed:', error.message);
      if (error.response) {
        console.error('📊 Error response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  // Tải lên avatar người dùng
  async uploadAvatar(imageUri: string): Promise<string> {
    try {
      console.log('🔄 Starting avatar upload process...');
      console.log('📋 Input image URI:', imageUri);
      
      // Log detailed URI analysis
      console.log('📊 URI Analysis:');
      console.log('  - URI type:', imageUri.startsWith('file://') ? 'Local file' : imageUri.startsWith('http') ? 'Remote URL' : 'Unknown');
      console.log('  - URI length:', imageUri.length);
      
      // Create FormData for file upload
      const formData = new FormData();
      
      // Extract filename from URI or use default
      const filename = imageUri.split('/').pop() || 'avatar.jpg';
      console.log('📋 Extracted filename:', filename);
      
      // Determine MIME type based on file extension
      const extension = filename.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg'; // default
      
      switch (extension) {
        case 'png':
          mimeType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
      }
      
      console.log('📋 Determined MIME type:', mimeType);
      
      // Append file to FormData
      formData.append('avatar', {
        uri: imageUri,
        type: mimeType,
        name: filename,
      } as any);
      
      console.log('📤 Uploading avatar...');
      
      // Upload using apiService with FormData
      const response = await apiService.postFormData<ApiResponseData>('/api/v1/users/upload-avatar', formData);
      
      console.log('📥 Upload response:', JSON.stringify(response, null, 2));
      
      // Extract avatar URL from response
      if (response.data) {
        const responseData = response.data as any;
        const avatarUrl = responseData.avatar_url || responseData.user_avatar_url || responseData.url;
        
        if (avatarUrl) {
          console.log('✅ Avatar uploaded successfully:', avatarUrl);
          return avatarUrl;
        }
      }
      
      throw new Error('No avatar URL received from server');
      
    } catch (error: any) {
      console.error('❌ Avatar upload failed:', error.message);
      if (error.response) {
        console.error('📊 Upload error response:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
}

// Export singleton instance
export const userService = UserService.getInstance(); 