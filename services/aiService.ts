import { AuthService } from './authService';
import { AI_CHAT_ENDPOINTS } from './config';

export interface AIChatMessage {
  user_id: number;
  text_input: string;
  access_token: string;
}

export interface SuggestedWallet {
  id: number;
  name: string;
  balance?: number;
  currency?: string;
}

export interface SuggestedBudget {
  id: number;
  name: string;
  overall_amount_limit?: number;
  budget_remaining_amount?: number;
  currency?: string;
}

export interface ChatHistoryMessage {
  chat_id: number;
  user_id: number;
  sender_type: 'USER' | 'AI';
  message_content: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  status_code: number;
  message: string;
  data: {
    content: ChatHistoryMessage[];
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    size: number;
  };
}

export interface AIChatResponse {
  message: string;
  suggested_wallets?: SuggestedWallet[];
  suggested_budgets?: SuggestedBudget[];
  yes_or_no?: boolean;
  status_code: number;
  data?: any;
}

// API response structure
interface ApiAIResponse {
  status_code: number;
  message: string;
  suggested_wallets?: SuggestedWallet[];
  suggested_budgets?: SuggestedBudget[];
  yes_or_no?: boolean;
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
  async sendMessage(userId: number, textInput: string): Promise<AIChatResponse> {
    try {
      console.log('🤖 === AI SERVICE DEBUG START ===');
      console.log('🤖 Sending message to AI:');
      console.log('   - User ID:', userId);
      console.log('   - Text Input:', textInput);
      console.log('   - Endpoint:', AI_CHAT_ENDPOINTS.SEND_MESSAGE);
      
      // Lấy access_token từ AuthService
      const authService = AuthService.getInstance();
      const accessToken = await authService.getStoredToken();
      
      if (!accessToken) {
        console.error('❌ No access token available');
        return {
          message: 'Xin lỗi, phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          status_code: 401
        };
      }
      
      const payload: AIChatMessage = {
        user_id: userId,
        text_input: textInput,
        access_token: accessToken
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
        return {
          message: this.getFriendlyErrorMessage('empty_response'),
          status_code: 500
        };
      } else {
        try {
          responseData = JSON.parse(responseText);
          console.log('📥 Parsed Response Data:', JSON.stringify(responseData, null, 2));
        } catch (parseError) {
          console.log('⚠️ Failed to parse JSON, treating as plain text');
          console.log('📝 Using raw text as response:', responseText);
          return {
            message: this.getFriendlyMessage(responseText),
            status_code: 200
          };
        }
      }

      console.log('🔄 Processing AI response...');

      // Xử lý response từ API - có thể có message và suggested_wallets
      // Kiểm tra nếu responseData là array (trường hợp response trả về array)
      let actualResponseData = responseData;
      if (Array.isArray(responseData) && responseData.length > 0) {
        console.log('📦 Response is an array, taking first element');
        actualResponseData = responseData[0];
      }

      if (actualResponseData && actualResponseData.message) {
        console.log('✅ Found response in message field:', actualResponseData.message);
        
        const result: AIChatResponse = {
          message: actualResponseData.message,
          status_code: actualResponseData.status_code || 200
        };

        // Kiểm tra và xử lý suggested_wallets
        if (actualResponseData.suggested_wallets && Array.isArray(actualResponseData.suggested_wallets)) {
          // Giới hạn tối đa 5 phần tử
          result.suggested_wallets = actualResponseData.suggested_wallets.slice(0, 5);
          console.log('💼 Found suggested wallets:', result.suggested_wallets);
        }

        // Kiểm tra và xử lý list_suggested_budgets - handle alternative field names for API compatibility
        const suggestedBudgets = actualResponseData.list_suggested_budgets || actualResponseData.suggest_budget || actualResponseData.suggested_budgets;
        if (suggestedBudgets && Array.isArray(suggestedBudgets)) {
          // Giới hạn tối đa 5 phần tử
          result.suggested_budgets = suggestedBudgets.slice(0, 5);
          console.log('💰 Found suggested budgets:', result.suggested_budgets);
        }

        // Kiểm tra và xử lý yes_or_no field
        if (actualResponseData.yes_or_no !== undefined) {
          result.yes_or_no = actualResponseData.yes_or_no;
          console.log('❓ Found yes_or_no field:', result.yes_or_no);
        }

        console.log('🤖 === AI SERVICE DEBUG END ===');
        return result;
      } else {
        console.log('⚠️ No message field found in response');
        console.log('⚠️ Full response structure:', JSON.stringify(responseData, null, 2));
        console.log('🤖 === AI SERVICE DEBUG END ===');
        return {
          message: this.getFriendlyErrorMessage('no_message'),
          status_code: 500
        };
      }
    } catch (error) {
      console.error('❌ === AI SERVICE ERROR ===');
      console.error('❌ Error sending AI message:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ === AI SERVICE ERROR END ===');
      
      return {
        message: this.getFriendlyErrorMessage('network_error'),
        status_code: 500
      };
    }
  }

  // Lấy lịch sử chat từ API
  async getChatHistory(page: number = 0, size: number = 10): Promise<ChatHistoryMessage[]> {
    try {
      console.log('📚 === CHAT HISTORY DEBUG START ===');
      console.log('📚 Loading chat history:');
      console.log('   - Page:', page);
      console.log('   - Size:', size);
      console.log('   - Endpoint:', AI_CHAT_ENDPOINTS.CHAT_HISTORY);
      console.log('   - Full URL:', `${AI_CHAT_ENDPOINTS.CHAT_HISTORY}?page=${page}&size=${size}`);
      
      // Lấy access_token từ AuthService
      const authService = AuthService.getInstance();
      const accessToken = await authService.getStoredToken();
      
      if (!accessToken) {
        console.error('❌ No access token available');
        return [];
      }
      
      const url = `${AI_CHAT_ENDPOINTS.CHAT_HISTORY}?page=${page}&size=${size}`;
      console.log('📤 Request URL:', url);
      console.log('📤 Access Token:', accessToken.substring(0, 20) + '...');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Chat History Response received:');
      console.log('   - Status:', response.status);
      console.log('   - Status Text:', response.statusText);
      console.log('   - Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        console.error('❌ Chat history request failed:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        return [];
      }

      const responseData: ChatHistoryResponse = await response.json();
      console.log('📥 Parsed Chat History Data:', JSON.stringify(responseData, null, 2));

      if (responseData.data && responseData.data.content && Array.isArray(responseData.data.content)) {
        console.log('✅ Chat history loaded successfully:', responseData.data.content.length, 'messages');
        console.log('📚 === CHAT HISTORY DEBUG END ===');
        return responseData.data.content;
      } else {
        console.log('⚠️ No content found in chat history response');
        console.log('📚 === CHAT HISTORY DEBUG END ===');
        return [];
      }
    } catch (error) {
      console.error('❌ === CHAT HISTORY ERROR ===');
      console.error('❌ Error loading chat history:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ === CHAT HISTORY ERROR END ===');
      
      return [];
    }
  }

  // Xóa toàn bộ lịch sử chat của người dùng
  async deleteChatHistory(): Promise<boolean> {
    try {
      console.log('🗑️ Deleting chat history...');
      console.log('   - Endpoint:', AI_CHAT_ENDPOINTS.CHAT_HISTORY);

      const authService = AuthService.getInstance();
      const accessToken = await authService.getStoredToken();
      if (!accessToken) {
        console.error('❌ No access token available');
        throw new Error('Authentication required');
      }

      const response = await fetch(AI_CHAT_ENDPOINTS.CHAT_HISTORY, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📥 Delete history response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Delete history failed:', errorText);
        throw new Error(`Failed to delete history: ${response.status}`);
      }

      // Try to parse message for logging, ignore errors
      try {
        const data = await response.json();
        console.log('✅ Delete history response:', data);
      } catch (_) {
        // no-op
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting chat history:', error);
      throw error;
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