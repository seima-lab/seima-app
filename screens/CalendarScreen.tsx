import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Modal,
    PanResponder,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomConfirmModal from '../components/CustomConfirmModal';
import { typography } from '../constants/typography';
import { useAuth } from '../contexts/AuthContext';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import {
    DailyTransactions,
    TransactionItem,
    TransactionOverviewResponse,
    transactionService
} from '../services/transactionService';
import { getIconColor, getIconForCategory } from '../utils/iconUtils';

interface Transaction {
    id: string;
    date: string;
    category: string;
    amount: number;
    type: 'income' | 'expense';
    icon: string;
    iconColor: string;
    description?: string;
}

interface DayData {
    income: number;
    expense: number;
    total: number;
}

// Format money helper function
const formatMoney = (amount: number | undefined | null, maxLength?: number): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '0đ';
    }
    const formatted = amount.toLocaleString('vi-VN'); // chỉ lấy phần số
    if (maxLength && formatted.replace(/\D/g, '').length > maxLength) {
        // Nếu số lượng ký tự số > maxLength, lấy 7 ký tự đầu (bao gồm dấu .), thêm ...
        let count = 0;
        let result = '';
        for (let i = 0; i < formatted.length; i++) {
            if (/\d/.test(formatted[i])) count++;
            result += formatted[i];
            if (count === maxLength) break;
        }
        return result + '...' + 'đ';
    }
    return formatted + 'đ';
};

// Swipeable Transaction Item Component
const SwipeableTransactionItem = ({ 
    transaction, 
    onDelete,
    onEdit
}: { 
    transaction: Transaction; 
    onDelete: (id: string) => void;
    onEdit: (transaction: Transaction) => void;
}) => {
    const { t } = useTranslation();
    const translateX = new Animated.Value(0);
    const rightActionOpacity = new Animated.Value(0);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
        },
        onPanResponderMove: (evt, gestureState) => {
            if (gestureState.dx < 0) { // Only allow left swipe
                const newTranslateX = Math.max(gestureState.dx, -100);
                translateX.setValue(newTranslateX);
                rightActionOpacity.setValue(Math.abs(newTranslateX) / 100);
            }
        },
        onPanResponderRelease: (evt, gestureState) => {
            if (gestureState.dx < -50) {
                // Show delete button
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: -100,
                        duration: 200,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rightActionOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: true,
                    })
                ]).start();
            } else {
                // Reset position
                resetPosition();
            }
        },
    });

    const resetPosition = () => {
        Animated.parallel([
            Animated.timing(translateX, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(rightActionOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handleDelete = () => {
        setShowConfirmModal(true);
    };

    const handleConfirmDelete = () => {
        setShowConfirmModal(false);
        resetPosition();
        onDelete(transaction.id);
    };

    const handleCancelDelete = () => {
        setShowConfirmModal(false);
        resetPosition();
    };

    return (
        <>
            <View style={styles.swipeableContainer}>
                {/* Transaction Item */}
                <Animated.View
                    style={[
                        styles.transactionItemSwipeable,
                        { transform: [{ translateX }] }
                    ]}
                    {...panResponder.panHandlers}
                >
                    <TouchableOpacity 
                        style={styles.transactionItem}
                        onPress={() => onEdit(transaction)}
                    >
                        <View style={styles.transactionLeft}>
                            <View style={[styles.transactionIcon, { backgroundColor: transaction.iconColor + '20' }]}>
                                <Icon name={transaction.icon} size={20} color={transaction.iconColor} />
                            </View>
                            <View style={styles.transactionInfo}>
                                <Text style={styles.transactionCategory}>{transaction.category}</Text>
                                {transaction.description && (
                                    <Text style={styles.transactionDescription}>{transaction.description}</Text>
                                )}
                            </View>
                        </View>
                        <Text style={[
                            styles.transactionAmount,
                            transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
                        ]}>
                            {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
                        </Text>
                        <Icon name="chevron-right" size={20} color="#999" />
                    </TouchableOpacity>
                </Animated.View>
                
                {/* Delete Action - appears behind when swiped */}
                <Animated.View 
                    style={[
                        styles.deleteAction,
                        { opacity: rightActionOpacity }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDelete}
                    >
                        <Icon name="delete" size={20} color="#FFFFFF" />
                        <Text style={styles.deleteText}>{t('delete')}</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Custom Confirm Modal */}
            <CustomConfirmModal
                visible={showConfirmModal}
                title={t('common.confirm')}
                message={t('calendar.confirmDeleteTransaction')}
                confirmText={t('delete')}
                cancelText={t('cancel')}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                type="danger"
                iconName="delete"
            />
        </>
    );
};

const CalendarScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    const { transactionRefreshTrigger } = useAuth();
    
    // Initialize with current month
    const today = new Date();
    const currentMonthString = today.toISOString()?.substring(0, 7) || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const [currentMonth, setCurrentMonth] = useState(currentMonthString);
    const [overviewData, setOverviewData] = useState<TransactionOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [pickerDate, setPickerDate] = useState(new Date(currentMonth + '-01'));

    // Load transaction overview data
    const loadTransactionOverview = async (month: string, isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
                // Đừng xóa dữ liệu cũ để giữ UI mượt
                // setOverviewData(null);
            }
            setError(null);
            
            console.log('🔄 Loading transaction overview for month:', month);
            const data = await transactionService.getTransactionOverview(month);
            
            // Log the received data
            console.log('📦 Received overview data:', JSON.stringify(data, null, 2));
            console.log('📊 Summary:', data?.summary);
            console.log('📅 by_date array length:', data?.by_date?.length || 0);
            
            if (data?.by_date && Array.isArray(data.by_date)) {
                data.by_date.forEach((dailyData, index) => {
                    console.log(`📆 Day ${index + 1}:`, {
                        date: dailyData.date,
                        transactionCount: dailyData.transactions?.length || 0,
                        transactions: dailyData.transactions
                    });
                });
            } else {
                console.log('⚠️ No by_date data or by_date is not an array');
            }
            
            setOverviewData(data);
            setLastRefreshTime(Date.now());
        } catch (err: any) {
            console.error('❌ Failed to load transaction overview:', err);
            console.error('❌ Error details:', {
                message: err.message,
                stack: err.stack,
                response: err.response
            });
            setError(err.message || 'Failed to load transaction data');
            if (!isRefresh) {
                Alert.alert(
                    t('common.error'),
                    err.message || 'Failed to load transaction data',
                    [{ text: t('common.ok') }]
                );
            }
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    // Handle pull to refresh
    const onRefresh = () => {
        loadTransactionOverview(currentMonth, true);
    };

    // Load data when component mounts or month changes
    useEffect(() => {
        loadTransactionOverview(currentMonth);
    }, [currentMonth]);

    // Listen to global transaction refresh trigger
    useEffect(() => {
        if (transactionRefreshTrigger > 0) {
            console.log('🔄 Global transaction refresh triggered');
            loadTransactionOverview(currentMonth, true);
        }
    }, [transactionRefreshTrigger, currentMonth]);

    // Refresh data when screen comes into focus (when returning from edit screen)
    useFocusEffect(
        useCallback(() => {
            loadTransactionOverview(currentMonth, true);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [currentMonth])
    );

    // Convert API data to local Transaction format using iconUtils
    const convertToLocalTransaction = (item: TransactionItem, date: string): Transaction | null => {
        // Filter out inactive or invalid transaction types
        const validTypes = ['income', 'expense', 'INCOME', 'EXPENSE'];
        const transactionType = item.transaction_type?.toLowerCase();
        
        if (!transactionType || !validTypes.includes(item.transaction_type)) {
            console.log('⚠️ Filtered out invalid transaction type:', item.transaction_type, 'for transaction:', item.transaction_id);
            return null;
        }
        
        // Use iconUtils to get proper icon and color from category_icon_url
        const categoryType = transactionType === 'income' ? 'income' : 'expense';
        const iconName = getIconForCategory(item.category_icon_url, categoryType);
        const iconColor = getIconColor(iconName, categoryType);
        
        console.log('🎨 Icon mapping for transaction:', {
            transactionId: item.transaction_id,
            categoryName: item.category_name,
            categoryIconUrl: item.category_icon_url,
            categoryType: categoryType,
            mappedIcon: iconName,
            mappedColor: iconColor
        });
        
        return {
            id: (item.transaction_id || 0).toString(),
            date: date,
            category: item.category_name || 'Unknown',
            amount: item.amount || 0,
            type: transactionType === 'income' ? 'income' : 'expense',
            icon: iconName,
            iconColor: iconColor,
            description: item.description || item.category_name || 'No description'
        };
    };

    // Get all transactions from API data
    const getAllTransactions = (): Transaction[] => {
        console.log('🔄 Getting all transactions from overview data...');
        
        if (!overviewData || !overviewData.by_date || !Array.isArray(overviewData.by_date)) {
            console.log('⚠️ No overview data available for transactions');
            return [];
        }
        
        const transactions: Transaction[] = [];
        
        overviewData.by_date.forEach((dailyTransaction: DailyTransactions, dayIndex: number) => {
            console.log(`📅 Processing day ${dayIndex + 1}:`, dailyTransaction.date);
            
            if (dailyTransaction && dailyTransaction.transactions && Array.isArray(dailyTransaction.transactions)) {
                console.log(`📝 Found ${dailyTransaction.transactions.length} transactions for ${dailyTransaction.date}`);
                
                dailyTransaction.transactions.forEach((item: TransactionItem, transIndex: number) => {
                    if (item) {
                        const convertedTransaction = convertToLocalTransaction(item, dailyTransaction.date);
                        if (convertedTransaction) {
                            console.log(`💰 Transaction ${transIndex + 1}:`, {
                                id: convertedTransaction.id,
                                category: convertedTransaction.category,
                                amount: convertedTransaction.amount,
                                type: convertedTransaction.type,
                                icon: convertedTransaction.icon,
                                iconColor: convertedTransaction.iconColor
                            });
                            transactions.push(convertedTransaction);
                        }
                    }
                });
            } else {
                console.log(`⚠️ No transactions found for ${dailyTransaction.date}`);
            }
        });
        
        console.log(`✅ Total transactions processed: ${transactions.length}`);
        return transactions;
    };

    const transactions = useMemo(() => getAllTransactions(), [overviewData]);

    // Calculate day data
    const getDayData = (): { [key: string]: DayData } => {
        console.log('📊 Calculating day data from transactions...');
        const dayData: { [key: string]: DayData } = {};
        
        if (transactions && Array.isArray(transactions)) {
            console.log(`📝 Processing ${transactions.length} valid transactions for day calculations`);
            
            transactions.forEach((transaction, index) => {
                if (transaction && transaction.date && (transaction.type === 'income' || transaction.type === 'expense')) {
                    if (!dayData[transaction.date]) {
                        dayData[transaction.date] = { income: 0, expense: 0, total: 0 };
                        console.log(`📅 Created day data for: ${transaction.date}`);
                    }
                    
                    if (transaction.type === 'income') {
                        dayData[transaction.date].income += transaction.amount || 0;
                    } else if (transaction.type === 'expense') {
                        dayData[transaction.date].expense += transaction.amount || 0;
                    }
                    
                    dayData[transaction.date].total = dayData[transaction.date].income - dayData[transaction.date].expense;
                }
            });
            
            console.log('📊 Final day data:', dayData);
        } else {
            console.log('⚠️ No transactions array available for day data calculation');
        }
        
        return dayData;
    };

    const dayData = useMemo(() => getDayData(), [transactions]);

    // Get monthly totals
    const getMonthlyTotals = () => {
        console.log('💰 Calculating monthly totals...');
        
        if (!overviewData || !overviewData.summary) {
            console.log('⚠️ No summary data available, returning zeros');
            return {
                income: 0,
                expense: 0,
                total: 0
            };
        }
        
        const totals = {
            income: overviewData.summary.total_income || 0,
            expense: overviewData.summary.total_expense || 0,
            total: overviewData.summary.balance || 0
        };
        
        console.log('📊 Monthly totals:', totals);
        return totals;
    };

    const monthlyTotals = getMonthlyTotals();

    // Custom Month Picker Component
    const MonthPickerModal = () => {
        const [selectedYear, setSelectedYear] = useState(new Date(currentMonth + '-01').getFullYear());
        const [selectedMonth, setSelectedMonth] = useState(new Date(currentMonth + '-01').getMonth());
        const [showYearPicker, setShowYearPicker] = useState(false);
        
        const months = [
            { value: 0, label: t('months.january') },
            { value: 1, label: t('months.february') },
            { value: 2, label: t('months.march') },
            { value: 3, label: t('months.april') },
            { value: 4, label: t('months.may') },
            { value: 5, label: t('months.june') },
            { value: 6, label: t('months.july') },
            { value: 7, label: t('months.august') },
            { value: 8, label: t('months.september') },
            { value: 9, label: t('months.october') },
            { value: 10, label: t('months.november') },
            { value: 11, label: t('months.december') }
        ];

        const currentMonthIndex = new Date(currentMonth + '-01').getMonth();
        const currentYearValue = new Date(currentMonth + '-01').getFullYear();

        const handleMonthSelect = (monthIndex: number) => {
            setSelectedMonth(monthIndex);
        };

        const handleYearChange = (increment: number) => {
            setSelectedYear(prev => prev + increment);
        };

        const handleYearSelect = (year: number) => {
            setSelectedYear(year);
            setShowYearPicker(false);
            // Optional: Add haptic feedback here if needed
        };

        const handleToggleYearPicker = () => {
            setShowYearPicker(!showYearPicker);
        };

        const handleConfirm = () => {
            const newMonth = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
            setCurrentMonth(newMonth);
            setShowMonthPicker(false);
        };

        const handleCancel = () => {
            setSelectedYear(currentYearValue);
            setSelectedMonth(currentMonthIndex);
            setShowMonthPicker(false);
        };

        // Generate years for picker (from 2010 to 2030)
        const years = Array.from({ length: 21 }, (_, i) => 2010 + i);

        return (
            <Modal visible={showMonthPicker} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Year Selection Header */}
                        <View style={styles.yearSelectionContainer}>
                            <TouchableOpacity 
                                style={styles.yearArrowButton}
                                onPress={() => handleYearChange(-1)}
                            >
                                <Icon name="chevron-left" size={20} color="#007AFF" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.yearDisplayContainer}
                                onPress={handleToggleYearPicker}
                            >
                                <Text style={styles.yearDisplayText}>{selectedYear}</Text>
                                <Icon 
                                    name={showYearPicker ? "chevron-up" : "chevron-down"} 
                                    size={16} 
                                    color="#007AFF" 
                                />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.yearArrowButton}
                                onPress={() => handleYearChange(1)}
                            >
                                <Icon name="chevron-right" size={20} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Year Picker Dropdown */}
                        {showYearPicker && (
                            <Animated.View 
                                style={[
                                    styles.yearPickerContainer,
                                    { opacity: 1 }
                                ]}
                            >
                                <ScrollView 
                                    style={styles.yearPickerScroll}
                                    showsVerticalScrollIndicator={false}
                                    nestedScrollEnabled={true}
                                    contentContainerStyle={{ paddingVertical: 4 }}
                                >
                                    {years.map((year) => (
                                        <TouchableOpacity
                                            key={year}
                                            style={[
                                                styles.yearPickerItem,
                                                selectedYear === year && styles.selectedYearPickerItem
                                            ]}
                                            onPress={() => handleYearSelect(year)}
                                        >
                                            <Text style={[
                                                styles.yearPickerItemText,
                                                selectedYear === year && styles.selectedYearPickerItemText
                                            ]}>
                                                {year}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </Animated.View>
                        )}

                        {/* Month Grid */}
                        <View style={styles.monthGrid}>
                            {months.map((month, index) => (
                                <TouchableOpacity
                                    key={month.value}
                                    style={[
                                        styles.monthGridItem,
                                        selectedMonth === month.value && styles.selectedMonthGridItem
                                    ]}
                                    onPress={() => handleMonthSelect(month.value)}
                                >
                                    <Text style={[
                                        styles.monthGridItemText,
                                        selectedMonth === month.value && styles.selectedMonthGridItemText
                                    ]}>
                                        {month.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.okButton}
                                onPress={handleConfirm}
                            >
                                <Text style={styles.okButtonText}>{t('ok')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    };

    // Handle month picker
    const handleOpenMonthPicker = () => {
        setPickerDate(new Date(currentMonth + '-01'));
        setShowMonthPicker(true);
    };

    const handleMonthPickerChange = (event: any, selectedDate?: Date) => {
        setShowMonthPicker(false);
        if (selectedDate) {
            const newMonth = selectedDate.toISOString()?.substring(0, 7) || `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;
            setCurrentMonth(newMonth);
        }
    };

    const formatMonthDisplay = (monthString: string) => {
        if (!monthString || monthString.trim() === '') {
            const today = new Date();
            const month = today.getMonth();
            const year = today.getFullYear();
            return `${t(`months.${getMonthKey(month)}`)} ${year}`;
        }
        
        try {
            const date = new Date(monthString + '-01');
            if (isNaN(date.getTime())) {
                const today = new Date();
                const month = today.getMonth();
                const year = today.getFullYear();
                return `${t(`months.${getMonthKey(month)}`)} ${year}`;
            }
            const month = date.getMonth();
            const year = date.getFullYear();
            return `${t(`months.${getMonthKey(month)}`)} ${year}`;
        } catch (error) {
            console.error('Error formatting month display:', error);
            const today = new Date();
            const month = today.getMonth();
            const year = today.getFullYear();
            return `${t(`months.${getMonthKey(month)}`)} ${year}`;
        }
    };

    // Helper function to get month key for translation
    const getMonthKey = (monthIndex: number): string => {
        const monthKeys = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        return monthKeys[monthIndex] || 'january';
    };

    // Helper function to format day header with proper localization
    const formatDayHeader = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            
            const day = date.getDate();
            const month = date.getMonth();
            const weekday = date.getDay();
            
            const weekdayNames = [
                'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
            ];
            
            return `${t(`weekdays.${weekdayNames[weekday]}`)}, ${day.toString().padStart(2, '0')}/${(month + 1).toString().padStart(2, '0')}`;
        } catch (error) {
            console.error('Error formatting day header:', error);
            return dateString;
        }
    };

    // Custom header renderer for Calendar
    const renderCalendarHeader = (date: any) => {
        return (
            <TouchableOpacity 
                style={styles.calendarHeader}
                onPress={handleOpenMonthPicker}
            >
                <Text style={styles.calendarHeaderText}>
                    {formatMonthDisplay(date.dateString?.substring(0, 7) || '')}
                </Text>
                <Icon name="chevron-down" size={16} color="#007AFF" style={styles.calendarHeaderIcon} />
            </TouchableOpacity>
        );
    };

    // Group transactions by date for the entire month
    const getGroupedTransactions = (): { [date: string]: Transaction[] } => {
        if (!transactions || !Array.isArray(transactions)) {
            return {};
        }
        
        const grouped: { [date: string]: Transaction[] } = {};
        transactions.forEach(transaction => {
            if (transaction && transaction.date) {
                if (!grouped[transaction.date]) {
                    grouped[transaction.date] = [];
                }
                grouped[transaction.date].push(transaction);
            }
        });
        
        // Sort dates in descending order (newest first)
        const sortedGrouped: { [date: string]: Transaction[] } = {};
        Object.keys(grouped)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
            .forEach(date => {
                sortedGrouped[date] = grouped[date];
            });
        
        return sortedGrouped;
    };

    const groupedTransactions = useMemo(() => getGroupedTransactions(), [transactions]);

    // Handle delete transaction
    const handleDeleteTransaction = async (transactionId: string) => {
        try {
            console.log('🔄 Deleting transaction:', transactionId);
            
            // Call the actual delete API
            await transactionService.deleteTransaction(parseInt(transactionId));
            
            console.log('✅ Transaction deleted successfully');
            
            // Refresh the data
            loadTransactionOverview(currentMonth);
            
        } catch (error: any) {
            console.error('❌ Failed to delete transaction:', error);
            Alert.alert(
                'Error',
                error.message || 'Failed to delete transaction',
                [{ text: 'OK' }]
            );
        }
    };

    // Handle edit transaction
    const handleEditTransaction = (transaction: Transaction) => {
        console.log('🔄 Navigating to edit transaction:', transaction);
        navigation.navigate('AddExpenseScreen' as any, {
            editMode: true,
            transactionData: {
                id: transaction.id,
                amount: transaction.amount.toString(),
                note: transaction.description || '',
                date: transaction.date,
                category: transaction.category,
                type: transaction.type,
                icon: transaction.icon,
                iconColor: transaction.iconColor
            }
        });
    };

    // Create marked dates - simple marking for days with transactions
    const getMarkedDates = () => {
        const marked: any = {};
        
        Object.keys(dayData).forEach(date => {
            marked[date] = {
                customStyles: {
                    container: {
                        backgroundColor: 'transparent',
                        borderRadius: 4,
                    },
                    text: {
                        color: '#333',
                        fontSize: 14,
                        fontWeight: 'normal',
                    }
                }
            };
        });
        
        return marked;
    };

    const renderDayComponent = ({ date, state }: any) => {
        const dateStr = date.dateString;
        const data = dayData[dateStr];

        return (
            <View style={styles.dayContainer}>
                <Text style={styles.dayNumber}>
                    {date.day}
                </Text>
                <View style={styles.amountContainerFixed}>
                    {data && data.income > 0 && (
                        <Text style={styles.incomeText}>
                            {formatMoney(data.income, 7)}
                        </Text>
                    )}
                    {data && data.expense > 0 && (
                        <Text style={styles.expenseText}>
                            {formatMoney(data.expense, 7)}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const renderTransaction = (transaction: Transaction) => (
        <TouchableOpacity key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
                <View style={[styles.transactionIcon, { backgroundColor: transaction.iconColor + '20' }]}>
                    <Icon name={transaction.icon} size={20} color={transaction.iconColor} />
                </View>
                <View style={styles.transactionInfo}>
                    <Text style={styles.transactionCategory}>{transaction.category}</Text>
                    {transaction.description && (
                        <Text style={styles.transactionDescription}>{transaction.description}</Text>
                    )}
                </View>
            </View>
            <Text style={[
                styles.transactionAmount,
                transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount
            ]}>
                {transaction.type === 'income' ? '+' : '-'}{formatMoney(transaction.amount)}
            </Text>
            <Icon name="chevron-right" size={20} color="#999" />
        </TouchableOpacity>
    );

    const renderDayGroup = (date: string, dayTransactions: Transaction[]) => {
        const dayTotal = dayTransactions.reduce((total, transaction) => {
            return transaction.type === 'income' 
                ? total + transaction.amount 
                : total - transaction.amount;
        }, 0);

        return (
            <View key={date} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderDate}>
                        {formatDayHeader(date)}
                    </Text>
                    <Text style={[
                        styles.dayHeaderTotal,
                        dayTotal >= 0 ? styles.positiveTotal : styles.negativeTotal
                    ]}>
                        {dayTotal >= 0 ? '+' : ''}{formatMoney(Math.abs(dayTotal))}
                    </Text>
                </View>
                {dayTransactions.map(transaction => (
                    <SwipeableTransactionItem 
                        key={transaction.id} 
                        transaction={transaction} 
                        onDelete={(id) => handleDeleteTransaction(id)}
                        onEdit={handleEditTransaction}
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-left" size={24} color="#1e90ff" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
                
                <TouchableOpacity style={styles.searchButton}>
                    <Icon name="magnify" size={24} color="#1e90ff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Scrollable All-in-One View */}
                <ScrollView 
                    style={styles.transactionsList} 
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                >
                    {/* Calendar */}
                    <View style={styles.calendarContainer}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>{t('common.loading')}</Text>
                            </View>
                        ) : (
                            <Calendar
                                current={currentMonth + '-01'}
                                onMonthChange={(month: DateData) => {
                                    const newMonth = month.dateString?.substring(0, 7) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                                    setCurrentMonth(newMonth);
                                    // loadTransactionOverview will be called by useEffect when currentMonth changes
                                }}
                                markingType={'custom'}
                                markedDates={getMarkedDates()}
                                dayComponent={renderDayComponent}
                                renderHeader={renderCalendarHeader}
                                theme={{
                                    backgroundColor: '#ffffff',
                                    calendarBackground: '#ffffff',
                                    textSectionTitleColor: '#b6c1cd',
                                    selectedDayBackgroundColor: '#007AFF',
                                    selectedDayTextColor: '#ffffff',
                                    todayTextColor: '#007AFF',
                                    dayTextColor: '#2d4150',
                                    textDisabledColor: '#d9e1e8',
                                    arrowColor: '#007AFF',
                                    monthTextColor: '#333',
                                    indicatorColor: '#007AFF',
                                    textDayFontWeight: '400',
                                    textMonthFontWeight: 'bold',
                                    textDayHeaderFontWeight: '600',
                                    textDayFontSize: 14,
                                    textMonthFontSize: 18,
                                    textDayHeaderFontSize: 12
                                }}
                                style={styles.calendar}
                            />
                        )}
                    </View>

                    {/* Summary */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('calendar.income')}</Text>
                            <Text style={styles.incomeAmount}>{formatMoney(monthlyTotals.income, 7)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('calendar.expense')}</Text>
                            <Text style={styles.expenseAmount}>{formatMoney(monthlyTotals.expense, 7)}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>{t('calendar.total')}</Text>
                            <Text style={[
                                styles.totalAmount,
                                monthlyTotals.total >= 0 ? styles.positiveTotal : styles.negativeTotal
                            ]}>
                                {monthlyTotals.total >= 0 ? '+' : ''}{formatMoney(Math.abs(monthlyTotals.total), 7)}
                            </Text>
                        </View>
                    </View>

                    {/* Month Info */}
                    <Text style={styles.selectedDateTitle}>
                        {loading ? (
                            `${t('common.loading')} - ${currentMonth}...`
                        ) : (
                            `${t('calendar.transactionsFor')} ${formatMonthDisplay(currentMonth)}`
                        )}
                    </Text>

                    {/* Transactions List */}
                    {loading ? (
                        <View style={styles.transactionLoadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                            <Text style={styles.loadingText}>{t('common.loading')}</Text>
                        </View>
                    ) : Object.keys(groupedTransactions).length > 0 ? (
                        <FlatList
                            data={Object.entries(groupedTransactions)}
                            keyExtractor={([date]) => date}
                            renderItem={({ item: [date, dayTransactions] }) => renderDayGroup(date, dayTransactions)}
                            ListEmptyComponent={
                                <View style={styles.noTransactions}>
                                    <Text style={styles.noTransactionsText}>
                                        {t('calendar.noTransactionsThisMonth')}
                                    </Text>
                                </View>
                            }
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    ) : (
                        <View style={styles.noTransactions}>
                            <Text style={styles.noTransactionsText}>
                                {t('calendar.noTransactionsThisMonth')}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Month Picker Modal */}
            {showMonthPicker && (
                <MonthPickerModal />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        ...typography.semibold,
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    searchButton: {
        padding: 8,
    },
    content: {
        flex: 1,
    },
    calendarContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
    },
    calendar: {
        paddingHorizontal: 16,
    },
    dayContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        minHeight: 50,
        borderRadius: 4,
    },
    selectedDay: {
        backgroundColor: '#007AFF',
    },
    todayDay: {
        backgroundColor: '#E8F0FE',
    },
    dayNumber: {
        fontSize: 14,
        ...typography.regular,
        color: '#333',
    },
    selectedDayText: {
        ...typography.semibold,
        color: '#FFFFFF',
    },
    disabledDayText: {
        ...typography.regular,
        color: '#d9e1e8',
    },
    amountContainer: {
        alignItems: 'center',
        marginTop: 2,
    },
    amountContainerFixed: {
        alignItems: 'center',
        marginTop: 2,
        height: 16, // Chiều cao cố định để các ngày đều nhau
        justifyContent: 'center',
    },
    incomeText: {
        fontSize: 8,
        color: '#34C759',
        ...typography.medium,
    },
    expenseText: {
        fontSize: 8,
        color: '#FF3B30',
        ...typography.medium,
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F8F9FA',
        // marginHorizontal: 16, // bỏ để mở rộng full width
        marginVertical: 8,
        borderRadius: 12,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        ...typography.regular,
        color: '#666',
        marginBottom: 4,
    },
    incomeAmount: {
        fontSize: 16,
        ...typography.semibold,
        color: '#34C759',
    },
    expenseAmount: {
        fontSize: 16,
        ...typography.semibold,
        color: 'red',
    },
    totalAmount: {
        fontSize: 16,
        ...typography.semibold,
    },
    positiveTotal: {
        color: '#34C759',
    },
    negativeTotal: {
        color: '#FF3B30',
    },
    selectedDateTitle: {
        fontSize: 16,
        ...typography.semibold,
        color: '#333',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    transactionsList: {
        flex: 1,
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionCategory: {
        fontSize: 16,
        ...typography.medium,
        color: '#333',
    },
    transactionDescription: {
        fontSize: 12,
        ...typography.regular,
        color: '#666',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        ...typography.semibold,
        marginRight: 8,
    },
    noTransactions: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noTransactionsText: {
        fontSize: 16,
        ...typography.regular,
        color: '#666',
    },
    dayGroup: {
        marginBottom: 16,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
    },
    dayHeaderDate: {
        fontSize: 16,
        ...typography.semibold,
        color: '#333',
    },
    dayHeaderTotal: {
        fontSize: 16,
        ...typography.semibold,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    transactionLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        minHeight: 200,
    },
    loadingText: {
        fontSize: 16,
        ...typography.regular,
        color: '#666',
        marginTop: 8,
    },
    bottomNavigation: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingTop: 8,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    navText: {
        fontSize: 12,
        ...typography.regular,
        color: '#999',
        marginTop: 4,
    },
    activeNavText: {
        color: '#FF9500',
        ...typography.medium,
    },
    swipeableContainer: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
    deleteAction: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 100,
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    deleteButton: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
        paddingVertical: 15,
        width: '100%',
        height: '100%',
    },
    deleteText: {
        fontSize: 12,
        ...typography.semibold,
        color: '#FFFFFF',
        marginTop: 4,
    },
    transactionItemSwipeable: {
        backgroundColor: '#FFFFFF',
        zIndex: 2,
        width: '100%',
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
    },
    calendarHeaderText: {
        fontSize: 18,
        ...typography.semibold,
        color: '#333',
    },
    calendarHeaderIcon: {
        marginLeft: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '85%',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    yearSelectionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 8,
    },
    yearArrowButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F8F9FA',
    },
    yearDisplayContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        minWidth: 100,
        justifyContent: 'center',
    },
    yearDisplayText: {
        fontSize: 18,
        ...typography.semibold,
        color: '#333',
        marginRight: 8,
    },
    yearPickerContainer: {
        maxHeight: 120,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 3,
    },
    yearPickerScroll: {
        maxHeight: 120,
    },
    yearPickerItem: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    selectedYearPickerItem: {
        backgroundColor: '#007AFF',
    },
    yearPickerItemText: {
        fontSize: 16,
        ...typography.medium,
        color: '#333',
        textAlign: 'center',
    },
    selectedYearPickerItemText: {
        color: '#FFFFFF',
        ...typography.semibold,
    },
    monthGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 1,
    },
    monthGridItem: {
        width: '30%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    selectedMonthGridItem: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    monthGridItemText: {
        fontSize: 14,
        ...typography.medium,
        color: '#333',
        textAlign: 'center',
    },
    selectedMonthGridItemText: {
        color: '#FFFFFF',
        ...typography.semibold,
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 0,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#007AFF',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        ...typography.medium,
        color: '#007AFF',
    },
    okButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#007AFF',
        alignItems: 'center',
    },
    okButtonText: {
        fontSize: 16,
        ...typography.medium,
        color: '#FFFFFF',
    },
});

export default CalendarScreen; 