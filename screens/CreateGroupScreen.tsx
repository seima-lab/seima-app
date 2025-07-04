import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Image,
    Modal,
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
import { RootStackParamList } from '../navigation/types';
import { GroupResponse, groupService } from '../services/groupService';

const CreateGroupScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CreateGroup'>>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  
  // Get route parameters
  const { mode = 'create', groupData } = route.params || {};
  const isEditMode = mode === 'edit';
  
  // Form state
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<GroupResponse | null>(null);
  
  // Validation errors
  const [errors, setErrors] = useState({
    groupName: '',
  });

  // Load existing group data in edit mode
  useEffect(() => {
    if (isEditMode && groupData) {
      console.log('🔄 [CreateGroupScreen] Loading group data for editing:');
      console.log('📊 [CreateGroupScreen] Group data type:', typeof groupData);
      console.log('📊 [CreateGroupScreen] Group data keys:', Object.keys(groupData));
      console.log('📊 [CreateGroupScreen] Full group data:', JSON.stringify(groupData, null, 2));
      
      // Set group name
      const name = groupData.group_name || '';
      console.log('📝 [CreateGroupScreen] Setting group name:', name);
      setGroupName(name);
      
      // Set group avatar
      const avatar = groupData.group_avatar_url || null;
      console.log('🖼️ [CreateGroupScreen] Setting group avatar:', avatar);
      setGroupAvatar(avatar);
    }
  }, [isEditMode, groupData]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const validateForm = () => {
    const newErrors = {
      groupName: '',
    };

    // Validate group name (backend allows up to 100 characters)
    if (!groupName.trim()) {
      newErrors.groupName = t('group.create.nameRequired');
    } else if (groupName.trim().length < 3) {
      newErrors.groupName = t('group.create.nameMinLength');
    } else if (groupName.trim().length > 100) {
      newErrors.groupName = t('group.create.nameMaxLength');
    }

    setErrors(newErrors);
    return !newErrors.groupName;
  };

  const handlePickImage = async () => {
    try {
      console.log('🎨 [CreateGroupScreen] Opening image picker modal');
      setShowImagePicker(true);
    } catch (error) {
      console.error('🔴 Error in handlePickImage:', error);
      Alert.alert(t('common.error'), t('group.create.errors.imagePickerError'));
    }
  };

  const closeImagePicker = () => {
    console.log('❌ [CreateGroupScreen] Closing image picker modal');
    setShowImagePicker(false);
  };

  const handleImageOptionPress = (option: 'camera' | 'gallery') => {
    console.log('📷 [CreateGroupScreen] Image option selected:', option);
    setShowImagePicker(false);
    
    switch (option) {
      case 'camera':
        openCamera();
        break;
      case 'gallery':
        openGallery();
        break;
    }
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('permissions.cameraError'));
        return;
      }

      console.log('🟡 Opening camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      handleImageResult(result);
    } catch (error) {
      console.error('🔴 Camera error:', error);
      Alert.alert(t('common.error'), t('permissions.cameraError'));
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), t('permissions.galleryError'));
        return;
      }

      console.log('🟡 Opening gallery...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      });

      handleImageResult(result);
    } catch (error) {
      console.error('🔴 Gallery error:', error);
      Alert.alert(t('common.error'), t('permissions.galleryError'));
    }
  };

  const handleImageResult = (result: ImagePicker.ImagePickerResult) => {
    console.log('🟡 Image picker result:', result);

    if (!result.canceled && result.assets && result.assets[0]) {
      const selectedImage = result.assets[0];
      
      // Validate image size (max 5MB)
      if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
        Alert.alert(
          t('common.error'),
          t('group.create.errors.imageTooLarge')
        );
        return;
      }

      console.log('🟢 Image selected:', {
        uri: selectedImage.uri,
        type: selectedImage.type,
        fileSize: selectedImage.fileSize,
        width: selectedImage.width,
        height: selectedImage.height,
      });
      
      setGroupAvatar(selectedImage.uri);
    } else {
      console.log('🔴 Image selection cancelled or failed');
    }
  };

  const handleCreateGroup = async () => {
    if (!isAuthenticated) {
      Alert.alert(t('common.error'), t('auth.pleaseLogin'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoadingText(isEditMode ? t('group.edit.updating') : t('group.create.creating'));
    
    try {
      console.log(`${isEditMode ? 'Updating' : 'Creating'} group with data:`, {
        group_name: groupName.trim(),
        image: groupAvatar,
        ...(isEditMode && { groupId: groupData?.group_id }),
      });

      // Prepare image file object if avatar is selected
      let imageFile = undefined;
      if (groupAvatar && !groupAvatar.startsWith('http')) {
        setLoadingText(isEditMode ? t('group.edit.processingImage') : t('group.create.processingImage'));
        
        // Only create file object for local images (not for existing URLs)
        const uriParts = groupAvatar.split('.');
        const fileType = uriParts[uriParts.length - 1].toLowerCase();
        
        // Ensure valid image type
        const validTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        const mimeType = validTypes.includes(fileType) ? `image/${fileType === 'jpg' ? 'jpeg' : fileType}` : 'image/jpeg';
        
        imageFile = {
          uri: groupAvatar,
          type: mimeType,
          name: `group-avatar.${fileType === 'jpg' ? 'jpeg' : fileType}`,
        };
        
        console.log('🟡 Image file object:', imageFile);
      }

      let response: GroupResponse;
      
      if (isEditMode && groupData?.group_id) {
        setLoadingText(t('group.edit.uploadingChanges'));
        // Update existing group
        response = await groupService.updateGroup(Number(groupData.group_id), {
          group_name: groupName.trim(),
          image: imageFile,
        });
        console.log('🟢 Group updated successfully:', response);
      } else {
        setLoadingText(t('group.create.uploadingData'));
        // Create new group
        response = await groupService.createGroup({
          group_name: groupName.trim(),
          image: imageFile,
        });
        console.log('🟢 Group created successfully:', response);
      }

      setCreatedGroup(response);
      setLoading(false);
      setLoadingText('');
      setShowSuccessModal(true);
      
    } catch (error: any) {
      setLoading(false);
      setLoadingText('');
      console.error(`🔴 Error ${isEditMode ? 'updating' : 'creating'} group:`, error);
      
      let errorMessage = error.message;
      if (error.message?.includes('timeout') || error.message?.includes('timed out')) {
        errorMessage = isEditMode ? t('group.edit.errors.timeout') : t('group.create.errors.timeout');
      } else if (error.message?.includes('Network')) {
        errorMessage = t('group.create.errors.network');
      } else if (error.message?.includes('Authentication')) {
        errorMessage = t('group.create.errors.auth');
      }
      
      Alert.alert(
        t('common.error'),
        errorMessage || (isEditMode ? t('group.edit.errors.updateFailed') : t('group.create.errors.createFailed'))
      );
    }
  };

  const handleCopyInviteCode = async () => {
    if (createdGroup?.group_invite_code) {
      try {
        Clipboard.setString(createdGroup.group_invite_code);
        Alert.alert(
          t('common.success'),
          t('group.create.success.inviteCodeCopied'),
          [{ text: t('common.ok') }]
        );
      } catch (error) {
        console.error('Failed to copy invite code:', error);
      }
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    if (isEditMode) {
      // For edit mode, just go back to previous screen (likely GroupSettings)
      navigation.goBack();
    } else {
      // For create mode, navigate to group management
      navigation.navigate('GroupManagement');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const renderImagePickerModal = () => (
    <Modal
      visible={showImagePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={closeImagePicker}
    >
      <View style={styles.imagePickerOverlay}>
        <TouchableOpacity style={styles.imagePickerBackdrop} onPress={closeImagePicker} />
        <View style={styles.imagePickerContent}>
          {/* Header */}
          <View style={styles.imagePickerHeader}>
            <View style={styles.imagePickerHandle} />
            <Text style={styles.imagePickerTitle}>{t('group.create.selectImage')}</Text>
            <Text style={styles.imagePickerSubtitle}>{t('permissions.chooseOption')}</Text>
          </View>

          {/* Options */}
          <View style={styles.imagePickerOptions}>
            {/* Camera Option */}
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={() => handleImageOptionPress('camera')}
            >
              <View style={[styles.imagePickerOptionIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Icon name="camera-alt" size={24} color="#FF6B6B" />
              </View>
              <View style={styles.imagePickerOptionContent}>
                <Text style={styles.imagePickerOptionTitle}>{t('permissions.camera')}</Text>
                <Text style={styles.imagePickerOptionDescription}>{t('permissions.cameraDescription')}</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#CCCCCC" />
            </TouchableOpacity>

            {/* Gallery Option */}
            <TouchableOpacity 
              style={styles.imagePickerOption}
              onPress={() => handleImageOptionPress('gallery')}
            >
              <View style={[styles.imagePickerOptionIcon, { backgroundColor: '#4ECDC420' }]}>
                <Icon name="photo-library" size={24} color="#4ECDC4" />
              </View>
              <View style={styles.imagePickerOptionContent}>
                <Text style={styles.imagePickerOptionTitle}>{t('permissions.gallery')}</Text>
                <Text style={styles.imagePickerOptionDescription}>{t('permissions.galleryDescription')}</Text>
              </View>
              <Icon name="chevron-right" size={20} color="#CCCCCC" />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.imagePickerCancelButton} onPress={closeImagePicker}>
            <Text style={styles.imagePickerCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
          <Text style={styles.successTitle}>
            {isEditMode ? t('group.edit.success.title') : t('group.create.success.title')}
          </Text>
          <Text style={styles.successSubtitle}>
            {isEditMode ? t('group.edit.success.subtitle') : t('group.create.success.subtitle')}
          </Text>
          
          {/* Group Info Preview */}
          <View style={styles.groupPreview}>
            {createdGroup?.group_avatar_url ? (
              <Image source={{ uri: createdGroup.group_avatar_url }} style={styles.groupPreviewAvatar} />
            ) : groupAvatar ? (
              <Image source={{ uri: groupAvatar }} style={styles.groupPreviewAvatar} />
            ) : (
              <View style={styles.groupPreviewAvatarDefault}>
                <Text style={styles.groupPreviewAvatarText}>
                  {groupName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.groupPreviewInfo}>
              <Text style={styles.groupPreviewName}>{createdGroup?.group_name || groupName}</Text>
              {!isEditMode && (
                <Text style={styles.groupPreviewDate}>
                  {t('group.create.success.groupInfo')}
                </Text>
              )}
            </View>
          </View>

          {/* Invite Code Section - Only show for create mode */}
          {!isEditMode && createdGroup?.group_invite_code && (
            <View style={styles.inviteCodeSection}>
              <Text style={styles.inviteCodeTitle}>
                {t('group.create.success.inviteCode')}
              </Text>
              <TouchableOpacity 
                style={styles.inviteCodeContainer}
                onPress={handleCopyInviteCode}
              >
                <Text style={styles.inviteCodeText}>
                  {createdGroup.group_invite_code}
                </Text>
                <Icon name="content-copy" size={20} color="#4A90E2" />
              </TouchableOpacity>
              <Text style={styles.inviteCodeHint}>
                {t('group.create.success.inviteCodeDescription')}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.successActions}>
            {!isEditMode && createdGroup?.group_invite_code && (
              <TouchableOpacity 
                style={styles.shareButton} 
                onPress={handleCopyInviteCode}
              >
                <Icon name="share" size={20} color="#4A90E2" style={{ marginRight: 8 }} />
                <Text style={styles.shareButtonText}>{t('group.create.success.shareButton')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.successButton} 
              onPress={handleSuccessModalClose}
            >
              <Icon name="arrow-back" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.successButtonText}>{t('group.create.success.backButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderLoadingModal = () => (
    <Modal
      visible={loading}
      transparent={true}
      animationType="fade"
      onRequestClose={() => {}} // Prevent closing during loading
    >
      <View style={styles.loadingModalOverlay}>
        <View style={styles.loadingModalContent}>
          {/* Loading Animation */}
          <View style={styles.loadingAnimationContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <View style={styles.loadingPulse} />
          </View>
          
          {/* Loading Text */}
          <Text style={styles.loadingTitle}>
            {isEditMode ? t('group.edit.title') : t('group.create.title')}
          </Text>
          <Text style={styles.loadingMessage}>
            {loadingText}
          </Text>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
          
          {/* Tips */}
          <Text style={styles.loadingTip}>
            {isEditMode ? t('group.edit.loadingTip') : t('group.create.loadingTip')}
          </Text>
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
        <Text style={styles.headerTitle}>
          {isEditMode ? t('group.edit.title') : t('group.create.title')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('group.create.avatar')}</Text>
          <TouchableOpacity 
            style={styles.avatarContainer} 
            onPress={handlePickImage}
          >
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
            maxLength={100}
          />
          {errors.groupName ? (
            <Text style={styles.errorText}>{errors.groupName}</Text>
          ) : null}
          <Text style={styles.charCount}>{groupName.length}/100</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Icon name="info" size={20} color="#4A90E2" />
          <Text style={styles.infoText}>
            {isEditMode ? t('group.edit.info') : t('group.create.info')}
          </Text>
        </View>
      </ScrollView>

      {/* Create/Update Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.createButton,
            (!groupName.trim()) && styles.createButtonDisabled
          ]} 
          onPress={handleCreateGroup}
          disabled={!groupName.trim()}
        >
          <>
            <Icon 
              name={isEditMode ? "edit" : "group-add"} 
              size={20} 
              color="#FFFFFF" 
              style={{ marginRight: 8 }} 
            />
            <Text style={styles.createButtonText}>
              {isEditMode ? t('group.edit.updateButton') : t('group.create.createButton')}
            </Text>
          </>
        </TouchableOpacity>
      </View>

      {/* Image Picker Modal */}
      {renderImagePickerModal()}

      {/* Success Modal */}
      {renderSuccessModal()}

      {/* Loading Modal */}
      {renderLoadingModal()}
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
  optional: {
    color: '#999999',
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
  successSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
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
  groupPreviewDate: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
  },
  inviteCodeSection: {
    marginTop: 20,
    marginBottom: 24,
  },
  inviteCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  inviteCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginRight: 8,
  },
  inviteCodeHint: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  successActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    marginRight: 8,
    flex: 1,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
  },
  successButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Image Picker Styles
  imagePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imagePickerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imagePickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 34,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  imagePickerHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  imagePickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
    marginBottom: 16,
  },
  imagePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  imagePickerSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  imagePickerOptions: {
    width: '100%',
    marginBottom: 20,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  imagePickerOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  imagePickerOptionContent: {
    flex: 1,
  },
  imagePickerOptionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  imagePickerOptionDescription: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 20,
  },
  imagePickerCancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  imagePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  // Loading Modal Styles
  loadingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  loadingAnimationContainer: {
    position: 'relative',
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingMessage: {
    fontSize: 16,
    color: '#4A90E2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E8F0FE',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
    width: '70%', // Static progress for now
  },
  loadingTip: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default CreateGroupScreen;

CreateGroupScreen.displayName = 'CreateGroupScreen'; 