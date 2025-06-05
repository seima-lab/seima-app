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
  ChangePassword: undefined;
  ChatAI: undefined;
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