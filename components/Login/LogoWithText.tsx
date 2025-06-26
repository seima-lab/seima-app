import { Image, StyleSheet, View } from 'react-native';

export default function LogoWithText() {
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
    marginBottom: 24,
    marginTop: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
}); 