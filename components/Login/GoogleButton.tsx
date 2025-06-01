import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface GoogleButtonProps {
  onPress?: () => void;
  style?: ViewStyle;
}

export default function GoogleButton({ onPress, style }: GoogleButtonProps) {
  return (
    <TouchableOpacity 
      style={[styles.googleButton, style]} 
      onPress={onPress} 
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name="google" size={20} color="#4285F4" style={styles.googleIcon} />
      <Text style={styles.googleButtonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleButtonText: {
    color: '#1e90ff',
    fontWeight: '500',
    fontSize: 16,
    marginLeft: 12,
  },
  googleIcon: {
    marginRight: 8,
  },
}); 