import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ExternalLink } from '../../components/ExternalLink';

export default function FooterLinks() {
  return (
    <View style={styles.footerLinks}>
   
      <ExternalLink href="https://example.com/support" style={styles.footerLinkText}>Support</ExternalLink>
      <ExternalLink href="https://example.com/privacy-policy" style={styles.footerLinkText}>Privacy Policy</ExternalLink>
    </View>
  );
}

const styles = StyleSheet.create({
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  footerLinkText: {
    color: '#2196F3',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginHorizontal: 8,
  },
}); 