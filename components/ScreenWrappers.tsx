import AddEditCategoryScreen from '../screens/AddEditCategoryScreen';
import AddExpenseScreen from '../screens/AddExpenseScreen';
import AddWalletScreen from '../screens/AddWalletScreen';
import ApproveMembersScreen from '../screens/ApproveMembersScreen';
import BudgetDetailScreen from '../screens/BudgetDetailScreen';
import BudgetScreen from '../screens/BudgetScreen';
import CalendarScreen from '../screens/CalendarScreen';
import CategoryReportDetailScreen from '../screens/CategoryReportDetailScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import ChatAIScreen from '../screens/ChatAIScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import EditCategoryScreen from '../screens/EditCategoryScreen';
import EditGroupScreen from '../screens/EditGroupScreen';
import FinanceScreen from '../screens/FinanceScreen';
import GroupDetailTabScreen from '../screens/GroupDetailTabScreen';
import GroupManagementScreen from '../screens/GroupManagementScreen';
import GroupMembersScreenContainer from '../screens/GroupMembersScreen';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import GroupTransactionListScreen from '../screens/GroupTransactionListScreen';
import InviteUsersScreen from '../screens/InviteUsersScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ReportDetailScreen from '../screens/ReportDetailScreen';
import SelectCategoryScreen from '../screens/SelectCategoryScreen';
import SetBudgetLimitScreen from '../screens/SetBudgetLimitScreen';
import StatusInviteMember, { GroupMemberStatus } from '../screens/StatusInviteMember';
import UpdateProfileScreen from '../screens/update-profile';
import WithBottomNavigation from './WithBottomNavigation';

// Wrapper components for each screen
export const AddExpenseScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <AddExpenseScreen {...props} />
  </WithBottomNavigation>
);

export const EditCategoryScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <EditCategoryScreen {...props} />
  </WithBottomNavigation>
);

export const AddEditCategoryScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <AddEditCategoryScreen {...props} />
  </WithBottomNavigation>
);

export const BudgetScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <BudgetScreen {...props} />
  </WithBottomNavigation>
);

export const FinanceScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <FinanceScreen {...props} />
  </WithBottomNavigation>
);

export const UpdateProfileScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <UpdateProfileScreen {...props} />
  </WithBottomNavigation>
);

export const ChangePasswordScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <ChangePasswordScreen {...props} />
  </WithBottomNavigation>
);

export const ChatAIScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <ChatAIScreen {...props} />
  </WithBottomNavigation>
);

export const GroupManagementScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <GroupManagementScreen {...props} />
  </WithBottomNavigation>
);

export const CreateGroupScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <CreateGroupScreen {...props} />
  </WithBottomNavigation>
);

export const GroupDetailTabScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <GroupDetailTabScreen {...props} />
  </WithBottomNavigation>
);

export const EditGroupScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <EditGroupScreen {...props} />
  </WithBottomNavigation>
);

export const GroupTransactionListScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <GroupTransactionListScreen {...props} />
  </WithBottomNavigation>
);

export const NotificationsScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <NotificationsScreen {...props} />
  </WithBottomNavigation>
);

export const NotificationDetailScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <NotificationDetailScreen {...props} />
  </WithBottomNavigation>
);

export const CalendarScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <CalendarScreen {...props} />
  </WithBottomNavigation>
);

export const SetBudgetLimitScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <SetBudgetLimitScreen {...props} />
  </WithBottomNavigation>
);

export const AddWalletScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <AddWalletScreen {...props} />
  </WithBottomNavigation>
);

export const InviteUsersScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <InviteUsersScreen {...props} />
  </WithBottomNavigation>
);

export const ApproveMembersScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <ApproveMembersScreen {...props} />
  </WithBottomNavigation>
);

export const GroupMembersScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <GroupMembersScreenContainer {...props} />
  </WithBottomNavigation>
);

export const GroupSettingsScreenWithNav = ({ route }: any) => (
  <WithBottomNavigation>
    <GroupSettingsScreen 
      groupId={(route.params as any).groupId} 
      groupName={(route.params as any).groupName} 
    />
  </WithBottomNavigation>
);

export const ReportDetailScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <ReportDetailScreen {...props} />
  </WithBottomNavigation>
);

export const SelectCategoryScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <SelectCategoryScreen {...props} />
  </WithBottomNavigation>
);

export const BudgetDetailScreenWithNav = (props: any) => (
  <WithBottomNavigation>
    <BudgetDetailScreen {...props} />
  </WithBottomNavigation>
);

export const StatusInviteMemberWithNav = ({ route }: any) => (
  <WithBottomNavigation>
    <StatusInviteMember {...route.params as { status: GroupMemberStatus }} />
  </WithBottomNavigation>
); 

export const CategoryReportDetailScreenWithNav = (props: any) => (
  <WithBottomNavigation showBottomNav={false}>
    <CategoryReportDetailScreen {...props} />
  </WithBottomNavigation>
); 