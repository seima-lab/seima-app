import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
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
import { Budget, budgetService } from '../services/budgetService';

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

// Empty State Component
const EmptyState = ({ onAddBudget, onWhatIsBudget }: { onAddBudget: () => void; onWhatIsBudget: () => void }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <LinearGradient
          colors={['#E3F2FD', '#BBDEFB']}
          style={styles.emptyIconGradient}
        >
          <Icon name="account-balance-wallet" size={48} color="#1976D2" />
        </LinearGradient>
      </View>
      
      <Text style={styles.emptyTitle}>{t('budget.emptyState.title')}</Text>
      
      <TouchableOpacity 
        style={styles.addBudgetButtonPrimary}
        onPress={onAddBudget}
      >
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.addBudgetGradient}
        >
          <Icon name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBudgetTextPrimary}>{t('budget.addBudget')}</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={onWhatIsBudget}>
        <Text style={styles.whatIsBudgetText}>{t('budget.emptyState.whatIsBudget')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// What is Budget Modal Component
const WhatIsBudgetModal = ({ visible, onClose, onCreateBudget }: { 
  visible: boolean; 
  onClose: () => void; 
  onCreateBudget: () => void;
}) => {
  const { t } = useTranslation();
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.whatIsBudgetModalContent}>
          <Text style={styles.whatIsBudgetExplanation}>
            {t('budget.emptyState.explanation')}
          </Text>
          
          <View style={styles.budgetExampleCard}>
            <View style={styles.budgetExampleHeader}>
              <View style={styles.budgetExampleInfo}>
                <View style={styles.budgetExampleIconContainer}>
                  <Icon name="shopping-cart" size={20} color="#2196F3" />
                </View>
                <View>
                  <Text style={styles.budgetExampleTitle}>{t('budget.emptyState.exampleTitle')}</Text>
                  <Text style={styles.budgetExamplePeriod}>{t('budget.emptyState.examplePeriod')}</Text>
                </View>
              </View>
              <Text style={styles.budgetExampleAmount}>{t('budget.emptyState.exampleAmount')}</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '50%' }]} />
              </View>
            </View>
            
            <View style={styles.budgetExampleFooter}>
              <Text style={styles.daysLeftText}>{t('budget.emptyState.daysLeft')}</Text>
              <Text style={styles.remainingAmount}>{t('budget.emptyState.remainingAmount')}</Text>
            </View>
            
            <View style={styles.continueContainer}>
              <Text style={styles.continueText}>{t('budget.emptyState.remainingDescription')}</Text>
            </View>
          </View>
          
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity 
              style={styles.modalButtonSecondary}
              onPress={onClose}
            >
              <Text style={styles.modalButtonSecondaryText}>{t('common.close')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalButtonPrimary}
              onPress={() => {
                onClose();
                onCreateBudget();
              }}
            >
              <LinearGradient
                colors={['#2196F3', '#1976D2']}
                style={styles.modalButtonGradient}
              >
                <Text style={styles.modalButtonPrimaryText}>{t('budget.createBudget')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const BudgetScreen = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigationService();
  const [selectedPeriod, setSelectedPeriod] = useState(t('budget.currentMonth'));
  const [isPeriodModalVisible, setIsPeriodModalVisible] = useState(false);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);
  const [isWhatIsBudgetModalVisible, setIsWhatIsBudgetModalVisible] = useState(false);
  const [selectedBudgetItem, setSelectedBudgetItem] = useState<BudgetCategory | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch budgets from API
  useFocusEffect(
    useCallback(() => {
      const fetchBudgets = async () => {
        try {
          setIsLoading(true);
          console.log('🔄 Fetching budgets...');
          const budgetList = await budgetService.getBudgetList(0, 20);
          console.log('📦 Raw budgets data:', JSON.stringify(budgetList, null, 2));
          setBudgets(budgetList);
          console.log('✅ Budgets fetched:', budgetList.length, 'items');
        } catch (error) {
          console.error('❌ Error fetching budgets:', error);
          setBudgets([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchBudgets();
    }, [])
  );

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

  const BudgetItem = ({ budget }: { budget: Budget }) => {
    const spent = (budget.overall_amount_limit ?? 0) - (budget.budget_remaining_amount ?? 0);
    const percentage = (budget.overall_amount_limit ?? 0) > 0 ? (spent / budget.overall_amount_limit) * 100 : 0;
    
    return (
      <View style={styles.budgetItemCard}>
        <View style={styles.budgetItemHeader}>
          <View style={styles.budgetItemInfo}>
            <View style={styles.budgetItemIconContainer}>
              <Icon name="account-balance-wallet" size={24} color="#2196F3" />
            </View>
            <View style={styles.budgetItemDetails}>
              <Text style={styles.budgetItemName}>{budget.budget_name}</Text>
              <Text style={styles.budgetItemPeriod}>
                {new Date(budget.start_date).toLocaleDateString('vi-VN')} - {new Date(budget.end_date).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
          <Text style={styles.budgetItemAmount}>
            {(budget.overall_amount_limit ?? 0).toLocaleString()} {t('currency')}
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(percentage, 100)}%` }]} />
          </View>
        </View>
        
        <View style={styles.budgetItemFooter}>
          <Text style={styles.budgetItemRemaining}>
            {t('budget.remaining')}: {(budget.budget_remaining_amount ?? 0).toLocaleString()} {t('currency')}
          </Text>
          <Text style={styles.budgetItemSpent}>
            {t('budget.spent')}: {(spent ?? 0).toLocaleString()} {t('currency')}
          </Text>
        </View>
      </View>
    );
  };

  const handleAddBudget = () => {
    navigation.navigate('SetBudgetLimitScreen');
  };

  const handleBudgetPress = (budget: Budget) => {
    navigation.navigate('BudgetDetailScreen', { budgetId: budget.budget_id });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
        
        {/* Header */}
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('budget.title')}</Text>
            <View style={styles.headerSpacer} />
          </View>
        </LinearGradient>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />
      
      {/* Header */}
      <LinearGradient
        colors={['#2196F3', '#1976D2']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('budget.title')}</Text>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {budgets.length === 0 ? (
          <EmptyState 
            onAddBudget={handleAddBudget}
            onWhatIsBudget={() => setIsWhatIsBudgetModalVisible(true)}
          />
        ) : (
          <ScrollView 
            style={styles.budgetsList}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.budgetsContainer}>
              {budgets.map((budget) => (
                <TouchableOpacity key={budget.budget_id || budget.budget_name} onPress={() => handleBudgetPress(budget)}>
                  <BudgetItem budget={budget} />
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Add More Budget Button */}
            <TouchableOpacity 
              style={styles.addMoreBudgetButton}
              onPress={handleAddBudget}
            >
              <Icon name="add" size={20} color="#2196F3" />
              <Text style={styles.addMoreBudgetText}>{t('budget.addMoreBudget')}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* What is Budget Modal */}
      <WhatIsBudgetModal
        visible={isWhatIsBudgetModalVisible}
        onClose={() => setIsWhatIsBudgetModalVisible(false)}
        onCreateBudget={handleAddBudget}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 32,
  },
  emptyIconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  addBudgetButtonPrimary: {
    borderRadius: 25,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addBudgetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  addBudgetTextPrimary: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  whatIsBudgetText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
  },
  // Budget List Styles
  budgetsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  budgetsContainer: {
    gap: 16,
  },
  budgetItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  budgetItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetItemIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetItemDetails: {
    flex: 1,
  },
  budgetItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  budgetItemPeriod: {
    fontSize: 14,
    color: '#666',
  },
  budgetItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  progressBarContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  budgetItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetItemRemaining: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  budgetItemSpent: {
    fontSize: 14,
    color: '#666',
  },
  addMoreBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  addMoreBudgetText: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  whatIsBudgetModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  whatIsBudgetExplanation: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  budgetExampleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  budgetExampleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetExampleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetExampleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetExampleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  budgetExamplePeriod: {
    fontSize: 12,
    color: '#666',
  },
  budgetExampleAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2196F3',
  },
  budgetExampleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  daysLeftText: {
    fontSize: 14,
    color: '#666',
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  continueContainer: {
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  continueText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  modalButtonPrimary: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonPrimaryText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // Legacy styles (keeping for compatibility)
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
});

export default BudgetScreen; 