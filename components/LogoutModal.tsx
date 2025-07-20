import { typography } from '@/constants/typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface LogoutModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  userName?: string;
}

const { width } = Dimensions.get('window');

const LogoutModal: React.FC<LogoutModalProps> = ({
  visible,
  onConfirm,
  onCancel,
  userName = 'Bạn',
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="exit-to-app" size={48} color="#FF6B35" />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>{t('logoutModal.goodbye', { userName })}</Text>
          
          {/* Message */}
          <Text style={styles.message}>
            {t('logoutModal.confirmMessage')}
          </Text>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Icon name="arrow-left" size={20} color="#4A90E2" />
              <Text style={styles.cancelText}>{t('logoutModal.stay')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.confirmButton} 
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Icon name="exit-to-app" size={20} color="white" />
              <Text style={styles.confirmText}>{t('logoutModal.logout')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Footer message */}
          <Text style={styles.footerText}>
            {t('logoutModal.footer')}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    ...typography.semibold,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    ...typography.regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  cancelText: {
    color: '#4A90E2',
    ...typography.semibold,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmText: {
    color: 'white',
    ...typography.semibold,
  },
  footerText: {
    ...typography.regular,
    color: '#999',
    textAlign: 'center',
  },
});

export default LogoutModal; 