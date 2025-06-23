import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { categoryService, CategoryType, LocalCategory } from '../services/categoryService';

// Icon configurations for different categories (matching AddEditCategoryScreen)
const EXPENSE_ICONS = [
  // Based on the Vietnamese categories in the image
  { name: 'silverware-fork-knife', color: '#ff9500' }, // Ăn uống - cam
  { name: 'food-apple', color: '#ff9500' },
  { name: 'hamburger', color: '#ff9500' },
  { name: 'coffee', color: '#ff9500' },
  { name: 'cake', color: '#ff9500' },
  
  { name: 'minus-circle', color: '#32d74b' }, // Chi tiêu hàng ngày - xanh lá
  { name: 'cart', color: '#32d74b' },
  { name: 'shopping', color: '#32d74b' },
  
  { name: 'tshirt-crew', color: '#007aff' }, // Quần áo - xanh dương
  { name: 'hanger', color: '#007aff' },
  { name: 'tshirt-v', color: '#007aff' }, // dress -> tshirt-v
  
  { name: 'lipstick', color: '#ff2d92' }, // Mỹ phẩm - hồng
  { name: 'face-woman', color: '#ff2d92' },
  { name: 'spray', color: '#ff2d92' }, // perfume -> spray
  
  { name: 'glass-wine', color: '#ffcc02' }, // Phí giao lưu - vàng
  { name: 'account-group', color: '#ffcc02' },
  { name: 'party-popper', color: '#ffcc02' },
  
  { name: 'hospital-box', color: '#30d158' }, // Y tế - xanh lá
  { name: 'pill', color: '#30d158' }, // pills -> pill
  { name: 'stethoscope', color: '#30d158' },
  { name: 'medical-bag', color: '#30d158' },
  
  { name: 'book-open', color: '#ff2d92' }, // Giáo dục - hồng
  { name: 'school', color: '#ff2d92' },
  { name: 'pencil', color: '#ff2d92' },
  
  { name: 'lightning-bolt', color: '#00c7be' }, // Tiền điện - xanh ngọc
  { name: 'flash', color: '#00c7be' },
  { name: 'power-plug', color: '#00c7be' },
  
  { name: 'car', color: '#9370db' }, // Đi lại - tím
  { name: 'bus', color: '#9370db' },
  { name: 'train', color: '#9370db' },
  { name: 'airplane', color: '#9370db' },
  { name: 'motorbike', color: '#9370db' }, // motorcycle -> motorbike
  { name: 'taxi', color: '#9370db' },
  
  { name: 'phone', color: '#00c7be' }, // Phí liên lạc - xanh ngọc
  { name: 'wifi', color: '#00c7be' },
  { name: 'cellphone', color: '#00c7be' },
  
  { name: 'home', color: '#ff9500' }, // Tiền nhà - cam
  { name: 'home-outline', color: '#ff9500' }, // house -> home-outline
  { name: 'key', color: '#ff9500' },
  
  { name: 'gamepad-variant', color: '#ff375f' }, // Đi chơi - đỏ
  { name: 'movie', color: '#ff375f' },
  { name: 'music', color: '#ff375f' },
  { name: 'ticket', color: '#ff375f' },
  
  // Other common icons
  { name: 'gift', color: '#bf5af2' },
  { name: 'tools', color: '#ff9500' },
  { name: 'water', color: '#00c7be' },
];

const INCOME_ICONS = [
  // Work & Salary
  { name: 'cash', color: '#32d74b' },
  { name: 'briefcase', color: '#708090' },
  { name: 'office-building', color: '#708090' },
  { name: 'laptop', color: '#ff375f' },
  
  // Investment & Business
  { name: 'chart-line', color: '#007aff' },
  { name: 'bank', color: '#ff2d92' },
  { name: 'percent', color: '#00c7be' },
  { name: 'store', color: '#30d158' },
  
  // Gifts & Rewards
  { name: 'gift', color: '#bf5af2' },
  { name: 'hand-heart', color: '#ff2d92' },
  { name: 'star', color: '#ffcc02' },
  { name: 'trophy', color: '#ffd700' },
  
  // Property & Rental
  { name: 'home-account', color: '#ffcc02' },
  { name: 'apartment', color: '#daa520' },
  { name: 'key', color: '#32d74b' },
  
  // Additional Income Sources
  { name: 'piggy-bank', color: '#32d74b' },
  { name: 'cash-plus', color: '#00ff00' },
  { name: 'credit-card', color: '#4682b4' },
  { name: 'wallet', color: '#8b4513' },
];

export default function EditCategoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditCategoryScreen'>>();
  const { user } = useAuth();
  const { type: initialType } = route.params;
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(initialType);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get color for an icon based on category type
  const getIconColor = (iconName: string, categoryType: 'expense' | 'income', dbColor?: string): string => {
    // If color exists in database, use it
    if (dbColor) {
      return dbColor;
    }
    
    // Otherwise, use default color mapping
    const iconSet = categoryType === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;
    const iconConfig = iconSet.find(icon => icon.name === iconName);
    return iconConfig ? iconConfig.color : '#666'; // Default color if not found
  };

  // Load categories when component mounts or tab changes
  useEffect(() => {
    loadCategories();
  }, [activeTab]);

  const loadCategories = async () => {
    if (!user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading categories for:', { activeTab, userId: user.id });
      
      // Convert tab to CategoryType
      const categoryType = activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME;
      
      // For now, using hardcoded userId and groupId - you should get these from user context
      const userId = parseInt(user.id) || 1;
      const groupId = 1; // You might want to get this from user context or app state
      
      // Fetch categories from API
      const apiCategories = await categoryService.getAllCategoriesByTypeAndUser(
        categoryType,
        userId,
        groupId
      );
      
      console.log('📊 API categories received:', apiCategories);
      
      // Convert API categories to local format
      const localCategories = apiCategories.map(apiCategory => 
        categoryService.convertToLocalCategory(apiCategory)
      );
      
      console.log('🔄 Converted to local categories:', localCategories);
      
      setCategories(localCategories);
      
    } catch (err: any) {
      console.error('❌ Failed to load categories:', err);
      setError(err.message || 'Failed to load categories');
      
      // Fallback to default categories
      const categoryType = activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME;
      const defaultCategories = categoryService.getDefaultCategories(categoryType);
      setCategories(defaultCategories);
      
      Alert.alert(
        t('common.error'),
        'Failed to load categories from server. Using default categories.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    // Navigate to add new category screen
    navigation.navigate('AddEditCategoryScreen', {
      mode: 'add',
      type: activeTab
    });
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleDeleteCategory = async (categoryId: string, categoryLabel: string) => {
    if (!user) {
      Alert.alert(t('common.error'), 'User not authenticated');
      return;
    }

    Alert.alert(
      t('deleteCategory'),
      `Are you sure you want to delete "${categoryLabel}"?`,
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Deleting category:', categoryId);
              
              // Call API to delete category
              await categoryService.deleteCategory(parseInt(categoryId));
              
              console.log('✅ Category deleted successfully');
              
              // Refresh categories list
              await loadCategories();
              
              Alert.alert(
                t('common.success'),
                'Category deleted successfully',
                [{ text: 'OK' }]
              );
              
            } catch (err: any) {
              console.error('❌ Failed to delete category:', err);
              Alert.alert(
                t('common.error'),
                err.message || 'Failed to delete category'
              );
            }
          }
        }
      ]
    );
  };

  const handleCategoryPress = (item: LocalCategory) => {
    if (item.key === 'add_category') {
      handleAddCategory();
    } else if (isEditMode) {
      // Only allow deletion of non-system categories
      if (item.is_system_defined) {
        Alert.alert(
          t('common.info'),
          'System categories cannot be deleted',
          [{ text: 'OK' }]
        );
        return;
      }
      handleDeleteCategory(item.key, item.label);
    } else {
      // Navigate to edit existing category screen
      navigation.navigate('AddEditCategoryScreen', {
        mode: 'edit',
        type: activeTab,
        category: {
          key: item.key,
          label: item.label,
          icon: item.icon,
          color: getIconColor(item.icon, activeTab, item.color) // Truyền màu chính xác
        }
      });
    }
  };

  const handleTabChange = (newTab: 'expense' | 'income') => {
    if (newTab !== activeTab) {
      setActiveTab(newTab);
      setIsEditMode(false); // Reset edit mode when switching tabs
    }
  };

  const renderCategoryItem = ({ item }: { item: LocalCategory }) => {
    if (item.key === 'add_category') {
      return (
        <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategoryPress(item)}>
          <View style={styles.categoryContent}>
            <Icon name="plus" size={24} color="#007aff" />
            <Text style={styles.addCategoryLabel}>{t('addCategory')}</Text>
          </View>
          {!isEditMode && <Icon name="chevron-right" size={20} color="#c7c7cc" />}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategoryPress(item)}>
        {isEditMode && !item.is_system_defined && (
          <TouchableOpacity 
            style={styles.minusButton}
            onPress={() => handleDeleteCategory(item.key, item.label)}
          >
            <Icon name="minus" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.categoryContent}>
          <Icon name={item.icon} size={24} color={getIconColor(item.icon, activeTab, item.color)} />
          <Text style={styles.categoryLabel}>
            {item.label}
            {item.is_system_defined && <Text style={styles.systemBadge}> (System)</Text>}
          </Text>
        </View>
        {!isEditMode && <Icon name="chevron-right" size={20} color="#c7c7cc" />}
      </TouchableOpacity>
    );
  };

  // Prepare data for FlatList
  const listData: LocalCategory[] = [
    { 
      key: 'add_category', 
      label: t('addCategory'), 
      icon: 'plus', 
      color: '#007aff',
      category_id: -1,
      is_system_defined: false
    },
    ...categories
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" translucent={false} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007aff" />
          <Text style={styles.loadingText}>{t('common.loading')}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#007aff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'expense' && styles.tabItemActive]}
              onPress={() => handleTabChange('expense')}
            >
              <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
                {t('expense')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'income' && styles.tabItemActive]}
              onPress={() => handleTabChange('income')}
            >
              <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActive]}>
                {t('incomeLabel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Text style={styles.editButtonText}>{isEditMode ? t('done') : t('edit')}</Text>
        </TouchableOpacity>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCategories}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Categories List */}
      <FlatList
        data={listData}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.key}
        style={styles.categoriesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        refreshing={loading}
        onRefresh={loadCategories}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8e8e93',
  },
  errorContainer: {
    backgroundColor: '#fff2f2',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderColor: '#fecaca',
    borderWidth: 1,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    backgroundColor: '#007aff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: '#e5e5ea',
    borderRadius: 16,
    width: 200,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  tabItemActive: {
    backgroundColor: '#007aff',
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#8e8e93',
  },
  tabTextActive: {
    color: '#fff',
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '400',
  },
  categoriesList: {
    flex: 1,
  },
  categoriesContainer: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
    fontWeight: '400',
  },
  systemBadge: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '300',
  },
  addCategoryLabel: {
    fontSize: 16,
    color: '#007aff',
    marginLeft: 12,
    fontWeight: '400',
  },
  minusButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
}); 