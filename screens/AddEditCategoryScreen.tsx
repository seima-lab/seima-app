import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';

// Icon configurations for different categories
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
  
  console.log('🎨 AddEditCategoryScreen params:', {
    mode,
    type,
    category
  });
  
  const [categoryName, setCategoryName] = useState(category?.label || '');
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || (type === 'expense' ? EXPENSE_ICONS[0].name : INCOME_ICONS[0].name));
  const [selectedColor, setSelectedColor] = useState(
    category?.color || 
    getIconColor(
      category?.icon || (type === 'expense' ? EXPENSE_ICONS[0].name : INCOME_ICONS[0].name), 
      type
    )
  );
  
  console.log('🎨 Initial state:', {
    selectedIcon,
    selectedColor,
    calculatedColor: getIconColor(selectedIcon, type, category?.color)
  });
  
  const title = mode === 'add' ? t('createNew') : t('editCategory');
  
  // Get icons based on category type
  const getAvailableIcons = () => {
    return type === 'expense' ? EXPENSE_ICONS : INCOME_ICONS;
  };
  
  const handleSave = () => {
    if (!categoryName.trim()) {
      alert(t('pleaseEnterCategoryName'));
      return;
    }
    
    // TODO: Implement save logic
    console.log('Save category:', {
      name: categoryName,
      icon: selectedIcon,
      color: selectedColor,
      type,
      mode
    });
    
    navigation.goBack();
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
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('save')}</Text>
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
}); 