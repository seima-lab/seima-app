import { NavigationProp, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    Alert,
    Clipboard,
    FlatList,
    Image,
    ListRenderItem,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import type { RootStackParamList } from '../navigation/types';

interface GroupOverviewScreenProps {
  groupId: string;
  groupName: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface Member {
  id: string;
  name: string;
  avatar: any;
}

const GroupOverviewScreen: React.FC<GroupOverviewScreenProps> = ({ groupId, groupName }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // Mock data
  const groupInfo = {
    name: groupName,
    description: 'Nhóm quản lý tài chính gia đình',
    avatar: require('../assets/images/group.png'),
    memberCount: 4,
    createdDate: '15/11/2024',
    inviteCode: 'ce2dddb9320d4bfc951e8d9d54ae889d',
  };

  const financialSummary = {
    totalIncome: 15000000,
    totalExpense: 8500000,
    balance: 6500000,
  };

  const members: Member[] = [
    { id: '1', name: 'Nguyễn Mạnh Cường', avatar: require('../assets/images/maleavatar.png') },
    { id: '2', name: 'Nguyễn Sỹ Hão', avatar: require('../assets/images/femaleavatar.png') },
    { id: '3', name: 'Trần Thị Mai', avatar: require('../assets/images/femaleavatar.png') },
    { id: '4', name: 'Lê Văn Nam', avatar: require('../assets/images/maleavatar.png') },
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'expense',
      description: 'Mua sắm thực phẩm',
      amount: 500000,
      date: '20/11/2024',
      category: 'Thực phẩm'
    },
    {
      id: '2',
      type: 'income',
      description: 'Lương tháng 11',
      amount: 12000000,
      date: '15/11/2024',
      category: 'Lương'
    },
    {
      id: '3',
      type: 'expense',
      description: 'Tiền điện nước',
      amount: 800000,
      date: '10/11/2024',
      category: 'Hóa đơn'
    },
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const handleCopyInviteCode = async () => {
    try {
      await Clipboard.setString(groupInfo.inviteCode);
      Alert.alert('Thành công', 'Đã sao chép mã mời vào clipboard');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể sao chép mã mời');
    }
  };

  const handleEditGroup = () => {
    navigation.navigate('EditGroup', { groupId, groupName });
  };

  const handleAddTransaction = () => {
    navigation.navigate('AddExpenseScreen');
  };

  const renderTransaction: ListRenderItem<Transaction> = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? '#E8F5E8' : '#FFF2F2' }]}>
        <Icon 
          name={item.type === 'income' ? 'arrow-downward' : 'arrow-upward'} 
          size={20} 
          color={item.type === 'income' ? '#4CAF50' : '#F44336'} 
        />
      </View>
      <View style={styles.transactionContent}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionCategory}>{item.category} • {item.date}</Text>
      </View>
      <Text style={[
        styles.transactionAmount, 
        { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
      ]}>
        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
      </Text>
    </View>
  );

  const renderMemberAvatar = (member: Member, index: number) => (
    <View key={member.id} style={[styles.memberAvatar, { marginLeft: index > 0 ? -8 : 0 }]}>
      <Image source={member.avatar} style={styles.memberAvatarImage} />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Group Info Card */}
        <View style={styles.groupInfoCard}>
          <View style={styles.groupHeader}>
            <Image source={groupInfo.avatar} style={styles.groupAvatar} />
            <View style={styles.groupDetails}>
              <Text style={styles.groupName}>{groupInfo.name}</Text>
              <Text style={styles.groupDescription}>{groupInfo.description}</Text>
              <Text style={styles.groupMeta}>
                {groupInfo.memberCount} thành viên • Tạo ngày {groupInfo.createdDate}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditGroup}>
              <Icon name="edit" size={20} color="#1e90ff" />
            </TouchableOpacity>
          </View>
          
          {/* Invite Code Section */}
          <View style={styles.inviteCodeSection}>
            <Text style={styles.inviteCodeLabel}>Mã mời nhóm</Text>
            <TouchableOpacity 
              style={styles.inviteCodeContainer}
              onPress={handleCopyInviteCode}
            >
              <Text style={styles.inviteCodeText}>{groupInfo.inviteCode}</Text>
              <Icon name="content-copy" size={18} color="#4A90E2" />
            </TouchableOpacity>
            <Text style={styles.inviteCodeHint}>Nhấn để sao chép và chia sẻ với bạn bè</Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <Text style={styles.cardTitle}>Tổng quan tài chính</Text>
          <View style={styles.financialRow}>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Thu nhập</Text>
              <Text style={styles.incomeAmount}>{formatCurrency(financialSummary.totalIncome)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Chi tiêu</Text>
              <Text style={styles.expenseAmount}>{formatCurrency(financialSummary.totalExpense)}</Text>
            </View>
            <View style={styles.financialItem}>
              <Text style={styles.financialLabel}>Số dư</Text>
              <Text style={styles.balanceAmount}>{formatCurrency(financialSummary.balance)}</Text>
            </View>
          </View>
        </View>

        {/* Members Preview */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.cardTitle}>Thành viên</Text>
            <View style={styles.memberAvatars}>
              {members.slice(0, 3).map(renderMemberAvatar)}
              {members.length > 3 && (
                <View style={styles.moreMembers}>
                  <Text style={styles.moreMembersText}>+{members.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.cardTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={transactions}
            renderItem={renderTransaction}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
        <Icon name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  groupInfoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  groupDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  groupMeta: {
    fontSize: 12,
    color: '#999999',
  },
  financialCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financialItem: {
    alignItems: 'center',
  },
  financialLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  memberAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  moreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  moreMembersText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666666',
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 80,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#666666',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 52,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  editButton: {
    padding: 8,
  },
  inviteCodeSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  inviteCodeLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 6,
  },
  inviteCodeText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    fontFamily: 'monospace',
    flex: 1,
  },
  inviteCodeHint: {
    fontSize: 11,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default GroupOverviewScreen; 