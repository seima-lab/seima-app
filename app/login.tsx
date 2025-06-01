import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import FooterLinks from '../components/Login/FooterLinks';
import GoogleButton from '../components/Login/GoogleButton';
import Logo from '../components/Login/Logo';
import { Colors } from '../constants/Colors';

export default function LoginScreen() {
  const colorScheme = 'light';
  const theme = Colors[colorScheme];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>  
      <Logo />
      <Text style={[styles.loginTitle, { color: '#1e90ff' }]}>Login</Text>
      <GoogleButton />
      <FooterLinks />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
}); 