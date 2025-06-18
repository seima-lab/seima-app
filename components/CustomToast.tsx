import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface CustomToastProps {
  visible: boolean;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  onHide: () => void;
  duration?: number;
}

export default function CustomToast({ 
  visible, 
  message, 
  type, 
  onHide, 
  duration = 4000 
}: CustomToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  const getToastConfig = () => {
    switch (type) {
      case 'error':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#FCA5A5',
          iconName: 'error-outline',
          iconColor: '#EF4444',
          textColor: '#991B1B',
          titleColor: '#DC2626'
        };
      case 'success':
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#86EFAC',
          iconName: 'check-circle-outline',
          iconColor: '#10B981',
          textColor: '#166534',
          titleColor: '#059669'
        };
      case 'warning':
        return {
          backgroundColor: '#FFFBEB',
          borderColor: '#FCD34D',
          iconName: 'warning',
          iconColor: '#F59E0B',
          textColor: '#92400E',
          titleColor: '#D97706'
        };
      case 'info':
        return {
          backgroundColor: '#EFF6FF',
          borderColor: '#93C5FD',
          iconName: 'info-outline',
          iconColor: '#3B82F6',
          textColor: '#1E40AF',
          titleColor: '#2563EB'
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
          borderColor: '#D1D5DB',
          iconName: 'info-outline',
          iconColor: '#6B7280',
          textColor: '#374151',
          titleColor: '#111827'
        };
    }
  };

  const config = getToastConfig();

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Icon
          name={config.iconName}
          size={24}
          color={config.iconColor}
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.message, { color: config.textColor }]}>
            {message}
          </Text>
        </View>
        <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
          <Icon name="close" size={20} color={config.textColor} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
}); 