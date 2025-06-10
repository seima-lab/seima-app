import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

// Type definitions
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  backgroundColor: string;
  isDisabled: boolean;
}

const AddBudgetCategoryScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();

  const [selectedCategory, setSelectedCategory] = useState('');

  // Existing budget categories (to disable in list)
  const existingBudgets = ['1', '2', '3']; // IDs of existing budget categories

  // Available categories
  const categories: Category[] = [
    {
      id: '1',
      name: t('budget.categories.transport'),
      icon: 'directions-car',
      color: '#26C6DA',
      backgroundColor: '#E0F7FA',
      isDisabled: existingBudgets.includes('1')
    },
    {
      id: '2',
      name: t('budget.categories.food'),
      icon: 'restaurant',
      color: '#FF7043',
      backgroundColor: '#FFF3E0',
      isDisabled: existingBudgets.includes('2')
    },
    {
      id: '3',
      name: t('budget.categories.shopping'),
      icon: 'shopping-cart',
      color: '#26C6DA',
      backgroundColor: '#E0F7FA',
      isDisabled: existingBudgets.includes('3')
    },
    {
      id: '4',
      name: t('budget.categories.entertainment'),
      icon: 'movie',
      color: '#9C27B0',
      backgroundColor: '#F3E5F5',
      isDisabled: false
    },
    {
      id: '5',
      name: t('budget.categories.healthcare'),
      icon: 'local-hospital',
      color: '#F44336',
      backgroundColor: '#FFEBEE',
      isDisabled: false
    },
    {
      id: '6',
      name: t('budget.categories.education'),
      icon: 'school',
      color: '#FF9800',
      backgroundColor: '#FFF3E0',
      isDisabled: false
    },
    {
      id: '7',
      name: t('budget.categories.utilities'),
      icon: 'home',
      color: '#4CAF50',
      backgroundColor: '#E8F5E8',
      isDisabled: false
    },
    {
      id: '8',
      name: t('budget.categories.travel'),
      icon: 'flight',
      color: '#2196F3',
      backgroundColor: '#E3F2FD',
      isDisabled: false
    }
  ];

  const handleContinue = () => {
    if (!selectedCategory) {
      Alert.alert(t('common.error'), t('budget.validation.categoryRequired'));
      return;
    }

    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) return;

    // Navigate to SetBudgetLimitScreen
    navigation.navigate('SetBudgetLimitScreen', {
      mode: 'add',
      category: {
        id: selectedCategoryData.id,
        name: selectedCategoryData.name,
        icon: selectedCategoryData.icon,
        color: selectedCategoryData.color,
        backgroundColor: selectedCategoryData.backgroundColor,
      }
    });
  };

  const CategoryItem = ({ item, index }: { item: Category; index: number }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        index === 0 && styles.firstCategoryItem,
        index === categories.length - 1 && styles.lastCategoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem,
        item.isDisabled && styles.disabledCategoryItem
      ]}
      onPress={() => {
        if (!item.isDisabled) {
          setSelectedCategory(item.id);
        }
      }}
      disabled={item.isDisabled}
    >
      <View style={styles.categoryItemContent}>
        <View style={[styles.categoryIcon, { backgroundColor: item.backgroundColor }]}>
          <Icon name={item.icon} size={24} color={item.isDisabled ? '#999' : item.color} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={[
            styles.categoryName,
            item.isDisabled && styles.disabledCategoryName
          ]}>
            {item.name}
          </Text>
          {item.isDisabled && (
            <Text style={styles.disabledLabel}>{t('budget.budgetCreated')}</Text>
          )}
        </View>
      </View>
      {!item.isDisabled && (
        <View style={styles.radioButton}>
          <View style={[
            styles.radioButtonOuter,
            selectedCategory === item.id && styles.radioButtonSelected
          ]}>
            {selectedCategory === item.id && (
              <View style={styles.radioButtonInner} />
            )}
          </View>
        </View>
      )}
      {index < categories.length - 1 && <View style={styles.separator} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('budget.selectCategoryTitle')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Category Selection */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>{t('budget.chooseCategory')}</Text>
          <View style={styles.categoryGroup}>
            <FlatList
              data={categories}
              renderItem={({ item, index }) => <CategoryItem item={item} index={index} />}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <View style={[styles.continueButtonContainer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            !selectedCategory && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedCategory}
        >
          <Text style={styles.continueButtonText}>
            {t('budget.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1e90ff',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categorySection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  categoryGroup: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
  },
  firstCategoryItem: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  lastCategoryItem: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  selectedCategoryItem: {
    backgroundColor: '#F0F8FF',
  },
  disabledCategoryItem: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 76,
    right: 16,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  disabledCategoryName: {
    color: '#999',
  },
  disabledLabel: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 2,
  },
  radioButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1e90ff',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e90ff',
  },
  continueButtonContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  continueButton: {
    backgroundColor: '#1e90ff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddBudgetCategoryScreen; 