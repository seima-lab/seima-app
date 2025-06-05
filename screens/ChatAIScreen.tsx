import React, { useRef, useState } from 'react';
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
            text: 'Hello! How can I assist you with your finances today?',
            isUser: false,
            timestamp: new Date(),
        },
        {
            id: '2',
            text: 'I need help setting up a new budget for this month.',
            isUser: true,
            timestamp: new Date(),
        },
        {
            id: '3',
            text: "Sure! Let's start by reviewing your current expenses and income.",
            isUser: false,
            timestamp: new Date(),
        },
    ]);
    
    const [inputText, setInputText] = useState('');
    
    const suggestions = [
        'Suggest 1',
        'Suggest 2', 
        'Suggest 3',
    ];

    const handleSendMessage = () => {
        if (inputText.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                text: inputText,
                isUser: true,
                timestamp: new Date(),
            };
            
            setMessages(prev => [...prev, newMessage]);
            setInputText('');
            
            // Simulate AI response
            setTimeout(() => {
                const aiResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "I understand. Let me help you with that financial advice.",
                    isUser: false,
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, aiResponse]);
            }, 1000);
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
                                style={[styles.inputButton, styles.sendButton]}
                                onPress={handleSendMessage}
                            >
                                <Icon name="send" size={24} color="white" />
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
});

export default ChatAIScreen; 