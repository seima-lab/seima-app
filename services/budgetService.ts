import { apiService } from './apiService';
import { BUDGET_ENDPOINTS } from './config';

// API Response structure (camelCase from backend)
export interface BudgetResponseDto {
  budget_id: number;
  budget_name: string;
  start_date: string; // "yyyy-MM-dd HH:mm:ss"
  end_date: string; // "yyyy-MM-dd HH:mm:ss"
  period_type: string;
  overall_amount_limit: number;
  budget_remaining_amount: number;
  created_at: string; // "yyyy-MM-dd HH:mm:ss"
  category_list: Category[]; // Thay đổi từ categories thành category_list để nhất quán
}

// Create Budget Request structure (snake_case for app usage)
export interface CreateBudgetRequest {
  user_id: number;
  budget_name: string;
  start_date: string; // "yyyy-MM-dd HH:mm:ss"
  end_date: string; // "yyyy-MM-dd HH:mm:ss"
  period_type: string;
  overall_amount_limit: number;
  budget_remaining_amount: number;
  category_list: { category_id: number }[];
  wallet_list: { id: number }[]; // Array of objects with id instead of wallet_id
  currency_code: string; // Add currency_code field
}

// Category interface
export interface Category {
  category_id: number;
  user_id: number;
  group_id: number;
  category_name: string;
  category_type: import('./categoryService').CategoryType;
  category_icon_url: string;
  parent_category_id: number | null;
  is_system_defined: boolean;
}

// Converted structure (snake_case for app usage)
export interface Budget {
  budget_id: number;
  budget_name: string;
  start_date: string;
  end_date: string;
  period_type: string;
  overall_amount_limit: number;
  budget_remaining_amount: number;
  created_at: string;
  category_list?: Category[]; // Optional categories
}

// API response structure
interface ApiBudgetResponse {
  status_code: number;
  message: string;
  data: {
    content: BudgetResponseDto[];
    pageable: {
      pageNumber: number;
      pageSize: number;
    };
    totalElements: number;
    totalPages: number;
    first: boolean;
    last: boolean;
    empty: boolean;
  };
}

// Convert camelCase field names to snake_case only
const convertToSnakeCase = (budget: any): Budget => {
  return {
    budget_id: budget.budget_id,
    budget_name: budget.budget_name,
    start_date: budget.start_date,
    end_date: budget.end_date,
    period_type: budget.period_type,
    overall_amount_limit: budget.overall_amount_limit,
    budget_remaining_amount: budget.budget_remaining_amount,
    created_at: budget.created_at,
    category_list: budget.category_list || budget.categories || []
  };
};


export class BudgetService {
  private static instance: BudgetService;

  private constructor() {}

  public static getInstance(): BudgetService {
    if (!BudgetService.instance) {
      BudgetService.instance = new BudgetService();
    }
    return BudgetService.instance;
  }

  // Get list of budgets
  async getBudgetList(page: number = 0, size: number = 10): Promise<Budget[]> {
    try {
      console.log('🔄 Fetching budget list...');
      console.log('📄 Page:', page, 'Size:', size);
      
      const response = await apiService.get<any>(
        `${BUDGET_ENDPOINTS.LIST}?page=${page}&size=${size}`
      );

      console.log('📥 Budget list response:', JSON.stringify(response, null, 2));

      // Handle response structure properly
      if (response && response.data && response.data.content) {
        const budgets = response.data.content.map(convertToSnakeCase);
        console.log('✅ Budget list converted to snake_case:', budgets.length, 'items');
        console.log('🔍 Sample converted budget:', budgets[0]);
        return budgets;
      }

      console.log('⚠️ No budget content found in response');
      return [];
    } catch (error) {
      console.error('❌ Error fetching budget list:', error);
      throw error;
    }
  }

  // Create new budget
  async createBudget(request: CreateBudgetRequest): Promise<Budget> {
    try {
      console.log('🔄 Creating budget...');
      console.log('📤 Request data:', JSON.stringify(request, null, 2));
      const response = await apiService.post<any>(
        BUDGET_ENDPOINTS.CREATE,
        request
      );
      console.log('📥 Create budget response:', JSON.stringify(response, null, 2));
      if (response && response.data) {
        // Convert to snake_case if needed
        const createdBudget = convertToSnakeCase(response.data);
        console.log('✅ Budget created successfully:', createdBudget);
        return createdBudget;
      }
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('❌ Error creating budget:', error);
      throw error;
    }
  }

  // Lấy chi tiết budget theo id
  async getBudgetDetail(id: number | string): Promise<Budget> {
    try {
      console.log('🔄 Getting budget detail for ID:', id);
      const response = await apiService.get<any>(`${BUDGET_ENDPOINTS.GET_BY_ID(id.toString())}`);
      console.log('📥 Raw API response:', response);
      
      if (response && response.data) {
        console.log('📊 Response data:', response.data);
        console.log('📊 Response data keys:', Object.keys(response.data));
        
        // Convert to Budget interface format
        const budgetDetail: Budget = {
          budget_id: response.data.budget_id || response.data.budgetId,
          budget_name: response.data.budget_name || response.data.budgetName,
          start_date: response.data.start_date || response.data.startDate,
          end_date: response.data.end_date || response.data.endDate,
          period_type: response.data.period_type || response.data.periodType,
          overall_amount_limit: response.data.overall_amount_limit || response.data.overallAmountLimit,
          budget_remaining_amount: response.data.budget_remaining_amount || response.data.budgetRemainingAmount,
          created_at: response.data.created_at || response.data.createdAt,
          category_list: response.data.category_list || response.data.categories || response.data.categoryList || []
        };
        
        console.log('🔄 Converted budget detail:', budgetDetail);
        console.log('🔄 Categories in converted data:', budgetDetail.category_list);
        
        return budgetDetail;
      }
      throw new Error('No data found');
    } catch (error) {
      console.error('❌ Error fetching budget detail:', error);
      throw error;
    }
  }

  // Cập nhật budget theo id
  async updateBudget(id: number | string, request: CreateBudgetRequest): Promise<Budget> {
    try {
      console.log('🔄 ===== UPDATE BUDGET START =====');
      console.log('🆔 Budget ID to update:', id);
      console.log('🆔 Budget ID type:', typeof id);
      console.log('📤 Request data:', JSON.stringify(request, null, 2));
      console.log('📤 Request data type:', typeof request);
      console.log('📤 Request keys:', Object.keys(request));
      
      // Log từng field trong request
      console.log('📋 Request details:');
      console.log('  - user_id:', request.user_id, '(type:', typeof request.user_id, ')');
      console.log('  - budget_name:', request.budget_name, '(type:', typeof request.budget_name, ')');
      console.log('  - start_date:', request.start_date, '(type:', typeof request.start_date, ')');
      console.log('  - end_date:', request.end_date, '(type:', typeof request.end_date, ')');
      console.log('  - period_type:', request.period_type, '(type:', typeof request.period_type, ')');
      console.log('  - overall_amount_limit:', request.overall_amount_limit, '(type:', typeof request.overall_amount_limit, ')');
      console.log('  - budget_remaining_amount:', request.budget_remaining_amount, '(type:', typeof request.budget_remaining_amount, ')');
      console.log('  - category_list:', request.category_list, '(type:', typeof request.category_list, ')');
      console.log('  - category_list length:', request.category_list?.length || 0);
      
      if (request.category_list && request.category_list.length > 0) {
        console.log('  - category_list details:');
        request.category_list.forEach((cat, index) => {
          console.log(`    [${index}] category_id:`, cat.category_id, '(type:', typeof cat.category_id, ')');
        });
      }
      
      console.log('🌐 API Endpoint:', `${BUDGET_ENDPOINTS.UPDATE(id.toString())}`);
      console.log('📡 Making PUT request...');
      
      const response = await apiService.put<any>(
        `${BUDGET_ENDPOINTS.UPDATE(id.toString())}`,
        request
      );
      
      console.log('📥 Raw API response:', response);
      console.log('📥 Response type:', typeof response);
      console.log('📥 Response keys:', response ? Object.keys(response) : 'null');
      
      if (response && response.data) {
        console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
        console.log('📊 Response data type:', typeof response.data);
        console.log('📊 Response data keys:', Object.keys(response.data));
        
        // Convert to snake_case if needed
        const updatedBudget = convertToSnakeCase(response.data);
        console.log('✅ Converted budget data:', JSON.stringify(updatedBudget, null, 2));
        console.log('✅ Budget updated successfully!');
        console.log('🔄 ===== UPDATE BUDGET END =====');
        return updatedBudget;
      }
      
      console.log('❌ Invalid response format - no data found');
      console.log('🔄 ===== UPDATE BUDGET END =====');
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('❌ ===== UPDATE BUDGET ERROR =====');
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('🔄 ===== UPDATE BUDGET END =====');
      throw error;
    }
  }

  // Xoá budget theo id
  async deleteBudget(id: number | string): Promise<void> {
    try {
      await apiService.delete(BUDGET_ENDPOINTS.DELETE(id.toString()));
    } catch (error) {
      console.error('❌ Error deleting budget:', error);
      throw error;
    }
  }
}

export const budgetService = BudgetService.getInstance(); 