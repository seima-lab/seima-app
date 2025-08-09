import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
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
import { CategoryResponse, categoryService, CategoryType } from '../services/categoryService';
import { deduplicateCategories, getIconColor, getIconForCategory } from '../utils/iconUtils';
  
const SelectCategoryScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { categoryType, onSelectCategories, selectedCategories: initialSelected = [], selectAllDefault = false } = (route as any).params;
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<CategoryResponse[]>(initialSelected);

  const insets = useSafeAreaInsets();

  // Debug selectedCategories changes
  useEffect(() => {
    console.log('🔄 SelectCategoryScreen - selectedCategories changed:', {
      count: selectedCategories.length,
      categories: selectedCategories.map(cat => ({
        id: cat.category_id,
        name: cat.category_name
      }))
    });
    
    // Check for duplicates
    const categoryIds = selectedCategories.map(cat => cat.category_id);
    const uniqueIds = new Set(categoryIds);
    if (categoryIds.length !== uniqueIds.size) {
      console.warn('⚠️ SelectCategoryScreen - DUPLICATE CATEGORIES DETECTED!', {
        total: categoryIds.length,
        unique: uniqueIds.size,
        duplicates: categoryIds.length - uniqueIds.size
      });
      
      // Find duplicates
      const duplicates = categoryIds.filter((id, index) => categoryIds.indexOf(id) !== index);
      console.warn('⚠️ SelectCategoryScreen - Duplicate category IDs:', duplicates);
    }
  }, [selectedCategories]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search query
    if (searchQuery) {
      const filtered = categories.filter(category => 
        category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Use system categories with userId and groupId as 0
      const loadedCategories = await categoryService.getAllCategoriesByTypeAndUser(
        categoryType === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME,
        0
      );
      
      setCategories(loadedCategories);
      setFilteredCategories(loadedCategories);
      if (selectAllDefault && initialSelected.length === 0) {
        setSelectedCategories(loadedCategories);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
      setLoading(false);
    }
  };

  const toggleCategory = (category: CategoryResponse) => {
    console.log('🔄 toggleCategory called with:', {
      category_id: category.category_id,
      category_name: category.category_name,
      current_selected_count: selectedCategories.length
    });
    
    setSelectedCategories((prev) => {
      // Check if category already exists by category_id
      const existingIndex = prev.findIndex((c) => c.category_id === category.category_id);
      
      if (existingIndex !== -1) {
        // Remove if exists
        console.log('🗑️ Removing existing category:', category.category_name);
        const newCategories = prev.filter((c) => c.category_id !== category.category_id);
        console.log('✅ Categories after removal:', newCategories.length);
        return newCategories;
      } else {
        // Add if not exists
        console.log('➕ Adding new category:', category.category_name);
        const newCategories = [...prev, category];
        console.log('✅ Categories after addition:', newCategories.length);
        return newCategories;
      }
    });
  };

  const areAllFilteredSelected = () => {
    if (filteredCategories.length === 0) return false;
    return filteredCategories.every(cat => selectedCategories.some(sel => sel.category_id === cat.category_id));
  };

  const handleSelectAllFiltered = () => {
    if (areAllFilteredSelected()) {
      // Deselect all filtered
      const filteredIds = new Set(filteredCategories.map(c => c.category_id));
      setSelectedCategories(prev => prev.filter(c => !filteredIds.has(c.category_id)));
    } else {
      // Select all filtered
      setSelectedCategories(prev => deduplicateCategories([...prev, ...filteredCategories]));
    }
  };

  const renderCategoryItem = ({ item }: { item: CategoryResponse }) => {
    const iconName = getIconForCategory(item.category_icon_url, categoryType);
    const iconColor = getIconColor(iconName, categoryType);
    const checked = selectedCategories.some((c) => c.category_id === item.category_id);

    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => toggleCategory(item)}
      >
        <View style={styles.categoryIconContainer}>
          <Icon name={iconName} size={24} color={iconColor} />
        </View>
        <Text style={styles.categoryName}>{item.category_name}</Text>
        <Icon
          name={checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={checked ? '#007AFF' : '#ccc'}
          style={{ marginLeft: 'auto' }}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  } 

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={loadCategories} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleConfirm = () => {
    // Validate and clean up categories before sending back
    const cleanedCategories = deduplicateCategories(selectedCategories);
    
    console.log('🔄 SelectCategoryScreen - Confirming categories:', {
      original: selectedCategories.length,
      cleaned: cleanedCategories.length
    });
    
    if (cleanedCategories.length !== selectedCategories.length) {
      console.warn('⚠️ SelectCategoryScreen - Removed duplicates before confirming');
    }
    
    onSelectCategories(cleanedCategories);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryType === 'expense' ? 'Chọn hạng mục chi' : 'Chọn hạng mục thu'}
        </Text>
        <TouchableOpacity onPress={handleSelectAllFiltered} style={{ marginLeft: 'auto' }}>
          <Text style={styles.selectAllText}>{areAllFilteredSelected() ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên hạng mục"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.category_id.toString()}
        contentContainerStyle={styles.categoryList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy hạng mục</Text>
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
    ...typography.semibold,
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
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
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
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F8FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#333',
    ...typography.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FD',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    ...typography.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F5F8FD',
  },
  errorText: {
    fontSize: 18,
    color: '#ff375f',
    textAlign: 'center',
    marginBottom: 16,
    ...typography.regular,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    ...typography.semibold,
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

export default SelectCategoryScreen; 