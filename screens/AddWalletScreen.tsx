import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigationService } from '../navigation/NavigationService';

interface Props {
  route?: {
    params?: {
      editMode?: boolean;
      walletData?: any;
    };
  };
}

const AddWalletScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  const editMode = route?.params?.editMode || false;
  const walletData = route?.params?.walletData;

  const [balance, setBalance] = useState(walletData?.balance || '');
  const [walletName, setWalletName] = useState(walletData?.name || '');
  const [walletType, setWalletType] = useState(walletData?.type || t('wallet.walletTypes.cash'));
  const [bankName, setBankName] = useState(walletData?.bankName || '');
  const [description, setDescription] = useState(walletData?.description || '');
  const [isDefault, setIsDefault] = useState(walletData?.isDefault || false);
  const [excludeFromTotal, setExcludeFromTotal] = useState(walletData?.excludeFromTotal || false);
  const [showWalletTypes, setShowWalletTypes] = useState(false);

  const walletTypes = [
    t('wallet.walletTypes.cash'),
    t('wallet.walletTypes.ewallet'),
    t('wallet.walletTypes.bank')
  ];

  const handleWalletTypeSelect = (type: string) => {
    setWalletType(type);
    setShowWalletTypes(false);
    if (type === t('wallet.walletTypes.cash')) {
      setBankName('');
    }
  };

  const handleSave = () => {
    // Add save logic here
    console.log('Save wallet:', {
      balance,
      walletName,
      walletType,
      bankName,
      description,
      isDefault,
      excludeFromTotal,
    });
    navigation.goBack();
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
    } else if (walletType === t('wallet.walletTypes.ewallet')) {
      return t('wallet.eWalletName');
    }
    return '';
  };

  const getFieldPlaceholder = () => {
    if (walletType === t('wallet.walletTypes.bank')) {
      return t('wallet.placeholders.enterBankName');
    } else if (walletType === t('wallet.walletTypes.ewallet')) {
      return t('wallet.placeholders.enterEWalletName');
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editMode ? t('wallet.editWalletTitle') : t('wallet.addWalletTitle')}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <Icon name="check" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Balance Field */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('wallet.balanceRequired')}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder={t('wallet.placeholders.enterBalance')}
                value={balance}
                onChangeText={setBalance}
                keyboardType="numeric"
              />
              <Text style={styles.currency}>{t('currency')}</Text>
            </View>
          </View>

          {/* Wallet Name Field */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('wallet.walletName')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('wallet.placeholders.enterWalletName')}
              value={walletName}
              onChangeText={setWalletName}
            />
          </View>

          {/* Wallet Type Field */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('wallet.walletType')}</Text>
            {renderWalletTypeDropdown()}
          </View>

          {/* Bank/E-wallet Name Field - Conditional */}
          {(walletType === t('wallet.walletTypes.ewallet') || walletType === t('wallet.walletTypes.bank')) && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {getFieldLabel()}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={getFieldPlaceholder()}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
          )}

          {/* Description Field */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('wallet.description')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('wallet.placeholders.enterDescription')}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Default Wallet Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>{t('wallet.isDefault')}</Text>
              <Text style={styles.toggleSubtitle}>
                {t('wallet.defaultDescription')}
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#d1d5db', true: '#1e90ff' }}
              thumbColor={isDefault ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Exclude from Total Toggle */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleContent}>
              <Text style={styles.toggleTitle}>{t('wallet.excludeFromTotal')}</Text>
              <Text style={styles.toggleSubtitle}>
                {t('wallet.excludeDescription')}
              </Text>
            </View>
            <Switch
              value={excludeFromTotal}
              onValueChange={setExcludeFromTotal}
              trackColor={{ false: '#d1d5db', true: '#9ca3af' }}
              thumbColor={excludeFromTotal ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('wallet.save')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: '600',
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
    backgroundColor: '#f8f9fa',
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
    fontWeight: '600',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddWalletScreen; 