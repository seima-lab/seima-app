export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTP: {
    email?: string;
    phoneNumber?: string;
    type?: 'register' | 'forgot-password';
  };
  ResetPassword: {
    email?: string;
  };
  Calendar: undefined;
  ChangePassword: undefined;
  ChatAI: undefined;
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
  AddExpenseScreen: undefined;
  EditCategoryScreen: { type: 'expense' | 'income' };
  AddEditCategoryScreen: { 
    mode: 'add' | 'edit';
    type: 'expense' | 'income';
    category?: {
      key: string;
      label: string;
      icon: string;
      color: string;
    };
  };
};

export type ScreenNames = keyof RootStackParamList; 