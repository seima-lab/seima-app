import { apiService } from './apiService';

// Request interface for creating/updating wallets - matches Java DTO
export interface CreateWalletRequest {
  walletName: string; // @NotBlank - required
  balance: number; // @NotNull @Min(0) - required, cannot be negative
  description?: string; // optional
  walletTypeId: number; // @NotNull - required
  isDefault?: boolean; // optional, default false
  excludeFromTotal?: boolean; // optional, default false
  bankName?: string; // optional
  iconUrl?: string; // optional
}

// Response interface matching the backend WalletResponse
export interface WalletResponse {
  walletId: number;
  userId: number;
  walletName: string;
  walletTypeId: number;
  walletType?: string; // Type name for display
  balance: number;
  currentBalance: number;
  initialBalance: number;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  excludeFromTotal: boolean;
  bankName?: string;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export class WalletService {
  private static instance: WalletService;

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Create a new wallet for a user
   * POST /api/v1/users/{userId}/wallets
   */
  async createWallet(userId: number, request: CreateWalletRequest): Promise<WalletResponse> {
    try {
      console.log('🔄 Creating wallet for user:', userId, request);
      
      const response = await apiService.post<WalletResponse>(
        `/api/v1/users/${userId}/wallets`, 
        request
      );
      
      if (response.data) {
        console.log('✅ Wallet created successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to create wallet');
      
    } catch (error: any) {
      console.error('❌ Failed to create wallet:', error);
      throw new Error(error.message || 'Failed to create wallet');
    }
  }

  /**
   * Get a specific wallet by ID
   * GET /api/v1/users/{userId}/wallets/{id}
   */
  async getWallet(userId: number, walletId: number): Promise<WalletResponse> {
    try {
      console.log('🔄 Getting wallet:', walletId, 'for user:', userId);
      
      const response = await apiService.get<WalletResponse>(
        `/api/v1/users/${userId}/wallets/${walletId}`
      );
      
      if (response.data) {
        console.log('✅ Wallet retrieved successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get wallet');
      
    } catch (error: any) {
      console.error('❌ Failed to get wallet:', error);
      throw new Error(error.message || 'Failed to get wallet');
    }
  }

  /**
   * Get all wallets for a user
   * GET /api/v1/users/{userId}/wallets
   */
  async getAllWallets(userId: number): Promise<WalletResponse[]> {
    try {
      console.log('🔄 Getting all wallets for user:', userId);
      
      const response = await apiService.get<WalletResponse[]>(
        `/api/v1/users/${userId}/wallets`
      );
      
      if (response.data) {
        console.log('✅ Wallets retrieved successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to get wallets');
      
    } catch (error: any) {
      console.error('❌ Failed to get wallets:', error);
      throw new Error(error.message || 'Failed to get wallets');
    }
  }

  /**
   * Update a wallet
   * PUT /api/v1/users/{userId}/wallets/{id}
   */
  async updateWallet(
    userId: number, 
    walletId: number, 
    request: CreateWalletRequest
  ): Promise<WalletResponse> {
    try {
      console.log('🔄 Updating wallet:', walletId, 'for user:', userId, request);
      
      const response = await apiService.put<WalletResponse>(
        `/api/v1/users/${userId}/wallets/${walletId}`, 
        request
      );
      
      if (response.data) {
        console.log('✅ Wallet updated successfully:', response.data);
        return response.data;
      }
      
      throw new Error(response.message || 'Failed to update wallet');
      
    } catch (error: any) {
      console.error('❌ Failed to update wallet:', error);
      throw new Error(error.message || 'Failed to update wallet');
    }
  }

  /**
   * Delete a wallet
   * DELETE /api/v1/users/{userId}/wallets/{id}
   */
  async deleteWallet(userId: number, walletId: number): Promise<void> {
    try {
      console.log('🔄 Deleting wallet:', walletId, 'for user:', userId);
      
      const response = await apiService.delete<void>(
        `/api/v1/users/${userId}/wallets/${walletId}`
      );
      
      console.log('✅ Wallet deleted successfully');
      
    } catch (error: any) {
      console.error('❌ Failed to delete wallet:', error);
      throw new Error(error.message || 'Failed to delete wallet');
    }
  }

  /**
   * Get user's default wallet
   */
  async getDefaultWallet(userId: number): Promise<WalletResponse | null> {
    try {
      const wallets = await this.getAllWallets(userId);
      const defaultWallet = wallets.find(wallet => wallet.isDefault);
      return defaultWallet || null;
    } catch (error: any) {
      console.error('❌ Failed to get default wallet:', error);
      throw new Error(error.message || 'Failed to get default wallet');
    }
  }

  /**
   * Get wallets by type
   */
  async getWalletsByType(userId: number, walletTypeId: number): Promise<WalletResponse[]> {
    try {
      const wallets = await this.getAllWallets(userId);
      return wallets.filter(wallet => wallet.walletTypeId === walletTypeId);
    } catch (error: any) {
      console.error('❌ Failed to get wallets by type:', error);
      throw new Error(error.message || 'Failed to get wallets by type');
    }
  }

  /**
   * Get active wallets only
   */
  async getActiveWallets(userId: number): Promise<WalletResponse[]> {
    try {
      const wallets = await this.getAllWallets(userId);
      return wallets.filter(wallet => wallet.isActive);
    } catch (error: any) {
      console.error('❌ Failed to get active wallets:', error);
      throw new Error(error.message || 'Failed to get active wallets');
    }
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance(); 