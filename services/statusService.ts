// services/statusService.ts
// Service for handling financial health status API calls

import { apiService } from './apiService';
import { STATUS_ENDPOINTS } from './config';

// Type definitions for status API response
export interface HealthStatusData {
  score: number;
  level: string;
}

export interface HealthStatusResponse {
  statusCode: number;
  message: string;
  data: HealthStatusData;
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data?: T;
}

export class StatusService {
  /**
   * Get financial health status
   * @returns Promise<HealthStatusData>
   */
  async getHealthStatus(): Promise<HealthStatusData> {
    try {
      console.log('🟡 Fetching financial health status...');
      
      const response = await apiService.get<HealthStatusData>(STATUS_ENDPOINTS.GET_HEALTH_STATUS);
      
      console.log('🟢 Health status response:', response);
      
      // Handle response structure
      if (response.data) {
        return response.data;
      }
      
      // Fallback if data is directly in response
      if ('score' in response && 'level' in response) {
        return response as unknown as HealthStatusData;
      }
      
      throw new Error('Invalid health status response format');
      
    } catch (error: any) {
      console.error('🔴 Failed to fetch health status:', error);
      
      // Provide meaningful error messages
      if (error.message?.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error. Please check your connection.');
      }
      
      throw new Error(error.message || 'Failed to fetch financial health status');
    }
  }

  /**
   * Get health status description based on level
   * @param level - Health level from API
   * @returns Object with description and color
   */
  getHealthDescription(level: string) {
    const levelLower = level.toLowerCase();
    
    switch (levelLower) {
      case 'excellent':
        return {
          label: 'Excellent',
          message: 'Your financial health is excellent! Keep up the good work.',
          color: '#4CAF50',
          emoji: '🟩'
        };
      case 'good':
        return {
          label: 'Good', 
          message: 'Your financial health is good. Consider some improvements.',
          color: '#FF9800',
          emoji: '🟨'
        };
      case 'fair':
        return {
          label: 'Fair',
          message: 'Your financial health needs attention. Review your spending.',
          color: '#FF5722', 
          emoji: '🟧'
        };
      case 'poor':
        return {
          label: 'Poor',
          message: 'Your financial health needs immediate improvement.',
          color: '#F44336',
          emoji: '🟥'
        };
      default:
        return {
          label: 'Good', 
          message: 'Your financial health is good. Consider some improvements.',
          color: '#FF9800',
          emoji: '🟨'
        };
    }
  }

  /**
   * Get health progress bar width based on score
   * @param score - Health score from API (0-100)
   * @returns Progress percentage string
   */
  getProgressWidth(score: number): string {
    const normalizedScore = Math.max(0, Math.min(100, score));
    return `${normalizedScore}%`;
  }
}

// Export singleton instance
export const statusService = new StatusService(); 