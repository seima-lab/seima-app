import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    FlatList,
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
import MonthPickerModal from '../components/MonthPickerModal';
import SwipeableTransactionItem from '../components/SwipeableTransactionItem';
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
import {
    CALENDAR_THEME,
    DayData,
    formatDayHeader,
    formatMoney,
    formatMonthDisplay,
    Transaction
} from '../utils/calendarUtils';
import { getIconColor, getIconForCategory } from '../utils/iconUtils';

// Components imported from separate files

const CalendarScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    const { transactionRefreshTrigger } = useAuth();
    
    // Initialize with current month
    const today = new Date();
    const currentMonthString = today.toISOString()?.substring(0, 7) || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    const [currentMonth, setCurrentMonth] = useState(currentMonthString);
    const [headerMonth, setHeaderMonth] = useState(currentMonthString);
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
            
            // Debug: Check if any transaction has group_id
            if (data?.by_date && Array.isArray(data.by_date)) {
                let hasGroupTransactions = false;
                data.by_date.forEach((dailyData, dayIndex) => {
                    if (dailyData.transactions && Array.isArray(dailyData.transactions)) {
                        dailyData.transactions.forEach((transaction, transIndex) => {
                            if (transaction.group_id) {
                                hasGroupTransactions = true;
                                console.log(`🔍 Found group transaction in API response:`, {
                                    day: dayIndex + 1,
                                    transactionIndex: transIndex + 1,
                                    transactionId: transaction.transaction_id,
                                    groupId: transaction.group_id,
                                    categoryName: transaction.category_name
                                });
                            }
                        });
                    }
                });
                
                if (!hasGroupTransactions) {
                    console.log('ℹ️ No group transactions found in API response - all transactions appear to be personal');
                }
            }
            
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

    // Memoized function to convert API data to local Transaction format
    const convertToLocalTransaction = useCallback((item: TransactionItem, date: string): Transaction | null => {
        // Filter out inactive or invalid transaction types
        const validTypes = ['income', 'expense', 'INCOME', 'EXPENSE'];
        const transactionType = item.transaction_type?.toLowerCase();
        
        if (!transactionType || !validTypes.includes(item.transaction_type)) {
            console.log('⚠️ Filtered out invalid transaction type:', item.transaction_type, 'for transaction:', item.transaction_id);
            return null;
        }
        
        // Filter out transactions with group_id (group transactions)
        if (item.group_id) {
            console.log('⚠️ Filtered out group transaction:', {
                transactionId: item.transaction_id,
                groupId: item.group_id,
                categoryName: item.category_name
            });
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
    }, []);

    // Memoized function to get all transactions from API data
    const getAllTransactions = useCallback((): Transaction[] => {
        console.log('🔄 Getting all transactions from overview data...');
        
        if (!overviewData || !overviewData.by_date || !Array.isArray(overviewData.by_date)) {
            console.log('⚠️ No overview data available for transactions');
            return [];
        }
        
        const transactions: Transaction[] = [];
        let totalTransactions = 0;
        let filteredGroupTransactions = 0;
        
        overviewData.by_date.forEach((dailyTransaction: DailyTransactions, dayIndex: number) => {
            console.log(`📅 Processing day ${dayIndex + 1}:`, dailyTransaction.date);
            
            if (dailyTransaction && dailyTransaction.transactions && Array.isArray(dailyTransaction.transactions)) {
                console.log(`📝 Found ${dailyTransaction.transactions.length} transactions for ${dailyTransaction.date}`);
                
                dailyTransaction.transactions.forEach((item: TransactionItem, transIndex: number) => {
                    if (item) {
                        totalTransactions++;
                        
                        // Debug: Log the raw transaction item to see if group_id exists
                        console.log(`🔍 Raw transaction ${transIndex + 1}:`, {
                            transactionId: item.transaction_id,
                            categoryName: item.category_name,
                            amount: item.amount,
                            transactionType: item.transaction_type,
                            groupId: item.group_id,
                            hasGroupId: item.group_id !== undefined && item.group_id !== null
                        });
                        
                        // Check if this is a group transaction
                        if (item.group_id) {
                            filteredGroupTransactions++;
                            console.log(`🚫 Group transaction filtered:`, {
                                transactionId: item.transaction_id,
                                groupId: item.group_id,
                                categoryName: item.category_name
                            });
                        }
                        
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
        console.log(`📊 Transaction summary:`, {
            totalTransactions,
            filteredGroupTransactions,
            displayedTransactions: transactions.length
        });
        return transactions;
    }, [overviewData, convertToLocalTransaction]);

    const transactions = useMemo(() => getAllTransactions(), [getAllTransactions]);

    // Memoized function to calculate day data
    const getDayData = useCallback((): { [key: string]: DayData } => {
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
    }, [transactions]);

    const dayData = useMemo(() => getDayData(), [getDayData]);

    // Memoized function to get monthly totals
    const getMonthlyTotals = useCallback(() => {
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
    }, [overviewData]);

    const monthlyTotals = useMemo(() => getMonthlyTotals(), [getMonthlyTotals]);

    // Memoized handlers for month picker
    const handleOpenMonthPicker = useCallback(() => {
        setPickerDate(new Date(currentMonth + '-01'));
        setShowMonthPicker(true);
    }, [currentMonth]);

    const handleMonthPickerConfirm = useCallback((monthString: string) => {
        setCurrentMonth(monthString);
        setHeaderMonth(monthString);
        setShowMonthPicker(false);
    }, []);

    const handleMonthPickerCancel = useCallback(() => {
        setShowMonthPicker(false);
    }, []);

    // Memoized custom header renderer for Calendar
    const renderCalendarHeader = useCallback(() => {
        console.log('🔍 renderCalendarHeader called with headerMonth:', headerMonth);
        console.log('🔍 formatted display:', formatMonthDisplay(headerMonth, t));
        
        return (
            <TouchableOpacity 
                style={styles.calendarHeader}
                onPress={handleOpenMonthPicker}
            >
                <Text style={styles.calendarHeaderText}>
                    {formatMonthDisplay(headerMonth, t)}
                </Text>
                <Icon name="chevron-down" size={16} color="#007AFF" style={styles.calendarHeaderIcon} />
            </TouchableOpacity>
        );
    }, [headerMonth, handleOpenMonthPicker, t]);

    // Memoized function to group transactions by date for the entire month
    const getGroupedTransactions = useCallback((): { [date: string]: Transaction[] } => {
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
    }, [transactions]);

    const groupedTransactions = useMemo(() => getGroupedTransactions(), [getGroupedTransactions]);

    // Memoized handle delete transaction
    const handleDeleteTransaction = useCallback(async (transactionId: string) => {
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
    }, [currentMonth]);

    // Memoized handle edit transaction
    const handleEditTransaction = useCallback((transaction: Transaction) => {
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
    }, [navigation]);

    // Memoized function to create marked dates - simple marking for days with transactions
    const getMarkedDates = useCallback(() => {
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
    }, [dayData]);

    const renderDayComponent = useCallback(({ date, state }: any) => {
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
    }, [dayData]);

    const renderDayGroup = useCallback((date: string, dayTransactions: Transaction[]) => {
        const dayTotal = dayTransactions.reduce((total, transaction) => {
            return transaction.type === 'income' 
                ? total + transaction.amount 
                : total - transaction.amount;
        }, 0);

        return (
            <View key={date} style={styles.dayGroup}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayHeaderDate}>
                        {formatDayHeader(date, t)}
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
                        onDelete={handleDeleteTransaction}
                        onEdit={handleEditTransaction}
                    />
                ))}
            </View>
        );
    }, [handleDeleteTransaction, handleEditTransaction, t]);

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
                
                <View style={styles.headerSpacer} />
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
                            <>
                                {console.log('🔍 Calendar rendering with currentMonth:', currentMonth)}
                                <Calendar
                                    key={currentMonth}
                                    current={currentMonth + '-01'}
                                onMonthChange={(month: DateData) => {
                                    const newMonth = month.dateString?.substring(0, 7) || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                                    setCurrentMonth(newMonth);
                                    setHeaderMonth(newMonth);
                                    // loadTransactionOverview will be called by useEffect when currentMonth changes
                                }}
                                markingType={'custom'}
                                markedDates={getMarkedDates()}
                                dayComponent={renderDayComponent}
                                renderHeader={renderCalendarHeader}
                                theme={CALENDAR_THEME}
                                style={styles.calendar}
                            />
                            </>
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
                            `${t('calendar.transactionsFor')} ${formatMonthDisplay(currentMonth, t)}`
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
            <MonthPickerModal
                visible={showMonthPicker}
                currentMonth={currentMonth}
                onConfirm={handleMonthPickerConfirm}
                onCancel={handleMonthPickerCancel}
            />
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
    headerSpacer: {
        width: 40, // Same width as backButton for balance
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
    // Swipeable styles moved to SwipeableTransactionItem component
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
    // Month picker modal styles moved to MonthPickerModal component
});

export default CalendarScreen; 