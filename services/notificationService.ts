import { apiService } from './apiService';
import { NOTIFICATION_ENDPOINTS } from './config';

// Lấy danh sách notification với filter và phân trang
export const getNotifications = (params: {
  page?: number;
  size?: number;
  is_read?: boolean;
  type?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.append('page', params.page.toString());
  if (params.size !== undefined) searchParams.append('size', params.size.toString());
  if (params.is_read !== undefined) searchParams.append('isRead', params.is_read.toString());
  if (params.type) searchParams.append('type', params.type);
  if (params.start_date) searchParams.append('startDate', params.start_date);
  if (params.end_date) searchParams.append('endDate', params.end_date);
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