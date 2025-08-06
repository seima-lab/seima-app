import { WALLET_ENDPOINTS } from './config';
import { secureApiService } from './secureApiService';

/**
 * Wallet Service for managing user wallets
 * 
 * Updated to work with new Java API that uses authentication to identify current user
 * No need to pass userId in URLs - backend gets user from JWT token
 * 
 * Usage Examples:
 * 
 * // Get all wallets for current user
 * const wallets = await walletService.getAllWallets();
 * 
 * // Create a new wallet
 * const newWallet = await walletService.createWallet({
 *   walletName: "My Cash Wallet",
 *   balance: 1000000,
 *   walletTypeId: 1,
 *   isDefault: true,
 *   description: "Main cash wallet"
 * });
 * 
 * // Get default wallet
 * const defaultWallet = await walletService.getDefaultWallet();
 * 
 * // Get total balance
 * const totalBalance = await walletService.getTotalBalance();
 * 
 * All methods automatically include Authorization header from stored JWT token
 * and handle token refresh if needed.
 */

// Request interface for creating/updating wallets - matches Java DTO
export interface CreateWalletRequest {
  wallet_name: string; // @NotBlank - required
  balance: number; // @NotNull @Min(0) - required, cannot be negative
  wallet_type_id: number; // @NotNull - required
  is_default?: boolean; // optional, default false
  exclude_from_total?: boolean; // optional, default false
  bank_name?: string; // optional
  icon_url?: string; // optional
  currency_code?: string; // optional
  initial_balance?: number; // optional
}

// Response interface matching the backend WalletResponse
export interface WalletResponse {
  id: number;
  user_id?: number;
  wallet_name: string;
  wallet_type_id?: number;
  wallet_type_name?: string; // Type name for display
  balance?: number;
  current_balance: number;
  initial_balance?: number;
  description?: string;
  is_default: boolean;
  is_active?: boolean;
  is_delete?: boolean;
  exclude_from_total?: boolean;
  bank_name?: string;
  icon_url?: string;
  created_at?: string;
  updated_at?: string;
}

export class WalletService {
  private static instance: WalletService;
  private baseUrl = WALLET_ENDPOINTS.LIST;
  private _shouldRefresh = false; // Flag to indicate when wallets should be refreshed

  public static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Mark that wallets should be refreshed on next access
   */
  markForRefresh(): void {
    this._shouldRefresh = true;
    console.log('🔄 WalletService marked for refresh');
  }

  /**
   * Check if wallets should be refreshed
   */
  shouldRefresh(): boolean {
    return this._shouldRefresh;
  }

  /**
   * Clear the refresh flag
   */
  clearRefreshFlag(): void {
    this._shouldRefresh = false;
  }

  /**
   * Get all wallets for the current authenticated user
   * GET /api/v1/wallets
   */
  async getAllWallets(): Promise<WalletResponse[]> {
    try {
      console.log('🔄 Getting all wallets for current user');
      
      const data = await secureApiService.makeAuthenticatedRequest<WalletResponse[]>(
        this.baseUrl, 
        'GET'
      );
      
      console.log('✅ Wallets retrieved successfully:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Failed to get wallets:', error);
      throw new Error(error.message || 'Failed to get wallets');
    }
  }

  /**
   * Get a specific wallet by ID for the current user
   * GET /api/v1/wallets/{id}
   */
  async getWallet(walletId: number): Promise<WalletResponse> {
    try {
      console.log('🔄 Getting wallet:', walletId);
      
      const data = await secureApiService.makeAuthenticatedRequest<WalletResponse>(
        WALLET_ENDPOINTS.GET_BY_ID(walletId.toString()),
        'GET'
      );
      
      console.log('✅ Wallet retrieved successfully:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Failed to get wallet:', error);
      throw new Error(error.message || 'Failed to get wallet');
    }
  }

  /**
   * Create a new wallet for the current user
   * POST /api/v1/wallets
   */
  async createWallet(request: CreateWalletRequest): Promise<WalletResponse> {
    try {
      console.log('🔄 Creating wallet:', request);
      
      const data = await secureApiService.makeAuthenticatedRequest<WalletResponse>(
        WALLET_ENDPOINTS.CREATE,
        'POST',
        request
      );
      
      console.log('✅ Wallet created successfully:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Failed to create wallet:', error);
      throw new Error(error.message || 'Failed to create wallet');
    }
  }

  /**
   * Update a wallet for the current user
   * PUT /api/v1/wallets/{id}
   */
  async updateWallet(walletId: number, request: CreateWalletRequest): Promise<WalletResponse> {
    try {
      console.log('🔄 Updating wallet:', walletId, request);
      
      const data = await secureApiService.makeAuthenticatedRequest<WalletResponse>(
        WALLET_ENDPOINTS.UPDATE(walletId.toString()),
        'PUT',
        request
      );
      
      console.log('✅ Wallet updated successfully:', data);
      return data;
      
    } catch (error: any) {
      console.error('❌ Failed to update wallet:', error);
      throw new Error(error.message || 'Failed to update wallet');
    }
  }

  /**
   * Delete a wallet for the current user
   * DELETE /api/v1/wallets/{id}
   */
  async deleteWallet(walletId: number): Promise<void> {
    try {
      console.log('🔄 Deleting wallet:', walletId);
      
      const result = await secureApiService.makeAuthenticatedRequest<void>(
        WALLET_ENDPOINTS.DELETE(walletId.toString()),
        'DELETE'
      );
      
      console.log('✅ Wallet deleted successfully, result:', result);
      
    } catch (error: any) {
      console.error('❌ Failed to delete wallet:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error(error.message || 'Failed to delete wallet');
    }
  }

  /**
   * Get user's default wallet
   */
  async getDefaultWallet(): Promise<WalletResponse | null> {
    try {
      const wallets = await this.getAllWallets();
      const defaultWallet = wallets.find(wallet => wallet.is_default);
      return defaultWallet || null;
    } catch (error: any) {
      console.error('❌ Failed to get default wallet:', error);
      throw new Error(error.message || 'Failed to get default wallet');
    }
  }

  /**
   * Get wallets by type for current user
   */
  async getWalletsByType(walletTypeId: number): Promise<WalletResponse[]> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.filter(wallet => wallet.wallet_type_id === walletTypeId);
    } catch (error: any) {
      console.error('❌ Failed to get wallets by type:', error);
      throw new Error(error.message || 'Failed to get wallets by type');
    }
  }

  /**
   * Get active wallets only for current user
   */
  async getActiveWallets(): Promise<WalletResponse[]> {
    try {
      const wallets = await this.getAllWallets();
      return wallets.filter(wallet => wallet.is_active);
    } catch (error: any) {
      console.error('❌ Failed to get active wallets:', error);
      throw new Error(error.message || 'Failed to get active wallets');
    }
  }

  /**
   * Get total balance from all wallets (excluding those marked as exclude_from_total)
   */
  async getTotalBalance(): Promise<number> {
    try {
      const wallets = await this.getAllWallets();
      const includedWallets = wallets.filter(wallet => 
        wallet.is_active && !wallet.exclude_from_total
      );
      
      return includedWallets.reduce((total, wallet) => {
        return total + (wallet.current_balance || 0);
      }, 0);
      
    } catch (error: any) {
      console.error('❌ Failed to get total balance:', error);
      throw new Error(error.message || 'Failed to get total balance');
    }
  }
}

// Export singleton instance
export const walletService = WalletService.getInstance(); 