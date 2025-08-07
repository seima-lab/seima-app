import { useCallback, useState } from 'react';

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
}

interface ToastState {
  visible: boolean;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
}

export const useModalStates = () => {
  // Error modal state
  const [errorModal, setErrorModal] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
  });

  // Success modal state
  const [successModal, setSuccessModal] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
  });

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'error',
  });

  // Other UI modals
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false);

  // Error modal methods
  const showErrorModal = useCallback((title: string, message: string, onConfirm?: () => void) => {
    setErrorModal({
      visible: true,
      title,
      message,
      onConfirm,
    });
  }, []);

  const hideErrorModal = useCallback(() => {
    const { onConfirm } = errorModal;
    setErrorModal({
      visible: false,
      title: '',
      message: '',
    });
    if (onConfirm) {
      onConfirm();
    }
  }, [errorModal]);

  // Success modal methods
  const showSuccessModal = useCallback((title: string, message: string, onConfirm?: () => void) => {
    setSuccessModal({
      visible: true,
      title,
      message,
      onConfirm,
    });
  }, []);

  const hideSuccessModal = useCallback(() => {
    const { onConfirm } = successModal;
    setSuccessModal({
      visible: false,
      title: '',
      message: '',
    });
    if (onConfirm) {
      onConfirm();
    }
  }, [successModal]);

  // Toast methods
  const showToast = useCallback((message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToast({
      visible: true,
      message,
      type,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  // Wallet picker methods
  const openWalletPicker = useCallback(() => {
    setShowWalletPicker(true);
  }, []);

  const closeWalletPicker = useCallback(() => {
    setShowWalletPicker(false);
  }, []);

  // Create wallet modal methods
  const openCreateWalletModal = useCallback(() => {
    setShowCreateWalletModal(true);
  }, []);

  const closeCreateWalletModal = useCallback(() => {
    setShowCreateWalletModal(false);
  }, []);

  // Date picker methods
  const openDatePicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const closeDatePicker = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  return {
    // Error modal
    errorModal,
    showErrorModal,
    hideErrorModal,

    // Success modal
    successModal,
    showSuccessModal,
    hideSuccessModal,

    // Toast
    toast,
    showToast,
    hideToast,

    // UI modals
    showDatePicker,
    openDatePicker,
    closeDatePicker,

    showWalletPicker,
    openWalletPicker,
    closeWalletPicker,

    showCreateWalletModal,
    openCreateWalletModal,
    closeCreateWalletModal,
  };
};
