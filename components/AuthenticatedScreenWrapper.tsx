import React from 'react';
import { StyleSheet, View } from 'react-native';
import WithBottomNavigation from './WithBottomNavigation';

interface AuthenticatedScreenWrapperProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
}

const AuthenticatedScreenWrapper: React.FC<AuthenticatedScreenWrapperProps> = ({ 
  children, 
  showBottomNav = true 
}) => {
  return (
    <View style={styles.container}>
      <WithBottomNavigation showBottomNav={showBottomNav}>
        {children}
      </WithBottomNavigation>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthenticatedScreenWrapper; 