import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import type { RootStackParamList } from '../navigation/types';

type EditGroupRouteProp = RouteProp<RootStackParamList, 'EditGroup'>;

interface GroupData {
  groupId: number;
  groupName: string;
  description?: string;
  groupAvatar?: string;
  memberCount?: number;
}

export default function EditGroupScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<EditGroupRouteProp>();
  const { user } = useAuth();

  // Get params from route
  const { groupId, groupName: initialGroupName } = route.params || {};

  // Form state
  const [groupName, setGroupName] = useState(initialGroupName || '');
  const [description, setDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call to get group details
      // const groupData = await groupService.getGroupById(groupId);
      
             // Mock data for now
       const mockGroupData: GroupData = {
         groupId: parseInt(groupId) || 1,
         groupName: initialGroupName || '',
         description: 'Family expense tracking group',
         groupAvatar: undefined,
         memberCount: 4
       };

      setGroupName(mockGroupData.groupName);
      setDescription(mockGroupData.description || '');
      setGroupAvatar(mockGroupData.groupAvatar || null);

    } catch (error: any) {
      console.error('❌ Failed to load group data:', error);
      Alert.alert(
        t('common.error'),
        'Failed to load group information',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!groupName.trim()) {
      Alert.alert(t('common.error'), 'Group name is required');
      return;
    }

    if (!user) {
      Alert.alert(t('common.error'), 'User not authenticated');
      return;
    }

    setSaving(true);

    try {
      console.log('🔄 Updating group:', {
        groupId,
        groupName: groupName.trim(),
        description: description.trim()
      });

      // TODO: Replace with actual API call
      // await groupService.updateGroup(groupId, {
      //   groupName: groupName.trim(),
      //   description: description.trim(),
      //   groupAvatar: groupAvatar
      // });

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        t('common.success'),
        'Group updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Failed to update group:', error);
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to update group. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone and all group data will be lost.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    setSaving(true);

    try {
      console.log('🗑️ Deleting group:', groupId);
      
      // TODO: Replace with actual API call
      // await groupService.deleteGroup(groupId);

      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        t('common.success'),
        'Group deleted successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to main screen or group list
              navigation.navigate('MainTab');
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Failed to delete group:', error);
      Alert.alert(
        t('common.error'),
        error.message || 'Failed to delete group. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImagePick = () => {
    Alert.alert(
      'Change Group Avatar',
      'Choose an option',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Camera',
          onPress: () => {
            // TODO: Implement camera functionality
            console.log('Open camera');
          }
        },
        {
          text: 'Gallery',
          onPress: () => {
            // TODO: Implement gallery picker
            console.log('Open gallery');
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.loadingText}>Loading group details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Group</Text>
          <TouchableOpacity 
            style={[styles.saveButton, (!groupName.trim() || saving) && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!groupName.trim() || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#1e90ff" />
            ) : (
              <Text style={[styles.saveButtonText, (!groupName.trim() || saving) && styles.saveButtonTextDisabled]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePick}>
              {groupAvatar ? (
                <Image source={{ uri: groupAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="group" size={40} color="#1e90ff" />
                </View>
              )}
              <View style={styles.avatarEditIcon}>
                <Icon name="camera-alt" size={16} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change group photo</Text>
          </View>

          {/* Group Name */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={styles.input}
              value={groupName}
              onChangeText={setGroupName}
              placeholder="Enter group name"
              placeholderTextColor="#aaa"
              returnKeyType="next"
              maxLength={50}
            />
          </View>

          {/* Description */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter group description (optional)"
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
          </View>

          {/* Group Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Group Information</Text>
            <View style={styles.infoItem}>
              <Icon name="people" size={20} color="#666" />
              <Text style={styles.infoText}>4 members</Text>
            </View>
            <View style={styles.infoItem}>
              <Icon name="event" size={20} color="#666" />
              <Text style={styles.infoText}>Created on Jan 15, 2024</Text>
            </View>
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <TouchableOpacity 
              style={styles.deleteButton} 
              onPress={handleDelete}
              disabled={saving}
            >
              <Icon name="delete" size={20} color="#dc3545" />
              <Text style={styles.deleteButtonText}>Delete Group</Text>
            </TouchableOpacity>
            <Text style={styles.deleteWarning}>
              Deleting a group will permanently remove all group data including expenses, 
              transactions, and member information. This action cannot be undone.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
    fontFamily: 'Roboto',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e90ff',
    fontFamily: 'Roboto',
  },
  saveButtonTextDisabled: {
    color: '#aaa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1e90ff',
    borderStyle: 'dashed',
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e90ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
    fontFamily: 'Roboto',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontFamily: 'Roboto',
  },
  dangerSection: {
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    marginBottom: 32,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 12,
    fontFamily: 'Roboto',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc3545',
    marginLeft: 8,
    fontFamily: 'Roboto',
  },
  deleteWarning: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    fontFamily: 'Roboto',
  },
}); 