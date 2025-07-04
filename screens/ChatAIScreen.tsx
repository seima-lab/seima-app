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
import { aiService } from '../services/aiService';
import { UserService } from '../services/userService';

const { width } = Dimensions.get('window');

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
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
                    colors={['#667eea', '#764ba2']}
                    style={styles.aiAvatarGradient}
                >
                    <Icon2 name="robot" size={18} color="#FFFFFF" />
                </LinearGradient>
            )}
        </View>
    );
};

// Welcome message component
const WelcomeMessage = () => {
    return (
        <View style={styles.welcomeContainer}>
            <LinearGradient
                colors={['#667eea', '#764ba2']}
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
    }, []);

    const handleSendMessage = async () => {
        console.log('📤 === SEND MESSAGE DEBUG START ===');
        console.log('📤 Input text:', inputText.trim());
        console.log('📤 User ID:', userId);
        console.log('📤 Can send?', inputText.trim() && userId);
        
        if (inputText.trim() && userId) {
            console.log('✅ Conditions met, proceeding to send message');
            
            const userMessage: Message = {
                id: Date.now().toString(),
                text: inputText,
                isUser: true,
                timestamp: new Date(),
            };
            
            console.log('📝 User message created:', JSON.stringify(userMessage, null, 2));
            setMessages(prev => [...prev, userMessage]);
            
            const currentInput = inputText;
            setInputText('');
            setIsLoading(true);
            setShowWelcome(false);
            
            console.log('🚀 Starting AI request with input:', currentInput);
            
            try {
                // Gửi message tới AI API
                console.log('🤖 Calling aiService.sendMessage...');
                const aiResponse = await aiService.sendMessage(userId, currentInput);
                
                console.log('✅ AI response received:', aiResponse);
                
                const aiMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: aiResponse,
                    isUser: false,
                    timestamp: new Date(),
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
            console.log('   - Input text empty?', !inputText.trim());
            console.log('   - User ID missing?', !userId);
        }
    };

    const handleSuggestion = (suggestion: string) => {
        setInputText(suggestion);
        setShowWelcome(false);
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
                    colors={['#667eea', '#764ba2']}
                    style={[styles.header, { paddingTop: insets.top + 16 }]}
                >
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="arrow-back-ios" size={24} color="#FFFFFF" />
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
                >
                    {/* Messages */}
                    <ScrollView 
                        ref={scrollViewRef}
                        style={styles.messagesContainer}
                        contentContainerStyle={styles.messagesContent}
                        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
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

                    {/* Suggestions */}
                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.suggestionsTitle}>Gợi ý cho bạn:</Text>
                        <View style={styles.suggestionsGrid}>
                            {suggestions.map((suggestion, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.suggestionButton}
                                    onPress={() => handleSuggestion(suggestion.text)}
                                >
                                    <Icon name={suggestion.icon} size={16} color="#667eea" />
                                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Input Area */}
                    <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 16 }]}>
                        <LinearGradient
                            colors={['#FFFFFF', '#f8f9fa']}
                            style={styles.inputGradient}
                        >
                            <View style={styles.inputRow}>
                                <View style={styles.textInputContainer}>
                                    <TextInput
                                        style={styles.textInput}
                                        value={inputText}
                                        onChangeText={setInputText}
                                        placeholder="Nhập tin nhắn của bạn..."
                                        placeholderTextColor="#8e9aaf"
                                        multiline
                                    />
                                </View>
                                
                                <View style={styles.inputButtons}>
                                    <TouchableOpacity style={styles.inputButton}>
                                        <Icon name="photo-camera" size={20} color="#667eea" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={styles.inputButton}>
                                        <Icon name="mic" size={20} color="#667eea" />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[
                                            styles.sendButton, 
                                            (isLoading || !userId || !inputText.trim()) && styles.disabledButton
                                        ]}
                                        onPress={handleSendMessage}
                                        disabled={isLoading || !userId || !inputText.trim()}
                                    >
                                        <LinearGradient
                                            colors={
                                                (isLoading || !userId || !inputText.trim()) 
                                                    ? ['#ccc', '#999'] 
                                                    : ['#667eea', '#764ba2']
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
        shadowColor: '#667eea',
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
        backgroundColor: '#667eea',
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
        maxWidth: width * 0.75,
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
    },
    userMessage: {
        backgroundColor: '#667eea',
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
        backgroundColor: '#667eea',
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
        minHeight: 44,
    },
    suggestionText: {
        color: '#4a5568',
        fontSize: 13,
        fontWeight: '500',
        marginLeft: 6,
        flexShrink: 1,
        flexWrap: 'wrap',
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
        alignItems: 'flex-end',
        gap: 12,
    },
    textInputContainer: {
        flex: 1,
        backgroundColor: '#f7fafc',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        maxHeight: 100,
        color: '#2d3748',
        lineHeight: 22,
    },
    inputButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    inputButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f7fafc',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
    },
    sendButtonGradient: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
});

export default ChatAIScreen; 