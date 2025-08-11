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

interface CustomSuccessModalProps {
    visible: boolean;
    title: string;
    message: string;
    buttonText: string;
    onConfirm: () => void;
    iconName?: string;
    transitionKey?: string;
}

const CustomSuccessModal: React.FC<CustomSuccessModalProps> = ({
    visible,
    title,
    message,
    buttonText,
    onConfirm,
    iconName = 'check-circle',
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

    return (
        <Modal
            key={transitionKey}
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onConfirm}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        { transform: [{ scale: scaleValue }] }
                    ]}
                >
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Icon name={iconName} size={48} color="#4CAF50" />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onConfirm}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
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
        backgroundColor: '#E8F5E8',
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
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    buttonText: {
        fontSize: 16,
        ...typography.semibold,
        color: '#FFFFFF',
    },
});

export default CustomSuccessModal; 