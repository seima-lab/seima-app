import { ApiService } from './apiService';
import { SecureApiService } from './secureApiService';

const secureApiService = SecureApiService.getInstance();
const apiService = ApiService.getInstance();

export enum GroupMemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface GroupMemberResponse {
  user_id: number;
  user_full_name: string;
  user_avatar_url?: string;
  user_email: string;
}

export interface UserJoinedGroupResponse {
  group_id: number;
  group_name: string;
  group_avatar_url?: string;
  group_created_date: string; // "yyyy-MM-dd HH:mm:ss"
  joined_date: string; // "yyyy-MM-dd HH:mm:ss"
  user_role: GroupMemberRole;
  total_members_count: number;
  group_leader: GroupMemberResponse;
}

export interface GroupResponse {
  group_id: number;
  group_name: string;
  group_invite_code: string;
  group_created_date: string; // "yyyy-MM-dd HH:mm:ss"
  group_is_active: boolean;
  group_avatar_url?: string;
}

export interface GroupDetailResponse {
  group_id: number;
  group_name: string;
  group_invite_link?: string;
  group_avatar_url?: string;
  group_created_date: string; // "yyyy-MM-dd HH:mm:ss"
  group_is_active: boolean;
  group_leader: GroupMemberResponse;
  members: GroupMemberResponse[];
  total_members_count: number;
  current_user_role: GroupMemberRole;
}

export interface CreateGroupRequest {
  group_name: string;
  image?: File | Blob | any; // Handle File/Blob for web, and React Native file objects
}

export interface UpdateGroupRequest {
  group_name?: string;
  image?: File | Blob | any; // Handle File/Blob for web, and React Native file objects
}

class GroupService {
  // Get all groups that current user has joined
  async getUserJoinedGroups(): Promise<UserJoinedGroupResponse[]> {
    try {
      console.log('🟡 Loading user joined groups...');
      const response = await secureApiService.makeAuthenticatedRequest<UserJoinedGroupResponse[]>('/api/v1/groups/joined', 'GET');
      console.log('🟢 User joined groups loaded:', response);
      return response;
    } catch (error: any) {
      console.error('🔴 Failed to load user joined groups:', error);
      throw new Error(error.message || 'Failed to load groups');
    }
  }

  // Get group detail by ID
  async getGroupDetail(groupId: number): Promise<GroupDetailResponse> {
    try {
      console.log('🟡 Loading group detail for ID:', groupId);
      const response = await secureApiService.makeAuthenticatedRequest<GroupDetailResponse>(`/api/v1/groups/${groupId}`, 'GET');
      console.log('🟢 Group detail loaded:', response);
      return response;
    } catch (error: any) {
      console.error('🔴 Failed to load group detail:', error);
      throw new Error(error.message || 'Failed to load group detail');
    }
  }

  // Create new group with timeout handling
  async createGroup(request: CreateGroupRequest): Promise<GroupResponse> {
    try {
      console.log('🟡 Creating new group:', request);
      
      const formData = new FormData();
      
      // Backend expects 'groupName' field
      console.log('🟡 Adding groupName to FormData:', request.group_name);
      formData.append('groupName', request.group_name);
      
      if (request.image) {
        console.log('🟡 Image details:', {
          size: request.image.size || 'unknown',
          type: request.image.type || 'unknown',
          name: (request.image as any).name || 'unknown',
          uri: (request.image as any).uri || 'unknown'
        });
        
        // Validate file size (max 5MB for group avatar)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (request.image.size && request.image.size > maxSize) {
          throw new Error(`Image too large: ${(request.image.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
        }
        
        // Handle different platforms like ocrService
        if (typeof request.image === 'object' && 'uri' in request.image) {
          // React Native mobile - create proper file object
          console.log('📱 Mobile platform - using URI format');
          const imageObject = {
            uri: request.image.uri,
            type: request.image.type || 'image/jpeg',
            name: request.image.name || 'group-avatar.jpg',
          };
          console.log('🟡 Final image object for FormData:', imageObject);
          formData.append('image', imageObject as any);
        } else {
          // Web or proper File/Blob
          console.log('🌐 Web platform - using File/Blob');
          formData.append('image', request.image, (request.image as any).name || 'group-avatar.jpg');
        }
        
        console.log('🟡 Image appended to FormData successfully');
      } else {
        console.log('🟡 No image provided, creating group without avatar');
      }

      // Log FormData contents for debugging
      console.log('🟡 FormData prepared, making API request to /api/v1/groups/create...');
      console.log('🟡 FormData contains:', {
        groupName: request.group_name,
        hasImage: !!request.image
      });

      // Use timeout handling for requests with images (they take longer)
      if (request.image) {
        console.log('🕐 Using extended timeout for image upload (30 seconds)');
        const response = await this.makeGroupRequestWithTimeout(formData, '/api/v1/groups/create', 30000);
        return response;
      } else {
        // Use regular apiService for text-only requests
        const response = await apiService.postFormData<GroupResponse>('/api/v1/groups/create', formData);
        
        console.log('🟢 Group created successfully:', response);
        
        // Return response.data or response based on structure
        if (response.data) {
          return response.data;
        }
        
        // If response doesn't have data property, return response itself
        throw new Error('Invalid response structure from server');
      }
      
    } catch (error: any) {
      console.error('🔴 Failed to create group:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('🔴 Response status:', error.response.status);
        console.error('🔴 Response data:', error.response.data);
        console.error('🔴 Response headers:', error.response.headers);
      }
      
      // Provide more specific error messages based on error type
      if (error.message?.includes('timeout') || error.message?.includes('Abort')) {
        throw new Error('Request timed out. Please try again with a smaller image or check your internet connection.');
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('500')) {
        throw new Error('Server error occurred. Please check your input and try again.');
      } else if (error.message?.includes('400')) {
        throw new Error('Invalid request. Please check group name and image format.');
      } else if (error.message?.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      throw new Error(error.message || 'Failed to create group');
    }
  }

  /**
   * Make group creation request with custom timeout (similar to ocrService)
   */
  private async makeGroupRequestWithTimeout(formData: FormData, endpoint: string, timeoutMs: number, method: 'POST' | 'PUT' = 'POST'): Promise<GroupResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`⏰ Group request timeout after ${timeoutMs/1000} seconds`);
      controller.abort();
    }, timeoutMs);

    try {
      // Get auth token
      const { authService } = await import('./authService');
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log(`🔐 Using auth token for group ${method} request`);
      
      const { ApiConfig } = await import('./config');
      const response = await fetch(`${ApiConfig.BASE_URL}${endpoint}`, {
        method: method,
        body: formData,
        signal: controller.signal,
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
          'Authorization': `Bearer ${token}`
        }
      });

      clearTimeout(timeoutId);

      console.log(`📥 Group ${method} response status:`, response.status);
      console.log(`📥 Group ${method} response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Group ${method} API error response:`, errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        
        throw new Error(`Group ${method} API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Group ${method} response data:`, data);

      // Handle different response formats
      if (data.data) {
        return data.data; // Standard API format with data wrapper
      } else if (data.group_id || data.group_name) {
        return data; // Direct response format
      }

      throw new Error('Invalid group response format');

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        throw new Error(`Group ${method} timed out after ${timeoutMs/1000} seconds. Please try with a smaller image or check your internet connection.`);
      }

      throw fetchError;
    }
  }

  // Update group information
  async updateGroup(groupId: number, request: UpdateGroupRequest): Promise<GroupResponse> {
    try {
      console.log('🟡 Updating group:', groupId, request);
      
      const formData = new FormData();
      
      if (request.group_name) {
        formData.append('groupName', request.group_name); // Backend expects 'groupName'
      }
      
      if (request.image) {
        console.log('🟡 Image details:', {
          size: request.image.size || 'unknown',
          type: request.image.type || 'unknown',
          name: (request.image as any).name || 'unknown',
          uri: (request.image as any).uri || 'unknown'
        });
        
        // Validate file size (max 5MB for group avatar)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (request.image.size && request.image.size > maxSize) {
          throw new Error(`Image too large: ${(request.image.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.`);
        }
        
        // Handle different platforms like ocrService
        if (typeof request.image === 'object' && 'uri' in request.image) {
          // React Native mobile - create proper file object
          console.log('📱 Mobile platform - using URI format');
          const imageObject = {
            uri: request.image.uri,
            type: request.image.type || 'image/jpeg',
            name: request.image.name || 'group-avatar.jpg',
          };
          console.log('🟡 Final image object for FormData:', imageObject);
          formData.append('image', imageObject as any);
        } else {
          // Web or proper File/Blob
          console.log('🌐 Web platform - using File/Blob');
          formData.append('image', request.image, (request.image as any).name || 'group-avatar.jpg');
        }
        
        console.log('🟡 Image appended to FormData successfully');
      }

      // Log FormData contents for debugging
      console.log('🟡 FormData prepared, making API request to update group...');
      console.log('🟡 FormData contains:', {
        groupName: request.group_name,
        hasImage: !!request.image
      });

      // Use timeout handling for requests with images (they take longer)
      if (request.image) {
        console.log('🕐 Using extended timeout for image upload (30 seconds)');
        const response = await this.makeGroupRequestWithTimeout(formData, `/api/v1/groups/${groupId}`, 30000, 'PUT');
        return response;
      } else {
        // Use regular apiService for text-only requests
        const response = await apiService.putFormData<GroupResponse>(`/api/v1/groups/${groupId}`, formData);
        
        console.log('🟢 Group updated successfully:', response);
        
        // Return response.data or response based on structure
        if (response.data) {
          return response.data;
        }
        
        // If response doesn't have data property, return response itself
        throw new Error('Invalid response structure from server');
      }
      
    } catch (error: any) {
      console.error('🔴 Failed to update group:', error);
      
      // Enhanced error logging
      if (error.response) {
        console.error('🔴 Response status:', error.response.status);
        console.error('🔴 Response data:', error.response.data);
        console.error('🔴 Response headers:', error.response.headers);
      }
      
      // Provide more specific error messages based on error type
      if (error.message?.includes('timeout') || error.message?.includes('Abort')) {
        throw new Error('Request timed out. Please try again with a smaller image or check your internet connection.');
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.message?.includes('500')) {
        throw new Error('Server error occurred. Please check your input and try again.');
      } else if (error.message?.includes('400')) {
        throw new Error('Invalid request. Please check group name and image format.');
      } else if (error.message?.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      throw new Error(error.message || 'Failed to update group');
    }
  }

  // Archive group
  async archiveGroup(groupId: number): Promise<GroupResponse> {
    try {
      console.log('🟡 Archiving group:', groupId);
      const response = await secureApiService.makeAuthenticatedRequest<GroupResponse>(`/api/v1/groups/${groupId}/archive`, 'DELETE');
      console.log('🟢 Group archived successfully:', response);
      return response;
    } catch (error: any) {
      console.error('🔴 Failed to archive group:', error);
      throw new Error(error.message || 'Failed to archive group');
    }
  }
}

export const groupService = new GroupService(); 