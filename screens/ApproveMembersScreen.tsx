import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    ListRenderItem,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

interface PendingMember {
  id: string;
  name: string;
  avatar: any;
  requestDate: string;
}

const ApproveMembersScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([
    {
      id: '1',
      name: 'Alex Johnson',
      avatar: require('../assets/images/maleavatar.png'),
      requestDate: '2024-11-20'
    },
    {
      id: '2',
      name: 'Emily Tran',
      avatar: require('../assets/images/femaleavatar.png'),
      requestDate: '2024-11-19'
    },
    {
      id: '3',
      name: 'Michael Smith',
      avatar: require('../assets/images/maleavatar.png'),
      requestDate: '2024-11-18'
    }
  ]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleApprove = (id: string, name: string) => {
    Alert.alert(
      'Duyệt thành viên',
      `Bạn có chắc chắn muốn duyệt ${name} tham gia nhóm?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Duyệt',
          onPress: () => {
            setPendingMembers(pendingMembers.filter(member => member.id !== id));
            Alert.alert('Thành công', `${name} đã được duyệt tham gia nhóm!`);
          }
        }
      ]
    );
  };

  const handleReject = (id: string, name: string) => {
    Alert.alert(
      'Từ chối thành viên',
      `Bạn có chắc chắn muốn từ chối ${name} tham gia nhóm?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: () => {
            setPendingMembers(pendingMembers.filter(member => member.id !== id));
            Alert.alert('Đã từ chối', `Đã từ chối ${name} tham gia nhóm.`);
          }
        }
      ]
    );
  };

  const renderPendingMember: ListRenderItem<PendingMember> = ({ item }) => (
    <View style={styles.memberCard}>
      <View style={styles.memberInfo}>
        <Image source={item.avatar} style={styles.memberAvatar} />
        <Text style={styles.memberName}>{item.name}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.approveButton}
          onPress={() => handleApprove(item.id, item.name)}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton}
          onPress={() => handleReject(item.id, item.name)}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="people-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateText}>Không có yêu cầu tham gia nào</Text>
      <Text style={styles.emptyStateSubtext}>
        Khi có người yêu cầu tham gia nhóm, họ sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Approve Members</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {pendingMembers.length > 0 ? (
          <FlatList
            data={pendingMembers}
            renderItem={renderPendingMember}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A90E2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  rejectButtonText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ApproveMembersScreen; 