import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import IconBack from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import type { RootStackParamList } from '../navigation/types';

const EXPENSE_CATEGORIES = [
  { key: 'food', label: 'categoryNames.food', icon: 'silverware-fork-knife', color: '#ff9500' },
  { key: 'daily', label: 'categoryNames.daily', icon: 'bottle-soda', color: '#32d74b' },
  { key: 'clothes', label: 'categoryNames.clothes', icon: 'tshirt-crew', color: '#007aff' },
  { key: 'cosmetic', label: 'categoryNames.cosmetic', icon: 'lipstick', color: '#ff2d92' },
  { key: 'social', label: 'categoryNames.social', icon: 'glass-cocktail', color: '#ffcc02' },
  { key: 'health', label: 'categoryNames.health', icon: 'pill', color: '#30d158' },
  { key: 'education', label: 'categoryNames.education', icon: 'book-open-variant', color: '#ff375f' },
  { key: 'electric', label: 'categoryNames.electric', icon: 'flash', color: '#00c7be' },
  { key: 'transport', label: 'categoryNames.transport', icon: 'train', color: '#bf5af2' },
  { key: 'phone', label: 'categoryNames.phone', icon: 'cellphone', color: '#6ac4dc' },
  { key: 'rent', label: 'categoryNames.rent', icon: 'home-city', color: '#ff9500' },
];

const INCOME_CATEGORIES = [
  { key: 'salary', label: 'categoryNames.salary', icon: 'cash', color: '#32d74b' },
  { key: 'bonus', label: 'categoryNames.bonus', icon: 'gift', color: '#ff9500' },
  { key: 'investment', label: 'categoryNames.investment', icon: 'chart-line', color: '#007aff' },
  { key: 'freelance', label: 'categoryNames.freelance', icon: 'laptop', color: '#ff375f' },
  { key: 'business', label: 'categoryNames.business', icon: 'store', color: '#30d158' },
  { key: 'rental', label: 'categoryNames.rental', icon: 'home-account', color: '#ffcc02' },
  { key: 'dividend', label: 'categoryNames.dividend', icon: 'bank', color: '#ff2d92' },
  { key: 'interest', label: 'categoryNames.interest', icon: 'percent', color: '#00c7be' },
  { key: 'gift_money', label: 'categoryNames.giftMoney', icon: 'hand-heart', color: '#bf5af2' },
  { key: 'selling', label: 'categoryNames.selling', icon: 'cart', color: '#6ac4dc' },
];

export default function EditCategoryScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'EditCategoryScreen'>>();
  const { type: initialType } = route.params;
  
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>(initialType);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const categories = activeTab === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const handleAddCategory = () => {
    Alert.alert(
      t('addCategory'),
      'Add new category functionality will be implemented in the next version.',
      [{ text: 'OK' }]
    );
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleDeleteCategory = (categoryKey: string, categoryLabel: string) => {
    Alert.alert(
      t('deleteCategory'),
      t('deleteCategoryConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete category logic
            console.log('Delete category:', categoryKey);
          }
        }
      ]
    );
  };

  const handleCategoryPress = (item: any) => {
    if (item.key === 'add_category') {
      // Navigate to add new category screen
      navigation.navigate('AddEditCategoryScreen', {
        mode: 'add',
        type: activeTab
      });
    } else if (isEditMode) {
      handleDeleteCategory(item.key, t(item.label));
    } else {
      // Navigate to edit existing category screen
      navigation.navigate('AddEditCategoryScreen', {
        mode: 'edit',
        type: activeTab,
        category: {
          key: item.key,
          label: t(item.label),
          icon: item.icon,
          color: item.color
        }
      });
    }
  };

  const renderCategoryItem = ({ item }: { item: any }) => {
    if (item.key === 'add_category') {
      return (
        <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategoryPress(item)}>
          <View style={styles.categoryContent}>
            <Text style={styles.addCategoryLabel}>{t('addCategory')}</Text>
          </View>
          {!isEditMode && <Icon name="chevron-right" size={20} color="#c7c7cc" />}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.categoryItem} onPress={() => handleCategoryPress(item)}>
        {isEditMode && (
          <TouchableOpacity 
            style={styles.minusButton}
            onPress={() => handleDeleteCategory(item.key, t(item.label))}
          >
            <Icon name="minus" size={16} color="#fff" />
          </TouchableOpacity>
        )}
        <View style={styles.categoryContent}>
          <Icon name={item.icon} size={24} color={item.color} />
          <Text style={styles.categoryLabel}>
            {t(item.label)}
          </Text>
        </View>
        {!isEditMode && <Icon name="chevron-right" size={20} color="#c7c7cc" />}
      </TouchableOpacity>
    );
  };

  // Combine add category item with regular categories
  const listData = [
    { key: 'add_category', label: t('addCategory') },
    ...categories
  ];

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
          <IconBack name="arrow-back" size={24} color="#007aff" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.tabSwitch}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'expense' && styles.tabItemActive]}
              onPress={() => setActiveTab('expense')}
            >
              <Text style={[styles.tabText, activeTab === 'expense' && styles.tabTextActive]}>
                {t('expense')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'income' && styles.tabItemActive]}
              onPress={() => setActiveTab('income')}
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

      {/* Categories List */}
      <FlatList
        data={listData}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.key}
        style={styles.categoriesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
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
  addCategoryLabel: {
    fontSize: 16,
    color: '#8e8e93',
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