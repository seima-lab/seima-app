import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Keyboard,
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
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { aiService, SuggestedWallet } from '../services/aiService';
import { TranscriptionService } from '../services/transcriptionService';
import { UserService } from '../services/userService';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
    suggestedWallets?: SuggestedWallet[];
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
const SuggestedWallets = ({ wallets, onWalletSelect }: { 
    wallets: SuggestedWallet[], 
    onWalletSelect: (wallet: SuggestedWallet) => void 
}) => {
    // Early return if no wallets or empty array
    if (!wallets || wallets.length === 0) {
        console.log('💼 No suggested wallets to display');
        return null;
    }

    console.log('💼 Rendering suggested wallets:', wallets.length, 'wallets');

    return (
        <View style={styles.suggestedWalletsContainer}>
            <Text style={styles.suggestedWalletsTitle}>💼 Ví được đề xuất:</Text>
            <View style={styles.suggestedWalletsGrid}>
                {wallets.map((wallet) => (
                    <TouchableOpacity
                        key={wallet.id}
                        style={styles.suggestedWalletButton}
                        onPress={() => onWalletSelect(wallet)}
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
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: t('voiceRecording.permissionTitle'),
                        message: t('voiceRecording.permissionMessage'),
                        buttonNeutral: t('voiceRecording.permissionAskLater'),
                        buttonNegative: t('voiceRecording.permissionDeny'),
                        buttonPositive: t('voiceRecording.permissionAllow'),
                    }
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    setHasAudioPermission(true);
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
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    

    // Pagination states
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [canLoadMore, setCanLoadMore] = useState(true);
    const [currentScrollY, setCurrentScrollY] = useState(0);
    
    const inputRef = useRef<TextInput>(null);
    
    const suggestions = [
        { text: 'Tôi tiêu 50k cho ăn uống 🍜', icon: 'restaurant' },
        { text: 'Tạo ngân sách tháng này 💰', icon: 'account-balance-wallet' }, 
        { text: 'Xem báo cáo chi tiêu 📊', icon: 'analytics' },
        { text: 'Tư vấn tiết kiệm 💡', icon: 'lightbulb' },
    ];

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
        
        // Keyboard listeners
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            setIsKeyboardVisible(true);
            setKeyboardHeight(e.endCoordinates.height);
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setIsKeyboardVisible(false);
            setKeyboardHeight(0);
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
        };
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
                
                console.log('✅ AI response received:', aiResponse);
                console.log('📝 AI response structure:', {
                    hasMessage: !!aiResponse.message,
                    messageLength: aiResponse.message?.length,
                    hasSuggestedWallets: !!aiResponse.suggested_wallets || !!(aiResponse as any).suggest_wallet,
                    suggestedWalletsCount: aiResponse.suggested_wallets?.length || (aiResponse as any).suggest_wallet?.length,
                    suggestedWallets,
                });
                
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse.message,
                    isUser: false,
                    timestamp: new Date(),
                    suggestedWallets,
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
        const walletMessage = wallet.name;
        handleSendMessage(walletMessage);
    };

    // Hàm bắt đầu ghi âm (bạn tích hợp recorder của bạn ở đây)
    const handleStartRecord = async () => {
        try {
            const result = await audioRecorderPlayer.startRecorder();
            // audioFilePath.current = result; // This line was removed
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
            // Chuẩn hóa lại đường dẫn (loại bớt dấu / dư thừa)
            if (result && result.startsWith('file:////')) {
                result = result.replace('file:////', 'file:///');
            }
            console.log('Chuẩn hóa file path:', result);

            // Chờ file được ghi ra ổ đĩa
            await new Promise(res => setTimeout(res, 200));

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

            // Upload như cũ, đồng bộ extension và type
            const formData = new FormData();
            formData.append('file', {
                uri: result,
                name: 'sound.mp4', // hoặc sound.m4a nếu đúng định dạng
                type: 'audio/mp4', // hoặc audio/m4a nếu đúng định dạng
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
                console.log('✅ Reset canLoadMore to true');
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
                        automaticallyAdjustKeyboardInsets={false}
                        onScroll={(event) => {
                            const offsetY = event.nativeEvent.contentOffset.y;
                            setCurrentScrollY(offsetY);
                            
                            // Load more messages when scrolling up to the top (within 50px)
                            // Only load if we're at the very top of the content
                            if (offsetY <= 0 && hasMoreMessages && !isLoadingMore && canLoadMore) {
                                console.log('🔄 Scrolling up to top, loading more messages...');
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
                            paddingBottom: insets.bottom + 16,
                            marginBottom: isKeyboardVisible ? keyboardHeight : 0,
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
                                        style={styles.textInput}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        placeholder="Tin nhắn..."
                                        placeholderTextColor="#8e9aaf"
                                        multiline
                                        maxLength={1000}
                                        onFocus={() => {
                                            // Set flag to scroll to bottom when input is focused
                                            setShouldScrollToBottom(true);
                                        }}
                                    />
                                </View>
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.sendButton, 
                                        (!inputText.trim() || isLoading) && styles.disabledButton
                                    ]}
                                    onPress={() => handleSendMessage()}
                                    disabled={!inputText.trim() || isLoading}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={inputText.trim() && !isLoading ? ['#1e90ff', '#0066cc'] : ['#cbd5e0', '#a0aec0']}
                                        style={styles.sendButtonGradient}
                                    >
                                        <Icon 
                                            name="send" 
                                            size={18} 
                                            color={inputText.trim() && !isLoading ? "#FFFFFF" : "#718096"} 
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
        minHeight: '100%',
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
    inputContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: 'transparent',
        flexShrink: 0,
    },
    inputGradient: {
        borderRadius: 24,
        padding: 12,
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
});
console.log("styles", styles);
export default ChatAIScreen; 