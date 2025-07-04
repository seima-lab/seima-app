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
      console.log('   - Headers:', response.headers);
      
      // Kiểm tra content type
      const contentType = response.headers.get('content-type');
      console.log('   - Content-Type:', contentType);
      
      // Lấy response text trước
      const responseText = await response.text();
      console.log('   - Raw Response Text:', responseText);
      console.log('   - Response Text Length:', responseText.length);
      
      let responseData;
      if (responseText.trim() === '') {
        console.log('⚠️ Empty response received');
        responseData = { message: 'Webhook trả về response rỗng' };
      } else {
        try {
          responseData = JSON.parse(responseText);
          console.log('   - Parsed Response Data:', JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          console.log('⚠️ JSON parse failed, treating as plain text');
          console.log('⚠️ Parse error:', parseError);
          // Nếu không parse được JSON, coi như text thuần
          responseData = { message: responseText };
        }
      }

      // Xử lý response từ API - chỉ có trường message
      console.log('🔄 Processing AI response...');
      if (responseData && responseData.message) {
        console.log('✅ Found response in message field:', responseData.message);
        console.log('🤖 === AI SERVICE DEBUG END ===');
        return responseData.message;
      } else {
        console.log('⚠️ No message field found in response');
        console.log('⚠️ Full response structure:', JSON.stringify(responseData, null, 2));
        console.log('🤖 === AI SERVICE DEBUG END ===');
        return 'Tôi hiểu yêu cầu của bạn. Hãy để tôi giúp bạn với thông tin tài chính.';
      }
    } catch (error) {
      console.error('❌ === AI SERVICE ERROR ===');
      console.error('❌ Error sending AI message:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ === AI SERVICE ERROR END ===');
      
      // Trả về phản hồi mặc định nếu API lỗi
      return 'Xin lỗi, hiện tại tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau.';
    }
  }
}

export const aiService = AIService.getInstance(); 