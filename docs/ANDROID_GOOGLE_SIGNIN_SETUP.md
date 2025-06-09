# Hướng dẫn cấu hình Google Sign-In cho Android

## Bước 1: Lấy SHA-1 Fingerprint cho Debug

Chạy lệnh sau trong thư mục project:

```bash
cd android
./gradlew signingReport
```

Hoặc trên Windows:

```bash
cd android
gradlew signingReport
```

Tìm SHA-1 fingerprint trong phần `Variant: debug`.

## Bước 2: Tạo Android OAuth Client ID trên Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào APIs & Services → Credentials
4. Click "Create Credentials" → "OAuth Client ID"
5. Chọn Application type: "Android"
6. Điền thông tin:
   - Package name: `com.seimaapp.app` (từ app.json)
   - SHA-1 certificate fingerprint: Paste SHA-1 từ bước 1
7. Click "Create"

## Bước 3: Download google-services.json

1. Sau khi tạo Android OAuth Client ID
2. Download file `google-services.json`
3. Copy file vào `android/app/google-services.json`

## Bước 4: Kiểm tra cấu hình

Đảm bảo Web Client ID trong `api/googleSignIn.ts` đã được cập nhật:
```javascript
webClientId: '335208463427-ugtao25qigd5efinilc2mg29uggcol4o.apps.googleusercontent.com'
```

## Bước 5: Build và chạy app

```bash
# Cài đặt dependencies
npm install

# Chạy app trên Android
npm run android
```

## Lưu ý quan trọng

- **SHA-1 Debug vs Release**: SHA-1 cho debug và release build khác nhau
- **Package Name**: Phải khớp với package name trong app.json
- **Web Client ID**: Luôn dùng Web Client ID, không phải Android Client ID
- **google-services.json**: File này chứa cấu hình Firebase/Google services cho app

## Troubleshooting

### Lỗi "Developer Error"
- Kiểm tra SHA-1 fingerprint đúng chưa
- Kiểm tra package name khớp chưa
- Đảm bảo đã enable Google Sign-In API

### Lỗi "12500"
- Kiểm tra google-services.json đã đặt đúng vị trí
- Clean và rebuild: `cd android && ./gradlew clean` 