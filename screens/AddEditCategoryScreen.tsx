import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';
import { ApiService } from '../services/apiService';
import { categoryService, CategoryType } from '../services/categoryService';
import { secureApiService } from '../services/secureApiService';

// Icon configurations for different categories - COMPLETE DATABASE MAPPING
const EXPENSE_ICONS = [
  // Food & Dining
  { name: 'silverware-fork-knife', color: '#ff9500' },
  { name: 'coffee', color: '#8b4513' },
  { name: 'hamburger', color: '#ff6b35' },
  { name: 'food-apple', color: '#ff9500' },
  { name: 'cake', color: '#ff9500' },
  
  // Daily & Shopping
  { name: 'bottle-soda', color: '#32d74b' },
  { name: 'shopping', color: '#32d74b' },
  { name: 'cart', color: '#228b22' },
  { name: 'store', color: '#32d74b' },
  { name: 'minus-circle', color: '#32d74b' },
  
  // Clothing & Fashion
  { name: 'tshirt-crew', color: '#007aff' },
  { name: 'shoe-heel', color: '#1e90ff' },
  { name: 'hanger', color: '#007aff' },
  { name: 'tshirt-v', color: '#4169e1' },
  
  // Beauty & Cosmetic
  { name: 'lipstick', color: '#ff2d92' },
  { name: 'face-woman', color: '#dda0dd' },
  { name: 'spray', color: '#ff69b4' },
  
  // Entertainment & Social
  { name: 'glass-cocktail', color: '#ffcc02' },
  { name: 'gamepad-variant', color: '#ff8c00' },
  { name: 'movie', color: '#ffd700' },
  { name: 'music', color: '#ffa500' },
  { name: 'party-popper', color: '#ffcc02' },
  { name: 'glass-wine', color: '#ffcc02' },
  { name: 'account-group', color: '#696969' },
  
  // Health & Medical
  { name: 'pill', color: '#30d158' },
  { name: 'hospital-box', color: '#228b22' },
  { name: 'pharmacy', color: '#32cd32' },
  { name: 'dumbbell', color: '#00ff7f' },
  { name: 'doctor', color: '#30d158' },
  { name: 'stethoscope', color: '#30d158' },
  { name: 'medical-bag', color: '#30d158' },
  
  // Education & Learning
  { name: 'book-open-variant', color: '#ff375f' },
  { name: 'school', color: '#ff375f' },
  { name: 'book-open-page-variant', color: '#dc143c' },
  { name: 'book-open', color: '#ff375f' },
  { name: 'book', color: '#ff375f' },
  { name: 'pencil', color: '#b22222' },
  
  // Utilities
  { name: 'flash', color: '#00c7be' },
  { name: 'water', color: '#00bfff' },
  { name: 'wifi', color: '#00c7be' },
  { name: 'fire', color: '#ff4500' },
  { name: 'home-lightning-bolt', color: '#00c7be' },
  { name: 'lightning-bolt', color: '#00c7be' },
  { name: 'power-plug', color: '#00c7be' },
  
  // Transportation
  { name: 'train', color: '#9370db' },
  { name: 'car', color: '#9370db' },
  { name: 'bus', color: '#9370db' },
  { name: 'taxi', color: '#9370db' },
  { name: 'gas-station', color: '#ff6347' },
  { name: 'parking', color: '#9370db' },
  { name: 'airplane', color: '#9370db' },
  { name: 'motorbike', color: '#9370db' },
  
  // Communication
  { name: 'cellphone', color: '#00c7be' },
  { name: 'phone', color: '#00c7be' },
  
  // Housing
  { name: 'home-city', color: '#ff9500' },
  { name: 'home', color: '#ff9500' },
  { name: 'apartment', color: '#ff9500' },
  { name: 'home-outline', color: '#ff9500' },
  { name: 'key', color: '#ff9500' },
  
  // Work & Office
  { name: 'briefcase', color: '#708090' },
  { name: 'office-building', color: '#708090' },
  
  // Additional common
  { name: 'dots-horizontal', color: '#666' },
  { name: 'bank-transfer', color: '#4682b4' },
  { name: 'bank', color: '#4682b4' },
  { name: 'credit-card-off', color: '#ff6b6b' },
  { name: 'shield-account', color: '#32cd32' },
  { name: 'credit-card-multiple', color: '#ff7f50' },
  { name: 'tools', color: '#ff9500' },
  { name: 'wrench', color: '#ff9500' },
  { name: 'dog', color: '#8b4513' },
  { name: 'baby', color: '#ffb6c1' },
  { name: 'beach', color: '#00ced1' },
  { name: 'calendar-heart', color: '#ff69b4' },
  { name: 'soccer', color: '#32d74b' },
  { name: 'palette', color: '#9370db' },
  { name: 'heart', color: '#ff1493' },
  { name: 'file-document', color: '#696969' },
  { name: 'alert-circle', color: '#ff4500' },
  { name: 'cash-minus', color: '#ff6b6b' },
  { name: 'gift', color: '#bf5af2' },
  { name: 'ticket', color: '#ff375f' },
];

const INCOME_ICONS = [
  // Work & Salary
  { name: 'cash', color: '#32d74b' },
  { name: 'cash-plus', color: '#00ff00' },
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
  { name: 'home', color: '#ff9500' },
  
  // Sales & Commission
  { name: 'cart', color: '#228b22' },
  
  // Additional Income Sources
  { name: 'piggy-bank', color: '#32d74b' },
  { name: 'credit-card', color: '#4682b4' },
  { name: 'wallet', color: '#8b4513' },
  { name: 'cash-minus', color: '#ff6b6b' },
  
  // Additional common icons
  { name: 'dots-horizontal', color: '#666' },
  { name: 'bank-transfer', color: '#4682b4' },
  { name: 'credit-card-multiple', color: '#ff7f50' },
  { name: 'shield-account', color: '#32cd32' },
];

// Additional color options for customization
const CUSTOM_COLORS = [
  '#ff375f', '#ff9500', '#ffcc02', '#32d74b', '#00c7be',
  '#007aff', '#bf5af2', '#ff2d92', '#8e8e93', '#000000'
];

// Get color for an icon based on category type (matching other screens)
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

export default function AddEditCategoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditCategoryScreen'>>();
  const { mode, type, category } = route.params;
  const { user } = useAuth();
  
  const availableIcons = type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;
  
  // Safe icon selection with fallback
  const getInitialIcon = () => {
    if (category?.icon) {
      const foundIcon = availableIcons.find(icon => icon.name === category.icon);
      if (foundIcon) {
        return category.icon;
      } else {
        console.log('⚠️ Using fallback icon for:', category.icon);
        return availableIcons[0].name;
      }
    }
    return type === 'expense' ? EXPENSE_ICONS[0].name : INCOME_ICONS[0].name;
  };
  
  const [categoryName, setCategoryName] = useState(category?.label || '');
  const [selectedIcon, setSelectedIcon] = useState(getInitialIcon());
  const [selectedColor, setSelectedColor] = useState(
    category?.color || 
    getIconColor(
      getInitialIcon(), 
      type
    )
  );
  const [isSaving, setIsSaving] = useState(false);
  
  const title = mode === 'add' ? t('createNew') : t('editCategory');
  
  // Get icons based on category type
  const getAvailableIcons = () => {
    return type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;
  };
  
  const handleSave = async () => {
    console.log('💾 === SAVE CATEGORY START ===');
    console.log('📊 Current Form State:');
    console.log('  - categoryName:', `"${categoryName}"`, '(trimmed:', `"${categoryName.trim()}"`, ')');
    console.log('  - selectedIcon:', selectedIcon);
    console.log('  - selectedColor:', selectedColor);
    console.log('  - type (tab):', type);
    console.log('  - mode:', mode);
    
    if (!categoryName.trim()) {
      console.log('❌ Validation failed: Category name is empty');
      Alert.alert(t('common.error'), t('pleaseEnterCategoryName'));
      return;
    }

    if (!user) {
      console.log('❌ Validation failed: User not authenticated');
      Alert.alert(t('common.error'), 'User not authenticated');
      return;
    }

    console.log('👤 User Info:');
    console.log('  - user.id:', user.id, '(type:', typeof user.id, ')');
    console.log('  - parsed user_id:', parseInt(user.id), '(type:', typeof parseInt(user.id), ')');

    setIsSaving(true);
    
    try {
      // Get user profile to get real userId
      const userProfile = await secureApiService.getCurrentUserProfile();
      const userId = userProfile.user_id;
      
      if (mode === 'add') {
        // Create new category using API - Format exactly as shown by user
        const createRequest = {
          category_name: categoryName.trim(),
          category_type: type === 'expense' ? 1 : 0,
          category_icon_url: selectedIcon || "",
          is_system_defined: 0,
          user_id: userId
        };

        console.log('🔄 Creating category with ApiService');
        
        const apiService = ApiService.getInstance();
        const result = await apiService.post('/api/v1/categories', createRequest);
        
        console.log('✅ Category created successfully:');
        console.log('📥 API Response:', JSON.stringify(result, null, 2));
        
        Alert.alert(
          t('common.success'), 
          'Category created successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
        
      } else {
        // Edit existing category using API PUT
        if (!category?.key) {
          throw new Error('Category ID not found for editing');
        }
        
        const categoryId = parseInt(category.key);
        console.log('🔧 Editing category ID:', categoryId);
        
        // Use CreateCategoryRequest format as per backend API specification
        const updateRequest = {
          category_name: categoryName.trim(),
          category_type: type === 'expense' ? CategoryType.EXPENSE : CategoryType.INCOME,
          category_icon_url: selectedIcon || "",
          is_system_defined: false,
          user_id: userId,
          group_id: 0 // Same as create - groupId = 0 for user-specific categories
        };
        
        console.log('🔄 Updating category with request:', updateRequest);
        
        await categoryService.updateCategory(categoryId, updateRequest);
        
        console.log('✅ Category updated successfully');
        
        Alert.alert(
          t('common.success'),
          'Category updated successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
      
    } catch (error: any) {
      console.error('❌ === SAVE CATEGORY ERROR ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Error name:', error.name);
      
      let errorMessage = 'Failed to save category';
      if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Final error message to user:', errorMessage);
      
      Alert.alert(
        t('common.error'),
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      console.log('🏁 === SAVE CATEGORY END ===');
      console.log('Setting isSaving to false');
      setIsSaving(false);
    }
  };

  const renderIconItem = ({ item }: { item: { name: string; color: string } }) => {
    const isSelected = selectedIcon === item.name;
    const iconColor = isSelected ? selectedColor : getIconColor(item.name, type, item.color);
    
    return (
      <TouchableOpacity
        style={[
          styles.iconItem,
          isSelected && styles.iconItemSelected
        ]}
        onPress={() => {
          setSelectedIcon(item.name);
          // Chỉ cập nhật màu nếu đang ở mode 'add' hoặc không có màu từ database
          if (mode === 'add' || !category?.color) {
            setSelectedColor(getIconColor(item.name, type, item.color));
          }
        }}
      >
        <Icon 
          name={item.name} 
          size={28} 
          color={iconColor}
        />
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeAreaContent}>
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
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('categoryName')}</Text>
            <TextInput
              style={styles.nameInput}
              placeholder={t('categoryNamePlaceholder')}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholderTextColor="#C7C7CC"
              returnKeyType="done"
              blurOnSubmit={false}
            />
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('icon')}</Text>
            <FlatList
              data={getAvailableIcons()}
              renderItem={renderIconItem}
              keyExtractor={item => item.name}
              numColumns={4}
              scrollEnabled={false}
              contentContainerStyle={styles.iconGrid}
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  safeAreaContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 0.5,
    borderColor: '#C6C6C8',
  },
  iconGrid: {
    paddingTop: 8,
  },
  iconItem: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  iconItemSelected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },

  bottomContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 34,
  },
  saveButton: {
    backgroundColor: '#007aff',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  saveButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
}); 