# New Forgot Password Flow Implementation

## Overview
The forgot password flow has been updated to use a new 3-step process with separate API endpoints for better security and user experience.

## Flow Steps

### 1. ForgotPasswordScreen
- User enters their email address
- Calls existing API: `api/v1/auth/forgot-password`
- On success, navigates to **VerifyOTPScreen** (new)

### 2. VerifyOTPScreen (NEW)
- User enters the 6-digit OTP code received via email
- Features:
  - Resend OTP functionality with 60-second cooldown
  - Real-time OTP input validation
  - Automatic focus management between input fields
- **Resend API**: `api/v1/auth/resend-forgot-password-otp`
  - Request: `{ "email": "user@example.com" }`
- **Verify API**: `api/v1/auth/verify-forgot-password-otp`
  - Request: `{ "email": "user@example.com", "otp": "123456" }`
  - Response: `{ "verification_token": "abc123..." }`
- On success, navigates to **ResetPasswordScreen** with verification token

### 3. ResetPasswordScreen (UPDATED)
- User enters new password and confirms it
- Now supports both old and new API flows:
  - **New API**: `api/v1/auth/set-new-password-after-verification`
    - Request: `{ "email": "user@example.com", "new_password": "newpass123", "verification_token": "abc123..." }`
  - **Legacy API**: `api/v1/auth/reset-password` (for backward compatibility)
- On success, navigates back to Login screen

## Files Modified/Created

### New Files
- `screens/VerifyOTPScreen.tsx` - New dedicated OTP verification screen
- `FORGOT_PASSWORD_FLOW.md` - This documentation

### Modified Files
- `services/authService.ts` - Added new API methods and types
- `navigation/types.ts` - Added VerifyOTP screen type
- `screens/ForgotPasswordScreen.tsx` - Updated navigation to VerifyOTP
- `screens/ResetPasswordScreen.tsx` - Added support for verification token
- `locales/en.json` - Added new translation strings
- `locales/vi.json` - Added Vietnamese translations

## New API Methods in AuthService

```typescript
// Resend forgot password OTP
async resendForgotPasswordOtp(request: ResendForgotPasswordOtpRequest): Promise<void>

// Verify forgot password OTP
async verifyForgotPasswordOtp(request: VerifyForgotPasswordOtpRequest): Promise<VerifyForgotPasswordOtpResponse>

// Set new password after verification
async setNewPasswordAfterVerification(request: SetNewPasswordAfterVerificationRequest): Promise<void>
```

## New TypeScript Interfaces

```typescript
interface ResendForgotPasswordOtpRequest {
  email: string;
}

interface VerifyForgotPasswordOtpRequest {
  email: string;
  otp: string;
}

interface VerifyForgotPasswordOtpResponse {
  verification_token: string;
}

interface SetNewPasswordAfterVerificationRequest {
  email: string;
  new_password: string;
  verification_token: string;
}
```

## Benefits

1. **Better Security**: Uses verification tokens instead of OTP codes for password reset
2. **Improved UX**: Dedicated OTP screen with better input handling and resend functionality
3. **Backward Compatibility**: Maintains support for old API flow
4. **Error Handling**: Better error messages and user feedback
5. **Internationalization**: Full support for English and Vietnamese

## Testing

To test the new flow:
1. Go to Login screen
2. Tap "Forgot Password"
3. Enter a valid email address
4. Check email for OTP code
5. Enter OTP in the new VerifyOTP screen
6. Use resend functionality if needed
7. Set new password in ResetPassword screen
8. Login with new password 