import { apiService } from './apiService';

// Transaction Types
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

// Request interfaces
export interface CreateTransactionRequest {
  user_id: number;
  wallet_id: number;
  category_id: number;
  group_id?: number;
  transaction_type: TransactionType;
  amount: number;
  currency_code: string;
  transaction_date: string; // ISO date string
  description?: string;
  receipt_image_url?: string | null; // Changed from receipt_image to receipt_image_url
  payee_payer_name?: string;
}

// Response interface
export interface TransactionResponse {
  transaction_id: number;
  user_id: number;
  wallet_id: number;
  category_id: number;
  group_id?: number;
  transaction_type: TransactionType;
  amount: number;
  currency_code: string;
  transaction_date: string;
  description?: string;
  receipt_image_url?: string;
  payee_payer_name?: string;
  created_at: string;
  updated_at: string;
}

export class TransactionService {
  
  /**
   * Create an expense transaction
   */
  async createExpense(request: CreateTransactionRequest): Promise<TransactionResponse> {
    try {
      console.log('🔄 Creating expense transaction:', request);
      
      // Send as JSON instead of FormData to match backend expectation
      const response = await apiService.post<TransactionResponse>(
        '/api/v1/transactions/expense', 
        request
      );
      
      if (response.data) {
        console.log('✅ Expense created successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create expense');
      
    } catch (error: any) {
      console.error('❌ Failed to create expense:', error);
      throw new Error(error.message || 'Failed to create expense transaction');
    }
  }

  /**
   * Create an income transaction
   */
  async createIncome(request: CreateTransactionRequest): Promise<TransactionResponse> {
    try {
      console.log('🔄 Creating income transaction:', request);
      
      // Send as JSON instead of FormData to match backend expectation
      const response = await apiService.post<TransactionResponse>(
        '/api/v1/transactions/income', 
        request
      );
      
      if (response.data) {
        console.log('✅ Income created successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create income');
      
    } catch (error: any) {
      console.error('❌ Failed to create income:', error);
      throw new Error(error.message || 'Failed to create income transaction');
    }
  }

  /**
   * Get all transactions
   */
  async getAllTransactions(page = 1, limit = 20): Promise<TransactionResponse[]> {
    try {
      const response = await apiService.get<TransactionResponse[]>(
        `/api/v1/transactions?page=${page}&limit=${limit}`
      );
      
      if (response.data) {
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get transactions');
      
    } catch (error: any) {
      console.error('❌ Failed to get transactions:', error);
      throw new Error(error.message || 'Failed to get transactions');
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService(); 