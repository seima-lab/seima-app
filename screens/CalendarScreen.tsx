import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

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

const CalendarScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    
    const [selectedDate, setSelectedDate] = useState('2025-05-20');
    const [currentMonth, setCurrentMonth] = useState('2025-05');

    // Mock data for transactions
    const transactions: Transaction[] = [
        {
            id: '1',
            date: '2025-05-26',
            category: 'Không có',
            amount: 10000,
            type: 'expense',
            icon: 'more-horiz',
            iconColor: '#666',
            description: 'Không có'
        },
        {
            id: '2',
            date: '2025-05-20',
            category: 'Ăn uống',
            amount: 30000,
            type: 'expense',
            icon: 'restaurant',
            iconColor: '#FF9500',
            description: 'Ăn uống'
        },
        {
            id: '3',
            date: '2025-05-20',
            category: 'Ăn uống',
            amount: 35000,
            type: 'expense',
            icon: 'restaurant',
            iconColor: '#FF9500',
            description: 'Ăn uống'
        },
        {
            id: '4',
            date: '2025-05-20',
            category: 'Ăn uống',
            amount: 0,
            type: 'expense',
            icon: 'restaurant',
            iconColor: '#FF9500',
            description: 'Ăn uống'
        },
        {
            id: '5',
            date: '2025-05-20',
            category: 'Thu nhập phụ',
            amount: 1000000,
            type: 'income',
            icon: 'account-balance-wallet',
            iconColor: '#34C759',
            description: 'Thu nhập phụ (Vợ iu cho)'
        },
        {
            id: '6',
            date: '2025-05-19',
            category: 'Chi tiêu hàng ngày',
            amount: 180000,
            type: 'expense',
            icon: 'shopping-basket',
            iconColor: '#007AFF',
            description: 'Chi tiêu hàng ngày'
        },
    ];

    // Calculate day data
    const getDayData = (): { [key: string]: DayData } => {
        const dayData: { [key: string]: DayData } = {};
        
        transactions.forEach(transaction => {
            if (!dayData[transaction.date]) {
                dayData[transaction.date] = { income: 0, expense: 0, total: 0 };
            }
            
            if (transaction.type === 'income') {
                dayData[transaction.date].income += transaction.amount;
            } else {
                dayData[transaction.date].expense += transaction.amount;
            }
            
            dayData[transaction.date].total = dayData[transaction.date].income - dayData[transaction.date].expense;
        });
        
        return dayData;
    };

    const dayData = getDayData();

    // Get monthly totals
    const getMonthlyTotals = () => {
        let totalIncome = 0;
        let totalExpense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.date.startsWith(currentMonth)) {
                if (transaction.type === 'income') {
                    totalIncome += transaction.amount;
                } else {
                    totalExpense += transaction.amount;
                }
            }
        });
        
        return {
            income: totalIncome,
            expense: totalExpense,
            total: totalIncome - totalExpense
        };
    };

    const monthlyTotals = getMonthlyTotals();

    // Get transactions for selected date
    const getSelectedDateTransactions = () => {
        return transactions.filter(transaction => transaction.date === selectedDate);
    };

    const selectedTransactions = getSelectedDateTransactions();

    // Format money
    const formatMoney = (amount: number): string => {
        return amount.toLocaleString('vi-VN') + 'đ';
    };

    // Create marked dates
    const getMarkedDates = () => {
        const marked: any = {};
        
        Object.keys(dayData).forEach(date => {
            const data = dayData[date];
            marked[date] = {
                customStyles: {
                    container: {
                        backgroundColor: date === selectedDate ? '#007AFF' : 'transparent',
                        borderRadius: 4,
                    },
                    text: {
                        color: date === selectedDate ? 'white' : '#333',
                        fontSize: 14,
                        fontWeight: date === selectedDate ? 'bold' : 'normal',
                    }
                }
            };
        });

        // Ensure selected date is marked even if no transactions
        if (!marked[selectedDate]) {
            marked[selectedDate] = {
                customStyles: {
                    container: {
                        backgroundColor: '#007AFF',
                        borderRadius: 4,
                    },
                    text: {
                        color: 'white',
                        fontSize: 14,
                        fontWeight: 'bold',
                    }
                }
            };
        }
        
        return marked;
    };

    const renderDayComponent = ({ date, state }: any) => {
        const dateStr = date.dateString;
        const data = dayData[dateStr];
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === new Date().toISOString().split('T')[0];
        
        return (
            <TouchableOpacity
                style={[
                    styles.dayContainer,
                    isSelected && styles.selectedDay,
                    isToday && !isSelected && styles.todayDay
                ]}
                onPress={() => setSelectedDate(dateStr)}
            >
                <Text style={[
                    styles.dayNumber,
                    isSelected && styles.selectedDayText,
                    state === 'disabled' && styles.disabledDayText
                ]}>
                    {date.day}
                </Text>
                {data && (
                    <View style={styles.amountContainer}>
                        {data.income > 0 && (
                            <Text style={styles.incomeText}>
                                {formatMoney(data.income)}
                            </Text>
                        )}
                        {data.expense > 0 && (
                            <Text style={styles.expenseText}>
                                {formatMoney(data.expense)}
                            </Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back-ios" size={24} color="#1e90ff" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
                
                <TouchableOpacity style={styles.searchButton}>
                    <Icon name="search" size={24} color="#1e90ff" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Calendar */}
                <View style={styles.calendarContainer}>
                    <Calendar
                        current={currentMonth + '-01'}
                        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                        onMonthChange={(month: DateData) => setCurrentMonth(month.dateString.substring(0, 7))}
                        markingType={'custom'}
                        markedDates={getMarkedDates()}
                        dayComponent={renderDayComponent}
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
                </View>

                {/* Summary */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{t('calendar.income')}</Text>
                        <Text style={styles.incomeAmount}>{formatMoney(monthlyTotals.income)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{t('calendar.expense')}</Text>
                        <Text style={styles.expenseAmount}>{formatMoney(monthlyTotals.expense)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>{t('calendar.total')}</Text>
                        <Text style={[
                            styles.totalAmount,
                            monthlyTotals.total >= 0 ? styles.positiveTotal : styles.negativeTotal
                        ]}>
                            {monthlyTotals.total >= 0 ? '+' : ''}{formatMoney(monthlyTotals.total)}
                        </Text>
                    </View>
                </View>

                {/* Selected Date Info */}
                <Text style={styles.selectedDateTitle}>
                    {new Date(selectedDate).toLocaleDateString('vi-VN', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    })}
                </Text>

                {/* Transactions List */}
                <View style={styles.transactionsList}>
                    {selectedTransactions.length > 0 ? (
                        selectedTransactions.map(renderTransaction)
                    ) : (
                        <View style={styles.noTransactions}>
                            <Text style={styles.noTransactionsText}>
                                {t('calendar.noTransactions')}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

      
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
        fontWeight: '600',
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
        color: '#333',
        fontWeight: '400',
    },
    selectedDayText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    disabledDayText: {
        color: '#d9e1e8',
    },
    amountContainer: {
        alignItems: 'center',
        marginTop: 2,
    },
    incomeText: {
        fontSize: 8,
        color: '#34C759',
        fontWeight: '500',
    },
    expenseText: {
        fontSize: 8,
        color: '#FF3B30',
        fontWeight: '500',
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#F8F9FA',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 12,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    incomeAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#34C759',
    },
    expenseAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'red',
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    positiveTotal: {
        color: '#34C759',
    },
    negativeTotal: {
        color: '#FF3B30',
    },
    selectedDateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    transactionsList: {
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
        fontWeight: '500',
        color: '#333',
    },
    transactionDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '600',
        marginRight: 8,
    },
    noTransactions: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    noTransactionsText: {
        fontSize: 16,
        color: '#666',
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
        color: '#999',
        marginTop: 4,
    },
    activeNavText: {
        color: '#FF9500',
        fontWeight: '500',
    },
});

export default CalendarScreen; 