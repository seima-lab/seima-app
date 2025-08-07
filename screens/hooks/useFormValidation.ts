import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface UseFormValidationProps {
  amount: string;
  note: string;
  selectedCategory: string;
  selectedWallet: number | null;
  fromGroupOverview: boolean;
  getNumericAmount: (formattedText: string) => number;
}

interface ValidationError {
  title: string;
  message: string;
}

export const useFormValidation = ({
  amount,
  note,
  selectedCategory,
  selectedWallet,
  fromGroupOverview,
  getNumericAmount,
}: UseFormValidationProps) => {
  const { t } = useTranslation();

  const validateForm = useCallback((): { isValid: boolean; error?: ValidationError } => {
    // Check amount
    if (!amount.trim()) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseEnterAmount'),
        },
      };
    }
    
    const amountValue = getNumericAmount(amount);
    if (amountValue <= 0) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseEnterValidAmount'),
        },
      };
    }
    
    // Check if amount exceeds 15 digits
    const digitsOnly = amount.replace(/[^\d]/g, '');
    if (digitsOnly.length > 15) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.amountExceed15Digits'),
        },
      };
    }
    
    // Check if amount is too large for JavaScript number precision
    if (amountValue > Number.MAX_SAFE_INTEGER) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.amountTooLarge'),
        },
      };
    }
    
    // Validate note (optional but with constraints if provided)
    if (note.trim().length > 500) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.noteExceed500Chars'),
        },
      };
    }
    
    // Check for potentially malicious content in note
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(note))) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.noteInvalidChars'),
        },
      };
    }
    
    // Check category selection
    if (!selectedCategory) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseSelectCategory'),
        },
      };
    }
    
    // Only validate wallet selection if not from group overview
    if (!fromGroupOverview && !selectedWallet) {
      return {
        isValid: false,
        error: {
          title: t('common.error'),
          message: t('common.pleaseSelectWallet'),
        },
      };
    }
    
    return { isValid: true };
  }, [amount, note, selectedCategory, selectedWallet, fromGroupOverview, getNumericAmount, t]);

  const formatAmountInput = useCallback((text: string): string => {
    // Remove all non-numeric characters
    const numericValue = text.replace(/[^\d]/g, '');
    
    if (numericValue === '') return '';
    
    // Limit to maximum 15 digits
    const limitedNumericValue = numericValue.slice(0, 15);
    
    // Convert to number and format with commas
    const number = parseInt(limitedNumericValue, 10);
    return number.toLocaleString('vi-VN');
  }, []);

  const getNumericAmountFromInput = useCallback((formattedText: string): number => {
    const numericValue = formattedText.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  }, []);

  const formatAmountFromNumber = useCallback((value: number): string => {
    if (value <= 0) return '';
    return value.toLocaleString('vi-VN');
  }, []);

  return {
    validateForm,
    formatAmountInput,
    getNumericAmountFromInput: getNumericAmountFromInput,
    formatAmountFromNumber,
  };
};
