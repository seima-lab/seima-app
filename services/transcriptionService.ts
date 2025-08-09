import { apiService } from './apiService';
import { TRANSCRIPTION_ENDPOINTS } from './config';

export interface TranscriptionResponse {
  statusCode: number;
  message: string;
  data: string;
}

export class TranscriptionService {
  static async uploadAudio(formData: FormData): Promise<string> {
    try {
      console.log('🎯 Starting audio transcription upload...');
      console.log('📍 Endpoint:', TRANSCRIPTION_ENDPOINTS.UPLOAD);
      console.log('🌐 Base URL:', 'https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net');
      console.log('🔗 Full URL will be:', `https://seima-server-byb7bmgea3fea4ej.southeastasia-01.azurewebsites.net${TRANSCRIPTION_ENDPOINTS.UPLOAD}`);
      
      const res = await apiService.postFormDataWithLongTimeout<TranscriptionResponse>(
        TRANSCRIPTION_ENDPOINTS.UPLOAD,
        formData,
        undefined, // headers
        90000 // 90 seconds timeout for transcription
      );
      
      console.log('📤 Transcription response received:', res);
      
      if (res && res.data && typeof res.data === 'string') {
        const transcriptionText = res.data as string;
        console.log('✅ Transcription successful:', transcriptionText.length > 100 ? transcriptionText.substring(0, 100) + '...' : transcriptionText);
        return transcriptionText;
      }
      
      // Handle different response formats
      if (res && res.status_code >= 200 && res.status_code < 300) {
        // Success but no data
        throw new Error('Nhận diện bạn đang không nói gì vui lòng thử lại');
      }
      
      // Server returned error
      const errorMsg = res?.message || 'Không nhận diện được giọng nói';
      console.error('❌ Transcription failed with message:', errorMsg);
      throw new Error(errorMsg);
      
    } catch (error: any) {
      console.error('❌ TranscriptionService error:', error);
      
      // Re-format network errors to be more user-friendly
      if (error.message?.includes('Network request failed')) {
        throw new Error('Network request failed');
      }
      
      if (error.message?.includes('timeout') || error.name === 'AbortError') {
        throw new Error('Quá trình nhận dạng mất quá nhiều thời gian. Vui lòng thử lại.');
      }
      
      // Pass through other errors
      throw error;
    }
  }
} 