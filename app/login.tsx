import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import GoogleButton from '../components/Login/GoogleButton';
import Logo from '../components/Login/Logo';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();

  // Card animation
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 900,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, [cardAnim]);

  const cardTranslateY = cardAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] });
  const cardOpacity = cardAnim;

  const handleGoogleLogin = () => {
    router.push('/register');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ backgroundColor: 'transparent' }}>
        <View style={styles.container}>
          {/* Animated Logo */}
          <Logo />
          {/* Animated Login Card */}
          <Animated.View style={[styles.loginCard, { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }]}> 
            <Text style={styles.loginTitle}>Sign in to your account</Text>
            <GoogleButton onPress={handleGoogleLogin} />
          </Animated.View>
          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 64,
    paddingHorizontal: 16,
    minHeight: height,
    backgroundColor: '#fff',
  },
  loginCard: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 400,
    padding: 36,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    marginBottom: 32,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1e90ff',
    textAlign: 'center',
    marginBottom: 32,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 18,
  },
}); 