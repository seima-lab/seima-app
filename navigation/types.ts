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
  MainTab: undefined;
  MainTabScreen: undefined;
  AddExpenseScreen: undefined;
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
  ReportDetailScreen: {
    title: string;
    categoryType: 'expense' | 'income';
    data: import('../services/transactionService').ReportByCategory[];
    totalAmount: number;
  };
};

export type ScreenNames = keyof RootStackParamList; 