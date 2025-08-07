import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { authService } from './authService';

// Helper function to detect if Google Sign-In was cancelled by user
const isGoogleSignInCancelled = (error: any): boolean => {
  if (!error) return false;

  // Check error code first
  if (error.code) {
    // Check for known cancellation codes
    if (error.code === statusCodes.SIGN_IN_CANCELLED || 
        error.code === 'SIGN_IN_CANCELLED' ||
        error.code === statusCodes.IN_PROGRESS ||
        error.code === 'IN_PROGRESS' ||
        error.code === 'getTokens' ||
        error.code === '12501') { // Android cancellation code
      return true;
    }
  }

  // Check error message
  if (error.message) {
    const message = error.message.toLowerCase();
    if (message.includes('cancelled') ||
        message.includes('canceled') ||
        message.includes('user cancelled') ||
        message.includes('user canceled') ||
        message.includes('getTokens requires a user to be signed in') ||
        message.includes('sign in was cancelled') ||
        message.includes('the user cancelled the sign-in flow')) {
      return true;
    }
  }

  // Check if it's a string error
  if (typeof error === 'string') {
    const errorStr = error.toLowerCase();
    if (errorStr.includes('cancelled') ||
        errorStr.includes('canceled') ||
        errorStr.includes('getTokens requires a user to be signed in')) {
      return true;
    }
  }

  return false;
};

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Read directly from environment variables
    webClientId: '184930202192-mrks31c9u41a946prh2s1cpvdud41bmp.apps.googleusercontent.com',
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });
};

// Sign in with Google - Simplified using authService
export const signInWithGoogle = async () => {
  try {
    console.log('🟢 Starting Google Sign-In process...');
    
    // Step 1: Check Play Services (Android only)
    await GoogleSignin.hasPlayServices();
    
    // Step 2: Sign in with Google
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    
    console.log('🟢 Google Sign-In successful, got tokens');
    console.log('🟢 tokens', tokens);
    // Step 3: Send idToken to backend via authService
    if (!tokens.idToken) {
      throw new Error('No ID token received from Google');
    }
    
    console.log('🟢 Calling backend via authService...');
    const backendResponse = await authService.googleLogin({ id_token: tokens.idToken });
    
    console.log('🟢 Backend response received:', {
      user_is_active: backendResponse.is_user_active,
      calculated_isFirstLogin: !backendResponse.is_user_active,
      userEmail: backendResponse.user_infomation.email
    });
    
    // Use is_user_active directly from backend
    const isUserActive = (backendResponse as any).is_user_active;
    
    console.log('🔍 DEBUGGING is_user_active field:', {
      'backendResponse.is_user_active': (backendResponse as any).is_user_active,
      'typeof is_user_active': typeof (backendResponse as any).is_user_active
    });
    
    return {
      success: true,
      userInfo,
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      backendData: backendResponse,
      is_user_active: isUserActive,
      email: backendResponse.user_infomation.email,
    };
  } catch (error: any) {
    // Check if user cancelled the sign-in
    const isUserCancellation = isGoogleSignInCancelled(error);
    
    if (isUserCancellation) {
      console.log('🟡 Google Sign-In cancelled by user');
      return {
        success: false,
        error: 'User cancelled Google Sign-In',
        userCancelled: true,
        isFirstLogin: false,
      };
    }
    
    console.error('🔴 Google Sign-In Error:', error);
    console.error('🔴 Error code:', error.code);
    console.error('🔴 Error message:', error.message);
    console.error('🔴 Full error object:', JSON.stringify(error, null, 2));
    return {
      success: false,
      error: error.message || 'Google Sign-In failed',
      isFirstLogin: false,
    };
  }
};

// Sign out
export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
    await authService.logout(); // Also logout from backend
    return { success: true };
  } catch (error: any) {
    console.error('Google Sign-Out Error:', error);
    return { success: false, error: error.message };
  }
};

// Check if user is signed in
export const getCurrentUser = async () => {
  try {
    const currentUser = await GoogleSignin.getCurrentUser();
    return currentUser;
  } catch (error) {
    return null;
  }
}; 