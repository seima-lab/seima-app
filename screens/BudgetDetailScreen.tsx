import { useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { budgetService } from '../services/budgetService';

const { width } = Dimensions.get('window');

const BudgetDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { budgetId } = (route as any).params;
  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const data = await budgetService.getBudgetDetail(budgetId);
        setBudget(data);
      } catch (err) {
        setError('Không thể tải chi tiết hạn mức.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [budgetId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
        <Text style={styles.loadingText}>Đang tải...</Text>
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
          <Text style={styles.retryButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!budget) return null;

  const spentAmount = (budget.overall_amount_limit || 0) - (budget.budget_remaining_amount || 0);
  const progressPercentage = budget.overall_amount_limit > 0 
    ? (spentAmount / budget.overall_amount_limit) * 100 
    : 0;

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
        <Text style={styles.headerTitle}>Chi tiết hạn mức</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editButton}>
            <Icon name="pencil" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={async () => {
            Alert.alert(
              'Xác nhận xoá',
              'Bạn có chắc chắn muốn xoá hạn mức này?',
              [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Xoá', style: 'destructive', onPress: async () => {
                  try {
                    await budgetService.deleteBudget(budgetId);
                    Alert.alert('Thành công', 'Đã xoá hạn mức!');
                    navigation.goBack();
                  } catch (err) {
                    Alert.alert('Lỗi', 'Xoá hạn mức thất bại!');
                  }
                }},
              ]
            );
          }}>
            <View style={styles.deleteIconWrapper}>
              <Icon name="trash-can" size={20} color="#FF3B30" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

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
              <Text style={styles.periodText}>{budget.period_type}</Text>
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
              {progressPercentage.toFixed(1)}% đã sử dụng
            </Text>
          </View>

          {/* Amount Details */}
          <View style={styles.amountDetails}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Đã chi</Text>
              <Text style={[styles.amountValue, { color: '#EF4444' }]}>
                {spentAmount.toLocaleString()} ₫
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Còn lại</Text>
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
            <Text style={styles.infoTitle}>Thời gian áp dụng</Text>
          </View>
          <View style={styles.dateRange}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Từ ngày</Text>
              <Text style={styles.dateValue}>{budget.start_date?.slice(0,10)}</Text>
            </View>
            <Icon name="arrow-right" size={16} color="#9CA3AF" />
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Đến ngày</Text>
              <Text style={styles.dateValue}>{budget.end_date?.slice(0,10)}</Text>
            </View>
          </View>
        </View>

        {/* Categories Card */}
        {Array.isArray(budget.category_list) && budget.category_list.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Icon name="shape" size={24} color="#1e90ff" />
              <Text style={styles.infoTitle}>Danh mục áp dụng</Text>
            </View>
            <View style={styles.categoriesContainer}>
              {budget.category_list.map((cat: any, index: number) => (
                <View key={cat.category_id} style={styles.categoryChip}>
                  <Icon name="tag" size={16} color="#1e90ff" />
                  <Text style={styles.categoryName}>{cat.category_name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.primaryButton}>
            <Icon name="chart-line" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Xem báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Icon name="bell" size={20} color="#1e90ff" />
            <Text style={styles.secondaryButtonText}>Cài đặt thông báo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#FFFFFF',
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 4,
  },
  deleteIconWrapper: {
    backgroundColor: '#FFE5E5',
    borderRadius: 20,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  periodBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e90ff',
  },
  budgetAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e90ff',
    marginBottom: 20,
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
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '600',
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
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
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
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
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
    backgroundColor: '#EEF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    color: '#1e90ff',
    marginLeft: 6,
    fontWeight: '500',
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
    fontWeight: '600',
    marginLeft: 8,
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
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BudgetDetailScreen;