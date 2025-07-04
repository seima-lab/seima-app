import { NavigationProp, RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
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
import { secureApiService } from '../services/secureApiService';
import { getIconColor } from '../utils/iconUtils';

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
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Sync activeTab with route params when navigating back
  useEffect(() => {
    const routeType = route.params.type;
    if (routeType !== activeTab) {
      console.log('🔄 Syncing activeTab with route params:', { routeType, currentActiveTab: activeTab });
      setActiveTab(routeType);
    }
  }, [route.params.type]);

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
      console.log('🎯 Route params type vs activeTab:', { routeType: route.params.type, activeTab });
      
      // Convert tab to CategoryType
      const categoryType = activeTab === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME;
      console.log('🔍 CategoryType resolved:', { activeTab, categoryType });
      
      // Use same logic as AddExpenseScreen: get userId from /me API and set groupId = 0
      const userProfile = await secureApiService.getCurrentUserProfile();
      const userId = userProfile.user_id;
      const groupId = 0; // Same as AddExpenseScreen to fetch all user-specific categories
      
      console.log('✅ User profile loaded for categories:', { userId, groupId, categoryType });
      
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
      setHasInitiallyLoaded(true);
      
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

  // Refresh data when screen is focused (for updated categories)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we have initially loaded data (not on first mount)
      if (hasInitiallyLoaded) {
        console.log('🔄 EditCategoryScreen focused - refreshing categories');
        console.log('🎯 Current activeTab before refresh:', activeTab);
        console.log('🎯 Route params type:', route.params.type);
        loadCategories();
      }
    }, [hasInitiallyLoaded, activeTab])
  );

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
      // Check if it's a system category
      if (item.is_system_defined) {
        Alert.alert(
          t('common.info'),
          'This is a default system category that cannot be edited',
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Navigate to edit existing category screen (only for user-created categories)
      console.log('🔧 Navigating to edit category:', {
        item_key: item.key,
        item_label: item.label,
        item_icon: item.icon,
        item_color: item.color,
        calculated_color: getIconColor(item.icon, activeTab, item.color),
        activeTab: activeTab
      });
      
      navigation.navigate('AddEditCategoryScreen', {
        mode: 'edit',
        type: activeTab,
        category: {
          key: item.key,
          label: item.label,
          icon: item.icon,
          color: getIconColor(item.icon, activeTab) // Use centralized color from iconUtils
        }
      });
    }
  };

  const handleTabChange = (newTab: 'expense' | 'income') => {
    if (newTab !== activeTab) {
      console.log('🔄 Tab change:', { from: activeTab, to: newTab });
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
          <Icon name={item.icon} size={24} color={getIconColor(item.icon, activeTab)} />
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