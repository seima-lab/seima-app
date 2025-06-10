import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { authService } from '../services/authService';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // Read directly from environment variables
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '335208463427-ugtao25qigd5efinilc2mg29uggcol4o.apps.googleusercontent.com',
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
    
    // Step 3: Send idToken to backend via authService
    if (!tokens.idToken) {
      throw new Error('No ID token received from Google');
    }
    
    console.log('🟢 Calling backend via authService...');
    const backendResponse = await authService.googleLogin({ idToken: tokens.idToken });
    
    console.log('🟢 Backend response received:', {
      isFirstLogin: backendResponse.isFirstLogin,
      userEmail: backendResponse.userInformation.email
    });
    
    return {
      success: true,
      userInfo,
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
      backendData: backendResponse,
      isFirstLogin: backendResponse.isFirstLogin,
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