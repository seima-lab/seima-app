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

// Transaction Overview interfaces
export interface TransactionOverviewResponse {
  summary: TransactionSummary;
  by_date: DailyTransactions[];
}

export interface TransactionSummary {
  total_income: number;
  total_expense: number;
  balance: number; // total_income - total_expense
}

export interface DailyTransactions {
  date: string; // LocalDate as string
  transactions: TransactionItem[];
}

export interface TransactionItem {
  transaction_id: number;
  category_name: string;
  amount: number;
  transaction_type: string;
  description?: string;
  transaction_date: string; // LocalDateTime as string
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

  /**
   * Get transaction overview for a specific month
   * @param month - Month in 'YYYY-MM' format
   */
  async getTransactionOverview(month: string): Promise<TransactionOverviewResponse> {
    try {
      console.log('🔄 Getting transaction overview for month:', month);
      
      const response = await apiService.get<TransactionOverviewResponse>(
        `/api/v1/transactions/overview?month=${month}`
      );
      
      if (response.data) {
        console.log('✅ Transaction overview retrieved successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get transaction overview');
      
    } catch (error: any) {
      console.error('❌ Failed to get transaction overview:', error);
      throw new Error(error.message || 'Failed to get transaction overview');
    }
  }

  /**
   * Delete a transaction by ID
   * @param transactionId - The ID of the transaction to delete
   */
  async deleteTransaction(transactionId: number): Promise<void> {
    try {
      console.log('🔄 Deleting transaction with ID:', transactionId);
      
      const response = await apiService.delete<null>(
        `/api/v1/transactions/delete/${transactionId}`
      );
      
      console.log('📋 Delete response:', JSON.stringify(response, null, 2));
      
      // Check if the response indicates success (200 OK or 204 No Content)
      if (response.status_code === 200 || response.status_code === 204) {
        console.log('✅ Transaction deleted successfully:', response.message);
      } else {
        console.log('⚠️ Unexpected status code:', response.status_code, 'Message:', response.message);
        throw new Error(response.message || 'Failed to delete transaction');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to delete transaction:', error);
      throw new Error(error.message || 'Failed to delete transaction');
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService(); 