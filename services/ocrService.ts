import { apiService } from './apiService';

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
      console.log('🔄 Scanning invoice...');
      
      const form = new FormData();
      form.append('file', file);
      
      const response = await apiService.postFormData<TransactionOcrResponse>(
        '/api/v1/transactions/scan-invoice',
        form
      );
      
      if (response.data) {
        console.log('✅ Invoice scanned successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to scan invoice');
      
    } catch (error: any) {
      console.error('❌ Failed to scan invoice:', error);
      throw new Error(error.message || 'Failed to scan invoice');
    }
  }
}

// Export singleton instance
export const ocrService = new OcrService(); 