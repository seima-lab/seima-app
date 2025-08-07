import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    PermissionsAndroid,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import AudioRecorderPlayer, {
    AudioEncoderAndroidType,
    AudioSourceAndroidType,
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
    RecordBackType
} from 'react-native-audio-recorder-player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { aiService, SuggestedBudget, SuggestedWallet } from '../services/aiService';
import { TranscriptionService } from '../services/transcriptionService';
import { UserService } from '../services/userService';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    suggestedWallets?: SuggestedWallet[];
    suggestedBudgets?: SuggestedBudget[];
    suggestDisabled?: boolean; // New prop for disabling suggestions
}

// Typing indicator component with 3 bouncing dots
const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animateDot = (dot: Animated.Value, delay: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dot, {
                        toValue: -6,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
        };

        const animations = [
            animateDot(dot1, 0),
            animateDot(dot2, 200),
            animateDot(dot3, 400),
        ];

        animations.forEach(anim => anim.start());

        return () => {
            animations.forEach(anim => anim.stop());
        };
    }, [dot1, dot2, dot3]);

    return (
        <View style={styles.typingContainer}>
            <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
            <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
            <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
        </View>
    );
};

// Avatar component for AI and User
const Avatar = ({ isUser, avatarUrl }: { isUser: boolean; avatarUrl?: string | null }) => {
    if (isUser && avatarUrl) {
        return (
            <View style={[styles.avatar, styles.userAvatar]}>
                <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: 32, height: 32, borderRadius: 16 }}
                    resizeMode="cover"
                />
            </View>
        );
    }
    return (
        <View style={[styles.avatar, isUser ? styles.userAvatar : styles.aiAvatar]}>
            {isUser ? (
                <Icon name="person" size={20} color="#FFFFFF" />
            ) : (
                <LinearGradient
                    colors={['#1e90ff', '#0066cc']}
                    style={styles.aiAvatarGradient}
                >
                    <Icon2 name="robot" size={18} color="#FFFFFF" />
                </LinearGradient>
            )}
        </View>
    );
};

// Suggested Wallets component
const SuggestedWallets = ({ wallets, onWalletSelect, disabled = false }: { 
    wallets: SuggestedWallet[], 
    onWalletSelect: (wallet: SuggestedWallet) => void,
    disabled?: boolean
}) => {
    // Early return if no wallets or empty array
    if (!wallets || wallets.length === 0) {
        console.log('💼 No suggested wallets to display');
        return null;
    }

    console.log('💼 Rendering suggested wallets:', wallets.length, 'wallets', 'disabled:', disabled);

    return (
        <View style={styles.suggestedWalletsContainer}>
            <Text style={styles.suggestedWalletsTitle}>💼 Ví được đề xuất:</Text>
            <View style={styles.suggestedWalletsGrid}>
                {wallets.map((wallet) => (
                    <TouchableOpacity
                        key={wallet.id}
                        style={[styles.suggestedWalletButton, disabled && { opacity: 0.5 }]}
                        onPress={() => !disabled && onWalletSelect(wallet)}
                        disabled={disabled}
                    >
                        <View style={styles.suggestedWalletContent}>
                            <Icon name="account-balance-wallet" size={16} color="#1e90ff" />
                            <Text style={styles.suggestedWalletName} numberOfLines={1}>
                                {wallet.name}
                            </Text>
                            {wallet.balance !== undefined && (
                                <Text style={styles.suggestedWalletBalance}>
                                    {wallet.balance.toLocaleString('vi-VN')} {wallet.currency || 'đ'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// Suggested Budgets component
const SuggestedBudgets = ({ budgets, onBudgetSelect, disabled = false }: { 
    budgets: SuggestedBudget[], 
    onBudgetSelect: (budget: SuggestedBudget) => void,
    disabled?: boolean
}) => {
    // Early return if no budgets or empty array
    if (!budgets || budgets.length === 0) {
        console.log('💰 No suggested budgets to display');
        return null;
    }

    console.log('💰 Rendering suggested budgets:', budgets.length, 'budgets', 'disabled:', disabled);

    return (
        <View style={styles.suggestedBudgetsContainer}>
            <Text style={styles.suggestedBudgetsTitle}>💰 Ngân sách được đề xuất:</Text>
            <View style={styles.suggestedBudgetsGrid}>
                {budgets.map((budget) => (
                    <TouchableOpacity
                        key={budget.id}
                        style={[styles.suggestedBudgetButton, disabled && { opacity: 0.5 }]}
                        onPress={() => !disabled && onBudgetSelect(budget)}
                        disabled={disabled}
                    >
                        <View style={styles.suggestedBudgetContent}>
                            <Icon name="account-balance" size={16} color="#28a745" />
                            <Text style={styles.suggestedBudgetName} numberOfLines={1}>
                                {budget.name}
                            </Text>
                            {budget.overall_amount_limit !== undefined && (
                                <Text style={styles.suggestedBudgetLimit}>
                                    Hạn mức: {budget.overall_amount_limit.toLocaleString('vi-VN')} {budget.currency || 'đ'}
                                </Text>
                            )}
                            {budget.budget_remaining_amount !== undefined && (
                                <Text style={styles.suggestedBudgetRemaining}>
                                    Còn lại: {budget.budget_remaining_amount.toLocaleString('vi-VN')} {budget.currency || 'đ'}
                                </Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

// Welcome message component
const WelcomeMessage = () => {
    return (
        <View style={styles.welcomeContainer}>
            <LinearGradient
                colors={['#1e90ff', '#0066cc']}
                style={styles.welcomeGradient}
            >
                <Icon2 name="robot" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.welcomeTitle}>Seima AI Assistant</Text>
            <Text style={styles.welcomeSubtitle}>
                Tôi sẵn sàng giúp bạn quản lý tài chính một cách thông minh! 
                Hãy chia sẻ thông tin chi tiêu hoặc đặt câu hỏi về ngân sách.
            </Text>
        </View>
    );
};

// Format timestamp
const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
};

// Format relative time in Vietnamese
const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);

    if (diffInMinutes < 1) {
        return 'Vừa xong';
    } else if (diffInMinutes < 60) {
        return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
    } else if (diffInDays < 30) {
        return `${diffInDays} ngày trước`;
    } else if (diffInMonths < 12) {
        return `${diffInMonths} tháng trước`;
    } else {
        return `${diffInYears} năm trước`;
    }
};

// Voice Recorder Modal - Half screen from bottom
const VoiceRecorderModal = ({
    visible,
    onClose,
    onResult,
    isLoading,
    onStartRecord,
    onStopRecord,
}: {
    visible: boolean;
    onClose: () => void;
    onResult: (text: string) => void;
    isLoading: boolean;
    onStartRecord: () => Promise<void>;
    onStopRecord: () => Promise<void>;
}) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null);

    // Reset state khi đóng modal
    useEffect(() => {
        if (!visible) {
            setIsRecording(false);
        }
    }, [visible]);

    // Kiểm tra quyền ghi âm khi mở modal (Android)
    useEffect(() => {
        if (visible && Platform.OS === 'android') {
            (async () => {
                try {
                    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
                    setHasAudioPermission(granted);
                } catch (e) {
                    setHasAudioPermission(false);
                }
            })();
        } else if (visible && Platform.OS !== 'android') {
            setHasAudioPermission(true); // iOS: luôn true
        }
    }, [visible]);

    const handlePressIn = async () => {
        if (Platform.OS === 'android' && !hasAudioPermission) {
            try {
                const permissions = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                ]);
                
                const audioGranted = permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
                const writeGranted = permissions[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
                const readGranted = permissions[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;
                
                if (audioGranted) {
                    setHasAudioPermission(true);
                    console.log('✅ Audio permission granted');
                    
                    if (writeGranted && readGranted) {
                        console.log('✅ Storage permissions granted');
                    } else {
                        console.log('⚠️ Some storage permissions not granted:', { writeGranted, readGranted });
                    }
                    
                    Alert.alert(t('voiceRecording.permissionGranted'), t('voiceRecording.permissionGrantedMessage'));
                    return;
                } else {
                    setHasAudioPermission(false);
                    Alert.alert(t('voiceRecording.permissionDenied'), t('voiceRecording.permissionDeniedMessage'));
                    return;
                }
            } catch (err) {
                setHasAudioPermission(false);
                Alert.alert(t('voiceRecording.permissionError'), t('voiceRecording.permissionErrorMessage'));
                return;
            }
        }
        
        try {
            await onStartRecord();
            setIsRecording(true);
        } catch (err) {
            setIsRecording(false);
        }
    };

    const handlePressOut = async () => {
        if (isRecording) {
            try {
                await onStopRecord();
                setIsRecording(false);
            } catch (err) {
                setIsRecording(false);
            }
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.voiceModalOverlay}>
                <View style={styles.voiceModalContainer}>
                    {/* Header */}
                    <View style={styles.voiceModalHeader}>
                        <View style={styles.voiceModalHandle} />
                        <Text style={styles.voiceModalTitle}>Ghi âm giọng nói</Text>
                        <TouchableOpacity
                            style={styles.voiceModalCloseButton}
                            onPress={onClose}
                        >
                            <Icon name="close" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <View style={styles.voiceModalContent}>
                        {isLoading ? (
                            <View style={styles.voiceLoadingContainer}>
                                <ActivityIndicator size="large" color="#1e90ff" style={{ marginBottom: 16 }} />
                                <Text style={styles.voiceLoadingText}>
                                    Đang xử lý giọng nói...{'\n'}
                                    <Text style={styles.voiceLoadingSubtext}>
                                        Vui lòng chờ trong giây lát
                                    </Text>
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Recording Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.voiceRecordButton,
                                        isRecording && styles.voiceRecordButtonRecording
                                    ]}
                                    onPressIn={handlePressIn}
                                    onPressOut={handlePressOut}
                                    disabled={isLoading}
                                >
                                    <LinearGradient
                                        colors={isRecording ? ['#ff4d4f', '#ff7875'] : ['#1e90ff', '#0066cc']}
                                        style={styles.voiceRecordButtonGradient}
                                    >
                                        <Icon 
                                            name={isRecording ? 'stop' : 'mic'} 
                                            size={32} 
                                            color="#fff" 
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Instructions */}
                                <Text style={styles.voiceInstructionText}>
                                    {isRecording ? 'Đang ghi âm... Nhả ra để dừng' : 'Giữ để ghi âm, nhả ra để dừng'}
                                </Text>

                                {/* Recording indicator */}
                                {isRecording && (
                                    <View style={styles.voiceRecordingIndicator}>
                                        <View style={styles.voiceRecordingDot} />
                                        <Text style={styles.voiceRecordingText}>Đang ghi âm</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const ChatAIScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    const route = useRoute();
    const scrollViewRef = useRef<ScrollView>(null);
    const textInputRef = useRef<TextInput>(null);
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [inputText, setInputText] = useState('');
    const [showWelcome, setShowWelcome] = useState(true);
    const [userId, setUserId] = useState<number | null>(null);
    const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
    const [showVoiceModal, setShowVoiceModal] = useState(false);
    const [isVoiceLoading, setIsVoiceLoading] = useState(false);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    
    // Input blocking states for suggested wallets
    const [isInputBlocked, setIsInputBlocked] = useState(false);
    const [blockTimer, setBlockTimer] = useState<NodeJS.Timeout | null>(null);
    const [remainingBlockTime, setRemainingBlockTime] = useState(0);
    
    // Persist suggested items state across navigation
    const [currentSuggestedWallets, setCurrentSuggestedWallets] = useState<SuggestedWallet[]>([]);
    const [currentSuggestedBudgets, setCurrentSuggestedBudgets] = useState<SuggestedBudget[]>([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [canLoadMore, setCanLoadMore] = useState(true);
    const [currentScrollY, setCurrentScrollY] = useState(0);
    const [lastLoadTriggerY, setLastLoadTriggerY] = useState(0); // Track last trigger position
    
    const inputRef = useRef<TextInput>(null);
    
    const suggestions = [
        { text: 'Tôi tiêu 50k cho ăn uống 🍜', icon: 'restaurant' },
        { text: 'Tạo ngân sách tháng này 💰', icon: 'account-balance-wallet' }, 
        { text: 'Xem báo cáo chi tiêu 📊', icon: 'analytics' },
        { text: 'Tư vấn tiết kiệm 💡', icon: 'lightbulb' },
    ];

    // Audio configuration for better compatibility across devices
    const audioSet = {
        // iOS Settings
        AVSampleRateKeyIOS: 44100,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,

        // Android Settings
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
    };

    const meteringEnabled = true; // Enable audio metering
    
    // Create AudioRecorderPlayer instance
    const audioRecorderPlayer = new AudioRecorderPlayer();

    // Load chat history from API
    const loadChatHistory = async () => {
        try {
            console.log('🔄 Loading chat history...');
            
            // Load page 0 (newest messages) - API trả về tin nhắn mới nhất trước
            const history = await aiService.getChatHistory(0, 10);
            
            if (history && history.length > 0) {
                const formattedMessages: Message[] = history.map((msg) => ({
                    id: msg.chat_id?.toString() || `fallback_${Date.now()}_${Math.random()}`,
                    text: msg.message_content || '',
                    isUser: msg.sender_type === 'USER',
                    timestamp: new Date(msg.timestamp || Date.now()),
                }));
                
                // API trả về tin nhắn mới nhất trước, cần reverse để tin nhắn mới nhất ở cuối
                const reversedMessages = formattedMessages.reverse();
                setMessages(reversedMessages);
                setCurrentPage(0);
                setHasMoreMessages(history.length === 10); // Nếu có 10 tin nhắn, có thể còn thêm
                console.log('✅ Chat history loaded:', reversedMessages.length, 'messages');
                
                            // Set flag to scroll to bottom after loading history
            setShouldScrollToBottom(true);
            } else {
                // If no history, don't add any messages, just show welcome message
                setMessages([]);
                setHasMoreMessages(false);
                console.log('✅ No chat history found, will show welcome message');
            }
            
        } catch (error) {
            console.error('❌ Error loading chat history:', error);
            // Fallback to empty messages if history loading fails
            setMessages([]);
            setHasMoreMessages(false);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Auto scroll to bottom only when first loading or when user sends a new message
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
    
    useEffect(() => {
        if (messages.length > 0 && !isLoadingHistory && shouldScrollToBottom) {
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            });
            setShouldScrollToBottom(false); // Reset after scrolling
        }
    }, [messages.length, isLoadingHistory, shouldScrollToBottom]);

    // Lấy user_id và load chat history khi component mount
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                console.log('🔄 === CHATAI SCREEN DEBUG START ===');
                console.log('🔄 Fetching user profile...');
                const userService = UserService.getInstance();
                const userProfile = await userService.getCurrentUserProfile();
                setUserId(userProfile.user_id);
                setUserAvatarUrl(userProfile.avatar_url || userProfile.user_avatar_url || null);
                console.log('✅ User ID loaded successfully:', userProfile.user_id);
                console.log('👤 Full user profile:', JSON.stringify(userProfile, null, 2));
                
                // Load chat history after getting user ID
                await loadChatHistory();
                
            } catch (error) {
                console.error('❌ Error loading user profile:', error);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
                setIsLoadingHistory(false);
            }
        };

        fetchUserId();
        
        // Hide welcome message after 3 seconds
        setTimeout(() => setShowWelcome(false), 3000);
        
        // Keyboard listeners for UI state tracking
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setIsKeyboardVisible(true);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
    }, []);
    
    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (blockTimer) {
                clearInterval(blockTimer);
            }
        };
    }, [blockTimer]);

    // Persist and restore input blocking state across navigation
    useFocusEffect(
        useCallback(() => {
            console.log('🔄 ChatAIScreen focused - checking for persisted state');
            
            // Restore state from route params if available
            const params = route.params as any;
            if (params?.isInputBlocked) {
                console.log('🔒 Restoring blocked input state from navigation params');
                setIsInputBlocked(true);
                setRemainingBlockTime(params.remainingBlockTime || 0);
                
                // If there's remaining time, restart the timer
                if (params.remainingBlockTime && params.remainingBlockTime > 0) {
                    const timer = setInterval(() => {
                        setRemainingBlockTime(prev => {
                            if (prev <= 1) {
                                clearInterval(timer);
                                setIsInputBlocked(false);
                                setBlockTimer(null);
                                                                        console.log('🔓 Input unblocked after timer completion (1 minute 30 seconds)');
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    setBlockTimer(timer);
                }
            }
            
            // Restore suggested items from route params
            if (params?.currentSuggestedWallets) {
                console.log('💼 Restoring suggested wallets from navigation params');
                setCurrentSuggestedWallets(params.currentSuggestedWallets);
            }
            
            if (params?.currentSuggestedBudgets) {
                console.log('💰 Restoring suggested budgets from navigation params');
                setCurrentSuggestedBudgets(params.currentSuggestedBudgets);
            }
        }, [route.params])
    );

    // Persist state when component unmounts
    useEffect(() => {
        return () => {
            console.log('🔄 ChatAIScreen unmounting - persisting state to AsyncStorage');
            
            // Persist state to AsyncStorage for restoration
            const persistState = async () => {
                try {
                    const stateToPersist = {
                        isInputBlocked,
                        remainingBlockTime,
                        currentSuggestedWallets,
                        currentSuggestedBudgets,
                        timestamp: Date.now()
                    };
                    
                    await AsyncStorage.setItem('ChatAI_PersistedState', JSON.stringify(stateToPersist));
                    console.log('💾 State persisted to AsyncStorage');
                } catch (error) {
                    console.error('❌ Failed to persist state:', error);
                }
            };
            
            persistState();
        };
    }, [isInputBlocked, remainingBlockTime, currentSuggestedWallets, currentSuggestedBudgets]);

    // Restore state from AsyncStorage on mount
    useEffect(() => {
        const restoreState = async () => {
            try {
                const persistedState = await AsyncStorage.getItem('ChatAI_PersistedState');
                if (persistedState) {
                    const state = JSON.parse(persistedState);
                    const timeDiff = Date.now() - state.timestamp;
                    
                    // Only restore if state is less than 5 minutes old
                    if (timeDiff < 5 * 60 * 1000) {
                        console.log('🔄 Restoring state from AsyncStorage');
                        
                        if (state.isInputBlocked && state.remainingBlockTime > 0) {
                            setIsInputBlocked(true);
                            setRemainingBlockTime(state.remainingBlockTime);
                            
                            // Restart timer if there's remaining time
                            const timer = setInterval(() => {
                                setRemainingBlockTime(prev => {
                                    if (prev <= 1) {
                                        clearInterval(timer);
                                        setIsInputBlocked(false);
                                        setBlockTimer(null);
                                        setCurrentSuggestedBudgets([]); // Clear suggested budgets when timer expires
                                        // Disable suggestions in the last AI message
                                        setMessages(prev => {
                                            // Tìm message cuối cùng có suggest
                                            const lastIdx = [...prev].reverse().findIndex(m => (m.suggestedWallets && m.suggestedWallets.length > 0) || (m.suggestedBudgets && m.suggestedBudgets.length > 0));
                                            if (lastIdx !== -1) {
                                                const realIdx = prev.length - 1 - lastIdx;
                                                const updated = [...prev];
                                                updated[realIdx] = { ...updated[realIdx], suggestDisabled: true };
                                                return updated;
                                            }
                                            return prev;
                                        });
                                        console.log('🔓 Input unblocked after 1 minute 30 seconds, suggestions disabled');
                                        return 0;
                                    }
                                    return prev - 1;
                                });
                            }, 1000);
                            setBlockTimer(timer);
                        }
                        
                        // If suggestions were active when blocked, add them as a new AI message
                        if (state.currentSuggestedWallets?.length > 0 || state.currentSuggestedBudgets?.length > 0) {
                            const restoredAIMessage: Message = {
                                id: `restored_suggestions_${Date.now()}`, // Unique ID
                                text: state.currentSuggestedWallets?.length > 0 ? 'Vui lòng chọn một ví từ danh sách gợi ý bên dưới:' : 'Vui lòng chọn một ngân sách từ danh sách gợi ý bên dưới:',
                                isUser: false,
                                timestamp: new Date(), // Use current time for restored message
                                suggestedWallets: state.currentSuggestedWallets,
                                suggestedBudgets: state.currentSuggestedBudgets,
                            };
                            // Append this message to the existing messages
                            setMessages(prev => [...prev, restoredAIMessage]);
                            setShouldScrollToBottom(true);
                            console.log('🤖 Added restored AI message with suggestions.');
                        }
                    } else {
                        // Clear old persisted state
                        await AsyncStorage.removeItem('ChatAI_PersistedState');
                        console.log('🗑️ Cleared old persisted state');
                    }
                }
            } catch (error) {
                console.error('❌ Failed to restore state:', error);
            }
        };
        
        restoreState();
    }, []);

    const handleSendMessage = async (messageText?: string) => {
        const textToSend = messageText || inputText.trim();
        
        console.log('📤 === SEND MESSAGE DEBUG START ===');
        console.log('📤 Input text:', textToSend);
        console.log('📤 User ID:', userId);
        console.log('📤 Can send?', textToSend && userId);
        
        if (textToSend && userId) {
            console.log('✅ Conditions met, proceeding to send message');
            
            const userMessage: Message = {
                id: Date.now().toString(),
                text: textToSend,
                isUser: true,
                timestamp: new Date(),
            };
            
            console.log('📝 User message created:', JSON.stringify(userMessage, null, 2));
            setMessages(prev => [...prev, userMessage]);
            
            if (!messageText) {
                setInputText('');
            }
            setIsLoading(true);
            setShowWelcome(false); // Hide welcome message when user sends message
            
            // Dismiss keyboard after sending
            Keyboard.dismiss();
            
            // Set flag to scroll to bottom after sending message
            setShouldScrollToBottom(true);
            
            console.log('🚀 Starting AI request with input:', textToSend);
            
            try {
                // Gửi message tới AI API
                console.log('🤖 Calling aiService.sendMessage...');
                const aiResponse = await aiService.sendMessage(userId, textToSend);
                
                // Support both 'suggested_wallets' and 'suggest_wallet' (for API compatibility)
                const suggestedWallets = aiResponse.suggested_wallets || (aiResponse as any).suggest_wallet || undefined;
                
                // Support suggested budgets - handle alternative field names for API compatibility
                const suggestedBudgets = aiResponse.suggested_budgets || (aiResponse as any).suggest_budget || (aiResponse as any).list_suggested_budgets || undefined;
                
                console.log('✅ AI response received:', aiResponse);
                console.log('📝 AI response structure:', {
                    hasMessage: !!aiResponse.message,
                    messageLength: aiResponse.message?.length,
                    hasSuggestedWallets: !!aiResponse.suggested_wallets || !!(aiResponse as any).suggest_wallet,
                    suggestedWalletsCount: aiResponse.suggested_wallets?.length || (aiResponse as any).suggest_wallet?.length,
                    suggestedWallets,
                    hasSuggestedBudgets: !!aiResponse.suggested_budgets || !!(aiResponse as any).suggest_budget || !!(aiResponse as any).list_suggested_budgets,
                    suggestedBudgetsCount: aiResponse.suggested_budgets?.length || (aiResponse as any).suggest_budget?.length || (aiResponse as any).list_suggested_budgets?.length,
                    suggestedBudgets,
                });
                
                        // Check if suggested wallets are present and block input for 1 minute 30 seconds
        if (suggestedWallets && suggestedWallets.length > 0) {
            console.log('🔒 Blocking input due to suggested wallets');
            setIsInputBlocked(true);
            setRemainingBlockTime(90); // 90 seconds (1 minute 30 seconds)
                    setCurrentSuggestedWallets(suggestedWallets);
                    
                    // Start countdown timer
                    const timer = setInterval(() => {
                        setRemainingBlockTime(prev => {
                            if (prev <= 1) {
                                clearInterval(timer);
                                setIsInputBlocked(false);
                                setBlockTimer(null);
                                setCurrentSuggestedWallets([]); // Clear suggested wallets when timer expires
                                setCurrentSuggestedBudgets([]); // Clear suggested budgets when timer expires
                                // Disable suggestions in the last AI message
                                setMessages(prev => {
                                    // Tìm message cuối cùng có suggest
                                    const lastIdx = [...prev].reverse().findIndex(m => (m.suggestedWallets && m.suggestedWallets.length > 0) || (m.suggestedBudgets && m.suggestedBudgets.length > 0));
                                    if (lastIdx !== -1) {
                                        const realIdx = prev.length - 1 - lastIdx;
                                        const updated = [...prev];
                                        updated[realIdx] = { ...updated[realIdx], suggestDisabled: true };
                                        return updated;
                                    }
                                    return prev;
                                });
                                console.log('🔓 Input unblocked after 1 minute 30 seconds, suggestions disabled');
                                return 0;
                            }
                            return prev - 1;
                        });
                    }, 1000);
                    
                    setBlockTimer(timer);
                }
                
                // Update current suggested budgets
                if (suggestedBudgets && suggestedBudgets.length > 0) {
                    setCurrentSuggestedBudgets(suggestedBudgets);
                }
                
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse.message,
                    isUser: false,
                    timestamp: new Date(),
                    suggestedWallets,
                    suggestedBudgets,
                };
                
                console.log('🤖 AI message created:', JSON.stringify(aiMessage, null, 2));
                setMessages(prev => [...prev, aiMessage]);
                
                // Set flag to scroll to bottom after AI response
                setShouldScrollToBottom(true);
                
                console.log('📤 === SEND MESSAGE SUCCESS ===');
                
            } catch (error) {
                console.error('❌ === SEND MESSAGE ERROR ===');
                console.error('❌ Error sending message to AI:', error);
                console.error('❌ Error type:', typeof error);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
                
                // Hiển thị message lỗi
                const errorMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: 'Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau. 😔',
                    isUser: false,
                    timestamp: new Date(),
                };
                
                console.log('⚠️ Error message created:', JSON.stringify(errorMessage, null, 2));
                setMessages(prev => [...prev, errorMessage]);
                // Set flag to scroll to bottom after error message
                setShouldScrollToBottom(true);
                console.error('❌ === SEND MESSAGE ERROR END ===');
                
            } finally {
                setIsLoading(false);
                console.log('📤 === SEND MESSAGE DEBUG END ===');
            }
        } else {
            console.log('❌ Cannot send message - missing conditions:');
            console.log('   - Input text empty?', !textToSend);
            console.log('   - User ID missing?', !userId);
        }
    };

    const handleSuggestion = (suggestion: string) => {
        setInputText(suggestion);
        setShowWelcome(false);
    };

    const handleWalletSelect = (wallet: SuggestedWallet) => {
        // Unblock input when wallet is selected
        if (isInputBlocked) {
            console.log('🔓 Unblocking input due to wallet selection');
            setIsInputBlocked(false);
            setRemainingBlockTime(0);
            setCurrentSuggestedWallets([]); // Clear suggested wallets when one is selected
            setCurrentSuggestedBudgets([]); // Clear suggested budgets when wallet is selected
            if (blockTimer) {
                clearInterval(blockTimer);
                setBlockTimer(null);
            }
        }
        
        const walletMessage = wallet.name;
        handleSendMessage(walletMessage);
    };

    const handleBudgetSelect = (budget: SuggestedBudget) => {
        let budgetMessage = budget.name;
        
        // Add budget limit information if available
        if (budget.overall_amount_limit !== undefined) {
            budgetMessage += ` (Hạn mức: ${budget.overall_amount_limit.toLocaleString('vi-VN')} ${budget.currency || 'đ'})`;
        }
        
        // Add remaining amount if available
        if (budget.budget_remaining_amount !== undefined) {
            budgetMessage += ` (Còn lại: ${budget.budget_remaining_amount.toLocaleString('vi-VN')} ${budget.currency || 'đ'})`;
        }
        
        // Clear current suggested budgets when one is selected
        setCurrentSuggestedBudgets([]);
        setCurrentSuggestedWallets([]); // Clear suggested wallets when budget is selected
        
        handleSendMessage(budgetMessage);
    };

    // Hàm bắt đầu ghi âm với cấu hình audio tối ưu
    const handleStartRecord = async () => {
        try {
            // Set up recording progress listener
            audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
                console.log('Recording progress:', e.currentPosition, e.currentMetering);
            });

            // Use proper audio configuration for better compatibility
            const result = await audioRecorderPlayer.startRecorder(
                undefined, // Use default path
                audioSet,
                meteringEnabled
            );
            console.log('Start record, file path:', result);
        } catch (err) {
            console.log('Error startRecorder:', err);
            Alert.alert(t('voiceRecording.recordError'));
        }
    };
    // Hàm dừng ghi âm và gửi lên API
    const handleStopRecord = async () => {
        setIsVoiceLoading(true);
        try {
            let result = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            
            // Chuẩn hóa lại đường dẫn (loại bớt dấu / dư thừa)
            if (result && result.startsWith('file:////')) {
                result = result.replace('file:////', 'file:///');
            }
            console.log('Chuẩn hóa file path:', result);

            // Chờ file được ghi ra ổ đĩa
            await new Promise(res => setTimeout(res, 500));

            // Kiểm tra file tồn tại
            if (!result) {
                Alert.alert(t('voiceRecording.fileError'), t('voiceRecording.fileNotFound'));
                return;
            }
            const info = await FileSystem.getInfoAsync(result);
            console.log('File info:', info);
            if (!info.exists) {
                Alert.alert(t('voiceRecording.fileError'), t('voiceRecording.fileNotExist'));
                return;
            }

            // Upload với định dạng AAC cho tương thích tốt hơn
            const formData = new FormData();
            formData.append('file', {
                uri: result,
                name: 'sound.m4a',
                type: 'audio/m4a',
            } as any);
            
            console.log('🎤 Bắt đầu gửi audio lên server...');
            const text = await TranscriptionService.uploadAudio(formData);
            console.log('✅ Nhận diện thành công:', text);
            
            // Tự động gửi tin nhắn sau khi nhận diện thành công
            if (text && text.trim()) {
                handleVoiceResult(text.trim());
            }
        } catch (err: any) {
            console.error('❌ Lỗi nhận diện giọng nói:', err);
            
            // Xử lý các loại lỗi khác nhau
            let errorMessage = t('voiceRecording.recognitionErrorMessage');
            
            if (err.name === 'AbortError' || err.message?.includes('timeout')) {
                errorMessage = t('voiceRecording.timeoutError');
            } else if (err.message?.includes('network')) {
                errorMessage = t('voiceRecording.networkError');
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            Alert.alert(t('voiceRecording.recognitionError'), errorMessage);
        } finally {
            setIsVoiceLoading(false);
        }
    };

    // Load more messages when scrolling up to the top
    const loadMoreMessages = async () => {
        if (!hasMoreMessages || isLoadingMore || !userId || !canLoadMore) {
            console.log('❌ Cannot load more messages:', { hasMoreMessages, isLoadingMore, userId, canLoadMore });
            return;
        }
        
        try {
            setIsLoadingMore(true);
            const nextPage = currentPage + 1;
            console.log('🔄 Loading more messages, current page:', currentPage, 'next page:', nextPage);
            const history = await aiService.getChatHistory(nextPage, 10);
            console.log('📥 API response:', history?.length, 'messages');
            
            if (history && history.length > 0) {
                const formattedMessages: Message[] = history.map((msg) => ({
                    id: msg.chat_id?.toString() || `fallback_${Date.now()}_${Math.random()}`,
                    text: msg.message_content || '',
                    isUser: msg.sender_type === 'USER',
                    timestamp: new Date(msg.timestamp || Date.now()),
                }));
                
                // Reverse the order so newest messages are at the bottom
                const reversedMessages = formattedMessages.reverse();
                
                // Use current scroll position from state
                
                // Add new messages to the beginning of the list, remove duplicates
                setMessages(prev => {
                    const existingIds = new Set(prev.map(msg => msg.id));
                    const newMessages = reversedMessages.filter(msg => !existingIds.has(msg.id));
                    const updatedMessages = [...newMessages, ...prev];
                    
                    // Keep scroll position after adding new messages
                    setTimeout(() => {
                        if (scrollViewRef.current) {
                            // Calculate the height of new messages added
                            const newMessagesHeight = newMessages.length * 120; // Approximate height per message
                            const newScrollY = currentScrollY + newMessagesHeight;
                            scrollViewRef.current.scrollTo({
                                y: newScrollY,
                                animated: false
                            });
                            console.log('📏 Adjusted scroll position:', { currentScrollY, newMessagesHeight, newScrollY });
                        }
                    }, 100);
                    
                    return updatedMessages;
                });
                setCurrentPage(nextPage);
                setHasMoreMessages(history.length === 10);
                console.log('✅ Loaded more messages successfully, new page:', nextPage, 'hasMore:', history.length === 10);
            } else {
                setHasMoreMessages(false);
                console.log('✅ No more messages to load');
            }
            
        } catch (error) {
            console.error('❌ Error loading more messages:', error);
        } finally {
            setIsLoadingMore(false);
            // Reset canLoadMore after a delay to prevent rapid calls
            setTimeout(() => {
                setCanLoadMore(true);
                // Reset lastLoadTriggerY to allow new triggers
                setLastLoadTriggerY(0);
                console.log('✅ Reset canLoadMore to true and lastLoadTriggerY to 0');
            }, 1000);
        }
    };

    const handleVoiceResult = (text: string) => {
        handleSendMessage(text);
        setShowVoiceModal(false);
    };

    const renderMessage = (message: Message) => (
        <View
            key={message.id}
            style={[
                styles.messageRow,
                message.isUser && { flexDirection: 'row-reverse', justifyContent: 'flex-end' },
            ]}
        >
            <Avatar isUser={message.isUser} avatarUrl={message.isUser ? undefined : undefined} />
            <View
                style={[
                    styles.messageContent,
                    message.isUser && { alignItems: 'flex-end' },
                ]}
            >
                <View
                    style={[
                        styles.messageContainer,
                        message.isUser ? styles.userMessage : styles.aiMessage
                    ]}
                >
                    <Text style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.aiMessageText
                    ]}>
                        {message.text}
                    </Text>
                </View>
                {/* Suggested Wallets - Only show if wallets exist */}
                {message.suggestedWallets && message.suggestedWallets.length > 0 && (
                    <SuggestedWallets 
                        wallets={message.suggestedWallets} 
                        onWalletSelect={handleWalletSelect}
                        disabled={!!message.suggestDisabled}
                    />
                )}
                
                {/* Suggested Budgets - Only show if budgets exist */}
                {message.suggestedBudgets && message.suggestedBudgets.length > 0 && (
                    <SuggestedBudgets 
                        budgets={message.suggestedBudgets} 
                        onBudgetSelect={handleBudgetSelect}
                        disabled={!!message.suggestDisabled}
                    />
                )}
                <Text style={[
                    styles.timestamp,
                    message.isUser ? styles.userTimestamp : styles.aiTimestamp
                ]}>
                    {formatRelativeTime(message.timestamp)}
                </Text>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <LinearGradient
                colors={['#f8f9fa', '#e9ecef']}
                style={styles.container}
            >
                <StatusBar 
                    barStyle="dark-content" 
                    backgroundColor="transparent" 
                    translucent={true}
                    animated={true}
                />
                
                {/* Header */}
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <LinearGradient
                        colors={['#1e90ff', '#0066cc']}
                        style={[styles.header, { paddingTop: insets.top + 16 }]}
                    >
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="chevron-left" size={28} color="#FFFFFF" style={{ alignSelf: 'center' }} />
                    </TouchableOpacity>
                    
                    <View style={styles.headerCenter}>
                        <View style={styles.robotIconHeader}>
                            <Icon2 name="robot" size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerTitle}>Seima AI</Text>
                            <Text style={styles.headerSubtitle}>Trợ lý tài chính thông minh</Text>
                        </View>
                    </View>
                </LinearGradient>
                </TouchableWithoutFeedback>

                <View style={styles.chatContainer}>
                    {/* Messages */}
                    <ScrollView 
                        ref={scrollViewRef}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={styles.messagesContent}
                        style={styles.messagesContainer}
                        bounces={true}
                        alwaysBounceVertical={true}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                        automaticallyAdjustKeyboardInsets={true}
                        onScroll={(event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            setCurrentScrollY(offsetY);
                            
                            // Load more messages when scrolling near the top (within 150px)
                            // Also check if we've scrolled up significantly from last trigger
                            const shouldLoad = offsetY <= 2000 && 
                                             hasMoreMessages && 
                                             !isLoadingMore && 
                                             canLoadMore &&
                                             (lastLoadTriggerY === 0 || offsetY < lastLoadTriggerY - 50);
                            
                            if (shouldLoad) {
                                console.log('🔄 Scrolling near top (offsetY:', offsetY, '), loading more messages...');
                                setLastLoadTriggerY(offsetY);
                                setCanLoadMore(false); // Prevent multiple calls
                                loadMoreMessages();
                            }
                        }}
                        scrollEventThrottle={300}
                    >
                        {isLoadingHistory ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#1e90ff" style={{ marginBottom: 16 }} />
                                <Text style={styles.loadingText}>Đang tải lịch sử chat...</Text>
                            </View>
                        ) : (showWelcome && messages.length === 0) ? (
                            <WelcomeMessage />
                        ) : null}
                        
                        {/* Loading more messages indicator */}
                        {isLoadingMore && (
                            <View style={styles.loadingMoreContainer}>
                                <ActivityIndicator size="small" color="#1e90ff" style={{ marginBottom: 8 }} />
                                <Text style={styles.loadingMoreText}>Đang tải thêm tin nhắn...</Text>
                            </View>
                        )}
                        
                        {/* Show indicator when near top and can load more */}
                        {!isLoadingMore && hasMoreMessages && currentScrollY <= 150 && (
                            <View style={styles.loadMoreHintContainer}>
                                <Text style={styles.loadMoreHintText}>⬆️ Kéo lên để xem tin nhắn cũ hơn</Text>
                            </View>
                        )}
                        
                        {messages.map(renderMessage)}
                        
                        {isLoading ? (
                            <View style={styles.messageRow}>
                                <Avatar isUser={false} />
                                <View style={styles.messageContent}>
                                    <View style={[styles.messageContainer, styles.aiMessage, styles.typingMessage]}>
                                        <TypingIndicator />
                                    </View>
                                </View>
                            </View>
                        ) : null}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={[
                        styles.inputContainer, 
                        { 
                            paddingBottom: insets.bottom,
                        }
                    ]}>
                        <LinearGradient
                            colors={['#FFFFFF', '#f8f9fa']}
                            style={styles.inputGradient}
                        >
                            <View style={styles.inputRow}>
                                <View style={styles.inputButtons}>
                                    <TouchableOpacity 
                                        style={styles.inputButton}
                                        onPress={() => setShowVoiceModal(true)}
                                    >
                                        <Icon name="mic" size={20} color="#1e90ff" />
                                    </TouchableOpacity>
                                </View>
                                
                                <View style={styles.textInputContainer}>
                                    <TextInput
                                        ref={inputRef}
                                        style={[
                                            styles.textInput,
                                            isInputBlocked && styles.blockedInput
                                        ]}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        placeholder={isInputBlocked ? `Vui lòng chọn ví gợi ý (${remainingBlockTime}s)` : "Tin nhắn..."}
                                        placeholderTextColor="#8e9aaf"
                                        multiline
                                        maxLength={1000}
                                        editable={!isInputBlocked}
                                        onFocus={() => {
                                            // Set flag to scroll to bottom when input is focused
                                            setShouldScrollToBottom(true);
                                        }}
                                    />
                                    {isInputBlocked && (
                                        <View style={styles.blockedOverlay}>
                                            <Text style={styles.blockedText}>
                                                Vui lòng chọn ví gợi ý ({remainingBlockTime}s)
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.sendButton, 
                                        (!inputText.trim() || isLoading || isInputBlocked) && styles.disabledButton
                                    ]}
                                    onPress={() => handleSendMessage()}
                                    disabled={!inputText.trim() || isLoading || isInputBlocked}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={inputText.trim() && !isLoading && !isInputBlocked ? ['#1e90ff', '#0066cc'] : ['#cbd5e0', '#a0aec0']}
                                        style={styles.sendButtonGradient}
                                    >
                                        <Icon 
                                            name="send" 
                                            size={18} 
                                            color={inputText.trim() && !isLoading && !isInputBlocked ? "#FFFFFF" : "#718096"} 
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
                {/* Voice Recorder Modal */}
                <VoiceRecorderModal
                    visible={showVoiceModal}
                    onClose={() => {
                        setShowVoiceModal(false);
                    }}
                    onResult={handleVoiceResult}
                    isLoading={isVoiceLoading}
                    onStartRecord={handleStartRecord}
                    onStopRecord={handleStopRecord}
                />
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 8,
        shadowColor: '#1e90ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 16,
    },
    robotIconHeader: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerTextContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    headerSubtitle: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
    },
    headerAction: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingTop: 16,
        paddingBottom: 16,
        flexGrow: 1,
    },
    welcomeContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
        marginBottom: 20,
    },
    welcomeGradient: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: 8,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: width * 0.85,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginVertical: 6,
        paddingHorizontal: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        marginBottom: 4,
    },
    userAvatar: {
        backgroundColor: '#1e90ff',
        alignSelf: 'flex-end',
        marginLeft: 8,
        marginRight: 0,
    },
    aiAvatar: {
        backgroundColor: 'transparent',
    },
    aiAvatarGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageContent: {
        flex: 1,
        maxWidth: width * 0.85,
    },
    messageContainer: {
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        flexShrink: 1,
    },
    userMessage: {
        backgroundColor: '#1e90ff',
        borderBottomRightRadius: 8,
        alignSelf: 'flex-end',
    },
    aiMessage: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 8,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    typingMessage: {
        paddingVertical: 16,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        flexWrap: 'wrap',
        flexShrink: 1,
    },
    userMessageText: {
        color: '#FFFFFF',
        fontWeight: '500',
    },
    aiMessageText: {
        color: '#2d3748',
        fontWeight: '400',
    },
    timestamp: {
        fontSize: 11,
        marginTop: 2,
        fontWeight: '500',
    },
    userTimestamp: {
        color: '#a0aec0',
        textAlign: 'right',
    },
    aiTimestamp: {
        color: '#a0aec0',
        textAlign: 'left',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 4,
        gap: 6,
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#1e90ff',
    },
    suggestionsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: 12,
        marginLeft: 4,
    },
    suggestionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
    },
    suggestionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7fafc',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        width: '48%',
        minHeight: 40,
    },
    suggestionText: {
        color: '#4a5568',
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 6,
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    // Suggested Wallets styles
    suggestedWalletsContainer: {
        marginTop: 8,
        marginBottom: 8,
    },
    suggestedWalletsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: 8,
    },
    suggestedWalletsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestedWalletButton: {
        backgroundColor: '#f0f8ff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#1e90ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 100,
        maxWidth: '48%',
    },
    suggestedWalletContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    suggestedWalletName: {
        color: '#1e90ff',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
        flex: 1,
    },
    suggestedWalletBalance: {
        color: '#666',
        fontSize: 11,
        marginTop: 2,
        width: '100%',
        textAlign: 'center',
    },
    // Suggested Budgets styles
    suggestedBudgetsContainer: {
        marginTop: 8,
        marginBottom: 8,
    },
    suggestedBudgetsTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4a5568',
        marginBottom: 8,
    },
    suggestedBudgetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    suggestedBudgetButton: {
        backgroundColor: '#f0fff4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#28a745',
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 100,
        maxWidth: '48%',
    },
    suggestedBudgetContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    suggestedBudgetName: {
        color: '#28a745',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 6,
        flex: 1,
    },
    suggestedBudgetLimit: {
        color: '#666',
        fontSize: 11,
        marginTop: 2,
        width: '100%',
        textAlign: 'center',
    },
    suggestedBudgetRemaining: {
        color: '#28a745',
        fontSize: 11,
        marginTop: 2,
        width: '100%',
        textAlign: 'center',
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 4,
        backgroundColor: 'transparent',
        flexShrink: 0,
    },
    inputGradient: {
        borderRadius: 24,
        padding: 6,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        // Ensure consistent background
        backgroundColor: '#FFFFFF',
    },
    // ✅ SỬA: Thêm dấu phẩy và căn chỉnh thụt lề đúng
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        // Ensure stable height
        minHeight: 40,
    },
    inputButtons: {
        flexDirection: 'row',
        gap: 8,
        width: 40,
    },
    textInputContainer: {
        flex: 1,
        minHeight: 40,
        backgroundColor: '#f7fafc',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        paddingVertical: 0,
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        color: '#2d3748',
        lineHeight: 20,
        textAlignVertical: 'top',
        maxHeight: 100,
        // Ensure consistent text input behavior
        includeFontPadding: false,
    },
    blockedInput: {
        backgroundColor: '#f1f5f9',
        color: '#94a3b8',
    },
    blockedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(241, 245, 249, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    blockedText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
    },
    inputButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f7fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f7fafc',
        // Ensure stable size
        flexShrink: 0,
    },

    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        // Ensure stable size
        flexShrink: 0,
    },
    sendButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
    },
    loadingMoreContainer: {
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
    },
    loadingMoreText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },

    // Voice Modal Styles
    voiceModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    voiceModalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 34, // Safe area for home indicator
        maxHeight: '50%',
        minHeight: 300,
    },
    voiceModalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 20,
        position: 'relative',
    },
    voiceModalHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        position: 'absolute',
        top: 8,
        left: '50%',
        marginLeft: -20,
    },
    voiceModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
    },
    voiceModalCloseButton: {
        position: 'absolute',
        right: 20,
        top: 16,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F7FAFC',
    },
    voiceModalContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    voiceLoadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    voiceLoadingText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        lineHeight: 24,
    },
    voiceLoadingSubtext: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '400',
    },
    voiceRecordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 24,
        elevation: 8,
        shadowColor: '#1E90FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    voiceRecordButtonRecording: {
        elevation: 12,
        shadowColor: '#FF4D4F',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    voiceRecordButtonGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    voiceInstructionText: {
        fontSize: 16,
        color: '#4A5568',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 24,
    },
    voiceRecordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF5F5',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FEB2B2',
    },
    voiceRecordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4D4F',
        marginRight: 8,
    },
    voiceRecordingText: {
        fontSize: 14,
        color: '#FF4D4F',
        fontWeight: '600',
    },
    loadMoreHintContainer: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(30, 144, 255, 0.1)',
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    loadMoreHintText: {
        fontSize: 13,
        color: '#1e90ff',
        fontWeight: '500',
        textAlign: 'center',
    },
});
console.log("styles", styles);
export default ChatAIScreen; 