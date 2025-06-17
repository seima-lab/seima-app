import { NavigationProp, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootStackParamList } from '../navigation/types';

const CreateGroupScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Validation errors
  const [errors, setErrors] = useState({
    groupName: '',
    groupDescription: '',
  });

  const handleBackPress = () => {
    navigation.goBack();
  };

  const validateForm = () => {
    const newErrors = {
      groupName: '',
      groupDescription: '',
    };

    // Validate group name
    if (!groupName.trim()) {
      newErrors.groupName = t('group.create.nameRequired');
    } else if (groupName.trim().length < 3) {
      newErrors.groupName = t('group.create.nameMinLength');
    } else if (groupName.trim().length > 50) {
      newErrors.groupName = t('group.create.nameMaxLength');
    }

    // Validate description
    if (!groupDescription.trim()) {
      newErrors.groupDescription = t('group.create.descriptionRequired');
    } else if (groupDescription.trim().length < 10) {
      newErrors.groupDescription = t('group.create.descriptionMinLength');
    } else if (groupDescription.trim().length > 200) {
      newErrors.groupDescription = t('group.create.descriptionMaxLength');
    }

    setErrors(newErrors);
    return !newErrors.groupName && !newErrors.groupDescription;
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('group.create.errors.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setGroupAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), t('group.create.errors.imagePickerError'));
    }
  };

  const handleCreateGroup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Creating group:', {
        name: groupName.trim(),
        description: groupDescription.trim(),
        avatar: groupAvatar,
      });

      setLoading(false);
      setShowSuccessModal(true);
      
    } catch (error) {
      setLoading(false);
      console.error('Error creating group:', error);
      Alert.alert(t('common.error'), t('group.create.errors.createError'));
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const renderSuccessModal = () => (
    <Modal
      visible={showSuccessModal}
      transparent={true}
      animationType="fade"
      onRequestClose={handleSuccessModalClose}
    >
      <View style={styles.successModalOverlay}>
        <View style={styles.successModalContent}>
          {/* Success Animation */}
          <View style={styles.successIconContainer}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Icon name="check" size={40} color="#FFFFFF" />
              </View>
            </View>
          </View>
          
          {/* Success Message */}
          <Text style={styles.successTitle}>{t('group.create.success.title')}</Text>
          <Text style={styles.successMessage}>
            {t('group.create.success.message', { name: groupName })}
          </Text>
          
          {/* Group Info Preview */}
          <View style={styles.groupPreview}>
            {groupAvatar ? (
              <Image source={{ uri: groupAvatar }} style={styles.groupPreviewAvatar} />
            ) : (
              <View style={styles.groupPreviewAvatarDefault}>
                <Text style={styles.groupPreviewAvatarText}>
                  {groupName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.groupPreviewInfo}>
              <Text style={styles.groupPreviewName}>{groupName}</Text>
              <Text style={styles.groupPreviewDescription} numberOfLines={2}>
                {groupDescription}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity 
            style={styles.successButton} 
            onPress={handleSuccessModalClose}
          >
            <Icon name="arrow-back" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.successButtonText}>{t('group.create.success.backButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('group.create.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.create.avatar')}</Text>
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickImage}>
            {groupAvatar ? (
              <Image source={{ uri: groupAvatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="camera-alt" size={32} color="#999999" />
                <Text style={styles.avatarPlaceholderText}>{t('group.create.selectImage')}</Text>
              </View>
            )}
            <View style={styles.avatarEditIcon}>
              <Icon name="edit" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Group Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('group.create.groupName')} <Text style={styles.required}>{t('group.create.required')}</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.groupName ? styles.inputError : null]}
            placeholder={t('placeholders.enterGroupName') || 'Enter group name'}
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
          {errors.groupName ? (
            <Text style={styles.errorText}>{errors.groupName}</Text>
          ) : null}
          <Text style={styles.charCount}>{groupName.length}/50</Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('group.create.groupDescription')} <Text style={styles.required}>{t('group.create.required')}</Text>
          </Text>
          <TextInput
            style={[styles.textArea, errors.groupDescription ? styles.inputError : null]}
            placeholder={t('placeholders.enterGroupDescription') || 'Enter group description...'}
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
            numberOfLines={4}
            maxLength={200}
            textAlignVertical="top"
          />
          {errors.groupDescription ? (
            <Text style={styles.errorText}>{errors.groupDescription}</Text>
          ) : null}
          <Text style={styles.charCount}>{groupDescription.length}/200</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Icon name="info" size={20} color="#4A90E2" />
          <Text style={styles.infoText}>
            {t('group.create.info')}
          </Text>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.createButton,
            (!groupName.trim() || !groupDescription.trim()) && styles.createButtonDisabled
          ]} 
          onPress={handleCreateGroup}
          disabled={loading || !groupName.trim() || !groupDescription.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="group-add" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.createButtonText}>{t('group.create.createButton')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      {renderSuccessModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  required: {
    color: '#FF4444',
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  avatarEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    height: 100,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#FF4444',
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#E8F0FE',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4A90E2',
    marginLeft: 12,
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    borderRadius: 12,
  },
  createButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Success Modal Styles
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIconInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  groupPreview: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 16,
    width: '100%',
    marginBottom: 24,
  },
  groupPreviewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  groupPreviewAvatarDefault: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  groupPreviewAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  groupPreviewInfo: {
    flex: 1,
  },
  groupPreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  groupPreviewDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateGroupScreen; 