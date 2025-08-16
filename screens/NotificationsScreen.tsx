import { typography } from '@/constants/typography';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react'; // Added missing import for React
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import CustomConfirmModal from '../components/CustomConfirmModal';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { deleteAllNotifications, deleteNotification, getNotifications, markAllAsRead, markAsRead, Notification } from '../services/notificationService';
const { width: screenWidth } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80; // Ngưỡng swipe để hiện delete button
const DELETE_BUTTON_WIDTH = 80; // Chiều rộng của delete button

const NotificationsScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<number | null>(null);

    // Track changes to notify FinanceScreen to reload
    const [hasChanges, setHasChanges] = useState(false);
    const [changeType, setChangeType] = useState<'delete' | 'read' | 'deleteAll' | null>(null);

    // Animation values for each notification
    const animatedValues = useRef<{ [key: number]: Animated.Value }>({});

    // Notify FinanceScreen to reload notifications when there are changes
    useFocusEffect(
        React.useCallback(() => {
            // When screen loses focus and there are changes, notify parent to reload
            return () => {
                if (hasChanges) {
                    console.log('🔄 NotificationsScreen has changes, notifying FinanceScreen to reload');
                    // Store change info in AsyncStorage for FinanceScreen to check
                    // This is a simple way to communicate between screens
                    const storeChangeInfo = async () => {
                        try {
                            const changeInfo = {
                                notificationsChanged: true,
                                changeType: changeType,
                                timestamp: Date.now()
                            };
                            await AsyncStorage.setItem('NotificationsChangeInfo', JSON.stringify(changeInfo));
                            console.log('📝 Change info stored for FinanceScreen:', changeInfo);
                        } catch (error) {
                            console.error('❌ Error storing change info:', error);
                        }
                    };
                    storeChangeInfo();
                }
            };
        }, [hasChanges, changeType])
    );

    // Initialize animated value for a notification
    const getAnimatedValue = (notificationId: number) => {
        if (!animatedValues.current[notificationId]) {
            animatedValues.current[notificationId] = new Animated.Value(0);
        }
        return animatedValues.current[notificationId];
    };

    const formatTimestamp = (timestamp: string): string => {
        if (!timestamp) return 'Thời gian không xác định'; // Placeholder for missing timestamp
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                return 'Định dạng thời gian không hợp lệ'; // Handle invalid date format
            }
            // Format to dd/MM/yyyy HH:mm
            return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        } catch (e) {
            return 'Lỗi định dạng thời gian'; // Handle other parsing errors
        }
    };

    const handleNotificationPress = async (notification: Notification, index: number) => {
        try {
            if (!notification.is_read) {
                await markAsRead(notification.notification_id);
                setNotifications(prev => prev.map((item, i) =>
                    i === index ? { ...item, is_read: true } : item
                ));
                
                // Track change for reload
                setHasChanges(true);
                setChangeType('read');
            }
        } catch (e) {
            // Có thể hiển thị toast hoặc log lỗi nếu cần
        }
        // Đã xoá navigation.navigate sang màn detail
    };

    const handleDeleteNotification = async (notificationId: number) => {
        // Reset swipe position first
        resetSwipe(notificationId);
        
        // Show confirmation modal
        setNotificationToDelete(notificationId);
        setShowDeleteModal(true);
    };

    const confirmDeleteNotification = async () => {
        if (notificationToDelete === null) return;
        
        try {
            console.log('🗑️ Deleting notification:', notificationToDelete);
            await deleteNotification(notificationToDelete);
            
            // Remove notification from local state
            setNotifications(prev => prev.filter(item => item.notification_id !== notificationToDelete));
            
            // Clean up animated value
            delete animatedValues.current[notificationToDelete];
            
            // Track change for reload
            setHasChanges(true);
            setChangeType('delete');
            
            console.log('✅ Notification deleted successfully');
        } catch (error) {
            console.error('❌ Error deleting notification:', error);
        } finally {
            setShowDeleteModal(false);
            setNotificationToDelete(null);
        }
    };

    const cancelDeleteNotification = () => {
        setShowDeleteModal(false);
        setNotificationToDelete(null);
    };

    const handleDeleteAllNotifications = async () => {
        // Close dropdown first
        setIsDropdownOpen(false);
        
        // Show confirmation modal
        setShowDeleteAllModal(true);
    };

    const confirmDeleteAllNotifications = async () => {
        try {
            console.log('🔴 Calling deleteAllNotifications API...');
            await deleteAllNotifications();
            setNotifications([]);
            
            // Track change for reload
            setHasChanges(true);
            setChangeType('deleteAll');
            
            console.log('✅ Delete all notifications completed');
        } catch (e) {
            console.error('❌ Error deleting all notifications:', e);
        } finally {
            setShowDeleteAllModal(false);
        }
    };

    const cancelDeleteAllNotifications = () => {
        setShowDeleteAllModal(false);
    };

    const onGestureEvent = (notificationId: number) => 
        Animated.event([{ nativeEvent: { translationX: getAnimatedValue(notificationId) } }], {
            useNativeDriver: false,
        });

    const onHandlerStateChange = (notificationId: number) => ({ nativeEvent }: any) => {
        const animatedValue = getAnimatedValue(notificationId);
        
        if (nativeEvent.state === State.END) {
            const { translationX } = nativeEvent;
            
            if (translationX < SWIPE_THRESHOLD) {
                // Swipe đủ xa, hiển thị delete button
                Animated.spring(animatedValue, {
                    toValue: -DELETE_BUTTON_WIDTH,
                    useNativeDriver: false,
                }).start();
            } else {
                // Swipe không đủ xa, reset về vị trí ban đầu
                Animated.spring(animatedValue, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
            }
        }
    };

    const resetSwipe = (notificationId: number) => {
        const animatedValue = getAnimatedValue(notificationId);
        Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: false,
        }).start();
    };

    const handleMarkAllAsRead = async () => {
        try {
            console.log('🔵 Calling markAllAsRead API...');
            await markAllAsRead();
            setNotifications(prev => prev.map(item => ({
                ...item,
                is_read: true
            })));
            setIsDropdownOpen(false);
            
            // Track change for reload
            setHasChanges(true);
            setChangeType('read');
            
            console.log('✅ Mark all as read completed');
        } catch (e) {
            console.error('❌ Error marking all as read:', e);
        }
    };

    const hasUnreadNotifications = notifications.some(notification => !notification.is_read);
    const hasAnyNotifications = notifications.length > 0;
    
    console.log('📊 Notification stats:', {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        hasUnread: hasUnreadNotifications,
        hasAny: hasAnyNotifications
    });

    useEffect(() => {
        setLoading(true);
        getNotifications({ page: 0, size: 20 })
            .then((res) => {
                const apiData = (res.data && typeof res.data === 'object' && 'content' in res.data) ? (res.data as any).content : [];
                setNotifications(apiData.map((item: Notification) => ({
                    ...item,
                    icon: 'notifications',
                    iconColor: '#FFFFFF',
                    iconBackground: '#2196F3',
                })));
                setError(null);
            })
            .catch(() => {
                setError('Lỗi khi tải thông báo');
            })
            .finally(() => setLoading(false));
    }, []);

    const renderNotification = (notification: Notification, index: number) => {
        const animatedValue = getAnimatedValue(notification.notification_id);
        
        return (
            <View key={`${notification.notification_id}-${index}`} style={styles.notificationWrapper}>
                {/* Delete Button Background */}
                <View style={styles.deleteButtonContainer}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteNotification(notification.notification_id)}
                    >
                        <Icon name="delete" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Swipeable Notification Card */}
                <PanGestureHandler
                    onGestureEvent={onGestureEvent(notification.notification_id)}
                    onHandlerStateChange={onHandlerStateChange(notification.notification_id)}
                    activeOffsetX={[-10, 10]}
                >
                    <Animated.View
                        style={[
                            styles.animatedCard,
                            {
                                transform: [{ translateX: animatedValue }],
                            },
                        ]}
                    >
                        <TouchableOpacity 
                            style={[styles.notificationCard, !notification.is_read && styles.unreadCard]}
                            onPress={() => {
                                resetSwipe(notification.notification_id);
                                handleNotificationPress(notification, index);
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.notificationContent}>
                                <View style={styles.textContainer}>
                                    <Text style={[styles.notificationTitle, !notification.is_read && {...typography.semibold}]}>{notification.title}</Text>
                                 
                                    <Text style={styles.notificationDescription} numberOfLines={2} ellipsizeMode="tail">
                                        {notification.message}
                                    </Text>
                                    <Text style={styles.notificationTime}>{formatTimestamp(notification.created_at)}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                </PanGestureHandler>
            </View>
        );
    };

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
                    <Icon name="chevron-left" size={28} color="#007AFF" style={{ alignSelf: 'center' }} />
                </TouchableOpacity>
                
                <View style={styles.headerCenter}>
                    <Text style={styles.notificationsTitle}>{t('notifications.title')}</Text>
                </View>
                
                <View style={styles.headerRight}>
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity 
                            style={styles.moreButton}
                            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <Icon name="more-vert" size={24} color="#007AFF" />
                        </TouchableOpacity>
                        {isDropdownOpen && (
                            <>
                                <TouchableWithoutFeedback onPress={() => setIsDropdownOpen(false)}>
                                    <View style={styles.dropdownBackdrop} />
                                </TouchableWithoutFeedback>
                                <View style={styles.dropdownMenu}>
                                    <TouchableOpacity 
                                        style={[
                                            styles.dropdownOption,
                                            !hasUnreadNotifications && styles.disabledOption
                                        ]}
                                        onPress={hasUnreadNotifications ? handleMarkAllAsRead : undefined}
                                        disabled={!hasUnreadNotifications}
                                    >
                                        <Icon 
                                            name="done-all" 
                                            size={20} 
                                            color={hasUnreadNotifications ? "#007AFF" : "#999"} 
                                        />
                                        <Text style={[
                                            styles.dropdownOptionText,
                                            !hasUnreadNotifications && { color: '#999' }
                                        ]}>
                                            Đọc hết
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[
                                            styles.dropdownOption, 
                                            styles.lastDropdownOption,
                                            !hasAnyNotifications && styles.disabledOption
                                        ]}
                                        onPress={hasAnyNotifications ? handleDeleteAllNotifications : undefined}
                                        disabled={!hasAnyNotifications}
                                    >
                                        <Icon 
                                            name="delete" 
                                            size={20} 
                                            color={hasAnyNotifications ? "#FF3B30" : "#999"} 
                                        />
                                        <Text style={[
                                            styles.dropdownOptionText, 
                                            { color: hasAnyNotifications ? '#FF3B30' : '#999' }
                                        ]}>
                                            Xóa hết
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </View>

            {/* Notifications List */}
            <ScrollView 
                style={styles.scrollContainer}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <Text>Đang tải...</Text>
                ) : error ? (
                    <Text style={{ color: 'red' }}>{error}</Text>
                ) : (
                    notifications.map((notification, index) => renderNotification(notification, index))
                )}
            </ScrollView>

            {/* Delete Notification Confirmation Modal */}
            <CustomConfirmModal
                visible={showDeleteModal}
                title="Xóa thông báo"
                message="Bạn có chắc chắn muốn xóa thông báo này không? Hành động này không thể hoàn tác."
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={confirmDeleteNotification}
                onCancel={cancelDeleteNotification}
                type="danger"
                iconName="delete"
            />

            {/* Delete All Notifications Confirmation Modal */}
            <CustomConfirmModal
                visible={showDeleteAllModal}
                title="Xóa tất cả thông báo"
                message="Bạn có chắc chắn muốn xóa tất cả thông báo không? Hành động này không thể hoàn tác."
                confirmText="Xóa tất cả"
                cancelText="Hủy"
                onConfirm={confirmDeleteAllNotifications}
                onCancel={cancelDeleteAllNotifications}
                type="danger"
                iconName="delete-sweep"
            />
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
        justifyContent: 'center',
        marginLeft: 0,
    },
    headerRight: {
        flexDirection: 'column',
        alignItems: 'flex-end',
    },
    headerTitle: {
        fontSize: 18,
        ...typography.semibold,
        color: '#007AFF',
    },
    notificationsTitle: {
        fontSize: 18,
        ...typography.semibold,
        color: '#333',
        marginRight: 0,
    },
    markAllButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginTop: 4,
    },
    markAllText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    notificationWrapper: {
        position: 'relative',
        marginBottom: 16,
        borderRadius: 16,
        overflow: 'hidden', // Ẩn delete button khi không swipe
        backgroundColor: '#FF3B30', // Background màu đỏ sẽ hiện khi swipe
    },
    deleteButtonContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        right: 0,
        width: DELETE_BUTTON_WIDTH,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent', // Transparent vì wrapper đã có màu đỏ
    },
    deleteButton: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedCard: {
        backgroundColor: 'transparent',
        width: '100%', // Đảm bảo che hết delete button
    },
    notificationCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: '100%', // Đảm bảo che hết delete button khi không swipe
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    unreadCard: {
        backgroundColor: '#E8F0FE',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
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
        ...typography.semibold,
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
        ...typography.medium,
    },
    dropdownContainer: {
        position: 'relative',
    },
    moreButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    dropdownBackdrop: {
        position: 'absolute',
        top: -50,
        left: -200,
        right: -50,
        bottom: -300,
        backgroundColor: 'transparent',
        zIndex: 999,
    },
    dropdownMenu: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E5',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        zIndex: 1000,
        minWidth: 140,
        paddingVertical: 4,
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        minHeight: 44,
    },
    lastDropdownOption: {
        borderBottomWidth: 0,
    },
    dropdownOptionText: {
        marginLeft: 12,
        fontSize: 14,
        ...typography.medium,
        color: '#333',
    },
    disabledOption: {
        opacity: 0.5,
    },
});

export default NotificationsScreen; 