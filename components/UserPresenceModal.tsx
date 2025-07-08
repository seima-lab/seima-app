import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TokenExpiryModalProps {
  visible: boolean;
  remainingTime: number;
  onRefresh: () => void;
  onLogout: () => void;
}

const { width } = Dimensions.get('window');

const TokenExpiryModal: React.FC<TokenExpiryModalProps> = ({
  visible,
  remainingTime,
  onRefresh,
  onLogout,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Icon name="access-time" size={64} color="#FF6B35" />
          
          <Text style={styles.title}>{t('tokenExpiryModal.title')}</Text>
          
          <Text style={styles.message}>
            {t('tokenExpiryModal.message', { remainingTime })}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <Text style={styles.refreshText}>{t('tokenExpiryModal.stay')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutText}>{t('tokenExpiryModal.logout')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${(remainingTime / 60) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 360,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  refreshButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 4,
  },
});

export default TokenExpiryModal; 