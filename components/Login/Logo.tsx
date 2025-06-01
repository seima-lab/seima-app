import React from 'react';
import { Image, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../../constants/Colors';

export default function Logo() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={styles.header}>
      <Image source={require('../../assets/images/Iconpiggybank.png')} style={styles.logo} />
      <Text style={[styles.appName, { color: theme.tint }]}>Seima</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 48,
    height: 48,
    marginBottom: 8,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
}); 