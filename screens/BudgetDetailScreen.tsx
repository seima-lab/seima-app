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
import { typography } from '../constants/typography';
import { budgetService } from '../services/budgetService';
import { deduplicateCategories, getIconColor, getIconForCategory } from '../utils/iconUtils';

const { width } = Dimensions.get('window');

const BudgetDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const navigation = useNavigation();
  const { budgetId } = (route as any).params;
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Custom modal states for delete
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
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
        const data = await budgetService.getBudgetDetail(budgetId);
        console.log('📊 Budget detail API response:', data);
        console.log('📊 Budget detail type:', typeof data);
        console.log('📊 Budget detail keys:', data ? Object.keys(data) : 'null');
        
        // Log specific fields
        if (data) {
          console.log('📊 Budget name:', data.budget_name);
          console.log('📊 Budget amount:', data.overall_amount_limit);
          console.log('📊 Budget period:', data.period_type);
          console.log('📊 Budget start date:', data.start_date);
          console.log('📊 Budget end date:', data.end_date);
          console.log('📊 Budget categories:', data.category_list);
          console.log('📊 Categories type:', typeof data.category_list);
          console.log('📊 Categories isArray:', Array.isArray(data.category_list));
          if (data.category_list && Array.isArray(data.category_list)) {
            console.log('📊 Categories count:', data.category_list.length);
            console.log('📊 First category:', data.category_list[0]);
            console.log('📊 All categories:', data.category_list);
          }
        }
        
        setBudget(data);
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
            const data = await budgetService.getBudgetDetail(budgetId);
            console.log('📊 Budget detail reloaded:', data ? 'success' : 'null');
            setBudget(data);
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

  const spentAmount = (budget.overall_amount_limit || 0) - (budget.budget_remaining_amount || 0);
  const progressPercentage = budget.overall_amount_limit > 0 
    ? (spentAmount / budget.overall_amount_limit) * 100 
    : 0;

  // Helper function to get period type label
  const getPeriodTypeLabel = (periodType: string) => {
    switch (periodType) {
      case 'WEEKLY':
        return t('budget.setBudgetLimit.weekly');
      case 'MONTHLY':
        return t('budget.setBudgetLimit.monthly');
      case 'YEARLY':
        return t('budget.setBudgetLimit.yearly');
      default:
        return periodType;
    }
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
      
      // Show brief success feedback then navigate
      setIsDeleting(false);
      
      // Optional: Show a brief success message
      // You can add a toast here if you have a toast system
      console.log('✅ Budget deleted successfully, navigating back...');
      
      // Navigate back immediately
      navigation.goBack();
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
        {/* Budget Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.budgetHeader}>
            <Text style={styles.budgetName}>{budget.budget_name}</Text>
            <View style={styles.periodBadge}>
              <Text style={styles.periodText}>{getPeriodTypeLabel(budget.period_type)}</Text>
            </View>
          </View>
          
          <Text style={styles.budgetAmount}>
            {(budget.overall_amount_limit ?? 0).toLocaleString()} ₫
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${Math.min(progressPercentage, 100)}%`,
                    backgroundColor: progressPercentage > 80 ? '#EF4444' : '#10B981'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {progressPercentage.toFixed(1)}% {t('budget.detail.progressUsed')}
            </Text>
          </View>

          {/* Amount Details */}
          <View style={styles.amountDetails}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>{t('budget.detail.amountUsed')}</Text>
              <Text style={[styles.amountValue, { color: '#EF4444' }]}>
                {spentAmount.toLocaleString()} ₫
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>{t('budget.detail.amountRemaining')}</Text>
              <Text style={[styles.amountValue, { color: '#10B981' }]}>
                {(budget.budget_remaining_amount ?? 0).toLocaleString()} ₫
              </Text>
            </View>
          </View>
        </View>

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
                
                console.log('�� BudgetDetailScreen - Original categories:', budget.category_list.length);
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <Icon name="chart-line" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{t('budget.detail.viewReport')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Icon name="bell" size={20} color="#1e90ff" />
            <Text style={styles.secondaryButtonText}>{t('budget.detail.setNotification')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>

      {/* Custom Modals */}
      
      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="alert-circle" size={48} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>{t('budget.detail.confirmDelete')}</Text>
            <Text style={styles.modalMessage}>{t('budget.detail.deleteMessage')}</Text>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleDeleteCancel}
              >
                <Text style={styles.modalButtonSecondaryText}>{t('budget.detail.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.modalButtonText}>{t('budget.detail.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Error Modal */}
      <Modal
        visible={showDeleteErrorModal}
        transparent
        animationType="fade"
        onRequestClose={handleDeleteError}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customModalContainer}>
            <View style={styles.modalIconContainer}>
              <Icon name="alert-circle" size={48} color="#EF4444" />
            </View>
            <Text style={styles.modalTitle}>{t('common.error')}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleDeleteError}
            >
              <Text style={styles.modalButtonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  
  // Summary Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetName: {
    fontSize: 20,
    color: '#1F2937',
    flex: 1,
    ...typography.bold,
  },
  periodBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 12,
    color: '#1e90ff',
    ...typography.semibold,
  },
  budgetAmount: {
    fontSize: 32,
    color: '#1e90ff',
    marginBottom: 20,
    ...typography.bold,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    ...typography.regular,
  },
  amountDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    ...typography.regular,
  },
  amountValue: {
    fontSize: 16,
    ...typography.semibold,
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
  
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#1e90ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    ...typography.semibold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e90ff',
  },
  secondaryButtonText: {
    color: '#1e90ff',
    fontSize: 16,
    marginLeft: 8,
    ...typography.semibold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  customModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
    ...typography.bold,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    ...typography.regular,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...typography.semibold,
  },
  modalButtonSecondary: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    ...typography.semibold,
  },
  modalButtonDanger: {
    backgroundColor: '#EF4444',
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