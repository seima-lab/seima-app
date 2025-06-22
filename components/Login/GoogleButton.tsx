import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import '../../i18n';

interface GoogleButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

// Official Google Logo SVG Component
const GoogleLogo = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function GoogleButton({ onPress, style, disabled = false }: GoogleButtonProps) {
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity 
      style={[styles.googleButton, disabled && styles.googleButtonDisabled, style]} 
      onPress={disabled ? undefined : onPress} 
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
      testID="google-login-button"
    >
      <View style={styles.iconContainer}>
        <GoogleLogo size={20} />
      </View>
      <Text style={[styles.googleButtonText, disabled && styles.googleButtonTextDisabled]}>
        {t('login.continueWithGoogle')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#1F2937',
    fontWeight: '500',
    fontSize: 16,
  },
  googleButtonTextDisabled: {
    color: '#9CA3AF',
  },
}); 