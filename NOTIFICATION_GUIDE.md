# Hướng dẫn sử dụng tính năng Notification

## Tổng quan

Ứng dụng Seima đã được tích hợp tính năng thông báo sử dụng:
- **@notifee/react-native**: Hiển thị thông báo local
- **@react-native-firebase/messaging**: Nhận thông báo từ Firebase Cloud Messaging (FCM)
- **AsyncStorage**: Lưu trữ trạng thái thông báo đã hiển thị

## Tính năng đã triển khai

### 1. Thông báo Mock (Demo)
- **Vị trí**: `app/_layout.tsx` - Component `MockNotificationHandler`
- **Chức năng**: Hiển thị thông báo chào mừng khi user đăng nhập lần đầu
- **Tính năng**: Chỉ hiển thị một lần duy nhất, sau đó sẽ không hiển thị lại
- **Reset**: Có thể reset để hiển thị lại thông báo

### 2. Thông báo từ API
- **Vị trí**: `app/_layout.tsx` - Component `NotificationHandler`
- **Chức năng**: Hiển thị thông báo mới nhất từ API khi app khởi động
- **Tính năng**: Chỉ hiển thị thông báo chưa đọc và chưa hiển thị trước đó

### 3. Context quản lý thông báo
- **Vị trí**: `contexts/NotificationContext.tsx`
- **Chức năng**: Quản lý danh sách thông báo, trạng thái đọc/chưa đọc
- **Tính năng**: Tự động load thông báo khi user đăng nhập, clear khi logout

### 4. Utility functions
- **Vị trí**: `utils/notificationUtils.ts`
- **Chức năng**: Các function helper để quản lý thông báo mock
- **Functions**:
  - `resetMockNotification()`: Reset thông báo mock
  - `isMockNotificationShown()`: Kiểm tra đã hiển thị chưa
  - `markMockNotificationAsShown()`: Đánh dấu đã hiển thị

## Cách sử dụng

### Test thông báo Mock

1. **Khởi động app lần đầu**: Thông báo mock sẽ tự động hiển thị sau 2 giây
2. **Reset để test lại**:
   - Vào Settings screen
   - Tìm section "Thử nghiệm thông báo"
   - Nhấn "Reset thông báo demo"
   - Khởi động lại app để thấy thông báo

### Cấu hình thông báo

#### Android
- Cần cấp quyền POST_NOTIFICATIONS (Android 13+)
- Sử dụng channel "default" cho thông báo
- Có action buttons: "Xem chi tiết" và "Đóng"

#### iOS
- Tự động request permission khi app khởi động
- Hiển thị banner, sound, badge
- Không hỗ trợ action buttons (do limitation của notifee)

### FCM Setup

1. **Đăng ký device**: Tự động khi app khởi động
2. **Request permission**: Tự động request quyền thông báo
3. **Lấy FCM token**: Token được log ra console, cần gửi lên backend

## Cấu trúc code

```
app/_layout.tsx
├── MockNotificationHandler (thông báo demo)
├── NotificationHandler (thông báo từ API)
└── FCM setup

contexts/NotificationContext.tsx
├── Quản lý danh sách thông báo
├── Trạng thái đọc/chưa đọc
└── AsyncStorage persistence

utils/notificationUtils.ts
├── resetMockNotification()
├── isMockNotificationShown()
└── markMockNotificationAsShown()

screens/SettingScreen.tsx
└── UI để reset thông báo mock
```

## Lưu ý quan trọng

1. **AsyncStorage**: Thông báo mock được lưu vĩnh viễn, chỉ reset khi user thao tác
2. **Permission**: App sẽ request quyền thông báo khi khởi động
3. **Timing**: Thông báo mock có delay 2 giây để đảm bảo app load xong
4. **Authentication**: Chỉ hiển thị thông báo khi user đã đăng nhập

## Troubleshooting

### Thông báo không hiển thị
1. Kiểm tra quyền thông báo đã được cấp
2. Kiểm tra console log để xem lỗi
3. Thử reset thông báo mock từ Settings

### Lỗi FCM
1. Kiểm tra Firebase config
2. Kiểm tra FCM token trong console
3. Đảm bảo google-services.json đã được cấu hình đúng

### Lỗi notifee
1. Kiểm tra version compatibility
2. Rebuild app nếu cần
3. Kiểm tra Android channel configuration 