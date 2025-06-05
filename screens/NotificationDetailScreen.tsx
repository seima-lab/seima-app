import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { RootStackParamList } from '../navigation/types';

type NotificationDetailScreenRouteProp = RouteProp<RootStackParamList, 'NotificationDetail'>;

const NotificationDetailScreen = () => {
    const route = useRoute<NotificationDetailScreenRouteProp>();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    const { notification } = route.params;

    const handleMarkAsRead = () => {
        Alert.alert(
            t('notifications.markAsRead'),
            t('notifications.markAsReadConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                    text: t('common.confirm'), 
                    onPress: () => {
                        // TODO: Implement mark as read logic
                        Alert.alert(t('common.success'), t('notifications.markedAsRead'));
                    }
                },
            ]
        );
    };

    const handleDeleteNotification = () => {
        Alert.alert(
            t('notifications.deleteNotification'),
            t('notifications.deleteNotificationConfirm'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                    text: t('notifications.delete'), 
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Implement delete logic
                        Alert.alert(t('common.success'), t('notifications.notificationDeleted'), [
                            { text: t('common.confirm'), onPress: () => navigation.goBack() }
                        ]);
                    }
                },
            ]
        );
    };

    const getNotificationTypeInfo = () => {
        switch (notification.type) {
            case 'payment':
                return {
                    category: t('notifications.paymentCategory'),
                    priority: t('notifications.highPriority'),
                    priorityColor: '#FF3B30',
                };
            case 'expense':
                return {
                    category: t('notifications.expenseCategory'),
                    priority: t('notifications.mediumPriority'),
                    priorityColor: '#FF9500',
                };
            case 'transaction':
                return {
                    category: t('notifications.transactionCategory'),
                    priority: t('notifications.lowPriority'),
                    priorityColor: '#34C759',
                };
            default:
                return {
                    category: t('notifications.generalCategory'),
                    priority: t('notifications.lowPriority'),
                    priorityColor: '#007AFF',
                };
        }
    };

    const typeInfo = getNotificationTypeInfo();

    return (
        <View style={styles.container}>
            <StatusBar 
                barStyle="dark-content" 
                backgroundColor="#FFFFFF" 
                translucent={false}
                animated={true}
            />
            
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back-ios" size={24} color="#007AFF" />
                </TouchableOpacity>
                
                <Text style={styles.headerTitle}>{t('notifications.notificationDetail')}</Text>
                
                <TouchableOpacity 
                    style={styles.moreButton}
                    onPress={handleDeleteNotification}
                >
                    <Icon name="more-vert" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Notification Icon & Type */}
                <View style={styles.notificationHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: notification.iconBackground }]}>
                        <Icon 
                            name={notification.icon} 
                            size={32} 
                            color={notification.iconColor} 
                        />
                    </View>
                    <View style={styles.typeContainer}>
                        <Text style={styles.categoryText}>{typeInfo.category}</Text>
                        <View style={styles.priorityContainer}>
                            <View style={[styles.priorityDot, { backgroundColor: typeInfo.priorityColor }]} />
                            <Text style={[styles.priorityText, { color: typeInfo.priorityColor }]}>
                                {typeInfo.priority}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Notification Content */}
                <View style={styles.contentContainer}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationDescription}>{notification.description}</Text>
                    <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                </View>

                {/* Additional Info */}
                <View style={styles.infoContainer}>
                    <Text style={styles.infoTitle}>{t('notifications.additionalInfo')}</Text>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('notifications.notificationId')}:</Text>
                        <Text style={styles.infoValue}>#{notification.id}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('notifications.type')}:</Text>
                        <Text style={styles.infoValue}>{typeInfo.category}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('notifications.status')}:</Text>
                        <Text style={[styles.infoValue, { color: '#FF9500' }]}>
                            {t('notifications.unread')}
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionContainer}>
                    <TouchableOpacity 
                        style={styles.primaryButton}
                        onPress={handleMarkAsRead}
                    >
                        <Icon name="check" size={20} color="white" />
                        <Text style={styles.primaryButtonText}>
                            {t('notifications.markAsRead')}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.secondaryButton}
                        onPress={handleDeleteNotification}
                    >
                        <Icon name="delete" size={20} color="#FF3B30" />
                        <Text style={styles.secondaryButtonText}>
                            {t('notifications.delete')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    moreButton: {
        padding: 8,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    typeContainer: {
        flex: 1,
    },
    categoryText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    priorityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    priorityText: {
        fontSize: 14,
        fontWeight: '500',
    },
    contentContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 12,
    },
    notificationDescription: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
        marginBottom: 16,
    },
    notificationTime: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '500',
    },
    infoContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    actionContainer: {
        gap: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        gap: 8,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    secondaryButtonText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NotificationDetailScreen; 