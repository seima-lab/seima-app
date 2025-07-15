# Hướng dẫn Test Background Notification

## 🎯 **Mục đích:**
Test thông báo hiển thị popup khi app đang chạy nền (background)

## 📱 **Cách test:**

### **Bước 1: Mở app và đăng nhập**
1. Khởi động app Seima
2. Đăng nhập vào tài khoản

### **Bước 2: Vào Settings**
1. Vào màn hình Settings
2. Tìm section "Thử nghiệm thông báo"

### **Bước 3: Test Background Thực Sự**
1. **Nhấn button "Test Background Thực Sự"** (màu xanh dương)
2. **Nhấn "Bắt đầu"** trong popup
3. **Ngay lập tức minimize app** (nhấn nút Home)
4. **Chờ 10 giây**
5. **Thông báo sẽ hiển thị popup** trên màn hình

## 🔍 **Kết quả mong đợi:**

### **Khi app đang mở (foreground):**
- ✅ Thông báo hiển thị trong notification bar
- ❌ Không có popup trên màn hình

### **Khi app đang chạy nền (background):**
- ✅ Thông báo hiển thị popup đầy đủ
- ✅ Có sound và vibration
- ✅ Hiển thị trên màn hình khóa
- ✅ Có action buttons: "Mở App" và "Test OK"

## 🧪 **Các loại test có sẵn:**

### **1. Test Notification Ngay** (màu xanh lá)
- Hiển thị thông báo ngay lập tức
- Test khi app đang mở
- Kết quả: Thông báo trong notification bar

### **2. Reset thông báo demo** (màu cam)
- Reset thông báo mock để test lại
- Khởi động lại app để thấy thông báo mock

### **3. Test Background (10s)** (màu tím)
- Delay 10 giây rồi hiển thị thông báo
- Có thể test cả foreground và background

### **4. Test Background Thực Sự** (màu xanh dương)
- **Chuyên dụng cho test background**
- Delay 10 giây
- **Hướng dẫn minimize app**
- **Kết quả: Popup đầy đủ khi app chạy nền**

## ⚠️ **Lưu ý quan trọng:**

### **Để thấy popup:**
1. **Phải minimize app** trước khi thông báo hiển thị
2. **Không được mở app** trong 10 giây delay
3. **Để app chạy nền** để thấy popup

### **Nếu không thấy popup:**
1. Kiểm tra quyền notification trong Settings
2. Tắt Do Not Disturb
3. Kiểm tra Battery Optimization
4. Thử test lại

## 🔧 **Troubleshooting:**

### **Vấn đề: Không thấy popup**
**Giải pháp:**
- Đảm bảo đã minimize app trước khi thông báo hiển thị
- Kiểm tra quyền notification
- Thử test lại

### **Vấn đề: Thông báo chỉ hiển thị trong notification bar**
**Giải pháp:**
- Đây là hành vi bình thường khi app đang mở
- Minimize app để thấy popup

### **Vấn đề: Không có sound/vibration**
**Giải pháp:**
- Kiểm tra âm lượng thiết bị
- Kiểm tra cài đặt notification trong Settings

## 📋 **Checklist test:**

- [ ] App đã đăng nhập
- [ ] Vào Settings screen
- [ ] Nhấn "Test Background Thực Sự"
- [ ] Nhấn "Bắt đầu"
- [ ] Minimize app ngay lập tức
- [ ] Chờ 10 giây
- [ ] Thấy popup notification
- [ ] Có sound và vibration
- [ ] Có action buttons

## 🎉 **Kết quả thành công:**

Khi test thành công, bạn sẽ thấy:
- **Popup notification** hiển thị trên màn hình
- **Sound và vibration**
- **Action buttons**: "Mở App" và "Test OK"
- **Thông báo trên màn hình khóa** (nếu có)

**Điều này chứng minh hệ thống notification hoạt động đúng khi app chạy nền!** 🚀 