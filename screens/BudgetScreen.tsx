import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

const { width } = Dimensions.get('window');

// Type definitions
interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget: number;
  backgroundColor: string;
}

interface CircularProgressProps {
  spent: number;
  budget: number;
  color: string;
  icon: string;
  backgroundColor: string;
}

const BudgetScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const [selectedPeriod, setSelectedPeriod] = useState(t('budget.currentMonth'));
  const [isPeriodModalVisible, setIsPeriodModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetCategory | null>(null);

  // Dữ liệu ngân sách mẫu
  const budgetData: BudgetCategory[] = [
    {
      id: '1',
      name: t('budget.categories.transport'),
      icon: 'directions-car',
      color: '#26C6DA',
      spent: 0,
      budget: 100000,
      backgroundColor: '#E0F7FA'
    },
    {
      id: '2', 
      name: t('budget.categories.food'),
      icon: 'restaurant',
      color: '#FF7043',
      spent: 88800,
      budget: 100000,
      backgroundColor: '#FFF3E0'
    },
    {
      id: '3',
      name: t('budget.categories.shopping'), 
      icon: 'shopping-cart',
      color: '#26C6DA',
      spent: 0,
      budget: 100000,
      backgroundColor: '#E0F7FA'
    }
  ];

  const CircularProgress = ({ spent, budget, color, icon, backgroundColor }: CircularProgressProps) => {
    const percentage = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const radius = 24;
    const strokeWidth = 3;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <View style={styles.circularProgressContainer}>
        <Svg
          height={radius * 2}
          width={radius * 2}
          style={styles.circularProgressSvg}
        >
          {/* Background circle */}
          <Circle
            stroke="#E5E5E5"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <Circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            transform={`rotate(-90 ${radius} ${radius})`}
          />
        </Svg>
        <View style={[styles.circularProgressIcon, { backgroundColor }]}>
          <Icon name={icon} size={20} color={color} />
        </View>
      </View>
    );
  };

  const BudgetCategoryItem = ({ item }: { item: BudgetCategory }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <View style={styles.categoryInfo}>
          <CircularProgress 
            spent={item.spent}
            budget={item.budget}
            color={item.color}
            icon={item.icon}
            backgroundColor={item.backgroundColor}
          />
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryName}>{item.name}</Text>
            <Text style={styles.categoryBudget}>
              {t('budget.remaining')} {(item.budget - item.spent).toLocaleString()}đ
            </Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            setSelectedBudgetItem(item);
            setIsOptionsModalVisible(true);
          }}
        >
          <Icon name="more-horiz" size={24} color="#999" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.amountSection}>
        <Text style={[styles.spentAmount, item.spent > 0 && { color: '#FF5722' }]}>
          {item.spent > 0 ? `${t('budget.exceeded')} ${item.spent.toLocaleString()}đ` : `${t('budget.spent')} ${item.spent.toLocaleString()}đ`}
        </Text>
        <Text style={styles.budgetAmount}>/ {item.budget.toLocaleString()}đ</Text>
      </View>
    </View>
  );

  const PeriodSelector = () => (
    <View>
      <TouchableOpacity 
        style={styles.periodSelector}
        onPress={() => setIsPeriodModalVisible(true)}
      >
        <Text style={styles.periodText}>{selectedPeriod}</Text>
        <Icon name="keyboard-arrow-down" size={20} color="#666" />
      </TouchableOpacity>

      <Modal
        visible={isPeriodModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPeriodModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPeriodModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {PERIODS.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodOption,
                  selectedPeriod === period && styles.selectedPeriodOption
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setIsPeriodModalVisible(false);
                }}
              >
                <Text style={[
                  styles.periodOptionText,
                  selectedPeriod === period && styles.selectedPeriodOptionText
                ]}>
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const OptionsModal = () => (
    <Modal
      visible={isOptionsModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsOptionsModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setIsOptionsModalVisible(false)}
      >
        <View style={styles.optionsModalContent}>
          <Text style={styles.optionsModalTitle}>{t('budget.options.customize')}</Text>
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              setIsOptionsModalVisible(false);
              // Navigate to SetBudgetLimitScreen for editing
              if (selectedBudgetItem) {
                navigation.navigate('SetBudgetLimitScreen', {
                  mode: 'edit',
                  category: {
                    id: selectedBudgetItem.id,
                    name: selectedBudgetItem.name,
                    icon: selectedBudgetItem.icon,
                    color: selectedBudgetItem.color,
                    backgroundColor: selectedBudgetItem.backgroundColor,
                  },
                  currentBudget: selectedBudgetItem.budget,
                });
              }
            }}
          >
            <Icon name="edit" size={20} color="#1e90ff" />
            <Text style={styles.optionText}>{t('budget.options.edit')}</Text>
          </TouchableOpacity>
          
          <View style={styles.optionDivider} />
          
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              setIsOptionsModalVisible(false);
              // Show beautiful delete confirmation
              setTimeout(() => {
                Alert.alert(
                  `🗑️ ${t('budget.deleteConfirm.title')}`,
                  `${t('budget.deleteConfirm.message')} "${selectedBudgetItem?.name}"?\n\n💡 ${t('budget.deleteConfirm.hint')}`,
                  [
                    {
                      text: `❌ ${t('common.cancel')}`,
                      style: 'cancel'
                    },
                    {
                      text: `🗑️ ${t('budget.deleteConfirm.delete')}`,
                      style: 'destructive',
                      onPress: () => {
                        // Handle actual delete logic here
                        console.log('Delete budget for:', selectedBudgetItem?.name);
                        Alert.alert(
                          `✅ ${t('common.success')}`,
                          `${t('budget.deleteConfirm.success')} "${selectedBudgetItem?.name}" ${t('budget.deleteConfirm.deleted')}! 🎉`,
                          [{ text: 'OK' }]
                        );
                      }
                    }
                  ]
                );
              }, 300); // Small delay to let modal close first
            }}
          >
            <Icon name="delete" size={20} color="#F44336" />
            <Text style={[styles.optionText, { color: '#F44336' }]}>{t('budget.options.delete')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const PERIODS = [
    t('budget.periods.lastMonth'),
    t('budget.periods.currentMonth'), 
    t('budget.periods.nextMonth'),
    t('budget.periods.quarter'),
    t('budget.periods.year')
  ];

  // Tính số ngày còn lại trong tháng
  const getDaysLeft = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysLeft = lastDay.getDate() - now.getDate();
    return Math.max(0, daysLeft);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('budget.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Info */}
        <View style={styles.periodInfo}>
          <PeriodSelector />
          <Text style={styles.daysLeft}>{t('budget.daysLeft', { days: getDaysLeft() })}</Text>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('budget.sections.livingExpenses')}</Text>
          </View>

          {budgetData.map((item) => (
            <BudgetCategoryItem key={item.id} item={item} />
          ))}
        </View>

        {/* Chi phí phát sinh Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('budget.sections.unexpectedExpenses')}</Text>
          </View>
          
          <View style={styles.categoryItem}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryInfo}>
                <CircularProgress 
                  spent={0}
                  budget={100000}
                  color="#26C6DA"
                  icon="shopping-cart"
                  backgroundColor="#E0F7FA"
                />
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>{t('budget.categories.shopping')}</Text>
                  <Text style={styles.categoryBudget}>{t('budget.remaining')} 100.000đ</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => {
                  setSelectedBudgetItem({
                    id: '4',
                    name: t('budget.categories.shopping'),
                    icon: 'shopping-cart',
                    color: '#26C6DA',
                    spent: 0,
                    budget: 100000,
                    backgroundColor: '#E0F7FA'
                  });
                  setIsOptionsModalVisible(true);
                }}
              >
                <Icon name="more-horiz" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.amountSection}>
              <Text style={styles.spentAmount}>{t('budget.spent')} 0đ</Text>
              <Text style={styles.budgetAmount}>/ 100.000đ</Text>
            </View>
          </View>
        </View>

        {/* Add Budget Button */}
        <TouchableOpacity 
          style={styles.addBudgetButton}
          onPress={() => navigation.navigate('AddBudgetCategoryScreen')}
        >
          <Icon name="add" size={20} color="#1e90ff" />
          <Text style={styles.addBudgetText}>{t('budget.addBudget')}</Text>
        </TouchableOpacity>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <Text style={styles.editText}>
            {t('budget.editQuestion')} 
            <Text style={styles.editLink}> {t('budget.adjust')}</Text>
          </Text>
        </View>
      </ScrollView>

      {/* Options Modal */}
      <OptionsModal />
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
  periodInfo: {
    paddingVertical: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  daysLeft: {
    fontSize: 14,
    color: '#666',
  },
  categoriesSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  circularProgressContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  circularProgressSvg: {
    position: 'absolute',
  },
  circularProgressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  categoryBudget: {
    fontSize: 14,
    color: '#26C6DA',
  },
  moreButton: {
    padding: 4,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  spentAmount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  budgetAmount: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  addBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e90ff',
    borderStyle: 'dashed',
  },
  addBudgetText: {
    fontSize: 16,
    color: '#1e90ff',
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  editText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  editLink: {
    color: '#1e90ff',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    width: '80%',
    maxWidth: 300,
  },
  periodOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  selectedPeriodOption: {
    backgroundColor: '#E3F2FD',
  },
  periodOptionText: {
    fontSize: 14,
    color: '#666',
  },
  selectedPeriodOptionText: {
    color: '#1e90ff',
    fontWeight: '500',
  },
  optionsModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 10,
  },
});

export default BudgetScreen; 