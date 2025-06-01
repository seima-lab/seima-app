import { AntDesign } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface GoogleButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export default function GoogleButton({ onPress, style }: GoogleButtonProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <TouchableOpacity style={[styles.googleButton, { backgroundColor: '1e90ff' }, style]} onPress={onPress} activeOpacity={0.8}>
      <Text style={styles.googleButtonText}>Login with Google</Text>
      <AntDesign name="google" size={24} color="#fff" style={styles.googleIcon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 40,
  },
  googleButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    textAlign: 'center',
  },
  googleIcon: {
    marginLeft: 8,
  },
}); 