import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { categoryService, CategoryService, CategoryType, LocalCategory } from '../../services/categoryService';
import { secureApiService } from '../../services/secureApiService';
import { WalletResponse, walletService } from '../../services/walletService';

// Cache configuration
const CACHE_DURATION = 30000; // 30 seconds

interface DataCache {
  wallets: WalletResponse[];
  expenseCategories: LocalCategory[];
  incomeCategories: LocalCategory[];
}

interface UseDataLoadingProps {
  fromGroupOverview: boolean;
  groupContextId?: string;
  groupContextName?: string;
  isEditMode: boolean;
  transactionData?: any;
  activeTab: 'expense' | 'income';
  fromGroupTransactionList: boolean;
  setSelectedWallet?: (walletId: number | null) => void;
}

export const useDataLoading = ({
  fromGroupOverview,
  groupContextId,
  groupContextName,
  isEditMode,
  transactionData,
  activeTab,
  fromGroupTransactionList,
  setSelectedWallet,
}: UseDataLoadingProps) => {
  const { t } = useTranslation();
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<LocalCategory[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<LocalCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Cache state
  const [dataCache, setDataCache] = useState<DataCache>({} as DataCache);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  // Prevent multiple concurrent API calls
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    if (!isMountedRef.current) {
      setIsLoading(false);
      return;
    }

    // Prevent multiple concurrent calls
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏭️ Skipping data load - already loading');
      return;
    }

    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < CACHE_DURATION && Object.keys(dataCache).length > 0) {
      console.log('📦 Using cached data, last fetch:', new Date(lastFetchTime));
      setWallets(dataCache.wallets || []);
      setExpenseCategories(dataCache.expenseCategories || []);
      setIncomeCategories(dataCache.incomeCategories || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    isLoadingRef.current = true;
    
    try {
      console.log('🔄 Loading all data in parallel...');
      
      // Load wallets and user profile in parallel
      const [walletsData, userProfile] = await Promise.all([
        walletService.getAllWallets(),
        secureApiService.getCurrentUserProfile()
      ]);
      
      console.log('✅ Wallets loaded:', walletsData.length);
      console.log('✅ User profile loaded:', userProfile);

      // Determine userId and groupId based on context
      let userId, groupId;
      if (fromGroupOverview) {
        userId = 0;
        groupId = groupContextId ? parseInt(groupContextId) : 0;
      } else {
        userId = userProfile.user_id;
        groupId = 0;
      }
      
      console.log('🔄 Loading categories for both tabs');
      console.log('🔍 Context:', {
        fromGroupOverview,
        groupContextId,
        groupContextName,
        isEditMode,
        willUseUserId: userId,
        willUseGroupId: groupId,
        realUserId: userProfile.user_id
      });
      
      // Fetch categories separately for each tab
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, groupId),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, groupId),
      ]);

      console.log('✅ Categories loaded:', {
        expenseCount: expenseCats.length,
        incomeCount: incomeCats.length,
      });

      // Convert to local format và sort theo id tăng dần
      const categoryServiceInstance = CategoryService.getInstance();
      const convertedExpenseCategories = expenseCats
        .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
        .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0));
      
      const convertedIncomeCategories = incomeCats
        .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
        .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0));

      setWallets(walletsData);
      setExpenseCategories(convertedExpenseCategories);
      setIncomeCategories(convertedIncomeCategories);

      // Set default wallet selection if not from group overview
      if (!fromGroupOverview && setSelectedWallet && walletsData.length > 0) {
        const defaultWallet = walletsData.find(w => w.is_default) || walletsData[0];
        setSelectedWallet(defaultWallet.id);
        console.log('✅ Default wallet selected:', defaultWallet.wallet_name);
      }

      // Set default category based on current active tab or edit mode
      if (isEditMode && transactionData?.category) {
        // In edit mode, try to find and select the matching category
        const allCategories = [...expenseCats, ...incomeCats];
        
        let matchingCategory = null;
        if (transactionData.categoryId) {
          matchingCategory = allCategories.find(cat => cat.category_id === transactionData.categoryId);
        }
        
        if (!matchingCategory) {
          matchingCategory = allCategories.find(cat => cat.category_name === transactionData.category);
        }
        
        if (matchingCategory) {
          const categoryKey = categoryServiceInstance.convertToLocalCategory(matchingCategory).key;
          setSelectedCategory(categoryKey);
        } else {
          // Fall back to default category selection
          const categories = activeTab === 'expense' ? expenseCats : incomeCats;
          if (categories.length > 0) {
            const defaultCategoryKey = categoryServiceInstance.convertToLocalCategory(categories[0]).key;
            setSelectedCategory(defaultCategoryKey);
          }
        }
      } else {
        // Normal mode - set default category based on current active tab
        if (activeTab === 'expense' && expenseCats.length > 0) {
          const defaultCategoryKey = categoryServiceInstance.convertToLocalCategory(expenseCats[0]).key;
          setSelectedCategory(defaultCategoryKey);
        } else if (activeTab === 'income' && incomeCats.length > 0) {
          const defaultCategoryKey = categoryServiceInstance.convertToLocalCategory(incomeCats[0]).key;
          setSelectedCategory(defaultCategoryKey);
        }
      }

      // Update cache
      setDataCache({
        wallets: walletsData,
        expenseCategories: convertedExpenseCategories,
        incomeCategories: convertedIncomeCategories
      });
      setLastFetchTime(now);

      console.log('✅ All data loaded successfully');
      setHasInitiallyLoaded(true);

    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Handle authentication errors specifically
      if (error.message?.includes('Authentication failed') || 
          error.message?.includes('Please login again') ||
          error.message?.includes('User not authenticated')) {
        Alert.alert(t('common.error'), t('common.pleaseLogin'));
      } else {
        Alert.alert(t('common.error'), t('common.failedToLoadData'));
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [
    fromGroupOverview, 
    groupContextId, 
    groupContextName, 
    isEditMode, 
    transactionData, 
    activeTab, 
    fromGroupTransactionList, 
    lastFetchTime, 
    dataCache, 
    t,
    setSelectedWallet
  ]);

  const refreshCategories = useCallback(async () => {
    try {
      console.log('🔄 Refreshing categories only...');
      
      const userProfile = await secureApiService.getCurrentUserProfile();
      
      let userId, groupId;
      if (fromGroupOverview) {
        userId = 0;
        groupId = groupContextId ? parseInt(groupContextId) : 0;
      } else {
        userId = userProfile.user_id;
        groupId = 0;
      }
      
      const [expenseCats, incomeCats] = await Promise.all([
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.EXPENSE, groupId),
        categoryService.getAllCategoriesByTypeAndUser(CategoryType.INCOME, groupId),
      ]);

      const categoryServiceInstance = CategoryService.getInstance();
      setExpenseCategories(
        expenseCats
          .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
          .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0))
      );
      setIncomeCategories(
        incomeCats
          .map(cat => categoryServiceInstance.convertToLocalCategory(cat))
          .sort((a, b) => (a.category_id ?? 0) - (b.category_id ?? 0))
      );

      // Update selected category if current one is invalid
      const currentCategories = activeTab === 'expense' ? expenseCats : incomeCats;
      const isCurrentCategoryValid = currentCategories.some(cat => cat.category_id.toString() === selectedCategory);
      
      if (!isCurrentCategoryValid && currentCategories.length > 0) {
        const newCategoryId = currentCategories[0].category_id.toString();
        setSelectedCategory(newCategoryId);
      }

      console.log('✅ Categories refreshed successfully');

    } catch (error: any) {
      console.error('❌ Error refreshing categories:', error);
    }
  }, [fromGroupOverview, groupContextId, activeTab, selectedCategory]);

  const refreshData = useCallback(async () => {
    try {
      console.log('🔄 Refreshing categories and wallets...');
      
      const [walletsData] = await Promise.all([
        walletService.getAllWallets(),
        refreshCategories(),
      ]);
      
      setWallets(walletsData);

      // Set default wallet if not from group overview and no wallet currently selected
      if (!fromGroupOverview && setSelectedWallet && walletsData.length > 0) {
        const defaultWallet = walletsData.find(w => w.is_default) || walletsData[0];
        setSelectedWallet(defaultWallet.id);
        console.log('🔄 Updated selected wallet after refresh:', defaultWallet.wallet_name);
      }

      console.log('✅ Data refreshed successfully');

    } catch (error: any) {
      console.error('❌ Error refreshing data:', error);
    }
  }, [refreshCategories, fromGroupOverview, setSelectedWallet]);

  const cleanup = useCallback(() => {
    isMountedRef.current = false;
  }, []);

  return {
    // State
    isLoading,
    hasInitiallyLoaded,
    wallets,
    expenseCategories,
    incomeCategories,
    selectedCategory,
    setSelectedCategory,
    setWallets,
    setExpenseCategories,
    setIncomeCategories,
    
    // Methods
    loadData,
    refreshCategories,
    refreshData,
    cleanup,
    
    // Cache info
    lastFetchTime,
    cacheValid: Date.now() - lastFetchTime < CACHE_DURATION,
  };
};
