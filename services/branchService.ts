// branchService.ts
import branch, { BranchParams } from 'react-native-branch';
import { navigationRef } from '../navigation/NavigationService'; // navigationRef từ project của bạn

type Unsubscribe = () => void;

class BranchService {
  private unsubscribe?: Unsubscribe;

  /**
   * Khởi động Subscription để lắng nghe deeplink
   */
  public init() {
    if (this.unsubscribe) return; // Đã init rồi thì không init lại nữa
    this.unsubscribe = branch.subscribe(({ error, params, uri }) => {
      if (error) {
        console.error('Branch error:', error);
        return;
      }
      console.log('Branch params:', params, 'uri:', uri);

      // Trường hợp đúng là từ Branch link
      if (params && params['+clicked_branch_link'] ) {
        console.log('Branch link opened:', params);
        this.handleDeepLink(params);
      } else if (params && params['+non_branch_link'] && !params['+clicked_branch_link']) {
        // Xử lý nếu là link thông thường
        const url = params['+non_branch_link'];
        console.log('Non-Branch URL opened:', url);
      }
    });
  }

  /**
   * Rẽ nhánh và điều hướng tùy theo params
   */
  private handleDeepLink(params: BranchParams) {
    // Ví dụ params có chứa trường custom tên màn bạn đã set
    const screen = params['_screen'] as string | undefined;
    const id = params['_id'] as string | number | undefined;

    if (screen) {
      // Có thể kèm tham số dạng object nếu cần
      navigationRef.navigate(screen as any, id ? { id } : undefined);
    } else {
      // Nếu không có screen, bạn có thể xử lý mặc định
      navigationRef.navigate('ChatAI');
    }
  }

  /**
   * Hủy subscription khi component unmount
   */
  public cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }
}

export default new BranchService();
