import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    // IMPORTANT: Replace with your actual Web Client ID from Google Cloud Console
    // Steps to get Web Client ID:
    // 1. Go to https://console.cloud.google.com/
    // 2. Select your project or create a new one
    // 3. Enable Google Sign-In API
    // 4. Go to Credentials
    // 5. Create OAuth 2.0 Client ID (Web application)
    // 6. Copy the Web Client ID (not the Android/iOS client ID)
    webClientId: '335208463427-ugtao25qigd5efinilc2mg29uggcol4o.apps.googleusercontent.com',
    offlineAccess: true,
    scopes: ['profile', 'email'],
  });
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    
    return {
      success: true,
      userInfo,
      idToken: tokens.idToken,
      accessToken: tokens.accessToken,
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Sign out
export const signOutGoogle = async () => {
  try {
    await GoogleSignin.signOut();
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