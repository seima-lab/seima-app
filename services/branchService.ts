// branchService.ts
import { navigationRef } from '@/navigation/NavigationService';
import branch, { BranchParams } from 'react-native-branch';

type Unsubscribe = () => void;

// Hàm chuyển object keys về snake_case
function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  } else if (obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  return obj;
}

class BranchService {
  private unsubscribe?: Unsubscribe;
  private static isInitialized = false;

  /**
   * Khởi động Subscription để lắng nghe deeplink
   */
  public init() {
    if (BranchService.isInitialized) {
      console.log('[BranchService] Already initialized, skipping init');
      return;
    }
    BranchService.isInitialized = true;
    console.log('[BranchService] Initializing Branch subscription');
    this.unsubscribe = branch.subscribe(async ({ error, params, uri }) => {
      if (error) {
        console.error('Branch error:', error);
        return;
      }
      console.log('Branch params:', params, 'uri:', uri);
      if (params && params['+clicked_branch_link'] ) {
        console.log('Branch link opened:', params);
        await this.handleDeepLink(params);
      } else if (params && params['+non_branch_link'] && !params['+clicked_branch_link']) {
        const url = params['+non_branch_link'];
        console.log('Non-Branch URL opened:', url);
      }
    });
  }

  /**
   * Rẽ nhánh và điều hướng tùy theo params
   */
  private async handleDeepLink(params: BranchParams) {
    // Lấy các trường từ payload deeplink
    const groupId = params['groupId'] || params['group_id'];
    const actionType = params['action'] || params['actionType'];
    const invitedUserId = params['invitedUserId'] || params['invited_user_id'];
    const inviterId = params['inviterId'] || params['inviter_id'];

    console.log('[Branch] Deeplink payload:', { actionType, groupId, invitedUserId, inviterId });

    // 🚨 NEW LOGIC: Navigate directly to PendingGroupsScreen instead of calling API
    if (groupId || actionType) {
      console.log('[Branch] Navigating to PendingGroupsScreen for deeplink');
      
      try {
        // Navigate directly to PendingGroupsScreen
        navigationRef.navigate('PendingGroups');
        console.log('[Branch] Successfully navigated to PendingGroupsScreen');
      } catch (err) {
        console.error('[Branch] Navigation error:', err);
      }
    }

    // Điều hướng như cũ nếu cần
   
  }

  /**
   * Hủy subscription khi component unmount
   */
  public cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
      BranchService.isInitialized = false;
      console.log('[BranchService] Cleaned up Branch subscription');
    }
  }
}

    export default new BranchService();
