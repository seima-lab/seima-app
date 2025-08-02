import { TabType } from '../utils/mainTabUtils';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTP: {
    email?: string;
    phoneNumber?: string;
    type?: 'register' | 'forgot-password';
  };
  VerifyOTP: {
    email: string;
  };
  ResetPassword: {
    email?: string;
    otp?: string;
    verificationToken?: string;
  };
  Calendar: undefined;
  ChangePassword: undefined;
  ChatAI: undefined;
  GroupManagement: undefined;
  CreateGroup: {
    mode?: 'create' | 'edit';
    groupData?: import('../services/groupService').GroupDetailResponse;
  } | undefined;
  Notifications: undefined;
  NotificationDetail: {
    notification: {
      id: string;
      type: 'payment' | 'expense' | 'transaction';
      title: string;
      description: string;
      timestamp: string;
      icon: string;
      iconColor: string;
      iconBackground: string;
    };
  };
  FinanceScreen: undefined;
  UpdateProfile: undefined;
  SettingScreen: undefined;
  MainTab: { initialTab?: TabType } | undefined;
  MainTabScreen: { initialTab?: TabType } | undefined;
  AddExpenseScreen: {
    fromGroupOverview?: boolean;
    fromGroupTransactionList?: boolean;
    groupId?: string;
    groupName?: string;
    editMode?: boolean;
    transactionData?: {
      id: string;
      amount: string;
      note: string;
      date: string;
      category: string;
      type: string;
      icon: string;
      iconColor: string;
      categoryId?: number;
    };
  } | undefined;
  BudgetScreen: undefined;
  AddBudgetCategoryScreen: undefined;
  SetBudgetLimitScreen: {
    mode: 'add' | 'edit';
    category: {
      id: string;
      name: string;
      icon: string;
      color: string;
      backgroundColor: string;
    };
    currentBudget?: number;
  };
  AddEditBudgetScreen: {
    mode: 'add' | 'edit';
    budgetItem?: {
      id: string;
      name: string;
      budget: number;
      categoryId: string;
    };
  };
  EditCategoryScreen: { type: 'expense' | 'income' };
  AddEditCategoryScreen: { 
    mode: 'add' | 'edit';
    type: 'expense' | 'income';
    category?: {
      key: string;
      label: string;
      icon: string;
      color?: string;
    };
  };
  AddWalletScreen: {
    editMode?: boolean;
    walletData?: {
      balance: string;
      name: string;
      type: string;
      bankName: string;
      description: string;
      isDefault: boolean;
      excludeFromTotal: boolean;
    };
  } | undefined;
  GroupDetail: { 
    groupId: string; 
    groupName: string;
    groupData?: import('../services/groupService').GroupDetailResponse;
  };
  EditGroup: { groupId: string; groupName: string };
  InviteUsers: { groupId: string };
  ApproveMembers: { groupId: string };
  GroupMembers: { groupId: string; groupName: string };
  GroupSettings: { 
    groupId: string; 
    groupName: string; 
    group_avatar_url?: string;
    group_created_date?: string;
  };
  GroupTransactionList: { 
    groupId: string; 
    groupName: string; 
  };
  PendingGroups: undefined;
  ReportDetailScreen: {
    title: string;
    categoryType: 'expense' | 'income';
    data: import('../services/transactionService').ReportByCategory[];
    totalAmount: number;
    groupId?: number;
    startDate?: string;
    endDate?: string;
    periodType?: import('../components/PeriodFilterBar').PeriodType;
    selectedPeriod?: string;
    weekReferenceDate?: Date;
    customStartDate?: Date;
    customEndDate?: Date;
  };
  SelectCategoryScreen: {
    categoryType: 'expense' | 'income';
    selectedCategories?: import('../services/categoryService').CategoryResponse[];
    onSelectCategories: (categories: import('../services/categoryService').CategoryResponse[]) => void;
  };
  BudgetDetailScreen: { budgetId: number };
  StatusInviteMember: {
    status: import('../screens/StatusInviteMember').GroupMemberStatus;
    group_name?: string;
    role?: string;
    joined_at?: string;
    invited_at?: string;
  };
  SelectWalletScreen: {
    wallets: import('../services/walletService').WalletResponse[];
    selectedWallet?: import('../services/walletService').WalletResponse | null;
    onSelectWallet: (wallet: import('../services/walletService').WalletResponse | null) => void;
  };
  WalletTransactionHistory: {
    walletId: number;
    walletName: string;
  };
  CategoryReportDetailScreen: {
    category_id: number | string;
    category_name: string;
    start_date?: string;
    end_date?: string;
    groupId?: number;
    periodType?: import('../components/PeriodFilterBar').PeriodType;
    selectedPeriod?: string;
    weekReferenceDate?: Date;
    customStartDate?: Date;
    customEndDate?: Date;
  };
  CategoryDetailReportScreen: {
    category_id: number;
    category_name: string;
    start_date: string;
    end_date: string;
    periodType?: import('../components/PeriodFilterBar').PeriodType;
    selectedPeriod?: string;
    weekReferenceDate?: Date;
    customStartDate?: Date;
    customEndDate?: Date;
  };
  ViewCategoryReportScreen: { type: 'expense' | 'income' };
  ReportScreen: { 
    groupId?: number; 
    groupName?: string; 
  } | undefined;
};
  
export type ScreenNames = keyof RootStackParamList; 