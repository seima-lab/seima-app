import React from 'react';
import { useTokenExpiry } from '../hooks/useTokenExpiry';
import TokenExpiryModal from './UserPresenceModal';

interface TokenExpiryProviderProps {
  children: React.ReactNode;
}

const TokenExpiryProvider: React.FC<TokenExpiryProviderProps> = ({ children }) => {
  const {
    showTokenExpiryModal,
    tokenExpiryRemainingTime,
    handleTokenExpiryRefresh,
    handleTokenExpiryLogout,
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
    </>
  );
};

export default TokenExpiryProvider; 