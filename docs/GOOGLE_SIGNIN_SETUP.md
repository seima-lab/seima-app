# Hướng dẫn cấu hình Google Sign-In

## Bước 1: Tạo OAuth 2.0 Client ID trên Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Enable Google Sign-In API:
   - Vào APIs & Services → Library
   - Tìm "Google Sign-In API" và Enable

4. Tạo OAuth 2.0 Client ID:
   - Vào APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth Client ID"
   - Chọn Application type: "Web application"
   - Thêm Authorized redirect URIs nếu cần
   - Click "Create"

5. Copy Web Client ID (format: xxxxx.apps.googleusercontent.com)

## Bước 2: Cập nhật cấu hình trong code

1. Mở file `api/googleSignIn.ts`
2. Thay thế `YOUR_WEB_CLIENT_ID` với Web Client ID thực của bạn

```typescript
webClientId: 'YOUR_ACTUAL_WEB_CLIENT_ID.apps.googleusercontent.com',
```

## Bước 3: Cấu hình cho iOS (nếu build cho iOS)

1. Tạo OAuth Client ID cho iOS trong Google Cloud Console
2. Download file `GoogleService-Info.plist`
3. Thêm file vào iOS project
4. Cập nhật `iosUrlScheme` trong `app.json`:

```json
"@react-native-google-signin/google-signin",
{
  "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
}
```

## Bước 4: Cấu hình cho Android (nếu build cho Android)

1. Tạo OAuth Client ID cho Android trong Google Cloud Console
2. Cần SHA-1 fingerprint của app
3. Download file `google-services.json`
4. Đặt file vào `android/app/`

## Test idToken

Khi đăng nhập thành công, idToken sẽ được hiển thị trong Alert. Bạn có thể:
- Copy idToken để test với backend
- Verify idToken tại: https://oauth2.googleapis.com/tokeninfo?id_token=YOUR_ID_TOKEN

## Lưu ý quan trọng

- **Web Client ID**: Luôn sử dụng Web Client ID cho React Native, không phải Android/iOS Client ID
- **SHA-1**: Cho Android, cần đúng SHA-1 fingerprint (debug và release khác nhau)
- **Bundle ID**: Cho iOS, Bundle ID phải khớp với cấu hình trên Google Cloud Console 