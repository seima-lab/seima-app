import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    ListRenderItem,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

interface InviteItem {
  id: string;
  email: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

const InviteUsersScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [invites, setInvites] = useState<InviteItem[]>([
    {
      id: '1',
      email: 'john.doe@example.com',
      status: 'Pending'
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      status: 'Pending'
    }
  ]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleInvite = () => {
    if (!email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    const newInvite: InviteItem = {
      id: Date.now().toString(),
      email: email.trim(),
      status: 'Pending'
    };

    setInvites([...invites, newInvite]);
    setEmail('');
    Alert.alert('Thành công', 'Lời mời đã được gửi!');
  };

  const handleCancel = (id: string) => {
    Alert.alert(
      'Hủy lời mời',
      'Bạn có chắc chắn muốn hủy lời mời này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy',
          style: 'destructive',
          onPress: () => {
            setInvites(invites.filter(invite => invite.id !== id));
          }
        }
      ]
    );
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const renderInviteItem: ListRenderItem<InviteItem> = ({ item }) => (
    <View style={styles.inviteItem}>
      <View style={styles.inviteInfo}>
        <Text style={styles.inviteEmail}>{item.email}</Text>
        <Text style={styles.inviteStatus}>Status: <Text style={styles.pendingText}>{item.status}</Text></Text>
      </View>
      <TouchableOpacity 
        style={styles.cancelButton}
        onPress={() => handleCancel(item.id)}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
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
        <View style={styles.headerContent}>
          <Icon name="group-add" size={24} color="#FFFFFF" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>Invite Users</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter email address"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Invite Button */}
        <TouchableOpacity style={styles.inviteButton} onPress={handleInvite}>
          <Text style={styles.inviteButtonText}>Invite</Text>
        </TouchableOpacity>

        {/* Invites List */}
        <FlatList
          data={invites}
          renderItem={renderInviteItem}
          keyExtractor={(item) => item.id}
          style={styles.invitesList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  emailInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: '#333333',
  },
  inviteButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  invitesList: {
    flex: 1,
  },
  inviteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inviteInfo: {
    flex: 1,
  },
  inviteEmail: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  inviteStatus: {
    fontSize: 14,
    color: '#666666',
  },
  pendingText: {
    color: '#FFA726',
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
});

export default InviteUsersScreen; 