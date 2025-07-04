import { AI_CHAT_ENDPOINTS } from './config';

export interface AIChatMessage {
  user_id: number;
  text_input: string;
}

export interface AIChatResponse {
  message: string;
  status_code: number;
  data?: any;
}

// API response structure
interface ApiAIResponse {
  status_code: number;
  message: string;
  data: {
    response: string;
    timestamp: string;
  };
}

export class AIService {
  private static instance: AIService;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Gửi message tới AI và nhận phản hồi
  async sendMessage(userId: number, textInput: string): Promise<string> {
    try {
      console.log('🤖 === AI SERVICE DEBUG START ===');
      console.log('🤖 Sending message to AI:');
      console.log('   - User ID:', userId);
      console.log('   - Text Input:', textInput);
      console.log('   - Endpoint:', AI_CHAT_ENDPOINTS.SEND_MESSAGE);
      
      const payload: AIChatMessage = {
        user_id: userId,
        text_input: textInput
      };

      console.log('📤 Request payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(AI_CHAT_ENDPOINTS.SEND_MESSAGE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 AI Response received:');
      console.log('   - Status:', response.status);
      console.log('   - Status Text:', response.statusText);
      console.log('   - Headers:', Object.fromEntries(response.headers.entries()));
      console.log('   - Content-Type:', response.headers.get('content-type'));

      const responseText = await response.text();
      console.log('   - Raw Response Text:', responseText);
      console.log('   - Response Text Length:', responseText.length);

      let responseData: any;

      if (responseText.trim() === '') {
        console.log('⚠️ Response is empty');
        return this.getFriendlyErrorMessage('empty_response');
      } else {
        try {
          responseData = JSON.parse(responseText);
          console.log('📥 Parsed Response Data:', JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          console.log('⚠️ Failed to parse JSON, treating as plain text');
          console.log('📝 Using raw text as response:', responseText);
          return this.getFriendlyMessage(responseText);
        }
      }

      console.log('🔄 Processing AI response...');

      // Xử lý response từ API - chỉ có trường message
      if (responseData && responseData.message) {
        console.log('✅ Found response in message field:', responseData.message);
        console.log('🤖 === AI SERVICE DEBUG END ===');
        return responseData.message;
      } else {
        console.log('⚠️ No message field found in response');
        console.log('⚠️ Full response structure:', JSON.stringify(responseData, null, 2));
        console.log('🤖 === AI SERVICE DEBUG END ===');
        return this.getFriendlyErrorMessage('no_message');
      }
    } catch (error) {
      console.error('❌ === AI SERVICE ERROR ===');
      console.error('❌ Error sending AI message:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ === AI SERVICE ERROR END ===');
      
      return this.getFriendlyErrorMessage('network_error');
    }
  }

  // Lấy message thân thiện dựa vào loại lỗi
  private getFriendlyErrorMessage(errorType: 'empty_response' | 'no_message' | 'network_error' | 'timeout' | 'default'): string {
    const friendlyMessages = {
      empty_response: 'Hmm, tôi đang suy nghĩ... Bạn có thể thử hỏi lại không? 🤔',
      no_message: 'Tôi hiểu ý bạn rồi! Hãy để tôi suy nghĩ thêm một chút và trả lời bạn sau nhé 😊',
      network_error: 'Ối, có vẻ như kết nối đang không ổn định. Bạn thử lại sau vài giây nhé! 🙏',
      timeout: 'Tôi đang xử lý hơi lâu... Bạn có thể thử lại không? ⏰',
      default: 'Xin lỗi, tôi đang gặp chút vấn đề kỹ thuật. Bạn hãy thử lại sau nhé! 😅'
    };

    return friendlyMessages[errorType] || friendlyMessages.default;
  }

  // Làm cho response thân thiện hơn
  private getFriendlyMessage(rawText: string): string {
    // Nếu response quá ngắn hoặc lạ, trả về message thân thiện
    if (rawText.length < 10 || /^[0-9\s\-_]+$/.test(rawText)) {
      return 'Tôi đã nhận được thông tin từ bạn rồi! Cảm ơn bạn đã chia sẻ 😊';
    }

    // Nếu response có vẻ hợp lý, trả về như bình thường
    return rawText;
  }
}

export const aiService = AIService.getInstance(); 