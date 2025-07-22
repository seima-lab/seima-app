import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { typography } from '../constants/typography';
import { WalletResponse } from '../services/walletService';

const ALL_WALLETS_ITEM: WalletResponse = { id: -1, wallet_name: 'Tất cả ví', is_default: false, current_balance: 0 };

const SelectWalletScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { wallets = [], selectedWallet, onSelectWallet } = (route as any).params;
  const [filteredWallets, setFilteredWallets] = useState<WalletResponse[]>(wallets);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<WalletResponse[]>(
    Array.isArray(selectedWallet) && selectedWallet.length > 0
      ? wallets.filter((w: WalletResponse) => selectedWallet.includes(w.id))
      : wallets
  );

  const insets = useSafeAreaInsets();

  // Nếu selectedWallet là mảng rỗng hoặc không truyền vào, khi wallets thay đổi thì mặc định chọn tất cả
  useEffect(() => {
    if (!selectedWallet || (Array.isArray(selectedWallet) && selectedWallet.length === 0)) {
      setSelected(wallets);
    }
  }, [wallets, selectedWallet]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = wallets.filter((wallet: WalletResponse) =>
        wallet.wallet_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredWallets(filtered);
    } else {
      setFilteredWallets(wallets);
    }
  }, [searchQuery, wallets]);

  const handleSelect = (wallet: WalletResponse) => {
    setSelected((prev) => {
      const exists = prev.some((w) => w.id === wallet.id);
      if (exists) {
        return prev.filter((w) => w.id !== wallet.id);
      } else {
        return [...prev, wallet];
      }
    });
  };

  const handleConfirm = () => {
    if (onSelectWallet) onSelectWallet(selected.map(w => w.id));
    navigation.goBack();
  };

  const isAllWalletsSelected = filteredWallets.length > 0 && filteredWallets.every(fw => selected.some(w => w.id === fw.id));
  const handleSelectAll = () => {
    if (isAllWalletsSelected) {
      // Bỏ chọn tất cả ví đang hiển thị
      setSelected(prev => prev.filter(w => !filteredWallets.some(fw => fw.id === w.id)));
    } else {
      // Thêm tất cả ví đang hiển thị vào selected (không trùng lặp)
      setSelected(prev => {
        const ids = new Set(prev.map(w => w.id));
        return [...prev, ...filteredWallets.filter(w => !ids.has(w.id))];
      });
    }
  };

  const toggleWallet = (wallet: WalletResponse) => {
    setSelected((prev) => {
      const exists = prev.some((w) => w.id === wallet.id);
      if (exists) {
        return prev.filter((w) => w.id !== wallet.id);
      } else {
        return [...prev, wallet];
      }
    });
  };

  const renderWalletItem = ({ item }: { item: WalletResponse }) => {
    const checked = selected.some((w) => w.id === item.id);
    return (
      <TouchableOpacity
        style={styles.walletItem}
        onPress={() => toggleWallet(item)}
      >
        <View style={styles.walletIconContainer}>
          <Icon name="wallet-outline" size={24} color={item.is_default ? '#007AFF' : '#888'} />
        </View>
        <Text style={styles.walletName}>{item.wallet_name}</Text>
        {item.is_default && (
          <Text style={styles.defaultText}>(Mặc định)</Text>
        )}
        <Icon
          name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={checked ? '#007AFF' : '#ccc'}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn ví</Text>
        <TouchableOpacity onPress={handleSelectAll} style={{ marginLeft: 'auto' }}>
          <Text style={styles.selectAllText}>{isAllWalletsSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên ví"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredWallets}
        renderItem={renderWalletItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.walletList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy ví</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 10, margin: 16 }}
        onPress={handleConfirm}
      >
        <Text style={{ color: '#fff', textAlign: 'center', ...typography.semibold }}>Xác nhận</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FD',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    marginLeft: 16,
    color: '#333',
    ...typography.semibold,
  },
  selectAllText: {
    fontSize: 14,
    color: '#007AFF',
    ...typography.regular,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#333',
    ...typography.regular,
  },
  walletList: {
    paddingHorizontal: 16,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  walletName: {
    fontSize: 16,
    color: '#333',
    ...typography.regular,
  },
  defaultText: {
    fontSize: 13,
    color: '#1e90ff',
    marginLeft: 8,
    ...typography.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    ...typography.regular,
  },
});

export default SelectWalletScreen; 