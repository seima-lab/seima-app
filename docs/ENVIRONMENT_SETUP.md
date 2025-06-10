# 🌍 Environment Variables Setup

## ⚠️ SECURITY NOTICE
**NEVER commit `.env` files to version control!** They contain sensitive information that should be kept secret.

## 📋 Setup Instructions

### 1. Copy the Environment Template
```bash
# Copy the example file
cp .env.example .env

# Edit with your actual values
nano .env  # or use your preferred editor
```

### 2. Required Environment Variables

#### 🔐 Authentication
```bash
# Google OAuth Configuration
GOOGLE_WEB_CLIENT_ID=335208463427-xxx.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=335208463427-xxx.apps.googleusercontent.com
GOOGLE_IOS_CLIENT_ID=335208463427-xxx.apps.googleusercontent.com
```

#### 🌐 API Configuration
```bash
# Development
API_BASE_URL=http://localhost:8080
API_TIMEOUT=10000

# Production
API_BASE_URL=https://api.seima.com
```

#### 📱 App Settings
```bash
APP_NAME=Seima Finance
APP_VERSION=1.0.0
NODE_ENV=development  # or production
```

### 3. How to Get Google Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Enable Google Sign-In API
4. Go to **Credentials** → **Create OAuth 2.0 Client ID**
5. Create separate client IDs for:
   - Web application
   - Android application  
   - iOS application
6. Copy the client IDs to your `.env` file

### 4. Environment-Specific Files

You can create multiple environment files:

```bash
.env.development    # Development settings
.env.staging       # Staging settings  
.env.production    # Production settings
.env.local         # Local overrides (highest priority)
```

### 5. Loading Environment Variables

The app automatically loads environment variables based on:

```typescript
// config/environment.ts
const buildType = process.env.NODE_ENV || 'development';
const customEnv = process.env.APP_ENV;

if (customEnv === 'staging') {
  return ENV.API.STAGING_BASE_URL;
}
```

### 6. Security Best Practices

#### ✅ DO:
- Use `.env.example` as a template
- Add `.env*` to `.gitignore`
- Use different keys for development/production
- Rotate API keys regularly
- Use environment-specific configurations

#### ❌ DON'T:
- Commit `.env` files to Git
- Share API keys in chat/email
- Use production keys in development
- Hard-code sensitive values in source code
- Leave default/example values in production

### 7. Team Collaboration

#### For Team Members:
1. Ask team lead for environment values
2. Never share your `.env` file
3. Use separate development API keys
4. Report any compromised keys immediately

#### For Team Leads:
1. Share environment template
2. Provide development API keys separately
3. Use secret management tools for production
4. Set up CI/CD environment variables

### 8. Production Deployment

#### For Mobile Apps:
```bash
# Build with production environment
NODE_ENV=production npm run build:android
NODE_ENV=production npm run build:ios
```

#### For CI/CD:
```yaml
# GitHub Actions example
env:
  GOOGLE_WEB_CLIENT_ID: ${{ secrets.GOOGLE_WEB_CLIENT_ID }}
  API_BASE_URL: ${{ secrets.API_BASE_URL }}
```

### 9. Troubleshooting

#### Common Issues:
```bash
# Environment not loading?
echo $NODE_ENV

# Check if .env exists
ls -la .env

# Verify file format (no spaces around =)
cat .env | grep "API_BASE_URL"
```

#### Debug Environment:
```typescript
// Add to your code temporarily
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL: process.env.API_BASE_URL,
});
```

## 🆘 Emergency Response

If you accidentally committed `.env`:

1. **Immediately** remove from Git:
   ```bash
   git rm --cached .env
   git commit -m "Remove .env file"
   git push
   ```

2. **Rotate all API keys** in the file
3. **Notify team** about potential compromise
4. **Update production** keys if necessary

## 📞 Support

- Technical issues: Contact dev team
- Security concerns: Contact security team immediately
- Lost API keys: Contact project manager 