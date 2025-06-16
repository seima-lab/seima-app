import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { userService } from '../services/userService';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^(0[3|5|7|8|9])([0-9]{8})$/; // Vietnamese phone number format

const UpdateProfile = () => {
  const { t } = useTranslation();
  const navigation = useNavigationService();
  const insets = useSafeAreaInsets();
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  
  // State
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDateOfBirth, setHasDateOfBirth] = useState(false);

  // Refs for TextInputs
  const fullNameRef = useRef<TextInput>(null);
  const phoneNumberRef = useRef<TextInput>(null);

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true
      })
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Fetch user profile when component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Fetching user profile...');
      const userProfile = await userService.getCurrentUserProfile();
      console.log('📋 User profile received:', JSON.stringify(userProfile, null, 2));
      
      // Populate form with user data (using raw API format like SettingScreen)
      setFullName(userProfile.user_full_name || '');
      setEmail(userProfile.user_email || '');
      setPhoneNumber(userProfile.user_phone_number || '');
      
      // Set date of birth if available
      if (userProfile.user_dob) {
        console.log('📅 Setting date of birth:', userProfile.user_dob);
        setDateOfBirth(new Date(userProfile.user_dob));
        setHasDateOfBirth(true);
      } else {
        setHasDateOfBirth(false);
      }
      
      // Set gender
      if (userProfile.user_gender === true) {
        setGender('Male');
        console.log('👨 Setting gender: Male');
      } else if (userProfile.user_gender === false) {
        setGender('Female');
        console.log('👩 Setting gender: Female');
      }
      
      // Set avatar if available
      if (userProfile.user_avatar_url) {
        console.log('🖼️ Setting avatar URL:', userProfile.user_avatar_url);
        setAvatarUri(userProfile.user_avatar_url);
      }
      
      console.log('✅ Profile data loaded successfully');
      
    } catch (err: any) {
      console.error('❌ Failed to fetch user profile:', err);
      setError(err.message || 'Failed to load profile data');
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (email && !emailRegex.test(email)) newErrors.email = 'Invalid email format';
    if (phoneNumber && !phoneRegex.test(phoneNumber)) newErrors.phoneNumber = 'Invalid phone number format';
    if (!gender) newErrors.gender = 'Please select your gender';
    if (hasDateOfBirth && (!dateOfBirth || isNaN(dateOfBirth.getTime()))) newErrors.dateOfBirth = 'Invalid date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = async () => {
    if (!validate()) {
      // Shake animation for error
      const shakeAnimation = Animated.sequence([
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 50, useNativeDriver: true })
      ]);
      shakeAnimation.start();
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare payload directly with snake_case format
      const payload: any = {};
      
      // Add fields to payload
      if (fullName.trim()) {
        payload.full_name = fullName.trim();
      }
      
      if (phoneNumber.trim()) {
        payload.phone_number = phoneNumber.trim();
      }
      
      if (gender) {
        payload.gender = gender === 'Male';
      }
      
      // Only include birth_date if it's been set
      if (hasDateOfBirth) {
        payload.birth_date = dateOfBirth.toISOString().split('T')[0];
      }
      
      // If avatar was changed and is a local file (not a URL), upload it first
      if (avatarUri && !avatarUri.startsWith('http')) {
        try {
          console.log('📤 Uploading new avatar...');
          const newAvatarUrl = await userService.uploadAvatar(avatarUri);
          console.log('✅ Avatar uploaded successfully:', newAvatarUrl);
          payload.avatar_url = newAvatarUrl;
        } catch (err: any) {
          console.error('❌ Failed to upload avatar:', err);
          Alert.alert('Error', 'Failed to upload avatar');
          // Continue with profile update even if avatar upload fails
        }
      }
      
      // Update profile
      console.log('📤 Updating profile with payload:', payload);
      await userService.updateUserProfile(payload);
      
      // Refresh local profile data
      console.log('🔄 Refreshing local profile data after update...');
      await fetchUserProfile();
      
      Alert.alert(
        'Success', 
        'Profile updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (err: any) {
      console.error('❌ Failed to update profile:', err);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Please grant camera and photo library permissions to change your avatar.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image from camera:', error);
      Alert.alert('Error', 'Could not access camera');
    }
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image from gallery:', error);
      Alert.alert('Error', 'Could not access photo gallery');
    }
  };

  const handleChangeAvatar = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Camera', 'Photo Gallery', 'Cancel'],
          cancelButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            pickImageFromCamera();
          } else if (buttonIndex === 1) {
            pickImageFromGallery();
          }
        }
      );
    } else {
      Alert.alert(
        'Change Avatar',
        'Choose an option',
        [
          { text: 'Camera', onPress: pickImageFromCamera },
          { text: 'Photo Gallery', onPress: pickImageFromGallery },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
      setHasDateOfBirth(true);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Debug function for input focus
  const handleInputFocus = (fieldName: string) => {
    console.log(`🎯 Input focus: ${fieldName}`);
    setFocusedField(fieldName);
    
    // Force keyboard to show manually if needed
    setTimeout(() => {
      if (fieldName === 'fullName' && fullNameRef.current) {
        fullNameRef.current.focus();
      } else if (fieldName === 'phoneNumber' && phoneNumberRef.current) {
        phoneNumberRef.current.focus();
      }
    }, 100);
  };

  const handleInputBlur = () => {
    console.log('🎯 Input blur');
    setFocusedField(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1e90ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#ff3b30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={22} color="#1e90ff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexOne}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
        >
          <Animated.View 
            style={[
              styles.mainContent, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] 
              }
            ]}
          >
            {/* Avatar Section */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    avatarUri 
                      ? { uri: avatarUri }
                      : require('../assets/images/Unknown.jpg')
                  }
                  style={styles.avatar}
                />
                <TouchableOpacity style={styles.cameraIconButton} onPress={handleChangeAvatar}>
                  <Icon name="photo-camera" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.changeAvatarButton} onPress={handleChangeAvatar}>
                <Text style={styles.changeAvatarText}>Change Avatar</Text>
                <Icon name="edit" size={16} color="#fff" style={styles.editIcon} />
              </TouchableOpacity>
            </View>

            {/* Form Fields Container */}
            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="person" size={16} color="#1e90ff" style={styles.inputIcon} />
                  Full Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'fullName' && styles.inputFocused,
                    errors.fullName && styles.inputError
                  ]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#9ca3af"
                  onFocus={() => handleInputFocus('fullName')}
                  onBlur={handleInputBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  ref={fullNameRef}
                />
                {errors.fullName && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.fullName}</Text>
                  </View>
                )}
              </View>

              {/* Date of Birth */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="cake" size={16} color="#1e90ff" style={styles.inputIcon} />
                  Date of Birth
                </Text>
                <TouchableOpacity 
                  style={[
                    styles.input,
                    focusedField === 'dateOfBirth' && styles.inputFocused,
                    errors.dateOfBirth && styles.inputError
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  onFocus={() => handleInputFocus('dateOfBirth')}
                  onBlur={handleInputBlur}
                >
                  <View style={styles.datePickerContent}>
                    <Text style={[
                      styles.dateText, 
                      !hasDateOfBirth && { color: '#9ca3af' }
                    ]}>
                      {hasDateOfBirth ? formatDate(dateOfBirth) : "Select date"}
                    </Text>
                    <Icon name="event" size={20} color="#1e90ff" />
                  </View>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={dateOfBirth}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    themeVariant="light"
                  />
                )}
                {errors.dateOfBirth && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.dateOfBirth}</Text>
                  </View>
                )}
              </View>

              {/* Email - Read Only */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="email" size={16} color="#1e90ff" style={styles.inputIcon} />
                  Email
                </Text>
                <View style={[styles.input, styles.disabledInput]}>
                  <Text style={styles.readOnlyText}>
                    {email || "No email provided"}
                  </Text>
                  <Icon name="lock-outline" size={18} color="#8E8E93" />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="phone" size={16} color="#1e90ff" style={styles.inputIcon} />
                  Phone Number
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'phoneNumber' && styles.inputFocused,
                    errors.phoneNumber && styles.inputError
                  ]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Enter your phone number"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  onFocus={() => handleInputFocus('phoneNumber')}
                  onBlur={handleInputBlur}
                  autoCorrect={false}
                  returnKeyType="done"
                  blurOnSubmit={false}
                  ref={phoneNumberRef}
                />
                {errors.phoneNumber && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.phoneNumber}</Text>
                  </View>
                )}
                <Text style={styles.helperText}>Format: 0xxxxxxxxx (10 digits)</Text>
              </View>

              {/* Gender */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  <Icon name="people" size={16} color="#1e90ff" style={styles.inputIcon} />
                  Gender
                </Text>
                <View style={styles.genderContainer}>
                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Male' && styles.genderOptionSelected
                    ]}
                    onPress={() => setGender('Male')}
                  >
                    <View style={[
                      styles.radioButton,
                      gender === 'Male' && styles.radioButtonSelected
                    ]}>
                      {gender === 'Male' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.genderText,
                      gender === 'Male' && styles.genderTextSelected
                    ]}>
                      <Icon 
                        name="male" 
                        size={16} 
                        color={gender === 'Male' ? "#1e90ff" : "#8E8E93"} 
                        style={styles.genderIcon} 
                      />
                      Male
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.genderDivider} />

                  <TouchableOpacity
                    style={[
                      styles.genderOption,
                      gender === 'Female' && styles.genderOptionSelected
                    ]}
                    onPress={() => setGender('Female')}
                  >
                    <View style={[
                      styles.radioButton,
                      gender === 'Female' && styles.radioButtonSelected
                    ]}>
                      {gender === 'Female' && <View style={styles.radioButtonInner} />}
                    </View>
                    <Text style={[
                      styles.genderText,
                      gender === 'Female' && styles.genderTextSelected
                    ]}>
                      <Icon 
                        name="female" 
                        size={16} 
                        color={gender === 'Female' ? "#1e90ff" : "#8E8E93"} 
                        style={styles.genderIcon} 
                      />
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.gender && (
                  <View style={styles.errorRow}>
                    <Icon name="error-outline" size={14} color="#ff3b30" />
                    <Text style={styles.validationErrorText}>{errors.gender}</Text>
                  </View>
                )}
              </View>

              {/* Save Button */}
              <Animated.View style={[styles.saveButtonContainer, { opacity: fadeAnim }]}>
                <TouchableOpacity 
                  style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                      <Icon name="check-circle" size={20} color="#fff" style={styles.saveIcon} />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  flexOne: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#1e90ff',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1e90ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: '#1e90ff',
    position: 'relative',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  cameraIconButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1e90ff',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    backgroundColor: '#1e90ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  changeAvatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  editIcon: {
    marginLeft: 6,
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  inputFocused: {
    borderColor: '#1e90ff',
    shadowColor: '#1e90ff',
    shadowOpacity: 0.1,
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#000',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  genderContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  genderDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  genderOptionSelected: {
    backgroundColor: 'rgba(30, 144, 255, 0.08)',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C8C8CD',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#1e90ff',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e90ff',
  },
  genderText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderTextSelected: {
    color: '#1e90ff',
    fontWeight: '600',
  },
  genderIcon: {
    marginRight: 4,
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#1e90ff',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    elevation: 4,
    shadowColor: '#1e90ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(30, 144, 255, 0.6)',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  saveIcon: {
    marginLeft: 8,
  },
  validationErrorText: {
    color: '#ff3b30',
    fontSize: 13,
    marginLeft: 4,
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default UpdateProfile; 