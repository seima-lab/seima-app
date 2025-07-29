import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
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
    TouchableWithoutFeedback,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomConfirmModal from '../components/CustomConfirmModal';
import CustomSuccessModal from '../components/CustomSuccessModal';
import { typography } from '../constants/typography';
import { BudgetPeriodResponse, budgetService } from '../services/budgetService';
import { deduplicateCategories, getIconColor, getIconForCategory } from '../utils/iconUtils';

const { width } = Dimensions.get('window');

const BudgetDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { budgetId } = (route as any).params;
  const [budget, setBudget] = useState<any>(null);
  const [budgetPeriods, setBudgetPeriods] = useState<BudgetPeriodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Custom modal states for delete
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    console.log('🔍 BudgetDetailScreen - useEffect triggered');
    console.log('🔍 budgetId from route params:', budgetId);
    console.log('🔍 budgetId type:', typeof budgetId);
    
    const fetchDetail = async () => {
      try {
        console.log('🔄 Fetching budget detail for ID:', budgetId);
        setLoading(true);
        
        // Fetch budget detail and periods in parallel
        const [budgetData, periodsData] = await Promise.all([
          budgetService.getBudgetDetail(budgetId),
          budgetService.getBudgetPeriods(budgetId)
        ]);
        
        console.log('📊 Budget detail API response:', budgetData);
        console.log('📊 Budget periods API response:', periodsData);
        
        // Log specific fields
        if (budgetData) {
          console.log('📊 Budget name:', budgetData.budget_name);
          console.log('📊 Budget amount:', budgetData.overall_amount_limit);
          console.log('📊 Budget period:', budgetData.period_type);
          console.log('📊 Budget start date:', budgetData.start_date);
          console.log('📊 Budget end date:', budgetData.end_date);
          console.log('📊 Budget categories:', budgetData.category_list);
          console.log('📊 Categories type:', typeof budgetData.category_list);
          console.log('📊 Categories isArray:', Array.isArray(budgetData.category_list));
          if (budgetData.category_list && Array.isArray(budgetData.category_list)) {
            console.log('📊 Categories count:', budgetData.category_list.length);
            console.log('📊 First category:', budgetData.category_list[0]);
            console.log('📊 All categories:', budgetData.category_list);
          }
        }
        
        setBudget(budgetData);
        setBudgetPeriods(periodsData);
      } catch (err) {
        console.error('❌ Error fetching budget detail:', err);
        setError(t('budget.detail.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [budgetId]);

  // Reload data when screen comes into focus (e.g., after editing)
  useFocusEffect(
    useCallback(() => {
      if (budgetId) {
        console.log('🔄 BudgetDetailScreen - Screen focused, reloading data for budgetId:', budgetId);
        const fetchDetail = async () => {
          try {
            setLoading(true);
            setError(null);
            
            // Fetch budget detail and periods in parallel
            const [budgetData, periodsData] = await Promise.all([
              budgetService.getBudgetDetail(budgetId),
              budgetService.getBudgetPeriods(budgetId)
            ]);
            
            console.log('📊 Budget detail reloaded:', budgetData ? 'success' : 'null');
            console.log('📊 Budget periods reloaded:', periodsData ? periodsData.length : 0, 'items');
            
            setBudget(budgetData);
            setBudgetPeriods(periodsData);
          } catch (err) {
            console.error('❌ Error reloading budget detail:', err);
            setError(t('budget.detail.loadError'));
          } finally {
            setLoading(false);
          }
        };
        fetchDetail();
      }
    }, [budgetId])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>{t('budget.detail.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="alert-circle" size={64} color="#1e90ff" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>{t('budget.detail.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!budget) return null;

  // Helper function to get period type label
  const getPeriodTypeLabel = (periodType: string) => {
    console.log('🔍 getPeriodTypeLabel - Input periodType:', periodType);
    console.log('🔍 getPeriodTypeLabel - Type of periodType:', typeof periodType);
    
    if (!periodType) {
      console.log('⚠️ periodType is null/undefined, returning default');
      return t('budget.setBudgetLimit.monthly') || 'Monthly';
    }
    
    // Convert to uppercase to handle case variations
    const normalizedType = periodType.toString().toUpperCase();
    console.log('🔍 Normalized periodType:', normalizedType);
    
    switch (normalizedType) {
      case 'WEEKLY':
      case 'WEEK':
        console.log('✅ Matched WEEKLY');
        return t('budget.setBudgetLimit.weekly') || 'Weekly';
      case 'MONTHLY':
      case 'MONTH':
        console.log('✅ Matched MONTHLY');
        return t('budget.setBudgetLimit.monthly') || 'Monthly';
      case 'YEARLY':
      case 'YEAR':
        console.log('✅ Matched YEARLY');
        return t('budget.setBudgetLimit.yearly') || 'Yearly';
      default:
        console.log('⚠️ No match found, returning original:', periodType);
        return periodType || 'Unknown';
    }
  };

  // Helper function to format date range
  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const startDay = start.getDate().toString().padStart(2, '0');
      const startMonth = (start.getMonth() + 1).toString().padStart(2, '0');
      const endDay = end.getDate().toString().padStart(2, '0');
      const endMonth = (end.getMonth() + 1).toString().padStart(2, '0');
      
      return `${startDay}/${startMonth} - ${endDay}/${endMonth}`;
    } catch (error) {
      console.error('❌ Error formatting date range:', error);
      return 'Invalid Date';
    }
  };

  // Budget Period Item Component
  const BudgetPeriodItem = ({ period }: { period: BudgetPeriodResponse }) => {
    const spentAmount = period.amount_limit - period.remaining_amount;
    const progressPercentage = period.amount_limit > 0 
      ? (spentAmount / period.amount_limit) * 100 
      : 0;

    return (
      <View style={styles.periodItem}>
        <View style={styles.periodHeader}>
          <Text style={styles.periodDateRange}>
            {formatDateRange(period.start_date, period.end_date)}
          </Text>
          <Text style={styles.periodIndex}>
            Period {period.period_index}
          </Text>
        </View>
        
        <View style={styles.periodAmounts}>
          <Text style={styles.periodTotalAmount}>
            {period.amount_limit.toLocaleString()} ₫
          </Text>
          <Text style={styles.periodRemainingAmount}>
            {period.remaining_amount.toLocaleString()} ₫
          </Text>
        </View>
        
        <View style={styles.periodProgressContainer}>
          <View style={styles.periodProgressBar}>
            <View 
              style={[
                styles.periodProgressFill, 
                { 
                  width: `${Math.min(progressPercentage, 100)}%`,
                  backgroundColor: progressPercentage > 80 ? '#EF4444' : '#10B981'
                }
              ]} 
            />
          </View>
          <Text style={styles.periodProgressText}>
            {progressPercentage.toFixed(1)}% used
          </Text>
        </View>
      </View>
    );
  };

  // Menu handling functions
  const handleMenuPress = () => {
    setMenuVisible(!menuVisible);
  };

  const handleCloseMenu = () => {
    setMenuVisible(false);
  };

  // Helper functions for delete modals
  const showDeleteConfirm = () => {
    setMenuVisible(false);
    setShowDeleteConfirmModal(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirmModal(false);
    setIsDeleting(true);
    
    try {
      console.log('🗑️ Deleting budget with ID:', budgetId);
      await budgetService.deleteBudget(budgetId);
      console.log('✅ Budget deleted successfully');
      
      // Show success modal
      setIsDeleting(false);
      setShowDeleteSuccessModal(true);
    } catch (err) {
      console.error('❌ Error deleting budget:', err);
      setModalMessage(t('budget.detail.deleteError'));
      setIsDeleting(false);
      setShowDeleteErrorModal(true);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirmModal(false);
  };

  const handleDeleteError = () => {
    setShowDeleteErrorModal(false);
  };

  const handleDeleteSuccess = () => {
    setShowDeleteSuccessModal(false);
    // Navigate back to BudgetScreen which will reload data
    navigation.goBack();
  };

  const handleEdit = () => {
    console.log('🎯 Edit button pressed');
    console.log('🎯 Current budget state:', budget);
    console.log('🎯 budgetId being passed:', budgetId);
    console.log('🎯 budgetData being passed:', budget);
    
    const navigationParams = {
      editMode: true,
      budgetId: budgetId,
      budgetData: budget
    };
    console.log('🎯 Navigation params:', navigationParams);
    
    setMenuVisible(false);
    (navigation as any).navigate('SetBudgetLimitScreen', navigationParams);
  };

  const handleDelete = () => {
    showDeleteConfirm();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e90ff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('budget.detail.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={handleMenuPress}
          >
            <Icon name="dots-vertical" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {menuVisible && (
            <View style={styles.menuContainer}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleEdit}
              >
                <Icon name="pencil" size={18} color="#333" />
                <Text style={styles.menuText}>{t('edit')}</Text>
              </TouchableOpacity>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDelete}
              >
                <Icon name="delete" size={18} color="#ff4757" />
                <Text style={[styles.menuText, { color: '#ff4757' }]}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <TouchableWithoutFeedback onPress={handleCloseMenu}>
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Budget Periods Card */}
          {Array.isArray(budgetPeriods) && budgetPeriods.length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Icon name="calendar-range" size={24} color="#1e90ff" />
                <Text style={styles.infoTitle}>{t('budget.detail.periods')}</Text>
              </View>
              <View style={styles.periodsContainer}>
                {budgetPeriods.map((period, index) => (
                  <BudgetPeriodItem key={`${period.period_index}-${index}`} period={period} />
                ))}
              </View>
            </View>
          )}

          {/* Date Range Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="calendar-range" size={24} color="#1e90ff" />
              <Text style={styles.infoTitle}>{t('budget.detail.timeRange')}</Text>
            </View>
            <View style={styles.dateRange}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>{t('budget.detail.fromDate')}</Text>
                <Text style={styles.dateValue}>{budget.start_date?.slice(0,10)}</Text>
              </View>
              <Icon name="arrow-right" size={16} color="#9CA3AF" />
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>{t('budget.detail.toDate')}</Text>
                <Text style={styles.dateValue}>{budget.end_date?.slice(0,10)}</Text>
              </View>
            </View>
          </View>

          {/* Categories Card */}
          {Array.isArray(budget.category_list) && budget.category_list.length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.infoHeader}>
                <Icon name="shape" size={24} color="#1e90ff" />
                <Text style={styles.infoTitle}>{t('budget.detail.appliedCategories')}</Text>
              </View>
              <View style={styles.categoriesContainer}>
                {/* Deduplicate categories before rendering */}
                {(() => {
                  const uniqueCategories = deduplicateCategories(budget.category_list);
                  
                  console.log('🔄 BudgetDetailScreen - Original categories:', budget.category_list.length);
                  console.log('🔄 BudgetDetailScreen - Unique categories:', uniqueCategories.length);
                  
                  return uniqueCategories.map((cat: any, index: number) => {
                    const iconName = getIconForCategory(cat.category_icon_url, 'expense');
                    const iconColor = getIconColor(iconName, 'expense');
                    
                    return (
                      <View key={`${cat.category_id}-${index}`} style={styles.categoryChip}>
                        <Icon name={iconName} size={16} color={iconColor} />
                        <Text style={styles.categoryName}>{cat.category_name}</Text>
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}

        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Custom Modals */}
      
      {/* Delete Confirmation Modal */}
      <CustomConfirmModal
        visible={showDeleteConfirmModal}
        title={t('budget.detail.confirmDelete')}
        message={t('budget.detail.deleteMessage')}
        confirmText={t('budget.detail.delete')}
        cancelText={t('budget.detail.cancel')}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        type="danger"
        iconName="delete"
      />

      {/* Delete Error Modal */}
      <CustomSuccessModal
        visible={showDeleteErrorModal}
        title={t('common.error')}
        message={modalMessage}
        buttonText={t('common.ok')}
        onConfirm={handleDeleteError}
        iconName="alert-circle"
      />

      {/* Loading Modal for Delete */}
      <Modal
        visible={isDeleting}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingModalContainer}>
            <ActivityIndicator size="large" color="#1e90ff" />
            <Text style={styles.loadingModalText}>{t('budget.detail.deleting')}</Text>
          </View>
        </View>
      </Modal>

      {/* Delete Success Modal */}
      <CustomSuccessModal
        visible={showDeleteSuccessModal}
        title={t('budget.detail.deleteSuccess')}
        message={t('budget.detail.deleteSuccessMessage')}
        buttonText={t('common.ok')}
        onConfirm={handleDeleteSuccess}
        iconName="check-circle"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    ...typography.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    ...typography.regular,
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...typography.semibold,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e90ff',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    ...typography.semibold,
  },
  moreButton: {
    padding: 8,
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 8,
    color: '#333',
    ...typography.medium,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 12,
  },
  
  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  
  // Info Cards
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
    ...typography.semibold,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateItem: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    ...typography.regular,
  },
  dateValue: {
    fontSize: 16,
    color: '#1F2937',
    ...typography.semibold,
  },
  
  // Categories
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryName: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
    ...typography.medium,
  },
  
  // Budget Periods
  periodsContainer: {
    marginTop: 16,
  },
  periodItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodDateRange: {
    fontSize: 14,
    color: '#374151',
    ...typography.medium,
  },
  periodIndex: {
    fontSize: 12,
    color: '#6B7280',
    ...typography.regular,
  },
  periodAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  periodTotalAmount: {
    fontSize: 16,
    color: '#1F2937',
    ...typography.semibold,
  },
  periodRemainingAmount: {
    fontSize: 16,
    color: '#10B981',
    ...typography.semibold,
  },
  periodProgressContainer: {
    marginTop: 8,
  },
  periodProgressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  periodProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  periodProgressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    ...typography.regular,
  },


  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingModalContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingModalText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
    ...typography.regular,
  },
});

export default BudgetDetailScreen;