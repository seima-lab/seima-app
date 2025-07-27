import { apiService } from './apiService';
import { TRANSCRIPTION_ENDPOINTS } from './config';

export interface TranscriptionResponse {
  statusCode: number;
  message: string;
  data: string;
}

export class TranscriptionService {
  static async uploadAudio(formData: FormData): Promise<string> {
    const res = await apiService.postFormDataWithLongTimeout<TranscriptionResponse>(
      TRANSCRIPTION_ENDPOINTS.UPLOAD,
      formData,
      undefined, // headers
      90000 // 90 seconds timeout for transcription
    );
    if (res && typeof res.data === 'string') {
      return res.data;
    }
    throw new Error(res?.message || 'Không nhận diện được giọng nói');
  }
} 