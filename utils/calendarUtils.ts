// Calendar utility functions for CalendarScreen

// Format money helper function
export const formatMoney = (amount: number | undefined | null, maxLength?: number): string => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0đ';
  }
  const formatted = amount.toLocaleString('vi-VN');
  if (maxLength && formatted.replace(/\D/g, '').length > maxLength) {
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

// Helper function to get month key for translation
export const getMonthKey = (monthIndex: number): string => {
  const monthKeys = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  return monthKeys[monthIndex] || 'january';
};

// Helper function to format day header with proper localization
export const formatDayHeader = (dateString: string, t: (key: string) => string): string => {
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

// Format month display function
export const formatMonthDisplay = (monthString: string, t: (key: string) => string): string => {
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

// Interface definitions
export interface Transaction {
  id: string;
  date: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  icon: string;
  iconColor: string;
  description?: string;
  // Full datetime from backend for intra-day sorting
  transaction_datetime?: string;
  // Optional wallet mapping for edit navigation
  wallet_id?: number;
  walletId?: number;
  // Optional receipt image fields for edit navigation
  receipt_image_url?: string | null;
  receiptImageUrl?: string | null;
  receipt_image?: string | null;
  receiptImage?: string | null;
}

export interface DayData {
  income: number;
  expense: number;
  total: number;
}

// Constants
export const MONTH_OPTIONS = [
  { value: 0, label: 'months.january' },
  { value: 1, label: 'months.february' },
  { value: 2, label: 'months.march' },
  { value: 3, label: 'months.april' },
  { value: 4, label: 'months.may' },
  { value: 5, label: 'months.june' },
  { value: 6, label: 'months.july' },
  { value: 7, label: 'months.august' },
  { value: 8, label: 'months.september' },
  { value: 9, label: 'months.october' },
  { value: 10, label: 'months.november' },
  { value: 11, label: 'months.december' }
];

export const YEAR_RANGE = Array.from({ length: 21 }, (_, i) => 2010 + i);

export const CALENDAR_THEME = {
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
  textDayFontWeight: '400' as const,
  textMonthFontWeight: 'bold' as const,
  textDayHeaderFontWeight: '600' as const,
  textDayFontSize: 14,
  textMonthFontSize: 18,
  textDayHeaderFontSize: 12
};
