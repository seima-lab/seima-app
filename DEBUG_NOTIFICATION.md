# Hướng dẫn Debug Notification

## Vấn đề: Thông báo không hiển thị sau khi login

### Bước 1: Kiểm tra Console Log

Khi khởi động app, hãy kiểm tra console log để xem các thông tin sau:

```
📱 Đã tạo notification channel cho Android
✅ Quyền thông báo đã được cấp
📨 FCM Permission status: 1 (hoặc 2)
📨 FCM Token: [token]
🔔 MockNotificationHandler: User đã đăng nhập, chuẩn bị hiển thị thông báo mock...
🔔 MockNotificationHandler: Đặt timer 3 giây để hiển thị thông báo...
🔔 MockNotificationHandler: Bắt đầu kiểm tra trạng thái thông báo mock...
🔔 MockNotificationHandler: Trạng thái thông báo mock: false
🔔 MockNotificationHandler: Chuẩn bị hiển thị thông báo mock...
🔔 MockNotificationHandler: Notification ID: [id]
🔔 Đã hiển thị thông báo mock thành công!
```

### Bước 2: Kiểm tra Permission

#### Android:
1. Vào **Settings > Apps > Seima > Permissions**
2. Đảm bảo **Notifications** được bật
3. Nếu Android 13+: Kiểm tra **POST_NOTIFICATIONS** permission

#### iOS:
1. Vào **Settings > Seima > Notifications**
2. Đảm bảo **Allow Notifications** được bật
3. Kiểm tra các options: **Badges**, **Sounds**, **Banners**

### Bước 3: Test thủ công

1. **Vào Settings screen trong app**
2. **Nhấn "Test Notification Ngay"** - Thông báo test sẽ hiển thị ngay lập tức
3. **Nhấn "Reset thông báo demo"** - Reset để test lại thông báo mock
4. **Khởi động lại app** - Thông báo mock sẽ hiển thị sau 3 giây

### Bước 4: Kiểm tra Device Settings

#### Android:
- **Do Not Disturb**: Tắt chế độ này
- **Battery Optimization**: Thêm app vào danh sách không tối ưu
- **Auto-start**: Cho phép app tự động khởi động

#### iOS:
- **Focus Mode**: Tắt chế độ này
- **Screen Time**: Kiểm tra giới hạn notification
- **Background App Refresh**: Bật cho app

### Bước 5: Debug Code

Nếu vẫn không hoạt động, hãy thêm logging vào `app/_layout.tsx`:

```typescript
// Trong MockNotificationHandler, thêm logging chi tiết hơn
console.log('🔔 Platform:', Platform.OS);
console.log('🔔 Version:', Platform.Version);
console.log('🔔 Is authenticated:', isAuthenticated);

// Trong RootLayout init function
console.log('🔔 Android version check:', Platform.OS === 'android' && Platform.Version >= 33);
console.log('🔔 Permission result:', granted);
```

### Bước 6: Common Issues

#### Issue 1: Permission bị từ chối
**Giải pháp**: 
- Vào Settings > Apps > Seima > Permissions > Notifications > Allow
- Hoặc gỡ cài đặt và cài lại app

#### Issue 2: Channel không được tạo
**Giải pháp**:
- Kiểm tra console log có "Đã tạo notification channel" không
- Nếu không có, có thể do lỗi notifee

#### Issue 3: App đang foreground
**Giải pháp**:
- Thông báo có thể không hiển thị khi app đang mở
- Thử minimize app hoặc chuyển sang app khác

#### Issue 4: Timing issue
**Giải pháp**:
- Tăng delay từ 3 giây lên 5 giây
- Hoặc test bằng button "Test Notification Ngay"

### Bước 7: Test trên Device khác

Nếu vẫn không hoạt động:
1. Test trên device Android khác
2. Test trên iOS device
3. Test trên emulator

### Bước 8: Rebuild App

Nếu tất cả đều không hoạt động:
```bash
# Clean và rebuild
npx expo run:android --clear
# hoặc
npx expo run:ios --clear
```

## Expected Behavior

✅ **Thành công**: Thông báo hiển thị trên notification bar
✅ **Thành công**: Có sound và vibration (Android)
✅ **Thành công**: Có action buttons (Android)
✅ **Thành công**: Chỉ hiển thị một lần duy nhất
✅ **Thành công**: Có thể reset để test lại

## Troubleshooting Checklist

- [ ] Console log hiển thị đầy đủ
- [ ] Permission được cấp
- [ ] Channel được tạo (Android)
- [ ] FCM token được tạo
- [ ] User đã đăng nhập
- [ ] Timer 3 giây đã chạy
- [ ] AsyncStorage hoạt động
- [ ] Device settings cho phép notification
- [ ] App không bị block bởi system 