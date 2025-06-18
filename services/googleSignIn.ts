import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { authService } from './authService';

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
    console.error('🔴 Google Sign-In Error:', error);
    return {
      success: false,
      error: error.message,
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