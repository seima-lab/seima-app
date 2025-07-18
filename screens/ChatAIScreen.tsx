import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { aiService, SuggestedWallet } from '../services/aiService';
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
const Avatar = ({ isUser }: { isUser: boolean }) => {
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

const ChatAIScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    const scrollViewRef = useRef<ScrollView>(null);
    const textInputRef = useRef<TextInput>(null);
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! Tôi có thể giúp bạn gì về tài chính hôm nay? 😊',
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    
    const [inputText, setInputText] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [showExtraButtons, setShowExtraButtons] = useState(true);
    
    const suggestions = [
        { text: 'Tôi tiêu 50k cho ăn uống 🍜', icon: 'restaurant' },
        { text: 'Tạo ngân sách tháng này 💰', icon: 'account-balance-wallet' }, 
        { text: 'Xem báo cáo chi tiêu 📊', icon: 'analytics' },
        { text: 'Tư vấn tiết kiệm 💡', icon: 'lightbulb' },
    ];

    // Lấy user_id khi component mount
    useEffect(() => {
        const fetchUserId = async () => {
            try {
                console.log('🔄 === CHATAI SCREEN DEBUG START ===');
                console.log('🔄 Fetching user profile...');
                const userService = UserService.getInstance();
                const userProfile = await userService.getCurrentUserProfile();
                setUserId(userProfile.user_id);
                console.log('✅ User ID loaded successfully:', userProfile.user_id);
                console.log('👤 Full user profile:', JSON.stringify(userProfile, null, 2));
            } catch (error) {
                console.error('❌ Error loading user profile:', error);
                console.error('❌ Error details:', JSON.stringify(error, null, 2));
            }
        };

        fetchUserId();
        
        // Hide welcome message after 3 seconds
        setTimeout(() => setShowWelcome(false), 3000);
        
        // Listen to keyboard events
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        });

        return () => {
            keyboardDidShowListener?.remove();
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
            setShowWelcome(false);
            
            // Keep input focused after sending message for continuous chatting
            
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

    const renderMessage = (message: Message) => (
        <View key={message.id} style={styles.messageRow}>
            <Avatar isUser={message.isUser} />
            <View style={styles.messageContent}>
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
                    {formatTime(message.timestamp)}
                </Text>
            </View>
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                    
                    <TouchableOpacity style={styles.headerAction}>
                        <Icon name="more-vert" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </LinearGradient>

                <KeyboardAvoidingView 
                    style={styles.chatContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    {/* Messages */}
                    <ScrollView 
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="interactive"
                        maintainVisibleContentPosition={{
                            minIndexForVisible: 0,
                            autoscrollToTopThreshold: 10
                        }}
                    >
                        {showWelcome && <WelcomeMessage />}
                        
                        {messages.map(renderMessage)}
                        
                        {isLoading && (
                            <View style={styles.messageRow}>
                                <Avatar isUser={false} />
                                <View style={styles.messageContent}>
                                    <View style={[styles.messageContainer, styles.aiMessage, styles.typingMessage]}>
                                        <TypingIndicator />
                                    </View>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Suggestions - Temporarily hidden */}
                    {/* <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>Gợi ý cho bạn:</Text>
                        <View style={styles.suggestionsGrid}>
                            {suggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionButton}
                                    onPress={() => handleSuggestion(suggestion.text)}
                                >
                                    <Icon name={suggestion.icon} size={16} color="#1e90ff" />
                                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View> */}

                    {/* Input Area */}
                    <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <LinearGradient
                            colors={['#FFFFFF', '#f8f9fa']}
                            style={styles.inputGradient}
                        >
                            <View style={styles.inputRow}>
                                {showExtraButtons ? (
                                    <View style={styles.inputButtons}>
                                        <TouchableOpacity style={styles.inputButton}>
                                            <Icon name="photo-camera" size={20} color="#1e90ff" />
                                        </TouchableOpacity>
                                        
                                        <TouchableOpacity style={styles.inputButton}>
                                            <Icon name="mic" size={20} color="#1e90ff" />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity 
                                        style={styles.smallArrowButton}
                                        onPress={() => setShowExtraButtons(true)}
                                    >
                                        <Icon name="keyboard-arrow-right" size={16} color="#1e90ff" />
                                    </TouchableOpacity>
                                )}
                                
                                <View style={[
                                    styles.textInputContainer,
                                    !showExtraButtons && styles.expandedInput
                                ]}>
                                    <TextInput
                                        ref={textInputRef}
                                        style={styles.textInput}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        onContentSizeChange={() => {
                                            // Scroll to bottom when input expands
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollToEnd({ animated: true });
                                            }, 100);
                                        }}
                                        onFocus={() => {
                                            setIsInputFocused(true);
                                            setShowExtraButtons(false);
                                            // Scroll to bottom when focusing
                                            setTimeout(() => {
                                                scrollViewRef.current?.scrollToEnd({ animated: true });
                                            }, 300);
                                        }}
                                        onBlur={() => {
                                            setIsInputFocused(false);
                                            setShowExtraButtons(true);
                                        }}
                                        placeholder={showExtraButtons ? "Tin nhắn..." : "Nhập tin nhắn của bạn..."}
                                        placeholderTextColor="#8e9aaf"
                                        multiline
                                    />
                                </View>
                                
                                <TouchableOpacity 
                                    style={[
                                        styles.sendButton, 
                                        (isLoading || !userId || !inputText.trim()) && styles.disabledButton
                                    ]}
                                    onPress={() => handleSendMessage()}
                                    disabled={isLoading || !userId || !inputText.trim()}
                                >
                                    <LinearGradient
                                        colors={
                                            (isLoading || !userId || !inputText.trim()) 
                                                ? ['#ccc', '#999'] 
                                                : ['#1e90ff', '#0066cc']
                                        }
                                        style={styles.sendButtonGradient}
                                    >
                                        <Icon 
                                            name={isLoading ? "hourglass-empty" : "send"} 
                                            size={20} 
                                            color="#FFFFFF" 
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </LinearGradient>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
        paddingVertical: 20,
        paddingBottom: 40,
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
    },
    inputGradient: {
        borderRadius: 24,
        padding: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
        inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    inputButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    textInputContainer: {
        flex: 1,
        minHeight: 40,
        backgroundColor: '#f7fafc',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
    },
    expandedInput: {
        marginLeft: -10,
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 14,
        color: '#2d3748',
        lineHeight: 20,
        textAlignVertical: 'top',
        maxHeight: 100,
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
    },
    smallArrowButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#f7fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f7fafc',
        marginRight: 4,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
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
});

export default ChatAIScreen; 