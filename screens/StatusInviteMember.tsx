import { TabType } from '@/utils/mainTabUtils';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

export type GroupMemberStatus =
  | 'PENDING_APPROVAL'
  | 'INVITED'
  | 'REJECTED'
  | 'LEFT'
  | 'ACTIVE';

interface StatusInviteMemberProps {
  status: GroupMemberStatus;
  group_name?: string;
  role?: string;
  joined_at?: string;
  invited_at?: string;
}

const STATUS_CONFIG: Record<GroupMemberStatus, {
  icon: string;
  color: string;
  title: string;
  description: string;
}> = {
  PENDING_APPROVAL: {
    icon: 'hourglass-empty',
    color: '#FFA726',
    title: 'Chờ phê duyệt',
    description: 'Yêu cầu tham gia nhóm của bạn đang chờ phê duyệt.'
  },
  INVITED: {
    icon: 'mail-outline',
    color: '#42A5F5',
    title: 'Đã được mời',
    description: 'Bạn đã được mời vào nhóm. Hãy chờ xác nhận hoặc tham gia.'
  },
  REJECTED: {
    icon: 'cancel',
    color: '#EF5350',
    title: 'Bị từ chối',
    description: 'Yêu cầu tham gia nhóm của bạn đã bị từ chối.'
  },
  LEFT: {
    icon: 'logout',
    color: '#BDBDBD',
    title: 'Đã rời nhóm',
    description: 'Bạn đã rời khỏi nhóm này.'
  },
  ACTIVE: {
    icon: 'check-circle',
    color: '#66BB6A',
    title: 'Đã tham gia',
    description: 'Bạn là thành viên chính thức của nhóm.'
  }
};

const StatusInviteMember: React.FC<StatusInviteMemberProps> = ({ status, group_name, role, joined_at, invited_at }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  console.log('StatusInviteMember props:', { status, group_name, role, joined_at, invited_at });
  if (!status) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Text style={{ color: '#EF5350', fontSize: 18, fontFamily: 'Roboto' }}>Thiếu thông tin trạng thái</Text>
    </View>
  );
  const config = STATUS_CONFIG[status as GroupMemberStatus] || STATUS_CONFIG.PENDING_APPROVAL;

  return (
    <View style={styles.container}>
      {/* Back Arrow */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          navigation.navigate('MainTab', { initialTab: 'Finance' as TabType });
        }}
      >
        <Icon name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>
      {/* Main Content */}
      <View style={styles.contentWrapper}>
        <View style={[styles.iconWrapper, { backgroundColor: config.color + '22' }]}> {/* 22 = opacity */}
          <Icon name={config.icon} size={48} color={config.color} />
        </View>
        <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
        <Text style={styles.description}>{config.description}</Text>
        {group_name && (
          <Text style={styles.groupName}>Nhóm: <Text style={{ fontWeight: 'bold' }}>{group_name}</Text></Text>
        )}
        {role && (
          <Text style={styles.info}>Vai trò: <Text style={{ fontWeight: 'bold' }}>{role}</Text></Text>
        )}
        {joined_at && (
          <Text style={styles.info}>Tham gia lúc: <Text style={{ fontWeight: 'bold' }}>{joined_at}</Text></Text>
        )}
        {invited_at && (
          <Text style={styles.info}>Được mời lúc: <Text style={{ fontWeight: 'bold' }}>{invited_at}</Text></Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  description: {
    fontSize: 16,
    color: '#444',
    marginBottom: 18,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Roboto',
  },
  groupName: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: 6,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  info: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
});

export default StatusInviteMember; 