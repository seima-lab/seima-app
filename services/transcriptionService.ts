import { apiService } from './apiService';
import { TRANSCRIPTION_ENDPOINTS } from './config';

export interface TranscriptionResponse {
  statusCode: number;
  message: string;
  data: string;
}

export class TranscriptionService {
  static async uploadAudio(formData: FormData): Promise<string> {
    const res = await apiService.postFormData<TranscriptionResponse>(
      TRANSCRIPTION_ENDPOINTS.UPLOAD,
      formData
    );
    if (res && typeof res.data === 'string') {
      return res.data;
    }
    throw new Error(res?.message || 'Không nhận diện được giọng nói');
  }
} 