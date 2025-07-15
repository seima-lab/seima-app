# Giải thích: Foreground vs Background Notification

## 🔍 **Vấn đề bạn gặp phải:**

### **Khi app đang mở (Foreground):**
- ✅ Thông báo **có hiển thị** trong notification bar (kéo xuống từ trên cùng)
- ❌ Thông báo **không hiển thị popup/banner** trên màn hình
- ❌ Không có sound hoặc vibration rõ ràng

### **Khi app đang chạy nền (Background):**
- ✅ Thông báo **hiển thị popup/banner** đầy đủ
- ✅ Có sound và vibration
- ✅ Hiển thị trên màn hình khóa

## 🤔 **Tại sao lại như vậy?**

### **Lý do thiết kế:**
1. **Tránh làm phiền user**: Khi app đang mở, user đang sử dụng app, không cần popup
2. **Trải nghiệm tốt hơn**: Không bị gián đoạn khi đang sử dụng app
3. **Tiết kiệm pin**: Không cần hiển thị popup khi user đã đang xem app

### **Hành vi mặc định:**
- **Android**: Chỉ hiển thị trong notification bar khi foreground
- **iOS**: Có thể hiển thị banner nhỏ ở trên cùng màn hình

## 🛠️ **Giải pháp đã triển khai:**

### **1. Cải thiện Foreground Notification:**
```typescript
android: {
  importance: 4, // HIGH importance
  showTimestamp: true,
  timestamp: Date.now(),
  sound: 'default',
  vibrationPattern: [300, 500],
}
```

### **2. Thêm Background Test:**
- Button "Test Background" để test notification khi app chạy nền
- Hướng dẫn user minimize app để thấy popup

### **3. Cấu hình iOS:**
```typescript
ios: {
  foregroundPresentationOptions: {
    badge: true,
    sound: true,
    banner: true, // Hiển thị banner nhỏ
    list: true,
  },
  interruptionLevel: 'active',
}
```

## 📱 **Cách test:**

### **Test Foreground (app đang mở):**
1. Mở app và đăng nhập
2. Vào Settings
3. Nhấn "Test Notification Ngay"
4. **Kết quả**: Thông báo hiển thị trong notification bar

### **Test Background (app chạy nền):**
1. Mở app và đăng nhập
2. Vào Settings
3. Nhấn "Test Background"
4. **Minimize app** (nhấn nút Home)
5. Chờ 5 giây
6. **Kết quả**: Thông báo hiển thị popup đầy đủ

### **Test Mock Notification:**
1. Nhấn "Reset thông báo demo"
2. Khởi động lại app
3. **Kết quả**: Thông báo mock hiển thị sau 3 giây

## 🎯 **Kết quả mong đợi:**

### **Foreground (app đang mở):**
- ✅ Thông báo hiển thị trong notification bar
- ✅ Có sound và vibration (nếu được cấu hình)
- ✅ Có action buttons (Android)
- ❌ Không có popup lớn trên màn hình

### **Background (app chạy nền):**
- ✅ Thông báo hiển thị popup đầy đủ
- ✅ Có sound và vibration
- ✅ Hiển thị trên màn hình khóa
- ✅ Có action buttons

## 🔧 **Tùy chỉnh thêm (nếu cần):**

### **Để hiển thị popup ngay cả khi foreground:**
```typescript
// Thêm vào AndroidManifest.xml
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

// Hoặc sử dụng Alert thay vì notification
Alert.alert('Thông báo', 'Nội dung thông báo');
```

### **Để tắt notification khi foreground:**
```typescript
// Kiểm tra app state
import { AppState } from 'react-native';

if (AppState.currentState === 'active') {
  // App đang foreground - không hiển thị notification
  return;
}
```

## 📋 **Checklist kiểm tra:**

### **Foreground Notification:**
- [ ] Thông báo hiển thị trong notification bar
- [ ] Có sound (nếu được cấu hình)
- [ ] Có vibration (Android)
- [ ] Có action buttons (Android)

### **Background Notification:**
- [ ] Thông báo hiển thị popup đầy đủ
- [ ] Có sound và vibration
- [ ] Hiển thị trên màn hình khóa
- [ ] Có thể tap để mở app

### **Mock Notification:**
- [ ] Hiển thị sau 3 giây khi đăng nhập
- [ ] Chỉ hiển thị một lần duy nhất
- [ ] Có thể reset để test lại

## 💡 **Lời khuyên:**

1. **Đây là hành vi bình thường** của notification system
2. **Không cần lo lắng** nếu không thấy popup khi app đang mở
3. **Test background notification** để thấy popup đầy đủ
4. **Sử dụng Alert** nếu muốn hiển thị popup ngay cả khi foreground 