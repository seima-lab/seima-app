import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigationService } from '../navigation/NavigationService';

const WalletScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteWalletInfo, setDeleteWalletInfo] = useState<{id: string, name: string} | null>(null);
  const navigation = useNavigationService();

  const handleMenuPress = (accountId: string) => {
    setMenuVisible(menuVisible === accountId ? null : accountId);
  };

  const handleCloseMenu = () => {
    setMenuVisible(null);
  };

  const handleEdit = (accountId: string) => {
    console.log('Edit account:', accountId);
    setMenuVisible(null);
    
    // Mock data for edit mode
    const walletData = {
      balance: accountId === 'mbbank' ? '1996007000' : '7000000',
      name: accountId === 'mbbank' ? 'MBBank' : t('wallet.defaultWallet'),
      type: accountId === 'mbbank' ? t('wallet.walletTypes.bank') : t('wallet.walletTypes.cash'),
      bankName: accountId === 'mbbank' ? 'MBBank' : '',
      description: '',
      isDefault: accountId === 'wallet',
      excludeFromTotal: false,
    };
    
    navigation.navigate('AddWalletScreen', {
      editMode: true,
      walletData: walletData,
    });
  };

  const handleDelete = (accountId: string) => {
    setMenuVisible(null);
    
    const walletName = accountId === 'mbbank' ? 'MBBank' : t('wallet.defaultWallet');
    setDeleteWalletInfo({ id: accountId, name: walletName });
    setDeleteAlertVisible(true);
  };

  const confirmDelete = () => {
    if (deleteWalletInfo) {
      console.log('Delete confirmed for:', deleteWalletInfo.id);
      // Add actual delete logic here
      // Example: call API to delete wallet
      // deleteWallet(deleteWalletInfo.id);
    }
    setDeleteAlertVisible(false);
    setDeleteWalletInfo(null);
  };

  const cancelDelete = () => {
    setDeleteAlertVisible(false);
    setDeleteWalletInfo(null);
  };

  const handleAddWallet = () => {
    navigation.navigate('AddWalletScreen');
  };

  const renderMenu = (accountId: string) => {
    if (menuVisible !== accountId) return null;
    
    return (
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleEdit(accountId)}
        >
          <Icon name="edit" size={18} color="#333" />
          <Text style={styles.menuText}>{t('edit')}</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleDelete(accountId)}
        >
          <Icon name="delete" size={18} color="#ff4757" />
          <Text style={[styles.menuText, { color: '#ff4757' }]}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCustomAlert = () => (
    <Modal
      transparent={true}
      visible={deleteAlertVisible}
      animationType="fade"
      onRequestClose={cancelDelete}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{t('wallet.alertTitle')}</Text>
          <Text style={styles.alertMessage}>
            {t('wallet.deleteMessage', { walletName: deleteWalletInfo?.name })}
          </Text>
          <View style={styles.alertButtonContainer}>
            <TouchableOpacity style={styles.alertCancelButton} onPress={cancelDelete}>
              <Text style={styles.alertCancelText}>{t('wallet.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertDeleteButton} onPress={confirmDelete}>
              <Text style={styles.alertDeleteText}>{t('wallet.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <TouchableWithoutFeedback onPress={handleCloseMenu}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('wallet.title')}</Text>
              <TouchableOpacity>
                <Icon name="history" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>{t('wallet.currentBalance')}</Text>
              <Text style={styles.balanceAmount}>2,003,007,000 {t('currency')}</Text>
              
              <View style={styles.balanceBreakdown}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>{t('wallet.totalAssets')}</Text>
                  <Text style={styles.balanceSubAmount}>2,003,007,000 {t('currency')}</Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>{t('wallet.totalDebts')}</Text>
                  <Text style={styles.balanceSubAmount}>0 {t('currency')}</Text>
                </View>
              </View>
            </View>

            {/* Accounts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('wallet.includeInTotal')}</Text>
              
              {/* MBBank Account */}
              <View style={styles.accountItem}>
                <View style={styles.accountIcon}>
                  <Text style={styles.accountIconText}>MB</Text>
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>MBBank</Text>
                  <Text style={styles.accountBalance}>1,996,007,000 {t('currency')}</Text>
                </View>
                <View style={styles.moreButtonContainer}>
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => handleMenuPress('mbbank')}
                  >
                    <Icon name="more-vert" size={24} color="#666" />
                  </TouchableOpacity>
                  {renderMenu('mbbank')}
                </View>
              </View>

              {/* Wallet Account */}
              <View style={styles.accountItem}>
                <View style={[styles.accountIcon, styles.walletIcon]}>
                  <Icon2 name="wallet" size={20} color="#fff" />
                </View>
                <View style={styles.accountInfo}>
                  <View style={styles.walletNameContainer}>
                    <Text style={styles.accountName}>{t('navigation.wallet')}</Text>
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>{t('wallet.defaultWallet')}</Text>
                    </View>
                  </View>
                  <Text style={styles.accountBalance}>7,000,000 {t('currency')}</Text>
                </View>
                <View style={styles.moreButtonContainer}>
                  <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={() => handleMenuPress('wallet')}
                  >
                    <Icon name="more-vert" size={24} color="#666" />
                  </TouchableOpacity>
                  {renderMenu('wallet')}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleAddWallet}>
                <Icon name="add" size={24} color="#1e90ff" />
                <Text style={styles.actionButtonText}>{t('wallet.addWallet')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
        {renderCustomAlert()}
      </View>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#1e90ff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    flex: 1,
  },
  balanceSubLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  balanceSubAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ff6b6b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  walletIcon: {
    backgroundColor: '#6c5ce7',
  },
  accountIconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  walletNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  defaultBadge: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  accountBalance: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  moreButtonContainer: {
    position: 'relative',
  },
  moreButton: {
    padding: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#1e90ff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    color: '#333',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  alertOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  alertMessage: {
    color: '#666',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
    textAlign: 'center',
  },
  alertButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  alertCancelButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  alertCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertDeleteButton: {
    backgroundColor: '#E53E3E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flex: 1,
  },
  alertDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default WalletScreen; 