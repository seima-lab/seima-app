import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTokenExpiry } from '../hooks/useTokenExpiry';
import CustomSuccessModal from './CustomSuccessModal';
import TokenExpiryModal from './UserPresenceModal';

interface TokenExpiryProviderProps {
  children: React.ReactNode;
}

const TokenExpiryProvider: React.FC<TokenExpiryProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const {
    showTokenExpiryModal,
    tokenExpiryRemainingTime,
    handleTokenExpiryRefresh,
    handleTokenExpiryLogout,
    // ✅ Lấy state và handler cho modal thành công
    showSuccessModal,
    handleSuccessModalClose,
  } = useTokenExpiry();

  return (
    <>
      {children}
      
      <TokenExpiryModal
        visible={showTokenExpiryModal}
        remainingTime={tokenExpiryRemainingTime}
        onRefresh={handleTokenExpiryRefresh}
        onLogout={handleTokenExpiryLogout}
      />
      
      {/* ✅ CustomSuccessModal để hiển thị khi gia hạn token thành công */}
      <CustomSuccessModal
        visible={showSuccessModal}
        title={t('tokenExpiryModal.successTitle')}
        message={t('tokenExpiryModal.successMessage')}
        buttonText={t('tokenExpiryModal.successButton')}
        onConfirm={handleSuccessModalClose}
        iconName="check-circle"
        transitionKey="token-refresh-success"
      />
    </>
  );
};

export default TokenExpiryProvider; 