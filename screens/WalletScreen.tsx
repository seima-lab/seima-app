import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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

// Enhanced responsive utilities for all screen sizes
const { width, height } = Dimensions.get('window');

// Responsive utilities - optimized for all screen sizes
const responsiveUtils = {
  isSmallScreen: width < 375 || height < 667,
  isMediumScreen: width >= 375 && width < 414,
  isLargeScreen: width >= 414,
  screenWidth: width,
  screenHeight: height,
  
  // Responsive padding/margin
  rp: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minSize = size * 0.7;
    const maxSize = size * 1.3;
    const scaledSize = size * scale;
    return Math.max(Math.min(scaledSize, maxSize), minSize);
  },
  
  // Responsive font size
  rf: (fontSize: number) => {
    const scale = Math.min(width / 375, height / 667);
    const minFontScale = 0.8;
    const maxFontScale = 1.2;
    const fontScale = Math.min(Math.max(scale, minFontScale), maxFontScale);
    return fontSize * fontScale;
  },
  
  // Width percentage
  wp: (percentage: number) => (width * percentage) / 100,
  
  // Height percentage
  hp: (percentage: number) => (height * percentage) / 100,
  
  // Responsive border radius
  rb: (size: number) => {
    const scale = Math.min(width / 375, height / 667);
    return Math.max(size * scale, size * 0.8);
  }
};

// Extract utilities for easier use
const { isSmallScreen, isMediumScreen, isLargeScreen, rp, rf, wp, hp, rb } = responsiveUtils;

const WalletScreen = ({ footerHeight = 0 }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [deleteWalletInfo, setDeleteWalletInfo] = useState<{id: number, name: string} | null>(null);
  const navigation = useNavigationService();
  const isFirstRender = useRef(true);
  const shouldAutoRefresh = useRef(false);

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
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }

      if (walletService.shouldRefresh()) {
        console.log('🔄 Refresh flag detected - reloading wallets...');
        walletService.clearRefreshFlag();
        
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
    
    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) return;

    let mappedType = t('wallet.walletTypes.cash');
    if (wallet.wallet_type_name === "Tài khoản Ngân hàng") {
      mappedType = t('wallet.walletTypes.bank');
    }

    const walletData = {
      balance: wallet.current_balance.toString(),
      name: wallet.wallet_name,
      type: mappedType,
      bankName: wallet.bank_name || '',
      isDefault: wallet.is_default,
      excludeFromTotal: wallet.exclude_from_total || false,
    };
    
    console.log('📝 Edit wallet data:', walletData);

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

    const activeWallets = wallets.filter(w => !w.is_delete && w.is_active !== false);
    
    if (activeWallets.length <= 1) {
      Alert.alert(
        t('common.error'),
        'Cannot delete the last wallet. You must have at least one wallet.',
        [{ text: 'OK' }]
      );
      return;
    }

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

    setDeleteWalletInfo({ id: walletId, name: wallet.wallet_name });
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!deleteWalletInfo) return;

    try {
      console.log('🗑️ Deleting wallet:', deleteWalletInfo.id);
      
      const deletedWalletName = deleteWalletInfo.name;
      
      setDeleteAlertVisible(false);
      setDeleteWalletInfo(null);
      setMenuVisible(null);
      setLoading(true);
      
      await walletService.deleteWallet(deleteWalletInfo.id);
      console.log('✅ Wallet deleted successfully via API');
      
      setWallets(prevWallets => prevWallets.filter(w => w.id !== deleteWalletInfo.id));
      
      await loadWallets(false);
      console.log('🔄 Wallets reloaded after deletion');
      
      Alert.alert(
        t('common.success'),
        `Wallet "${deletedWalletName}" has been deleted successfully.`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Failed to delete wallet:', error);
      
      setLoading(false);
      
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to delete wallet. Please try again.',
        [
          { text: 'Retry', onPress: () => {
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
          <Icon name="edit" size={rf(18)} color="#333" />
          <Text style={styles.menuText}>{t('edit')}</Text>
        </TouchableOpacity>
        <View style={styles.menuDivider} />
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleDelete(walletId)}
        >
          <Icon name="delete" size={rf(18)} color="#ff4757" />
          <Text style={[styles.menuText, { color: '#ff4757' }]}>{t('delete')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getWalletIcon = (walletTypeName?: string) => {
    if (walletTypeName === "Tài khoản Ngân hàng") {
      return <Icon2 name="university" size={rf(20)} color="#fff" />;
    }
    return <Icon2 name="wallet" size={rf(20)} color="#fff" />;
  };

  const getWalletIconStyle = (walletTypeName?: string) => {
    if (walletTypeName === "Tài khoản Ngân hàng") {
      return [styles.accountIcon, { backgroundColor: '#ff6b6b' }];
    }
    return [styles.accountIcon, styles.walletIcon];
  };

  const renderWalletItem = (wallet: WalletResponse) => {
    const isExcluded = wallet.exclude_from_total;
    const balanceColor = isExcluded
      ? styles.disabledAccountBalance.color
      : wallet.current_balance > 0 ? '#22c55e' : '#333';
    return (
      <View key={wallet.id} style={[styles.accountItem, isExcluded && styles.disabledAccountItem]}>
        <View style={[getWalletIconStyle(wallet.wallet_type_name), isExcluded && styles.disabledAccountIcon]}>
          {getWalletIcon(wallet.wallet_type_name)}
        </View>
        <View style={styles.accountInfo}>
          <View style={styles.walletNameContainer}>
            <Text style={[styles.accountName, isExcluded && styles.disabledAccountName]}>{wallet.wallet_name}</Text>
            {wallet.is_default && !isExcluded && (
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
            <Icon name="more-vert" size={rf(24)} color="#666" />
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
            <Icon name="warning" size={rf(48)} color="#ff4757" />
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
  const totalDebts = 0;

  console.log('🔍 Total wallets:', wallets.length);
  console.log('📱 Included wallets:', wallets.filter(wallet => !wallet.is_delete && wallet.is_active !== false).length);
  console.log('💼 Wallets details:', wallets.map(w => ({
    id: w.id,
    name: w.wallet_name,
    is_active: w.is_active,
    is_delete: w.is_delete,
    exclude_from_total: w.exclude_from_total,
    balance: w.current_balance
  })));

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handleCloseMenu}>
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
          contentContainerStyle={{
            paddingBottom: footerHeight + insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          bounces={true}
          overScrollMode="always"
        >
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}> 
            {/* Header */}
            <View style={[styles.header, { 
              paddingHorizontal: rp(20), 
              paddingVertical: rp(16),
              paddingTop: rp(20)
            }]}> 
              <Text style={[styles.headerTitle, { fontSize: rf(20) }]}>{t('wallet.title')}</Text>
              <TouchableOpacity onPress={() => loadWallets(true)} disabled={loading || refreshing}>
                <Icon name="refresh" size={rf(24)} color={loading || refreshing ? "#ccc" : "#333"} />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <View style={[styles.balanceCard, { 
              margin: rp(16), 
              padding: rp(24), 
              borderRadius: rb(16),
              marginHorizontal: rp(16)
            }]}> 
              <Text style={[styles.balanceLabel, { fontSize: rf(16), marginBottom: rp(8) }]}>
                {t('wallet.currentBalance')}
              </Text>
              <Text style={[styles.balanceAmount, { fontSize: rf(32), marginBottom: rp(24) }]}> 
                {totalBalance.toLocaleString('vi-VN')} {t('currency')} 
              </Text>
              <View style={styles.balanceBreakdown}>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceSubLabel, { fontSize: rf(14), marginBottom: rp(4) }]}>
                    {t('wallet.totalAssets')}
                  </Text>
                  <Text style={[styles.balanceSubAmount, { fontSize: rf(18) }]}> 
                    {totalAssets.toLocaleString('vi-VN')} {t('currency')} 
                  </Text>
                </View>
                <View style={styles.balanceItem}>
                  <Text style={[styles.balanceSubLabel, { fontSize: rf(14), marginBottom: rp(4) }]}>
                    {t('wallet.totalDebts')}
                  </Text>
                  <Text style={[styles.balanceSubAmount, { fontSize: rf(18) }]}> 
                    {totalDebts.toLocaleString('vi-VN')} {t('currency')} 
                  </Text>
                </View>
              </View>
            </View>

            {/* Accounts Section */}
            <View style={[styles.section, { 
              marginHorizontal: rp(16), 
              marginBottom: rp(16), 
              borderRadius: rb(12), 
              padding: rp(16) 
            }]}> 
              <Text style={[styles.sectionTitle, { fontSize: rf(18), marginBottom: rp(16) }]}> 
                {t('wallet.includeInTotal')} 
              </Text>
              {wallets.length > 0 ? (
                wallets
                  .filter(wallet => !wallet.is_delete && wallet.is_active !== false)
                  .sort((a, b) => {
                    if (a.exclude_from_total === b.exclude_from_total) return 0;
                    return a.exclude_from_total ? 1 : -1;
                  })
                  .map(renderWalletItem)
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { fontSize: rf(16), marginBottom: rp(8) }]}> 
                    No wallets found
                  </Text>
                  <Text style={[styles.emptySubText, { fontSize: rf(14) }]}> 
                    Add your first wallet to get started
                  </Text>
                </View>
              )}
            </View>

            {/* Excluded Wallets Section */}
            {/* Removed: do not render a separate section for excluded wallets */}

            {/* Action Buttons */}
            <View style={[styles.actionsContainer, { 
              paddingHorizontal: rp(16), 
              marginBottom: rp(24) 
            }]}> 
              <TouchableOpacity 
                style={[styles.actionButton, { 
                  paddingHorizontal: rp(24), 
                  paddingVertical: rp(16), 
                  borderRadius: rb(12) 
                }]} 
                onPress={handleAddWallet}
              >
                <Icon name="add" size={rf(24)} color="#1e90ff" />
                <Text style={[styles.actionButtonText, { fontSize: rf(16), marginLeft: rp(8) }]}>
                  {t('wallet.addWallet')}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {renderCustomAlert()}
        </ScrollView>
      </TouchableWithoutFeedback>
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
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  balanceCard: {
    backgroundColor: '#1e90ff',
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
    opacity: 0.9,
  },
  balanceAmount: {
    color: '#fff',
    fontWeight: 'bold',
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
    opacity: 0.8,
  },
  balanceSubAmount: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  disabledAccountItem: {
    backgroundColor: '#f7f7f7',
    opacity: 0.7,
  },
  disabledAccountName: {
    color: '#bbb',
  },
  disabledAccountBalance: {
    color: '#bbb',
  },
  disabledAccountIcon: {
    backgroundColor: '#e0e0e0',
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
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  walletNameContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  defaultBadge: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  defaultBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  accountBalance: {
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
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    fontWeight: '600',
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
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  alertMessage: {
    color: '#666',
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
    fontWeight: '600',
    textAlign: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#1e90ff',
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
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubText: {
    color: '#666',
  },
});

export default WalletScreen; 