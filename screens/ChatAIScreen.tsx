import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon2 from 'react-native-vector-icons/FontAwesome5';
import Icon from 'react-native-vector-icons/MaterialIcons';
import '../i18n';
import { useNavigationService } from '../navigation/NavigationService';
import { aiService } from '../services/aiService';
import { UserService } from '../services/userService';

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

const ChatAIScreen = () => {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const navigation = useNavigationService();
    const scrollViewRef = useRef<ScrollView>(null);
    
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Xin chào! Tôi có thể giúp bạn gì về tài chính hôm nay?',
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    
    const [inputText, setInputText] = useState('');
    const [userId, setUserId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const suggestions = [
        'Tôi tiêu 50k cho ăn uống',
        'Tạo ngân sách tháng này', 
        'Xem báo cáo chi tiêu',
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
                    text: 'Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.',
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
    };

    const renderMessage = (message: Message) => (
        <View 
            key={message.id}
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
                        <Icon2 name="robot" size={24} color="#007AFF" />
                    </View>
                    <Text style={styles.headerTitle}>Seima AI Assistant</Text>
                </View>
                
                <View style={styles.headerRight} />
            </View>

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
                >
                    {messages.map(renderMessage)}
                    {isLoading && (
                        <View style={[styles.messageContainer, styles.aiMessage]}>
                            <Text style={[styles.messageText, styles.aiMessageText]}>
                                AI đang trả lời...
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Suggestions */}
                <View style={styles.suggestionsContainer}>
                    {suggestions.map((suggestion, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.suggestionButton}
                            onPress={() => handleSuggestion(suggestion)}
                        >
                            <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Input Area */}
                <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.textInput}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type your message..."
                            placeholderTextColor="#999"
                            multiline
                        />
                        
                        <View style={styles.inputButtons}>
                            <TouchableOpacity style={styles.inputButton}>
                                <Icon name="photo-camera" size={24} color="#007AFF" />
                            </TouchableOpacity>
                            
                            <TouchableOpacity style={styles.inputButton}>
                                <Icon name="mic" size={24} color="#007AFF" />
                            </TouchableOpacity>
                            
                                                    <TouchableOpacity 
                            style={[styles.inputButton, styles.sendButton, isLoading && styles.disabledButton]}
                            onPress={handleSendMessage}
                            disabled={isLoading || !userId}
                        >
                            <Icon name={isLoading ? "hourglass-empty" : "send"} size={24} color="white" />
                        </TouchableOpacity>
                        </View>
                    </View>
                                 </View>
             </KeyboardAvoidingView>
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
        marginLeft: -32, // Offset back button width
    },
    robotIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E8F0FE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    headerRight: {
        width: 32,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messagesContent: {
        paddingVertical: 16,
    },
    messageContainer: {
        marginVertical: 4,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#007AFF',
        borderRadius: 20,
        borderBottomRightRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    aiMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#E8F0FE',
        borderRadius: 20,
        borderBottomLeftRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 20,
    },
    userMessageText: {
        color: 'white',
    },
    aiMessageText: {
        color: '#333',
    },
    suggestionsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    suggestionButton: {
        backgroundColor: '#E8F0FE',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        flex: 1,
    },
    suggestionText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        maxHeight: 100,
        color: '#333',
    },
    inputButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    inputButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {
        backgroundColor: '#007AFF',
    },
    disabledButton: {
        backgroundColor: '#B0B0B0',
    },
});

export default ChatAIScreen; 