import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface GroupSettingsScreenProps {
  groupId: string;
  groupName: string;
}

const GroupSettingsScreen: React.FC<GroupSettingsScreenProps> = ({ groupId, groupName }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoApproveEnabled, setAutoApproveEnabled] = React.useState(false);

  const handleEditGroup = () => {
    Alert.alert('Chỉnh sửa nhóm', 'Chức năng chỉnh sửa thông tin nhóm');
  };

  const handleManagePermissions = () => {
    Alert.alert('Quản lý quyền', 'Chức năng quản lý quyền thành viên');
  };

  const handleViewReports = () => {
    Alert.alert('Báo cáo', 'Chức năng xem báo cáo tài chính');
  };

  const handleExportData = () => {
    Alert.alert('Xuất dữ liệu', 'Chức năng xuất dữ liệu ra file Excel/PDF');
  };

  const handleBackupData = () => {
    Alert.alert('Sao lưu', 'Chức năng sao lưu dữ liệu');
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Rời khỏi nhóm',
      'Bạn có chắc chắn muốn rời khỏi nhóm này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Rời nhóm', style: 'destructive', onPress: () => console.log('Left group') }
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Xóa nhóm',
      'Bạn có chắc chắn muốn xóa nhóm này? Tất cả dữ liệu sẽ bị mất vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa nhóm', style: 'destructive', onPress: () => console.log('Deleted group') }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true, 
    danger = false,
    rightComponent 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    danger?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Icon 
        name={icon} 
        size={24} 
        color={danger ? '#F44336' : '#4A90E2'} 
        style={styles.settingIcon}
      />
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightComponent || (showArrow && (
        <Icon name="chevron-right" size={24} color="#CCCCCC" />
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Group Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý nhóm</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="edit"
              title="Chỉnh sửa thông tin nhóm"
              subtitle="Tên, mô tả, ảnh đại diện"
              onPress={handleEditGroup}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="security"
              title="Quản lý quyền"
              subtitle="Phân quyền cho thành viên"
              onPress={handleManagePermissions}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="notifications"
              title="Thông báo giao dịch"
              subtitle="Nhận thông báo khi có giao dịch mới"
              showArrow={false}
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#FFFFFF'}
                />
              }
            />
            <View style={styles.separator} />
            <SettingItem
              icon="auto-awesome"
              title="Tự động duyệt"
              subtitle="Tự động duyệt các giao dịch nhỏ"
              showArrow={false}
              rightComponent={
                <Switch
                  value={autoApproveEnabled}
                  onValueChange={setAutoApproveEnabled}
                  trackColor={{ false: '#E0E0E0', true: '#4A90E2' }}
                  thumbColor={autoApproveEnabled ? '#FFFFFF' : '#FFFFFF'}
                />
              }
            />
          </View>
        </View>

        {/* Reports & Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Báo cáo & Dữ liệu</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="assessment"
              title="Xem báo cáo"
              subtitle="Báo cáo thu chi chi tiết"
              onPress={handleViewReports}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="file-download"
              title="Xuất dữ liệu"
              subtitle="Xuất ra Excel hoặc PDF"
              onPress={handleExportData}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="backup"
              title="Sao lưu dữ liệu"
              subtitle="Sao lưu lên cloud"
              onPress={handleBackupData}
            />
          </View>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vùng nguy hiểm</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="exit-to-app"
              title="Rời khỏi nhóm"
              subtitle="Bạn sẽ không còn truy cập được nhóm này"
              onPress={handleLeaveGroup}
              danger={true}
            />
            <View style={styles.separator} />
            <SettingItem
              icon="delete-forever"
              title="Xóa nhóm"
              subtitle="Xóa vĩnh viễn nhóm và toàn bộ dữ liệu"
              onPress={handleDeleteGroup}
              danger={true}
            />
          </View>
        </View>

        {/* Group Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>ID nhóm:</Text>
              <Text style={styles.infoValue}>{groupId}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tên nhóm:</Text>
              <Text style={styles.infoValue}>{groupName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ngày tạo:</Text>
              <Text style={styles.infoValue}>15/11/2024</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phiên bản:</Text>
              <Text style={styles.infoValue}>1.0.0</Text>
            </View>
          </View>
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
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666666',
  },
  dangerText: {
    color: '#F44336',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 56,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
});

export default GroupSettingsScreen; 