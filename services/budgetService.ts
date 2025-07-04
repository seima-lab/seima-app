import { apiService } from './apiService';
import { BUDGET_ENDPOINTS } from './config';

// API Response structure (camelCase from backend)
export interface BudgetResponseDto {
  budgetId: number;
  budgetName: string;
  startDate: string; // "yyyy-MM-dd HH:mm:ss"
  endDate: string; // "yyyy-MM-dd HH:mm:ss"
  periodType: string;
  overallAmountLimit: number;
  budgetRemainingAmount: number;
  createdAt: string; // "yyyy-MM-dd HH:mm:ss"
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
  category_list: Category[];
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
  };
};

// Convert snake_case to camelCase for API request
const convertToCamelCase = (request: CreateBudgetRequest): any => {
  return {
    userId: request.user_id,
    budgetName: request.budget_name,
    startDate: request.start_date,
    endDate: request.end_date,
    periodType: request.period_type,
    overallAmountLimit: request.overall_amount_limit,
    budgetRemainingAmount: request.budget_remaining_amount,
    categoryList: request.category_list,
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
  async getBudgetDetail(id: number | string): Promise<any> {
    try {
      const response = await apiService.get<any>(`${BUDGET_ENDPOINTS.GET_BY_ID(id.toString())}`);
      if (response && response.data) {
        return response.data;
      }
      throw new Error('No data found');
    } catch (error) {
      console.error('❌ Error fetching budget detail:', error);
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