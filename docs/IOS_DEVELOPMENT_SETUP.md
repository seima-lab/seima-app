# Hướng dẫn chạy app trên iOS (QR Code)

## Cách 1: Sử dụng Expo Go (Recommended)

### Bước 1: Cài đặt Expo Go
1. Mở App Store trên iPhone/iPad
2. Tìm và cài đặt "Expo Go"

### Bước 2: Start Development Server
```bash
npx expo start
```

### Bước 3: Quét QR Code
1. Mở Expo Go app trên iOS
2. Chọn "Scan QR Code"
3. Quét QR code từ terminal hoặc từ trang web (localhost:8081)

### Bước 4: Kết nối
- App sẽ tự động download và chạy trên iOS
- Mọi thay đổi code sẽ tự động reload

## Cách 2: Sử dụng Camera App (iOS 11+)

1. Mở Camera app trên iPhone
2. Quét QR code từ terminal
3. Tap notification "Open in Expo Go"

## Lưu ý với Google Sign-In

⚠️ **Quan trọng**: Với Expo Go, `@react-native-google-signin/google-signin` sẽ KHÔNG hoạt động vì đây là native module.

### Giải pháp 1: Sử dụng Expo AuthSession
```bash
npm install expo-auth-session expo-crypto
```

### Giải pháp 2: Tạo Development Build
```bash
npm install -g eas-cli
eas build --profile development --platform ios
```

## Cấu hình Google Sign-In cho iOS (nếu dùng Development Build)

### Bước 1: Tạo iOS OAuth Client ID
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Vào APIs & Services → Credentials
3. Create Credentials → OAuth Client ID
4. Chọn "iOS"
5. Bundle ID: `com.seimaapp.app`

### Bước 2: Download GoogleService-Info.plist
1. Download file từ Google Cloud Console
2. Thêm vào iOS project (nếu có)

### Bước 3: Cập nhật app.json
```json
{
  "plugins": [
    [
      "@react-native-google-signin/google-signin",
      {
        "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
      }
    ]
  ]
}
```

## Troubleshooting

### QR Code không hiện
- Kiểm tra wifi/network cùng với máy tính
- Restart expo server: `npx expo start --clear`

### App không load
- Kiểm tra console log
- Thử reload: Shake device → Reload

### Google Sign-In không work
- Dùng Expo AuthSession thay vì native module
- Hoặc tạo development build

## Commands hữu ích

```bash
# Start với clear cache
npx expo start --clear

# Start với specific port
npx expo start --port 19000

# Start chỉ cho iOS
npx expo start --ios

# Check dependencies
npx expo doctor
``` 