import { typography } from '@/constants/typography';
import React from 'react';
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

interface CustomConfirmModalProps {
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
    onCancel: () => void;
    onClose?: () => void; // Optional close button handler
    type?: 'danger' | 'warning' | 'info';
    iconName?: string;
    transitionKey?: string;
}

const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
    visible,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    onClose,
    type = 'danger',
    iconName = 'delete',
    transitionKey,
}) => {
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

    const getTypeColor = () => {
        switch (type) {
            case 'danger':
                return '#FF3B30';
            case 'warning':
                return '#FF9500';
            case 'info':
                return '#007AFF';
            default:
                return '#FF3B30';
        }
    };

    const typeColor = getTypeColor();

    return (
        <Modal
            key={transitionKey}
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        { transform: [{ scale: scaleValue }] }
                    ]}
                >
                    {/* Close Button */}
                    {onClose && (
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Icon name="close" size={24} color="#999" />
                        </TouchableOpacity>
                    )}

                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: typeColor + '20' }]}>
                        <Icon name={iconName} size={40} color={typeColor} />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, { backgroundColor: typeColor }]}
                            onPress={() => {
                                console.log('🎯 [CustomConfirmModal] Confirm button pressed');
                                console.log('🎯 [CustomConfirmModal] onConfirm function:', onConfirm);
                                onConfirm();
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
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
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 25,
        width: width * 0.85,
        maxWidth: 350,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        ...typography.semibold,
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    confirmButton: {
        // backgroundColor will be set dynamically based on type
    },
    cancelButtonText: {
        fontSize: 16,
        ...typography.semibold,
        color: '#666',
    },
    confirmButtonText: {
        fontSize: 16,
        ...typography.semibold,
        color: '#FFFFFF',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
    },
});

export default CustomConfirmModal; 