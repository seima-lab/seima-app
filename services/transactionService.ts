import { apiService } from './apiService';
import { TRANSACTION_ENDPOINTS } from './config';

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

// Transaction Report interfaces
export interface TransactionReportResponse {
  summary: ReportSummary;
  transactionsByCategory: { [key: string]: ReportByCategory[] };
}

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface ReportByCategory {
  category_name: string;
  category_icon_url: string;
  amount: number;
  percentage: number;
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
        `${TRANSACTION_ENDPOINTS.CREATE}/expense`, 
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
        `${TRANSACTION_ENDPOINTS.CREATE}/income`, 
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
        `${TRANSACTION_ENDPOINTS.LIST}?page=${page}&limit=${limit}`
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
        `${TRANSACTION_ENDPOINTS.LIST}/overview?month=${month}`
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
   * Update a transaction by ID
   * @param transactionId - The ID of the transaction to update
   * @param request - The updated transaction data
   */
  async updateTransaction(transactionId: number, request: CreateTransactionRequest): Promise<TransactionResponse> {
    try {
      console.log('🔄 Updating transaction with ID:', transactionId);
      console.log('📝 Update data:', request);
      
      const response = await apiService.put<TransactionResponse>(
        `${TRANSACTION_ENDPOINTS.LIST}/update/${transactionId}`,
        request
      );
      
      if (response.data) {
        console.log('✅ Transaction updated successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update transaction');
      
    } catch (error: any) {
      console.error('❌ Failed to update transaction:', error);
      throw new Error(error.message || 'Failed to update transaction');
    }
  }

  /**
   * Delete a transaction by ID
   * @param transactionId - The ID of the transaction to delete
   */
  async deleteTransaction(transactionId: number): Promise<void> {
    try {
      console.log('🔄 Deleting transaction with ID:', transactionId);
      
      const response = await apiService.delete<void>(
        `${TRANSACTION_ENDPOINTS.LIST}/delete/${transactionId}`
      );
      
      console.log('✅ Transaction deleted successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to delete transaction:', error);
      throw new Error(error.message || 'Failed to delete transaction');
    }
  }

  /**
   * Get transaction by ID
   * @param transactionId - The ID of the transaction to get
   */
  async getTransactionById(transactionId: number): Promise<TransactionResponse> {
    try {
      console.log('🔄 Getting transaction with ID:', transactionId);
      
      const response = await apiService.get<TransactionResponse>(
        `${TRANSACTION_ENDPOINTS.LIST}/${transactionId}`
      );
      
      if (response.data) {
        console.log('✅ Transaction retrieved successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get transaction');
      
    } catch (error: any) {
      console.error('❌ Failed to get transaction:', error);
      throw new Error(error.message || 'Failed to get transaction');
    }
  }

  /**
   * Get transaction report
   * @param categoryId - Optional category ID to filter by
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   */
  async viewTransactionReport(
    categoryId?: number,
    startDate?: string,
    endDate?: string
  ): Promise<TransactionReportResponse> {
    try {
      console.log('🔄 Getting transaction report:', { categoryId, startDate, endDate });
      
      const params = new URLSearchParams();
      if (categoryId) {
        params.append('categoryId', categoryId.toString());
      }
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      
      const response = await apiService.get<TransactionReportResponse>(
        `${TRANSACTION_ENDPOINTS.LIST}/view-report?${params.toString()}`
      );
      
      if (response.data) {
        console.log('✅ Transaction report retrieved successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get transaction report');
      
    } catch (error: any) {
      console.error('❌ Failed to get transaction report:', error);
      throw new Error(error.message || 'Failed to get transaction report');
    }
  }
}

// Export singleton instance
export const transactionService = new TransactionService(); 