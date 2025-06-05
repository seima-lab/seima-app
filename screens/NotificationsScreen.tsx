import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';

interface Notification {
    id: string;
    type: 'payment' | 'expense' | 'transaction';
    title: string;
    description: string;
    timestamp: string;
    icon: string;
    iconColor: string;
    iconBackground: string;
}

const NotificationsScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();

    const notifications: Notification[] = [
        {
            id: '1',
            type: 'payment',
            title: t('notifications.paymentDue'),
            description: t('notifications.creditCardPaymentDue'),
            timestamp: t('notifications.hoursAgo', { count: 2 }),
            icon: 'warning',
            iconColor: '#FFFFFF',
            iconBackground: '#2196F3',
        },
        {
            id: '2',
            type: 'expense',
            title: t('notifications.expenseAlert'),
            description: t('notifications.diningBudgetExceeded'),
            timestamp: t('notifications.hoursAgo', { count: 4 }),
            icon: 'trending-up',
            iconColor: '#FFFFFF',
            iconBackground: '#2196F3',
        },
        {
            id: '3',
            type: 'transaction',
            title: t('notifications.newTransaction'),
            description: t('notifications.groceryTransaction'),
            timestamp: t('notifications.dayAgo', { count: 1 }),
            icon: 'notifications',
            iconColor: '#FFFFFF',
            iconBackground: '#2196F3',
        },
    ];

    const renderNotification = (notification: Notification) => (
        <TouchableOpacity 
            key={notification.id} 
            style={styles.notificationCard}
            onPress={() => navigation.navigate('NotificationDetail', { notification })}
        >
            <View style={styles.notificationContent}>
                <View style={[styles.iconContainer, { backgroundColor: notification.iconBackground }]}>
                    <Icon 
                        name={notification.icon} 
                        size={24} 
                        color={notification.iconColor} 
                    />
                </View>
                
                <View style={styles.textContainer}>
                    <Text style={styles.notificationTitle}>{notification.title}</Text>
                    <Text style={styles.notificationDescription}>
                        {notification.description}
                    </Text>
                    <Text style={styles.notificationTime}>{notification.timestamp}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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
                
                <View style={styles.headerCenter}>
                    <View style={styles.robotIcon}>
                        <Icon2 name="robot" size={20} color="#007AFF" />
                    </View>
                    <Text style={styles.headerTitle}>Seima</Text>
                </View>
                
                <Text style={styles.notificationsTitle}>{t('notifications.title')}</Text>
            </View>

            {/* Notifications List */}
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {notifications.map(renderNotification)}
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
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'flex-start',
        marginLeft: 10,
    },
    robotIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#007AFF',
    },
    notificationsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    notificationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    notificationDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
});

export default NotificationsScreen; 