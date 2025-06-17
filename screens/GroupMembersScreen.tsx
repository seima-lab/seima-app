import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
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
import { RootStackParamList } from '../navigation/types';

interface GroupMembersScreenProps {
  groupId: string;
  groupName: string;
}

interface Member {
  id: string;
  name: string;
  avatar: any;
  joinDate: string;
  contribution: number;
  role: 'admin' | 'member';
}

const GroupMembersScreen: React.FC<GroupMembersScreenProps> = ({ groupId, groupName }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [groupCode] = useState('651251');

  // Mock data
  const members: Member[] = [
    { 
      id: '1', 
      name: 'Nguyễn Mạnh Cường', 
      avatar: require('../assets/images/maleavatar.png'),
      joinDate: '15/11/2024',
      contribution: 700000,
      role: 'admin'
    },
    { 
      id: '2', 
      name: 'Nguyễn Sỹ Hào', 
      avatar: require('../assets/images/femaleavatar.png'),
      joinDate: '16/11/2024',
      contribution: 700000,
      role: 'member'
    },
    { 
      id: '3', 
      name: 'Trần Thị Mai', 
      avatar: require('../assets/images/femaleavatar.png'),
      joinDate: '17/11/2024',
      contribution: 500000,
      role: 'member'
    },
    { 
      id: '4', 
      name: 'Lê Văn Nam', 
      avatar: require('../assets/images/maleavatar.png'),
      joinDate: '18/11/2024',
      contribution: 300000,
      role: 'member'
    },
  ];

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + '₫';
  };

  const handleCopyCode = () => {
    Alert.alert('Thành công', 'Đã sao chép mã nhóm vào clipboard');
  };

  const handleInviteUsers = () => {
    navigation.navigate('InviteUsers', { groupId });
  };

  const handleManageMembers = () => {
    Alert.alert('Quản lý thành viên', 'Chức năng quản lý thành viên');
  };

  const handleApproveFundRequests = () => {
    navigation.navigate('ApproveMembers', { groupId });
  };

  const renderMember: ListRenderItem<Member> = ({ item }) => (
    <View style={styles.memberItem}>
      <Image source={item.avatar} style={styles.memberAvatar} />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>
          {item.role === 'admin' ? 'Fund Creator (You)' : 'Contributed'}
        </Text>
      </View>
      <Text style={styles.memberContribution}>{formatCurrency(item.contribution)}</Text>
    </View>
  );

  const displayedMembers = showAllMembers ? members : members.slice(0, 2);

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Group Header */}
        <View style={styles.groupHeader}>
          <Image source={require('../assets/images/group.png')} style={styles.groupImage} />
        </View>

        {/* Management Card */}
        <View style={styles.managementCard}>
          <TouchableOpacity style={styles.managementItem} onPress={handleInviteUsers}>
            <Icon name="mail" size={24} color="#4A90E2" />
            <Text style={styles.managementText}>Invite Users with email/sms</Text>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.managementItem} onPress={handleManageMembers}>
            <Icon name="people" size={24} color="#4A90E2" />
            <Text style={styles.managementText}>Manage Members</Text>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
          
          <View style={styles.separator} />
          
          <TouchableOpacity style={styles.managementItem} onPress={handleApproveFundRequests}>
            <Icon name="approval" size={24} color="#4A90E2" />
            <Text style={styles.managementText}>Approve Fund Join Requests</Text>
            <Icon name="chevron-right" size={24} color="#CCCCCC" />
          </TouchableOpacity>
        </View>

        {/* Group Code Section */}
        <View style={styles.groupCodeCard}>
          <TouchableOpacity style={styles.shareButton}>
            <Text style={styles.shareButtonText}>Invite via Code</Text>
          </TouchableOpacity>
          
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>This is a private fund, only those you approve can join Change</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{groupCode}</Text>
              <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
                <Icon name="content-copy" size={20} color="#4A90E2" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Members List */}
        <View style={styles.membersCard}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersTitle}>Listmember ( {members.length} )</Text>
            <TouchableOpacity>
              <Icon name="chevron-right" size={24} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={displayedMembers}
            renderItem={renderMember}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.memberSeparator} />}
          />
          
          {!showAllMembers && members.length > 2 && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllMembers(true)}
            >
              <Text style={styles.viewAllText}>View all members</Text>
              <Icon name="expand-more" size={20} color="#4A90E2" />
            </TouchableOpacity>
          )}
          
          {showAllMembers && (
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => setShowAllMembers(false)}
            >
              <Text style={styles.viewAllText}>Thu gọn</Text>
              <Icon name="expand-less" size={20} color="#4A90E2" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100, // Add padding bottom to account for the bottom navigation
  },
  groupHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  groupImage: {
    width: 120,
    height: 80,
    resizeMode: 'contain',
  },
  managementCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  managementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  managementText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  groupCodeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  codeSection: {
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 16,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    letterSpacing: 2,
    marginRight: 12,
  },
  copyButton: {
    padding: 8,
  },
  membersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginRight: 8,
  },
  memberRole: {
    fontSize: 12,
    color: '#666666',
  },
  memberContribution: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  memberSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 60,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
    marginRight: 4,
  },
});

export default GroupMembersScreen; 