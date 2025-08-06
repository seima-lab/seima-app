import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomErrorModal from '../components/CustomErrorModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import { typography } from '../constants/typography';
import { useNavigationService } from '../navigation/NavigationService';
import { CreateWalletRequest, walletService } from '../services/walletService';

interface Props {
  route?: {
    params?: {
      editMode?: boolean;
      walletId?: number;
      walletData?: any;
    };
  };
}

// Hàm format số tiền với dấu chấm ngăn cách hàng nghìn
const formatBalanceInput = (text: string): string => {
  const numericValue = text.replace(/[^\d]/g, '');
  if (numericValue === '') return '';
  // Không thể truy cập biến balance ở đây, nên chỉ trả về chuỗi hiện tại nếu vượt quá 15 số
  if (numericValue.length > 15) {
    return text;
  }
  const number = parseInt(numericValue, 10);
  return number.toLocaleString('en-US').replace(/,/g, '.');
};

const AddWalletScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  const editMode = route?.params?.editMode || false;
  const walletId = route?.params?.walletId;
  const walletData = route?.params?.walletData;

  const [balance, setBalance] = useState(
    walletData?.balance ? formatBalanceInput(walletData.balance.toString()) : ''
  );
  const [walletName, setWalletName] = useState(walletData?.name || '');
  const [walletType, setWalletType] = useState(walletData?.type || t('wallet.walletTypes.cash'));
  const [bankName, setBankName] = useState(walletData?.bankName || '');
  const [isDefault, setIsDefault] = useState(walletData?.isDefault || false);
  const [excludeFromTotal, setExcludeFromTotal] = useState(walletData?.excludeFromTotal || false);
  const [showWalletTypes, setShowWalletTypes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Add keyboard event listeners for debugging
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        console.log('⌨️ Keyboard DID SHOW - Success!');
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        console.log('⌨️ Keyboard DID HIDE');
      }
    );
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        console.log('⌨️ Keyboard WILL SHOW');
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        console.log('⌨️ Keyboard WILL HIDE');
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const walletTypes = [
    t('wallet.walletTypes.cash'),
    t('wallet.walletTypes.bank')
  ];

  // Map wallet type to walletTypeId
  const getWalletTypeId = (type: string): number => {
    if (type === t('wallet.walletTypes.bank')) {
      return 2;
    }
    return 1; // cash
  };

  const handleWalletTypeSelect = (type: string) => {
    setWalletType(type);
    setShowWalletTypes(false);
    if (type === t('wallet.walletTypes.cash')) {
      setBankName('');
    }
  };

  const validateForm = (): boolean => {
    if (!walletName.trim()) {
      setErrorTitle(t('common.error'));
      setErrorMessage(t('wallet.error.enterWalletName'));
      setShowErrorModal(true);
      return false;
    }

    const numericBalance = getNumericBalance(balance);
    if (!balance.trim() || numericBalance === 0) {
      setErrorTitle(t('common.error'));
      setErrorMessage(t('wallet.error.enterBalancevalid'));
      setShowErrorModal(true);
      return false;
    }

    if (numericBalance < 0) {
      setErrorTitle(t('common.error'));
      setErrorMessage(t('wallet.error.enterBalanceNegative'));
      setShowErrorModal(true);
      return false;
    }

    // Kiểm tra số chữ số không được vượt quá 15
    const digitsOnly = balance.replace(/[^\d]/g, '');
    if (digitsOnly.length > 15) {
      setErrorTitle(t('common.error'));
      setErrorMessage(t('wallet.error.enterBalanceMax'));
      setShowErrorModal(true);
      return false;
    }

    if (walletType === t('wallet.walletTypes.bank') && !bankName.trim()) {
      setErrorTitle(t('common.error'));
       setErrorMessage(t('wallet.error.enterBankName'));
      setShowErrorModal(true);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
             // Prepare wallet data in snake_case format
       const walletRequest: CreateWalletRequest = {
         wallet_name: walletName.trim(),
         balance: getNumericBalance(balance),
         wallet_type_id: getWalletTypeId(walletType),
         is_default: isDefault,
         exclude_from_total: excludeFromTotal,
         bank_name: bankName.trim() || undefined,
         icon_url: undefined, // Set to undefined instead of null
         currency_code: "VND",
         initial_balance: getNumericBalance(balance)
       };

      console.log('💾 Saving wallet:', walletRequest);

      let result;
      if (editMode && walletId) {
        // Update existing wallet
        result = await walletService.updateWallet(walletId, walletRequest);
        console.log('✅ Wallet updated successfully:', result);
        setSuccessMessage(t('wallet.update'));
        setShowSuccessModal(true);
        // Không gọi Alert.alert nữa
      } else {
        // Create new wallet
        result = await walletService.createWallet(walletRequest);
        console.log('✅ Wallet created successfully:', result);
        setSuccessMessage(t('wallet.save'));
        setShowSuccessModal(true);
        // Không gọi Alert.alert nữa
      }

    } catch (error: any) {
      console.error('❌ Failed to save wallet:', error);
      let message = error.message || 'Failed to save wallet. Please try again.';
      if (typeof message === 'string' && message.toLowerCase().includes('maximum wallet limit')) {
        message = t('wallet.maxWalletLimit');
      }
      setErrorTitle(t('common.error'));
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const renderWalletTypeDropdown = () => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowWalletTypes(!showWalletTypes)}
      >
        <Text style={styles.dropdownText}>{walletType}</Text>
        <Icon 
          name={showWalletTypes ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
          size={24} 
          color="#666" 
        />
      </TouchableOpacity>
      
      {showWalletTypes && (
        <View style={styles.dropdownMenu}>
          {walletTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.dropdownItem}
              onPress={() => handleWalletTypeSelect(type)}
            >
              <Text style={styles.dropdownItemText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const getFieldLabel = () => {
    if (walletType === t('wallet.walletTypes.bank')) {
      return t('wallet.bankName');
    }
    return '';
  };

  const getFieldPlaceholder = () => {
    if (walletType === t('wallet.walletTypes.bank')) {
      return t('wallet.placeholders.enterBankName');
    }
    return '';
  };

  // Hàm lấy giá trị số từ text đã format
  const getNumericBalance = (formattedText: string): number => {
    const numericValue = formattedText.replace(/[^\d]/g, '');
    return numericValue ? parseInt(numericValue, 10) : 0;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSide}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTitleWrapperCentered}>
            <Text style={[styles.headerTitle, typography.semibold]} numberOfLines={1}>
              {editMode ? t('wallet.editWalletTitle') : t('wallet.addWalletTitle')}
            </Text>
          </View>
          <View style={styles.headerSide} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Balance Field */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, typography.semibold]}>
              {t('wallet.balance')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('wallet.placeholders.enterBalance')}
                value={balance}
                onChangeText={(text) => setBalance(formatBalanceInput(text))}
                keyboardType="numeric"
                onFocus={() => {
                  console.log('🎯 Balance TextInput focused - keyboard should appear');
                }}
                onBlur={() => {
                  console.log('🎯 Balance TextInput blurred - keyboard should hide');
                }}
                autoCorrect={false}
                returnKeyType="next"
                editable={!saving}
              />
              <Text style={styles.currency}>{t('currency')}</Text>
            </View>
          </View>

          {/* Wallet Name Field */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, typography.semibold]}>
              {t('wallet.walletName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('wallet.placeholders.enterWalletName')}
              value={walletName}
              onChangeText={setWalletName}
              onFocus={() => {
                console.log('🎯 Wallet Name TextInput focused - keyboard should appear');
              }}
              onBlur={() => {
                console.log('🎯 Wallet Name TextInput blurred - keyboard should hide');
              }}
              autoCorrect={false}
              returnKeyType="next"
              editable={!saving}
            />
          </View>

          {/* Wallet Type Field */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, typography.semibold]}>
              {t('wallet.walletType')} <Text style={styles.required}>*</Text>
            </Text>
            {renderWalletTypeDropdown()}
          </View>

          {/* Bank Name Field - Conditional */}
          {walletType === t('wallet.walletTypes.bank') && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, typography.semibold]}>
                {getFieldLabel()} <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={getFieldPlaceholder()}
                value={bankName}
                onChangeText={setBankName}
                editable={!saving}
              />
            </View>
          )}

          {/* Default Wallet Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleTitle, typography.semibold]}>{t('wallet.isDefault')}</Text>
              <Text style={styles.toggleSubtitle}>
                {t('wallet.defaultDescription')}
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#d1d5db', true: '#1e90ff' }}
              thumbColor={isDefault ? '#fff' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          {/* Exclude from Total Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={[styles.toggleTitle, typography.semibold]}>{t('wallet.excludeFromTotal')}</Text>
              <Text style={styles.toggleSubtitle}>
                {t('wallet.excludeDescription')}
              </Text>
            </View>
            <Switch
              value={excludeFromTotal}
              onValueChange={setExcludeFromTotal}
              trackColor={{ false: '#d1d5db', true: '#1e90ff' }}
              thumbColor={excludeFromTotal ? '#fff' : '#f4f3f4'}
              disabled={saving}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={[styles.saveButtonText, typography.semibold]}>
              {saving ? 'Saving...' : (editMode ? t('wallet.update') : t('wallet.save'))}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
      <CustomErrorModal
        visible={showErrorModal}
        title={errorTitle}
        message={errorMessage}
        onDismiss={() => setShowErrorModal(false)}
        type="error"
      />
      <CustomSuccessModal
        visible={showSuccessModal}
        title={t('common.success')}
        message={successMessage}
        buttonText={t('common.ok')}
        onConfirm={() => {
          setShowSuccessModal(false);
          walletService.markForRefresh();
          navigation.goBack();
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerSide: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleWrapperCentered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ff4757',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  currency: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    zIndex: 1000,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  toggleContent: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default AddWalletScreen; 