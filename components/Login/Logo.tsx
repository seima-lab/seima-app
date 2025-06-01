import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export default function Logo() {
  return (
    <View style={styles.logoContainer}>
      <Image source={require('../../assets/images/group.png')} style={styles.logoImage} />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 48,
    marginTop: 8,
  },
  logoImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },
}); 