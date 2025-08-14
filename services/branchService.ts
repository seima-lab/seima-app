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
    const groupId = params['groupId'] || params['group_id'] || params['groupid'];
    const actionType = params['action'] || params['actionType'];
    const invitedUserId = params['invitedUserId'] || params['invited_user_id'] || params['inviteuserid'];
    const inviterId = params['inviterId'] || params['inviter_id'];

    console.log('[Branch] Deeplink payload:', { actionType, groupId, invitedUserId, inviterId });

    // Determine inviterId undefined robustly (handles '', 'undefined', null)
    const isInviterUndefined =
      inviterId === undefined || inviterId === null || (typeof inviterId === 'string' && inviterId.trim() === '') || String(inviterId).toLowerCase() === 'undefined';

    // CASE A: inviterId is undefined → build stack: GroupManagement → GroupDetail (Overview)
    if (isInviterUndefined && groupId) {
      try {
        const groupIdStr = String(groupId);
        console.log('[Branch] inviterId is undefined. Building stack to GroupManagement → GroupDetail for groupId:', groupIdStr);
        
        // Preferred: create a stack with GroupManagement first, then push GroupDetail (which renders GroupOverviewScreen)
        navigationRef.reset({
          index: 1,
          routes: [
            { name: 'GroupManagement', params: { autoNavigateToGroupId: groupIdStr } },
            { name: 'GroupDetail', params: { groupId: groupIdStr, groupName: '' } },
          ],
        });
        console.log('[Branch] Navigation stack created successfully');
        return;
      } catch (err) {
        console.error('[Branch] Failed to build stack. Falling back to navigate to GroupManagement:', err);
        try {
          navigationRef.navigate('GroupManagement', { autoNavigateToGroupId: String(groupId) });
          return;
        } catch (fallbackErr) {
          console.error('[Branch] Fallback navigation to GroupManagement also failed:', fallbackErr);
        }
      }
    }

    // CASE B: inviterId exists → go to PendingGroupsScreen
    if (!isInviterUndefined) {
      console.log('[Branch] inviterId detected. Navigating to PendingGroupsScreen');
      try {
        navigationRef.navigate('PendingGroups');
        return;
      } catch (err) {
        console.error('[Branch] Navigation to PendingGroups failed:', err);
      }
    }

    // Optional: Fallbacks can be added here if needed for other actions

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
