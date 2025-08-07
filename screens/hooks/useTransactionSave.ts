import { useNavigation } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { secureApiService } from '../../services/secureApiService';
import { CreateTransactionRequest, transactionService } from '../../services/transactionService';

interface UseTransactionSaveProps {
  isEditMode: boolean;
  activeTab: 'expense' | 'income';
  fromGroupOverview: boolean;
  fromGroupTransactionList: boolean;
  groupContextId?: string;
  groupContextName?: string;
  transactionData?: any;
  refreshTransactions: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

export const useTransactionSave = ({
  isEditMode,
  activeTab,
  fromGroupOverview,
  fromGroupTransactionList,
  groupContextId,
  groupContextName,
  transactionData,
  refreshTransactions,
  onSaveSuccess,
  onSaveError,
}: UseTransactionSaveProps) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  
  // State
  const [isSaving, setIsSaving] = useState(false);
  
  // Prevent multiple concurrent saves
  const isSavingRef = useRef(false);

  // Optimized date formatting for API
  const formatDateForAPI = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Get current time (already in Vietnam timezone)
    const now = new Date();
    
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(2, '0');
    
    // Format: 2025-07-20T08:04:33.11
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  }, []);

  const saveTransaction = useCallback(async (formData: {
    amount: number;
    note: string;
    date: Date;
    selectedCategory: string;
    selectedWallet: number | null;
    selectedImage: string | null;
  }, retryCount = 0) => {
    // Prevent multiple concurrent saves
    if (isSavingRef.current) {
      console.log('⏭️ Save already in progress, skipping...');
      return;
    }

    setIsSaving(true);
    isSavingRef.current = true;
    const maxRetries = 2;

    try {
      console.log(`🔄 Getting user profile for transaction... (attempt ${retryCount + 1})`);
      
      // Get user profile to get real userId - with optimized timeout
      const userProfilePromise = secureApiService.getCurrentUserProfile();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 8000) // Reduced timeout
      );
      
      const userProfile = await Promise.race([userProfilePromise, timeoutPromise]) as any;
      const userId = userProfile.user_id;
      
      console.log('✅ User ID for transaction:', userId);

      const categoryId = parseInt(formData.selectedCategory);

      const transactionRequestData: CreateTransactionRequest = {
        user_id: userId,
        wallet_id: fromGroupOverview ? 0 : formData.selectedWallet!,
        category_id: categoryId,
        group_id: fromGroupOverview && groupContextId ? parseInt(groupContextId) : undefined,
        amount: formData.amount,
        currency_code: 'VND',
        transaction_date: formatDateForAPI(formData.date),
        description: formData.note.trim() || undefined,
        receipt_image_url: formData.selectedImage || null,
        payee_payer_name: undefined,
      };

      console.log(`🔄 Saving transaction... (attempt ${retryCount + 1})`);

      let savePromise: Promise<any>;

      if (isEditMode && transactionData?.id) {
        const transactionId = parseInt(transactionData.id);
        savePromise = transactionService.updateTransaction(transactionId, transactionRequestData);
      } else {
        if (activeTab === 'expense') {
          savePromise = transactionService.createExpense(transactionRequestData);
        } else {
          savePromise = transactionService.createIncome(transactionRequestData);
        }
      }

      // Optimized timeout for save operation
      const saveTimeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 12000)
      );

      await Promise.race([savePromise, saveTimeoutPromise]);

      // Optimistic UI update - trigger refresh asynchronously
      if (refreshTransactions) {
        Promise.resolve().then(() => refreshTransactions());
      }

      console.log('✅ Transaction saved successfully');
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      return {
        success: true,
        isUpdate: isEditMode,
        message: isEditMode ? t('common.transactionUpdated') : t('common.transactionSaved')
      };

    } catch (error: any) {
      console.error(`❌ Error saving transaction (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && 
          (error.message?.includes('timeout') || 
           error.message?.includes('Network') ||
           error.message?.includes('fetch'))) {
        
        console.log(`🔄 Retrying save operation... (${retryCount + 1}/${maxRetries})`);
        
        // Reset saving state temporarily for retry
        setIsSaving(false);
        isSavingRef.current = false;
        
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000 + retryCount * 500));
        
        // Retry the operation
        return saveTransaction(formData, retryCount + 1);
      }
      
      // Handle different types of errors
      let errorMessage = t('common.failedToSaveTransaction');
      
      if (error.message?.includes('timeout') || error.message?.includes('Timeout')) {
        errorMessage = retryCount >= maxRetries ? 
          t('common.requestTimeoutAfterRetry') || t('common.requestTimeout') : 
          t('common.requestTimeout');
      } else if (error.message?.includes('Authentication failed') || 
                 error.message?.includes('Please login again') ||
                 error.message?.includes('User not authenticated')) {
        errorMessage = t('common.pleaseLogin');
      } else if (error.message?.includes('Network')) {
        errorMessage = retryCount >= maxRetries ? 
          t('common.networkErrorAfterRetry') || t('common.networkError') : 
          t('common.networkError');
      }

      if (onSaveError) {
        onSaveError(error);
      }

      return {
        success: false,
        error: errorMessage,
        isAuthError: error.message?.includes('Authentication failed') || 
                     error.message?.includes('Please login again') ||
                     error.message?.includes('User not authenticated'),
        retryCount
      };

    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  }, [
    isEditMode,
    activeTab,
    fromGroupOverview,
    groupContextId,
    transactionData,
    refreshTransactions,
    onSaveSuccess,
    onSaveError,
    formatDateForAPI,
    t
  ]);

  const copyTransaction = useCallback(() => {
    if (!isEditMode || !transactionData) return;
    navigation.navigate('AddExpenseScreen' as never, {
      ...transactionData,
      editMode: false, // chuyển sang chế độ add
    } as never);
  }, [isEditMode, transactionData, navigation]);

  return {
    isSaving,
    saveTransaction,
    copyTransaction,
    formatDateForAPI,
  };
};
