import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
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
import { WalletResponse, walletService } from '../services/walletService';

const WalletScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteWalletInfo, setDeleteWalletInfo] = useState<{id: number, name: string} | null>(null);
  const navigation = useNavigationService();
  const isFirstRender = useRef(true);
  const shouldAutoRefresh = useRef(false); // Flag to control when auto-refresh should run

  // Wallet data state
  const [wallets, setWallets] = useState<WalletResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);



     // Load wallets from API
   const loadWallets = useCallback(async (showRefreshing = false) => {
     try {
       if (showRefreshing) {
         setRefreshing(true);
       } else {
         setLoading(true);
       }
       setError(null);

       console.log('🔄 Loading wallets...');
       const walletsData = await walletService.getAllWallets();
       console.log('✅ Wallets loaded:', walletsData);
       console.log('📊 Wallets count:', walletsData.length);
       console.log('📋 Wallets data structure:', JSON.stringify(walletsData, null, 2));
       
       setWallets(walletsData);
     } catch (err: any) {
       console.error('❌ Failed to load wallets:', err);
       setError(err.message || 'Failed to load wallets');
       
       Alert.alert(
         t('common.error'),
         'Failed to load wallets. Please check your connection and try again.',
         [
           { text: 'Retry', onPress: () => loadWallets() },
           { text: 'Cancel' }
         ]
       );
     } finally {
       setLoading(false);
       setRefreshing(false);
     }
   }, [t]);

  // Load wallets on component mount
  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  // Check for refresh flag when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Skip first render
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      // Check if service is marked for refresh
      if (walletService.shouldRefresh()) {
        console.log('🔄 Refresh flag detected - reloading wallets...');
        walletService.clearRefreshFlag();
        
        // Small delay to avoid conflicts
        setTimeout(() => {
          if (!loading && !refreshing) {
            loadWallets(false);
          }
        }, 100);
      }
    }, [loading, refreshing, loadWallets])
  );



     // Calculate total balance (exclude wallets marked as exclude_from_total)
   const calculateTotalBalance = useCallback(() => {
     return wallets
       .filter(wallet => (wallet.is_active !== false) && !wallet.exclude_from_total && !wallet.is_delete)
       .reduce((total, wallet) => total + wallet.current_balance, 0);
   }, [wallets]);

   // Calculate total assets (all active wallets)
   const calculateTotalAssets = useCallback(() => {
     return wallets
       .filter(wallet => wallet.is_active !== false && !wallet.is_delete)
       .reduce((total, wallet) => total + wallet.current_balance, 0);
   }, [wallets]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    loadWallets(true);
  }, [loadWallets]);

  const handleMenuPress = (walletId: number) => {
    const walletIdString = walletId.toString();
    setMenuVisible(menuVisible === walletIdString ? null : walletIdString);
  };

  const handleCloseMenu = () => {
    setMenuVisible(null);
  };

  const handleEdit = (walletId: number) => {
    console.log('Edit wallet:', walletId);
    setMenuVisible(null);
    
    // Find wallet data
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    // Map wallet_type_name to the format expected by AddWalletScreen
    let mappedType = t('wallet.walletTypes.cash'); // default
    if (wallet.wallet_type_name === "Tài khoản Ngân hàng") {
      mappedType = t('wallet.walletTypes.bank');
    }

    const walletData = {
      balance: wallet.current_balance.toString(),
      name: wallet.wallet_name,
      type: mappedType,
      bankName: wallet.bank_name || '', // Ensure bankName is passed correctly
      isDefault: wallet.is_default,
      excludeFromTotal: wallet.exclude_from_total || false,
    };
    
    console.log('📝 Edit wallet data:', walletData); // Debug log

    navigation.navigate('AddWalletScreen', {
      editMode: true,
      walletId: walletId,
      walletData: walletData
    });
  };

  const handleDelete = (walletId: number) => {
    setMenuVisible(null);
    
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    // Get active wallets (non-deleted)
    const activeWallets = wallets.filter(w => !w.is_delete && w.is_active !== false);
    
    // Prevent deleting the last wallet
    if (activeWallets.length <= 1) {
      Alert.alert(
        t('common.error'),
        'Cannot delete the last wallet. You must have at least one wallet.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Warn about deleting default wallet
    if (wallet.is_default) {
      Alert.alert(
        'Delete Default Wallet',
        `"${wallet.wallet_name}" is your default wallet. Are you sure you want to delete it? You'll need to set another wallet as default.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              setDeleteWalletInfo({ id: walletId, name: wallet.wallet_name });
              setDeleteAlertVisible(true);
            }
          }
        ]
      );
      return;
    }

    // Normal delete confirmation
    setDeleteWalletInfo({ id: walletId, name: wallet.wallet_name });
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteWalletInfo) return;

    try {
      console.log('🗑️ Deleting wallet:', deleteWalletInfo.id);
      
      // Store wallet name for success message
      const deletedWalletName = deleteWalletInfo.name;
      
      // Close modal and menu, then show loading
      setDeleteAlertVisible(false);
      setDeleteWalletInfo(null);
      setMenuVisible(null); // Close any open menu
      setLoading(true);
      
      // Call DELETE API endpoint
      await walletService.deleteWallet(deleteWalletInfo.id);
      console.log('✅ Wallet deleted successfully via API');
      
      // Optimistic update: immediately remove wallet from local state
      setWallets(prevWallets => prevWallets.filter(w => w.id !== deleteWalletInfo.id));
      
      // Reload wallets after deletion to reflect changes and ensure data consistency
      await loadWallets(false);
      console.log('🔄 Wallets reloaded after deletion');
      
      // Show success message after reload
      Alert.alert(
        t('common.success'),
        `Wallet "${deletedWalletName}" has been deleted successfully.`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Failed to delete wallet:', error);
      
      // Hide loading
      setLoading(false);
      
      // Show error message
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to delete wallet. Please try again.',
        [
          { text: 'Retry', onPress: () => {
            // Reopen delete confirmation for retry
            setDeleteWalletInfo({ id: deleteWalletInfo.id, name: deleteWalletInfo.name });
            setDeleteAlertVisible(true);
          }},
          { text: 'Cancel' }
        ]
      );
    }
  };

  const cancelDelete = () => {
    setDeleteAlertVisible(false);
    setDeleteWalletInfo(null);
  };

  const handleAddWallet = () => {
    navigation.navigate('AddWalletScreen');
  };

  const renderMenu = (walletId: number) => {
    const walletIdString = walletId.toString();
    if (menuVisible !== walletIdString) return null;
    
    return (
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleEdit(walletId)}
        >
          <Icon name="edit" size={18} color="#333" />
          <Text style={styles.menuText}>{t('edit')}</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleDelete(walletId)}
        >
          <Icon name="delete" size={18} color="#ff4757" />
          <Text style={[styles.menuText, { color: '#ff4757' }]}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getWalletIcon = (walletTypeName?: string) => {
    // wallet_type_name: "Tài khoản Ngân hàng" = Bank, "Tiền mặt" = Cash
    if (walletTypeName === "Tài khoản Ngân hàng") {
      return <Icon2 name="university" size={20} color="#fff" />;
    }
    return <Icon2 name="wallet" size={20} color="#fff" />;
  };

  const getWalletIconStyle = (walletTypeName?: string) => {
    // wallet_type_name: "Tài khoản Ngân hàng" = Bank, "Tiền mặt" = Cash
    if (walletTypeName === "Tài khoản Ngân hàng") {
      return [styles.accountIcon, { backgroundColor: '#ff6b6b' }]; // Red for Bank
    }
    return [styles.accountIcon, styles.walletIcon]; // Default color for Cash
  };

  const renderWalletItem = (wallet: WalletResponse) => {
    // Determine balance color: green for positive, black for zero/negative
    const balanceColor = wallet.current_balance > 0 ? '#22c55e' : '#333';
    
    return (
      <View key={wallet.id} style={styles.accountItem}>
        <View style={getWalletIconStyle(wallet.wallet_type_name)}>
          {getWalletIcon(wallet.wallet_type_name)}
        </View>
        <View style={styles.accountInfo}>
          <View style={styles.walletNameContainer}>
            <Text style={styles.accountName}>{wallet.wallet_name}</Text>
            {wallet.is_default && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultBadgeText}>{t('wallet.defaultWallet')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.accountBalance, { color: balanceColor }]}>
            {wallet.current_balance.toLocaleString('vi-VN')} {t('currency')}
          </Text>
        </View>
        <View style={styles.moreButtonContainer}>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => handleMenuPress(wallet.id)}
          >
            <Icon name="more-vert" size={24} color="#666" />
          </TouchableOpacity>
          {renderMenu(wallet.id)}
        </View>
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
          <View style={styles.alertIconContainer}>
            <Icon name="warning" size={48} color="#ff4757" />
          </View>
          <Text style={styles.alertTitle}>{t('wallet.alertTitle')}</Text>
          <Text style={styles.alertMessage}>
            {t('wallet.deleteMessage', { walletName: deleteWalletInfo?.name })}
          </Text>
          <View style={styles.alertButtonContainer}>
            <TouchableOpacity style={styles.alertCancelButton} onPress={cancelDelete}>
              <Text style={styles.alertCancelText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertDeleteButton} onPress={confirmDelete}>
              <Text style={styles.alertDeleteText}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Show loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>{t('common.loading')}...</Text>
      </View>
    );
  }

  // Calculate balances
  const totalBalance = calculateTotalBalance();
  const totalAssets = calculateTotalAssets();
  const totalDebts = 0; // This could be calculated if you have debt wallets

     // Filter wallets that are included in total
   let includedWallets = wallets.filter(wallet => 
     (wallet.is_active !== false) && !wallet.exclude_from_total && !wallet.is_delete
   );

   // If no wallets are included (due to missing is_active field), show all wallets that are not deleted
   if (includedWallets.length === 0 && wallets.length > 0) {
     includedWallets = wallets.filter(wallet => !wallet.exclude_from_total && !wallet.is_delete);
   }

   console.log('🔍 Total wallets:', wallets.length);
   console.log('📱 Included wallets:', includedWallets.length);
   console.log('💼 Wallets details:', wallets.map(w => ({
     id: w.id,
     name: w.wallet_name,
     is_active: w.is_active,
     is_delete: w.is_delete,
     exclude_from_total: w.exclude_from_total,
     balance: w.current_balance
   })));

  return (
    <TouchableWithoutFeedback onPress={handleCloseMenu}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#1e90ff']}
                tintColor="#1e90ff"
              />
            }
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{t('wallet.title')}</Text>
              <TouchableOpacity onPress={() => loadWallets(true)} disabled={loading || refreshing}>
                <Icon name="refresh" size={24} color={loading || refreshing ? "#ccc" : "#333"} />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>{t('wallet.currentBalance')}</Text>
              <Text style={styles.balanceAmount}>
                {totalBalance.toLocaleString('vi-VN')} {t('currency')}
              </Text>
              
              <View style={styles.balanceBreakdown}>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>{t('wallet.totalAssets')}</Text>
                  <Text style={styles.balanceSubAmount}>
                    {totalAssets.toLocaleString('vi-VN')} {t('currency')}
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={styles.balanceSubLabel}>{t('wallet.totalDebts')}</Text>
                  <Text style={styles.balanceSubAmount}>
                    {totalDebts.toLocaleString('vi-VN')} {t('currency')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Accounts Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('wallet.includeInTotal')}</Text>
              
              {includedWallets.length > 0 ? (
                includedWallets.map(renderWalletItem)
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No wallets found</Text>
                  <Text style={styles.emptySubText}>Add your first wallet to get started</Text>
                </View>
              )}
            </View>

                         {/* Excluded Wallets Section */}
             {wallets.some(w => w.exclude_from_total && (w.is_active !== false) && !w.is_delete) && (
               <View style={styles.section}>
                 <Text style={styles.sectionTitle}>Excluded from Total</Text>
                 {wallets
                   .filter(w => w.exclude_from_total && (w.is_active !== false) && !w.is_delete)
                   .map(renderWalletItem)
                 }
               </View>
             )}

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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '85%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconContainer: {
    marginBottom: 16,
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
    marginBottom: 16,
    textAlign: 'center',
  },

  alertButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  alertCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCancelText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  alertDeleteButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc3545',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  alertDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#1e90ff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#666',
    fontSize: 14,
  },
});

export default WalletScreen; 