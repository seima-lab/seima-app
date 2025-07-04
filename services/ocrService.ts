import { authService } from './authService';
import { ApiConfig, TRANSACTION_ENDPOINTS } from './config';

// OCR Response interface
export interface TransactionOcrResponse {
  receipt_image_url: string;
  total_amount: number;
  currency_code: string;
  transaction_date: string;
  description_invoice: string;
  customer_name?: string | null;
}

export class OcrService {
  
  /**
   * Scan invoice and extract text from image
   */
  async scanInvoice(file: File | Blob): Promise<TransactionOcrResponse> {
    try {
      console.log('🔄 Starting OCR scan...');
      console.log('📄 File details:', {
        size: file.size || 'unknown',
        type: file.type || 'unknown',
        name: (file as any).name || 'unknown'
      });
      
      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size && file.size > maxSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB.`);
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (file.type && !validTypes.includes(file.type)) {
        console.log('⚠️ Invalid file type:', file.type);
        throw new Error(`Invalid file type: ${file.type}. Supported types: ${validTypes.join(', ')}`);
      }
      
      console.log('📤 Creating FormData...');
      const form = new FormData();
      
      // Handle different platforms
      if (typeof file === 'object' && 'uri' in file) {
        // React Native mobile
        console.log('📱 Mobile platform - using URI format');
        form.append('file', file as any);
      } else {
        // Web or proper File/Blob
        console.log('🌐 Web platform - using File/Blob');
        form.append('file', file, (file as any).name || 'receipt.jpg');
      }
      
      console.log('🚀 Sending OCR request with 60-second timeout...');
      
      // Custom OCR request with longer timeout
      const response = await this.makeOcrRequest(form);
      
      console.log('✅ OCR response received:', response);
      
      if (response && typeof response === 'object') {
        return response as TransactionOcrResponse;
      }
      
      throw new Error('Invalid OCR response format');
      
    } catch (error: any) {
      console.error('❌ OCR scan failed:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('timeout') || error.message?.includes('Abort')) {
        throw new Error('OCR scan timed out. Please try again with a smaller image.');
      }
      
      if (error.message?.includes('Network')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      if (error.message?.includes('Authentication') || error.message?.includes('401')) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      throw new Error(error.message || 'Failed to scan invoice. Please try again.');
    }
  }

  /**
   * Make OCR request with custom timeout (60 seconds)
   */
  private async makeOcrRequest(formData: FormData): Promise<TransactionOcrResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ OCR request timeout after 60 seconds');
      controller.abort();
    }, 60000); // 60 seconds for OCR

    try {
      // Get auth token
      const token = await authService.getStoredToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      console.log('🔑 Using auth token for OCR request');
      
      const response = await fetch(`${ApiConfig.BASE_URL}${TRANSACTION_ENDPOINTS.SCAN_INVOICE}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
          'Authorization': `Bearer ${token}`
        }
      });

      clearTimeout(timeoutId);

      console.log('📥 OCR response status:', response.status);
      console.log('📥 OCR response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OCR API error response:', errorText);
        
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        
        throw new Error(`OCR API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ OCR response data:', data);

      // Handle different response formats
      if (data.data) {
        return data.data; // Standard API format with data wrapper
      } else if (data.receipt_image_url || data.total_amount) {
        return data; // Direct response format
      }

      throw new Error('Invalid OCR response format');

    } catch (fetchError: any) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        throw new Error('OCR request timed out after 60 seconds. Please try with a smaller image.');
      }

      throw fetchError;
    }
  }
}

// Export singleton instance
export const ocrService = new OcrService(); 