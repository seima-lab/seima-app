import { apiService } from './apiService';
import { NOTIFICATION_ENDPOINTS } from './config';

interface Notification {
  notification_id: number;
  title: string;
  message: string;
  notification_type: string;  // hoặc enum, sẽ dùng toString()
  link_to_entity?: string | null;
  is_read: boolean;
  created_at: string;  // đã ở dạng "yyyy-MM-dd HH:mm:ss"
  sent_at?: string | null;
  sender?: {
    user_id: number;
    user_full_name: string;
    user_avatar_url: string;
  } | null;
}
export type { Notification };
// Lấy danh sách notification với filter và phân trang
export const getNotifications = (params: {
  page?: number;
  size?: number;
  isRead?: boolean;
  type?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.size !== undefined) searchParams.append('size', params.size.toString());
  if (params.isRead !== undefined) searchParams.append('isRead', params.isRead.toString());
  if (params.type) searchParams.append('type', params.type);
  if (params.startDate) searchParams.append('startDate', params.startDate);
  if (params.endDate) searchParams.append('endDate', params.endDate);
  const endpoint = searchParams.toString()
    ? `${NOTIFICATION_ENDPOINTS.list}?${searchParams.toString()}`
    : NOTIFICATION_ENDPOINTS.list;
  return apiService.get(endpoint);
};

// Lấy số lượng notification chưa đọc
export const getUnreadCount = () => {
  return apiService.get(NOTIFICATION_ENDPOINTS.unread_count);
};

// Đánh dấu 1 notification là đã đọc
export const markAsRead = (notificationId: number | string) => {
  return apiService.put(NOTIFICATION_ENDPOINTS.mark_as_read(notificationId));
};

// Đánh dấu tất cả notification là đã đọc
export const markAllAsRead = () => {
  return apiService.put(NOTIFICATION_ENDPOINTS.mark_all_as_read);
};

// Xóa 1 notification
export const deleteNotification = (notificationId: number | string) => {
  return apiService.delete(NOTIFICATION_ENDPOINTS.delete(notificationId));
};

// Xóa tất cả notification
export const deleteAllNotifications = () => {
  return apiService.delete(NOTIFICATION_ENDPOINTS.delete_all);
};

// Lấy danh sách notification chưa đọc
export const getUnreadNotifications = (params?: {
  page?: number;
  size?: number;
  type?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return getNotifications({
    ...params,
    isRead: false
  });
}; 