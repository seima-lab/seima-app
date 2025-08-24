import { typography } from '@/constants/typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface CustomErrorModalProps {
    visible: boolean;
    title: string;
    message: string;
    onDismiss: () => void;
    type?: 'error' | 'warning' | 'info' | 'success';
    buttonText?: string;
}

const CustomErrorModal: React.FC<CustomErrorModalProps> = ({
    visible,
    title,
    message,
    onDismiss,
    type = 'error',
    buttonText
}) => {
    const { t } = useTranslation();
    const scaleValue = new Animated.Value(0);

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleValue, {
                toValue: 1,
                tension: 50,
                friction: 6,
                useNativeDriver: true,
            }).start();
        } else {
            scaleValue.setValue(0);
        }
    }, [visible]);

    const getTypeConfig = () => {
        switch (type) {
            case 'error':
                return {
                    iconName: 'error',
                    iconColor: '#FF6B6B',
                    borderColor: '#FF6B6B',
                };
            case 'warning':
                return {
                    iconName: 'warning',
                    iconColor: '#FFB800',
                    borderColor: '#FFB800',
                };
            case 'success':
                return {
                    iconName: 'check-circle',
                    iconColor: '#4CAF50',
                    borderColor: '#4CAF50',
                };
            case 'info':
            default:
                return {
                    iconName: 'info',
                    iconColor: '#2196F3',
                    borderColor: '#2196F3',
                };
        }
    };

    const typeConfig = getTypeConfig();

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={styles.overlay}>
                <Animated.View 
                    style={[
                        styles.modalContainer,
                        { 
                            transform: [{ scale: scaleValue }],
                            borderTopColor: typeConfig.borderColor
                        }
                    ]}
                >
                    <View style={styles.header}>
                        <Icon 
                            name={typeConfig.iconName} 
                            size={24} 
                            color={typeConfig.iconColor} 
                        />
                        <Text style={styles.title}>{title}</Text>
                    </View>
                    
                    <Text style={styles.message}>{message}</Text>
                    
                    <TouchableOpacity 
                        style={[styles.button, { backgroundColor: typeConfig.borderColor }]}
                        onPress={onDismiss}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>
                            {buttonText || t('common.understood')}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 24,
        paddingVertical: 20,
        width: width * 0.85,
        maxWidth: 400,
        borderTopWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        ...typography.semibold,
        color: '#333',
        marginLeft: 12,
        flex: 1,
    },
    message: {
        fontSize: 16,
        color: '#666',
        lineHeight: 22,
        marginBottom: 24,
        textAlign: 'left',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        ...typography.semibold,
    },
});

export default CustomErrorModal; 