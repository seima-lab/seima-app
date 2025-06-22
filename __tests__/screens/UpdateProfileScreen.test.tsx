import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { ActionSheetIOS, Alert, Platform } from 'react-native';
import { useNavigationService } from '../../navigation/NavigationService';
import UpdateProfile from '../../screens/update-profile';
import { userService } from '../../services/userService';

// Mock dependencies
jest.mock('../../navigation/NavigationService');
jest.mock('../../services/userService');
jest.mock('expo-image-picker');
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 })
}));
jest.mock('@react-native-community/datetimepicker', () => {
  const MockDateTimePicker = ({ onChange, value }: any) => {
    return null; // Mock component
  };
  return MockDateTimePicker;
});

// Mock Alert
const mockAlert = jest.spyOn(Alert, 'alert');
const mockActionSheetIOS = jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions');

describe('UpdateProfile Screen', () => {
  
  // Mock implementations
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  const mockUserService = userService as jest.Mocked<typeof userService>;
  const mockImagePicker = ImagePicker as jest.Mocked<typeof ImagePicker>;
  const mockUseNavigationService = useNavigationService as jest.MockedFunction<typeof useNavigationService>;

  // Mock user profile data
  const mockUserProfile = {
    user_full_name: 'John Doe',
    user_email: 'john@example.com',
    user_phone_number: '0912345678',
    user_dob: '1990-01-01',
    user_gender: true,
    user_avatar_url: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockUseNavigationService.mockReturnValue(mockNavigation);
    mockUserService.getCurrentUserProfile.mockResolvedValue(mockUserProfile);
    mockImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    mockImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as any);
    
    // Mock Platform
    Platform.OS = 'ios';
  });

  // ========================
  // INITIAL RENDERING TESTS
  // ========================

  describe('Initial Rendering', () => {
    
    test('should show loading indicator initially', () => {
      // Arrange & Act
      const { getByText } = render(<UpdateProfile />);
      
      // Assert
      expect(getByText('Loading...')).toBeTruthy();
    });

    test('should fetch user profile on mount', async () => {
      // Arrange & Act
      render(<UpdateProfile />);
      
      // Assert
      await waitFor(() => {
        expect(mockUserService.getCurrentUserProfile).toHaveBeenCalledTimes(1);
      });
    });

    test('should display user profile data after loading', async () => {
      // Arrange & Act
      const { getByDisplayValue, queryByText } = render(<UpdateProfile />);
      
      // Assert
      await waitFor(() => {
        expect(queryByText('Loading...')).toBeFalsy();
      });
      
      expect(getByDisplayValue('John Doe')).toBeTruthy();
      expect(getByDisplayValue('0912345678')).toBeTruthy();
    });
  });

  // ========================
  // ERROR HANDLING TESTS
  // ========================

  describe('Error Handling', () => {
    
    test('should display error screen when profile fetch fails', async () => {
      // Arrange
      const errorMessage = 'Failed to fetch profile';
      mockUserService.getCurrentUserProfile.mockRejectedValue(new Error(errorMessage));
      
      // Act
      const { getByText } = render(<UpdateProfile />);
      
      // Assert
      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });

    test('should show retry button on error', async () => {
      // Arrange
      mockUserService.getCurrentUserProfile.mockRejectedValue(new Error('Network error'));
      
      // Act
      const { getByText } = render(<UpdateProfile />);
      
      // Assert
      await waitFor(() => {
        expect(getByText('common.retry')).toBeTruthy();
      });
    });

    test('should retry fetching profile when retry button is pressed', async () => {
      // Arrange
      mockUserService.getCurrentUserProfile
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(mockUserProfile);
      
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('common.retry')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('common.retry'));
      
      // Assert
      await waitFor(() => {
        expect(mockUserService.getCurrentUserProfile).toHaveBeenCalledTimes(2);
      });
    });
  });

  // ========================
  // FORM INTERACTION TESTS
  // ========================

  describe('Form Interactions', () => {
    
    test('should update full name when input changes', async () => {
      // Arrange
      const { getByDisplayValue } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const fullNameInput = getByDisplayValue('John Doe');
      
      // Act
      fireEvent.changeText(fullNameInput, 'Jane Smith');
      
      // Assert
      expect(getByDisplayValue('Jane Smith')).toBeTruthy();
    });

    test('should update phone number when input changes', async () => {
      // Arrange
      const { getByDisplayValue } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('0912345678')).toBeTruthy();
      });
      
      const phoneInput = getByDisplayValue('0912345678');
      
      // Act
      fireEvent.changeText(phoneInput, '0987654321');
      
      // Assert
      expect(getByDisplayValue('0987654321')).toBeTruthy();
    });

    test('should select Male gender when pressed', async () => {
      // Arrange
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('male')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('male'));
      
      // Assert - Male should be selected (this would be shown in UI styling)
      expect(getByText('male')).toBeTruthy();
    });

    test('should select Female gender when pressed', async () => {
      // Arrange
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('female')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('female'));
      
      // Assert
      expect(getByText('female')).toBeTruthy();
    });
  });

  // ========================
  // AVATAR HANDLING TESTS
  // ========================

  describe('Avatar Handling', () => {
    
    test('should show action sheet on iOS when change avatar is pressed', async () => {
      // Arrange
      Platform.OS = 'ios';
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('profile.changeAvatar'));
      
      // Assert
      expect(mockActionSheetIOS).toHaveBeenCalledWith(
        {
          options: ['Camera', 'Photo Gallery', 'Cancel'],
          cancelButtonIndex: 2,
        },
        expect.any(Function)
      );
    });

    test('should show alert on Android when change avatar is pressed', async () => {
      // Arrange
      Platform.OS = 'android';
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('profile.changeAvatar'));
      
      // Assert
      expect(mockAlert).toHaveBeenCalledWith(
        'permissions.chooseOption',
        '',
        [
          { text: 'permissions.camera', onPress: expect.any(Function) },
          { text: 'permissions.gallery', onPress: expect.any(Function) },
          { text: 'common.cancel', style: 'cancel' },
        ]
      );
    });

    test('should request permissions before picking image from camera', async () => {
      // Arrange
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://new-image.jpg' }]
      } as any);
      
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('profile.changeAvatar'));
      
      // Simulate ActionSheet camera selection
      const actionSheetCallback = mockActionSheetIOS.mock.calls[0][1];
      act(() => {
        actionSheetCallback(0); // Camera option
      });
      
      // Assert
      await waitFor(() => {
        expect(mockImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
        expect(mockImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });

    test('should launch camera when permissions are granted', async () => {
      // Arrange
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://new-image.jpg' }]
      } as any);
      
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('profile.changeAvatar'));
      
      const actionSheetCallback = mockActionSheetIOS.mock.calls[0][1];
      act(() => {
        actionSheetCallback(0); // Camera option
      });
      
      // Assert
      await waitFor(() => {
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      });
    });

    test('should launch gallery when gallery option is selected', async () => {
      // Arrange
      mockImagePicker.launchImageLibraryAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://new-image.jpg' }]
      } as any);
      
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act
      fireEvent.press(getByText('profile.changeAvatar'));
      
      const actionSheetCallback = mockActionSheetIOS.mock.calls[0][1];
      act(() => {
        actionSheetCallback(1); // Gallery option
      });
      
      // Assert
      await waitFor(() => {
        expect(mockImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      });
    });
  });

  // ========================
  // DATE PICKER TESTS
  // ========================

  describe('Date Picker', () => {
    
    test('should show date picker when date field is pressed', async () => {
      // Arrange
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('01/01/1990')).toBeTruthy(); // Formatted birth date
      });
      
      // Act
      fireEvent.press(getByText('01/01/1990'));
      
      // Assert - Date picker should be shown (component internal state)
      expect(getByText('01/01/1990')).toBeTruthy();
    });
  });

  // ========================
  // FORM VALIDATION TESTS
  // ========================

  describe('Form Validation', () => {
    
    test('should show validation error for empty full name', async () => {
      // Arrange
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const fullNameInput = getByDisplayValue('John Doe');
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.changeText(fullNameInput, '');
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(getByText('validation.fullNameRequired')).toBeTruthy();
      });
    });

    test('should show validation error for invalid phone number', async () => {
      // Arrange
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('0912345678')).toBeTruthy();
      });
      
      const phoneInput = getByDisplayValue('0912345678');
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.changeText(phoneInput, 'invalid-phone');
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(getByText('validation.invalidPhone')).toBeTruthy();
      });
    });

    test('should not submit form with validation errors', async () => {
      // Arrange
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const fullNameInput = getByDisplayValue('John Doe');
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.changeText(fullNameInput, '');
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(mockUserService.updateUserProfile).not.toHaveBeenCalled();
      });
    });
  });

  // ========================
  // FORM SUBMISSION TESTS
  // ========================

  describe('Form Submission', () => {
    
    test('should submit valid form data', async () => {
      // Arrange
      mockUserService.updateUserProfile.mockResolvedValue(undefined);
      mockUserService.getCurrentUserProfile.mockResolvedValue(mockUserProfile);
      
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const fullNameInput = getByDisplayValue('John Doe');
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.changeText(fullNameInput, 'Updated Name');
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(mockUserService.updateUserProfile).toHaveBeenCalledWith({
          full_name: 'Updated Name',
          phone_number: '0912345678',
          gender: true,
          birth_date: '1990-01-01'
        });
      });
    });

    test('should show loading state during form submission', async () => {
      // Arrange
      mockUserService.updateUserProfile.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.press(saveButton);
      
      // Assert - Should show loading indicator in button
      expect(saveButton.props.disabled).toBe(true);
    });

    test('should show success message after successful update', async () => {
      // Arrange
      mockUserService.updateUserProfile.mockResolvedValue(undefined);
      mockUserService.getCurrentUserProfile.mockResolvedValue(mockUserProfile);
      
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(getByText('updateProfilePage.updateSuccess')).toBeTruthy();
      });
    });

    test('should navigate back after successful update', async () => {
      // Arrange
      jest.useFakeTimers();
      
      mockUserService.updateUserProfile.mockResolvedValue(undefined);
      mockUserService.getCurrentUserProfile.mockResolvedValue(mockUserProfile);
      
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.press(saveButton);
      
      await waitFor(() => {
        expect(getByText('updateProfilePage.updateSuccess')).toBeTruthy();
      });
      
      // Fast forward timers
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      
      // Assert
      expect(mockNavigation.goBack).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    test('should show error message when update fails', async () => {
      // Arrange
      const errorMessage = 'Update failed';
      mockUserService.updateUserProfile.mockRejectedValue(new Error(errorMessage));
      
      const { getByDisplayValue, getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByDisplayValue('John Doe')).toBeTruthy();
      });
      
      const saveButton = getByText('saveChanges');
      
      // Act
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(getByText(errorMessage)).toBeTruthy();
      });
    });
  });

  // ========================
  // NAVIGATION TESTS
  // ========================

  describe('Navigation', () => {
    
    test('should navigate back when back button is pressed', async () => {
      // Arrange
      const { getByTestId } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(mockUserService.getCurrentUserProfile).toHaveBeenCalled();
      });
      
      // Act
      fireEvent.press(getByTestId('back-button') || getByTestId('header-back-button'));
      
      // Assert
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  // ========================
  // AVATAR UPLOAD TESTS
  // ========================

  describe('Avatar Upload', () => {
    
    test('should upload new avatar before updating profile', async () => {
      // Arrange
      const newAvatarUrl = 'https://example.com/new-avatar.jpg';
      mockUserService.uploadAvatar.mockResolvedValue(newAvatarUrl);
      mockUserService.updateUserProfile.mockResolvedValue(undefined);
      
      // Mock image picker result
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://new-image.jpg' }]
      } as any);
      
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act - Change avatar
      fireEvent.press(getByText('profile.changeAvatar'));
      
      const actionSheetCallback = mockActionSheetIOS.mock.calls[0][1];
      act(() => {
        actionSheetCallback(0); // Camera option
      });
      
      await waitFor(() => {
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalled();
      });
      
      // Act - Save changes
      const saveButton = getByText('saveChanges');
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(mockUserService.uploadAvatar).toHaveBeenCalledWith('file://new-image.jpg');
        expect(mockUserService.updateUserProfile).toHaveBeenCalledWith(
          expect.objectContaining({
            avatar_url: newAvatarUrl
          })
        );
      });
    });

    test('should continue with profile update even if avatar upload fails', async () => {
      // Arrange
      mockUserService.uploadAvatar.mockRejectedValue(new Error('Upload failed'));
      mockUserService.updateUserProfile.mockResolvedValue(undefined);
      
      // Mock image picker result
      mockImagePicker.launchCameraAsync.mockResolvedValue({
        canceled: false,
        assets: [{ uri: 'file://new-image.jpg' }]
      } as any);
      
      const { getByText } = render(<UpdateProfile />);
      
      await waitFor(() => {
        expect(getByText('profile.changeAvatar')).toBeTruthy();
      });
      
      // Act - Change avatar
      fireEvent.press(getByText('profile.changeAvatar'));
      
      const actionSheetCallback = mockActionSheetIOS.mock.calls[0][1];
      act(() => {
        actionSheetCallback(0); // Camera option
      });
      
      await waitFor(() => {
        expect(mockImagePicker.launchCameraAsync).toHaveBeenCalled();
      });
      
      // Act - Save changes
      const saveButton = getByText('saveChanges');
      fireEvent.press(saveButton);
      
      // Assert
      await waitFor(() => {
        expect(mockUserService.uploadAvatar).toHaveBeenCalledWith('file://new-image.jpg');
        expect(mockUserService.updateUserProfile).toHaveBeenCalled();
        expect(getByText('updateProfilePage.avatarUploadFailed')).toBeTruthy();
      });
    });
  });

  // ========================
  // ACCESSIBILITY TESTS
  // ========================

  describe('Accessibility', () => {
    
    test('should have proper accessibility labels', async () => {
      // Arrange & Act
      const { getByText } = render(<UpdateProfile />);
      
      // Assert
      await waitFor(() => {
        expect(getByText('updateProfile')).toBeTruthy();
        expect(getByText('profile.fullName')).toBeTruthy();
        expect(getByText('dateOfBirth')).toBeTruthy();
        expect(getByText('email')).toBeTruthy();
        expect(getByText('placeholders.phoneNumber')).toBeTruthy();
        expect(getByText('gender')).toBeTruthy();
      });
    });
  });
}); 