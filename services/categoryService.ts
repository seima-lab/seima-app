import { apiService } from './apiService';

// Enums
export enum CategoryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

// Interfaces for API requests and responses (snake_case format)
export interface CategoryResponse {
  category_id: number;
  user_id: number;
  group_id: number;
  category_name: string;
  category_type: CategoryType;
  category_icon_url: string;
  parent_category_id: number | null;
  is_system_defined: boolean;
}

export interface CreateCategoryRequest {
  user_id: number;
  group_id: number;
  category_name: string;
  category_type: CategoryType;
  category_icon_url: string;
  parent_category_id?: number;
  is_system_defined?: boolean;
}

export interface UpdateCategoryRequest {
  user_id?: number;
  group_id?: number;
  category_name?: string;
  category_type?: CategoryType;
  category_icon_url?: string;
  parent_category_id?: number;
  is_system_defined?: boolean;
}

// Local category interface for UI (with icon mapping)
export interface LocalCategory {
  key: string;
  label: string;
  icon: string;
  color: string;
  category_id?: number;
  is_system_defined?: boolean;
}

// Icon mapping từ key (backend trả về) sang local MaterialCommunityIcons
const ICON_MAPPING: { [key: string]: string } = {
  // Food & Dining - Expense Categories
  'food': 'silverware-fork-knife',
  'restaurant': 'silverware-fork-knife',
  'coffee': 'coffee',
  'fast-food': 'hamburger',
  'dining': 'silverware-fork-knife',
  
  // Daily & Shopping - Expense Categories  
  'daily': 'bottle-soda',
  'shopping': 'shopping',
  'grocery': 'cart',
  'market': 'store',
  
  // Clothing & Fashion - Expense Categories
  'clothes': 'tshirt-crew',
  'clothing': 'tshirt-crew',
  'fashion': 'tshirt-crew',
  'shoes': 'shoe-heel',
  
  // Beauty & Cosmetic - Expense Categories
  'cosmetic': 'lipstick',
  'beauty': 'lipstick',
  'makeup': 'lipstick',
  'skincare': 'face-woman',
  
  // Entertainment & Social - Expense Categories
  'social': 'glass-cocktail',
  'entertainment': 'gamepad-variant',
  'movie': 'movie',
  'music': 'music',
  'party': 'party-popper',
  'gaming': 'gamepad-variant',
  
  // Health & Medical - Expense Categories
  'health': 'pill',
  'medical': 'hospital-box',
  'hospital': 'hospital-box',
  'pharmacy': 'pharmacy',
  'fitness': 'dumbbell',
  'doctor': 'doctor',
  
  // Education & Learning - Expense Categories
  'education': 'book-open-variant',
  'school': 'school',
  'study': 'book-open-variant',
  'course': 'book-open-variant',
  'training': 'book-open-variant',
  
  // Work & Office - Mixed Categories
  'work': 'briefcase',
  'office': 'office-building',
  'meeting': 'account-group',
  
  // Utilities - Expense Categories
  'electric': 'flash',
  'electricity': 'flash',
  'water': 'water',
  'internet': 'wifi',
  'gas': 'fire',
  'utility': 'home-lightning-bolt',
  
  // Transportation - Expense Categories
  'transport': 'train',
  'transportation': 'train',
  'car': 'car',
  'bus': 'bus',
  'taxi': 'taxi',
  'fuel': 'gas-station',
  'petrol': 'gas-station',
  'parking': 'parking',
  
  // Communication - Expense Categories
  'phone': 'cellphone',
  'mobile': 'cellphone',
  'internet_bill': 'wifi',
  'communication': 'cellphone',
  
  // Housing - Expense Categories
  'rent': 'home-city',
  'house': 'home',
  'apartment': 'apartment',
  'home': 'home',
  'housing': 'home-city',
  
  // Income Categories
  'salary': 'cash',
  'wage': 'cash',
  'income': 'cash-plus',
  'bonus': 'gift',
  'reward': 'gift',
  'investment': 'chart-line',
  'stock': 'chart-line',
  'freelance': 'laptop',
  'freelancing': 'laptop',
  'business': 'store',
  'company': 'office-building',
  'rental': 'home-account',
  'rent_income': 'home-account',
  'dividend': 'bank',
  'interest': 'percent',
  'bank_interest': 'percent',
  'gift_money': 'hand-heart',
  'gift': 'hand-heart',
  'selling': 'cart',
  'sales': 'cart',
  'commission': 'percent',
  
  // Additional common categories
  'other': 'dots-horizontal',
  'miscellaneous': 'dots-horizontal',
  'transfer': 'bank-transfer',
  'loan': 'bank',
  'debt': 'credit-card-off',
  'saving': 'piggy-bank',
  'insurance': 'shield-account',
  'subscription': 'credit-card-multiple',
  'maintenance': 'tools',
  'repair': 'wrench',
  'pet': 'dog',
  'child': 'baby',
  'baby': 'baby',
  'book': 'book-open-page-variant',
  'travel': 'airplane',
  'vacation': 'beach',
  'holiday': 'calendar-heart',
  'gym': 'dumbbell',
  'sport': 'soccer',
  'hobby': 'palette',
  'charity': 'heart',
  'donation': 'hand-heart',
  'tax': 'file-document',
  'fine': 'alert-circle',
  'withdrawal': 'cash-minus',
  'deposit': 'cash-plus',
  
  // Default fallback
  'default_expense': 'cash-minus',
  'default_income': 'cash-plus',

  // Direct icon name mappings (when icon is saved directly as icon name)
  'briefcase': 'briefcase',
  
  // Handle invalid/legacy icon names
  'go_out': 'exit-to-app', // Map invalid go_out to valid exit-to-app
  'bug-report': 'bug', // Map invalid bug-report to valid bug
};

// Color mapping cho từng category key (backend trả về)
export const COLOR_MAPPING: { [key: string]: string } = {
  // Food & Dining - Orange tones
  'food': '#ff9500',
  'restaurant': '#ff9500',
  'coffee': '#8b4513',
  'fast-food': '#ff6b35',
  'dining': '#ff9500',
  
  // Daily & Shopping - Green tones
  'daily': '#32d74b',
  'shopping': '#32d74b',
  'grocery': '#228b22',
  'market': '#32d74b',
  
  // Clothing & Fashion - Blue tones
  'clothes': '#007aff',
  'clothing': '#007aff',
  'fashion': '#4169e1',
  'shoes': '#1e90ff',
  
  // Beauty & Cosmetic - Pink/Purple tones
  'cosmetic': '#ff2d92',
  'beauty': '#ff2d92',
  'makeup': '#ff69b4',
  'skincare': '#dda0dd',
  
  // Entertainment & Social - Yellow/Gold tones
  'social': '#ffcc02',
  'entertainment': '#ffcc02',
  'movie': '#ffd700',
  'music': '#ffa500',
  'party': '#ffcc02',
  'gaming': '#ff8c00',
  
  // Health & Medical - Green medical tones
  'health': '#30d158',
  'medical': '#30d158',
  'hospital': '#228b22',
  'pharmacy': '#32cd32',
  'fitness': '#00ff7f',
  'doctor': '#30d158',
  
  // Education & Learning - Red tones
  'education': '#ff375f',
  'school': '#ff375f',
  'study': '#dc143c',
  'course': '#ff375f',
  'training': '#b22222',
  
  // Work & Office - Gray/Professional tones
  'work': '#708090',
  'office': '#708090',
  'meeting': '#696969',
  
  // Utilities - Cyan/Teal tones
  'electric': '#00c7be',
  'electricity': '#00c7be',
  'water': '#00bfff',
  'internet': '#20b2aa',
  'gas': '#ff4500',
  'utility': '#00c7be',
  
  // Transportation - Purple tones
  'transport': '#bf5af2',
  'transportation': '#bf5af2',
  'car': '#9370db',
  'bus': '#8a2be2',
  'taxi': '#dda0dd',
  'fuel': '#ff4500',
  'petrol': '#ff4500',
  'parking': '#bf5af2',
  
  // Communication - Light Blue tones
  'phone': '#6ac4dc',
  'mobile': '#6ac4dc',
  'internet_bill': '#87ceeb',
  'communication': '#6ac4dc',
  
  // Housing - Orange/Brown tones
  'rent': '#ff9500',
  'house': '#cd853f',
  'apartment': '#daa520',
  'home': '#ff9500',
  'housing': '#ff9500',
  
  // Income Categories - Green money tones
  'salary': '#32d74b',
  'wage': '#32d74b',
  'income': '#00ff00',
  'bonus': '#ff9500',
  'reward': '#ffd700',
  'investment': '#007aff',
  'stock': '#4169e1',
  'freelance': '#ff375f',
  'freelancing': '#ff375f',
  'business': '#30d158',
  'company': '#708090',
  'rental': '#ffcc02',
  'rent_income': '#ffcc02',
  'dividend': '#ff2d92',
  'interest': '#00c7be',
  'bank_interest': '#00c7be',
  'gift_money': '#bf5af2',
  'gift': '#bf5af2',
  'selling': '#6ac4dc',
  'sales': '#6ac4dc',
  'commission': '#32d74b',
  
  // Additional common categories
  'other': '#999999',
  'miscellaneous': '#999999',
  'transfer': '#708090',
  'loan': '#ff6347',
  'debt': '#dc143c',
  'saving': '#32d74b',
  'insurance': '#4682b4',
  'subscription': '#bf5af2',
  'maintenance': '#ff9500',
  'repair': '#ff375f',
  'pet': '#ffcc02',
  'child': '#ff2d92',
  'baby': '#ff2d92',
  'book': '#30d158',
  'travel': '#007aff',
  'vacation': '#00c7be',
  'holiday': '#ff2d92',
  'gym': '#ff375f',
  'sport': '#32d74b',
  'hobby': '#bf5af2',
  'charity': '#ff2d92',
  'donation': '#ff2d92',
  'tax': '#8e8e93',
  'fine': '#ff375f',
  'withdrawal': '#ff375f',
  'deposit': '#32d74b',
  
  // Default fallback colors
  'default_expense': '#ff375f',
  'default_income': '#32d74b',
  
};

// API response structure
interface ApiResponseData<T = any> {
  status_code?: number;
  statusCode?: number;
  message?: string;
  data?: T;
}

export class CategoryService {
  private static instance: CategoryService;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // Get system default categories by type
  async getSystemCategoriesByType(categoryType: CategoryType): Promise<CategoryResponse[]> {
    try {
      console.log('🔄 Fetching system categories:', { categoryType });
      
             // Map CategoryType to integer values for backend
       const categoryTypeValue = categoryType === CategoryType.EXPENSE ? 1 : 2;
       
       console.log('🔄 Trying system categories with categoryType:', categoryTypeValue);
       
       const response = await apiService.get<ApiResponseData<CategoryResponse[]>>(
         `${CATEGORY_ENDPOINTS.LIST}/system?categoryType=${categoryTypeValue}`
       );
      
      console.log('📊 System categories response:', response);
      
      // Handle different response structures
      let categories: CategoryResponse[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else if (response && Array.isArray(response)) {
        categories = response;
      }
      
      console.log('📊 System categories count:', categories.length);
      return categories;
    } catch (error) {
      console.error('❌ Error fetching system categories:', error);
      console.log('⚠️ System categories endpoint may not exist, will fallback to main API');
      return [];
    }
  }

  // Get all categories by type and user
  async getAllCategoriesByTypeAndUser(
    categoryType: CategoryType,
    userId: number,
    groupId: number
  ): Promise<CategoryResponse[]> {
    try {
      console.log('🔄 Fetching categories:', { categoryType, userId, groupId });
      
            // Map CategoryType to integer values for backend (INCOME=0, EXPENSE=1)
      const categoryTypeValue = categoryType === CategoryType.EXPENSE ? 1 : 0;
      
      console.log('🔄 Fetching categories with params:', {
        categoryType: categoryTypeValue,
        categoryTypeString: categoryType,
        userId,
        groupId,
        expectedResponse: categoryType === CategoryType.INCOME ? 'Should get income categories' : 'Should get expense categories',
        fullUrl: `/api/v1/categories?categoryType=${categoryTypeValue}&userId=${userId}&groupId=${groupId}`
      });
      
      const response = await apiService.get<ApiResponseData<CategoryResponse[]>>(
        `${CATEGORY_ENDPOINTS.LIST}?categoryType=${categoryTypeValue}&userId=${userId}&groupId=${groupId}`
      );
      
      console.log('📊 Categories response for', categoryType, ':', response);
      console.log('📊 Response data type:', typeof response.data);
      console.log('📊 Response data length:', Array.isArray(response.data) ? response.data.length : 'Not array');
      console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
      
      // Handle different response structures
      let categories: CategoryResponse[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else if (response && Array.isArray(response)) {
        categories = response;
      }
      
            console.log('📊 Extracted categories count:', categories.length);
      console.log('📊 Categories:', categories);
      
      // Debug: Log each category details to understand the data structure
      if (categories.length > 0) {
        console.log('📊 Category details:');
        categories.forEach((cat, index) => {
          console.log(`  [${index}] ID: ${cat.category_id}, Name: ${cat.category_name}, Type: ${cat.category_type}, Icon: ${cat.category_icon_url}`);
        });
      }
      
      // Return real API categories (with proper DB IDs)
      return categories;
      
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      
      // Only use fallback if there's a network/API error, not when API returns empty array
      console.log(`🔧 API error, using fallback categories for ${categoryType}`);
      const defaultCategories = this.getDefaultCategories(categoryType);
      
      // Use negative IDs for fallback to avoid conflicts with real DB IDs
      const baseId = categoryType === CategoryType.INCOME ? -1000 : -2000;
      return defaultCategories.map((defaultCat, index) => ({
        category_id: baseId - index, // Negative IDs: -1000, -1001, -2000, -2001
          user_id: userId,
          group_id: groupId,
          category_name: defaultCat.label,
        category_type: categoryType,
          category_icon_url: defaultCat.key,
          parent_category_id: null,
          is_system_defined: true
        }));
      }
  }

  // Get all categories for a user (both income and expense)
  async getAllCategoriesForUser(
    userId: number,
    groupId: number | null
  ): Promise<CategoryResponse[]> {
    try {
      console.log('🔄 Fetching ALL categories for user:', { userId, groupId });
      
      // Pass null for categoryType to fetch all types.
      const endpoint = `${CATEGORY_ENDPOINTS.LIST}?categoryType=null&userId=${userId}&groupId=${groupId}`;
      console.log('🚀 Calling endpoint:', endpoint);

      const response = await apiService.get<ApiResponseData<CategoryResponse[]>>(endpoint);
      
      console.log('📊 All Categories response:', response);
      
      // Handle different response structures
      let categories: CategoryResponse[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        categories = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        categories = response.data.data;
      } else if (response && Array.isArray(response)) {
        categories = response;
      }
      
      console.log('📊 Extracted ALL categories count:', categories.length);
      return categories;
    } catch (error) {
      console.error('❌ Error fetching all categories:', error);
      // If this fails, we can't really fall back, so we throw
      throw new Error('Failed to fetch categories. Please try again.');
    }
  }

  // Get category by ID
  async getCategoryById(categoryId: number): Promise<CategoryResponse> {
    try {
      console.log('🔄 Fetching category by ID:', categoryId);
      
      const response = await apiService.get<ApiResponseData<CategoryResponse>>(
        CATEGORY_ENDPOINTS.GET_BY_ID(categoryId.toString())
      );
      
      console.log('📊 Category response:', response);
      
      if (response.data) {
        const data = response.data as any;
        return data.data || data;
      }
      
      throw new Error('Category not found');
    } catch (error) {
      console.error('❌ Error fetching category:', error);
      throw error;
    }
  }

  // Create new category
  async createCategory(request: CreateCategoryRequest): Promise<CategoryResponse> {
    try {
      console.log('🔄 Creating category:', request);
      
      const response = await apiService.post<ApiResponseData<CategoryResponse>>(
        CATEGORY_ENDPOINTS.CREATE,
        request
      );
      
      console.log('📊 Create category response:', response);
      
      if (response.data) {
        const data = response.data as any;
        return data.data || data;
      }
      
      throw new Error('Failed to create category');
    } catch (error) {
      console.error('❌ Error creating category:', error);
      throw error;
    }
  }

  // Update category - Use CreateCategoryRequest format as per backend API
  async updateCategory(categoryId: number, request: CreateCategoryRequest): Promise<CategoryResponse> {
    try {
      console.log('🔄 Updating category:', { categoryId, request });
      
      const response = await apiService.put<ApiResponseData<CategoryResponse>>(
        `${CATEGORY_ENDPOINTS.UPDATE(categoryId.toString())}`,
        request
      );
      
      console.log('📊 Update category response:', response);
      
      if (response.data) {
        const data = response.data as any;
        return data.data || data;
      }
      
      throw new Error('Failed to update category');
    } catch (error) {
      console.error('❌ Error updating category:', error);
      throw error;
    }
  }

  // Delete category
  async deleteCategory(categoryId: number): Promise<void> {
    try {
      console.log('🔄 Deleting category:', categoryId);
      
      const response = await apiService.delete<ApiResponseData>(
        CATEGORY_ENDPOINTS.DELETE(categoryId.toString())
      );
      
      console.log('📊 Delete category response:', response);
      
      const responseData = response as any;
      if (responseData.status_code !== 200 && responseData.statusCode !== 200) {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      throw error;
    }
  }

  // Convert API response to local category format for UI
  convertToLocalCategory(apiCategory: CategoryResponse): LocalCategory {
    // List of known valid MaterialCommunityIcons (partial list of most common ones)
    const validIcons = [
      'cash', 'cash-plus', 'cash-minus', 'credit-card', 'bank', 'wallet',
      'silverware-fork-knife', 'coffee', 'hamburger', 'food-apple', 'cake',
      'bottle-soda', 'shopping', 'cart', 'store', 'minus-circle',
      'tshirt-crew', 'shoe-heel', 'hanger', 'tshirt-v',
      'lipstick', 'face-woman', 'spray',
      'glass-cocktail', 'gamepad-variant', 'movie', 'music', 'party-popper',
      'pill', 'hospital-box', 'dumbbell', 'doctor', 'stethoscope',
      'book-open-variant', 'school', 'book-open-page-variant', 'graduation-cap',
      'briefcase', 'office-building', 'laptop',
      'flash', 'water', 'wifi', 'fire', 'home-lightning-bolt',
      'train', 'car', 'bus', 'taxi', 'gas-station', 'airplane',
      'cellphone', 'phone',
      'home-city', 'home', 'apartment', 'home-outline', 'key',
      'gift', 'hand-heart', 'star', 'trophy',
      'chart-line', 'piggy-bank', 'bank-transfer', 'percent',
      'dots-horizontal', 'shield-account', 'tools', 'wrench',
      'exit-to-app', 'arrow-left', 'close', 'pencil'
    ];
    
    let finalIcon = 'cash-minus'; // default fallback
    
    // Use category_icon_url if it exists and is valid
    if (apiCategory.category_icon_url && apiCategory.category_icon_url.trim()) {
      const iconName = apiCategory.category_icon_url.trim();
      
      // Check if it's a valid icon
      if (validIcons.includes(iconName)) {
        finalIcon = iconName;
      } else {
        // Log invalid icon for debugging
        console.warn('⚠️ Invalid icon name from database:', iconName, 'for category:', apiCategory.category_name);
        // Use mapping or fallback
        finalIcon = ICON_MAPPING[iconName] || (apiCategory.category_type === CategoryType.EXPENSE ? 'cash-minus' : 'cash-plus');
      }
    } else {
      // Fallback to default icons based on category type
      finalIcon = apiCategory.category_type === CategoryType.EXPENSE ? 'cash-minus' : 'cash-plus';
    }
    
    console.log('🔄 Converting category (validated mapping):', {
      category_name: apiCategory.category_name,
      category_icon_url: apiCategory.category_icon_url,
      category_type: apiCategory.category_type,
      final_icon: finalIcon,
      is_valid: validIcons.includes(finalIcon),
      note: 'Color will be determined by iconUtils.getIconColor()'
    });
    
    return {
      key: apiCategory.category_id.toString(),
      label: apiCategory.category_name,
      icon: finalIcon,
      color: '', // Don't set color here, let iconUtils handle it
      category_id: apiCategory.category_id,
      is_system_defined: apiCategory.is_system_defined,
    };
  }

  // Convert local category to API format
  convertToApiCategory(
    localCategory: Partial<LocalCategory>,
    userId: number,
    groupId: number,
    categoryType: CategoryType
  ): CreateCategoryRequest {
    return {
      user_id: userId,
      group_id: groupId,
      category_name: localCategory.label || '',
      category_type: categoryType,
      category_icon_url: localCategory.icon || '',
      is_system_defined: false,
    };
  }

  // Get default categories for specific type (fallback when API fails)
  getDefaultCategories(categoryType: CategoryType): LocalCategory[] {
    if (categoryType === CategoryType.EXPENSE) {
      return [
        { key: 'food', label: 'Food & Dining', icon: 'silverware-fork-knife', color: '#ff9500' },
        { key: 'daily', label: 'Daily Needs', icon: 'bottle-soda', color: '#32d74b' },
        { key: 'clothes', label: 'Clothing', icon: 'tshirt-crew', color: '#007aff' },
        { key: 'cosmetic', label: 'Beauty & Care', icon: 'lipstick', color: '#ff2d92' },
        { key: 'social', label: 'Entertainment', icon: 'glass-cocktail', color: '#ffcc02' },
        { key: 'health', label: 'Health', icon: 'pill', color: '#30d158' },
        { key: 'education', label: 'Education', icon: 'book-open-variant', color: '#ff375f' },
        { key: 'electric', label: 'Utilities', icon: 'flash', color: '#00c7be' },
        { key: 'transport', label: 'Transportation', icon: 'train', color: '#bf5af2' },
        { key: 'phone', label: 'Communication', icon: 'cellphone', color: '#6ac4dc' },
        { key: 'rent', label: 'Housing', icon: 'home-city', color: '#ff9500' },
      ];
    } else {
      return [
        { key: 'salary', label: 'Salary', icon: 'cash', color: '#32d74b' },
        { key: 'bonus', label: 'Bonus', icon: 'gift', color: '#ff9500' },
        { key: 'investment', label: 'Investment', icon: 'chart-line', color: '#007aff' },
        { key: 'freelance', label: 'Freelance', icon: 'laptop', color: '#ff375f' },
        { key: 'business', label: 'Business', icon: 'store', color: '#30d158' },
        { key: 'rental', label: 'Rental Income', icon: 'home-account', color: '#ffcc02' },
        { key: 'dividend', label: 'Dividend', icon: 'bank', color: '#ff2d92' },
        { key: 'interest', label: 'Interest', icon: 'percent', color: '#00c7be' },
        { key: 'gift_money', label: 'Gift Money', icon: 'hand-heart', color: '#bf5af2' },
        { key: 'selling', label: 'Selling', icon: 'cart', color: '#6ac4dc' },
      ];
    }
  }
}

// Export singleton instance
export const categoryService = CategoryService.getInstance();

