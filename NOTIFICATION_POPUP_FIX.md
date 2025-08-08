# Fix Multiple Notification Popups

## 🚨 **Vấn đề gặp phải:**

User báo cáo nhận được **nhiều popup notification** cùng lúc, gây khó chịu và confusing cho UX.

## 🔍 **Nguyên nhân:**

### **1. Duplicate Event Handlers**
- Multiple `messaging().onMessage()` được setup nhiều lần
- Event handlers không được cleanup đúng cách
- Foreground và background handlers conflict với nhau

### **2. Foreground Notifications hiển thị không cần thiết**
- Khi app ở foreground, `messaging().onMessage()` vẫn hiển thị local notification
- User sẽ thấy cả Firebase notification (từ system) + Local notification (từ notifee)
- Đặc biệt với group notifications, không cần hiển thị popup khi app đang mở

### **3. Multiple Navigation Calls**
- Cùng một notification có thể trigger nhiều navigation calls
- Không có debounce mechanism
- Race conditions giữa các event handlers

## ✅ **Giải pháp đã implement:**

### **1. Event Handler Cleanup**
```typescript
useEffect(() => {
  let foregroundMessageUnsubscribe: (() => void) | null = null;
  let backgroundMessageUnsubscribe: (() => void) | null = null;
  let notifeeUnsubscribe: (() => void) | null = null;
  
  // Setup handlers...
  
  // Cleanup function
  return () => {
    if (foregroundMessageUnsubscribe) {
      foregroundMessageUnsubscribe();
    }
    if (backgroundMessageUnsubscribe) {
      backgroundMessageUnsubscribe();
    }
    if (notifeeUnsubscribe) {
      notifeeUnsubscribe();
    }
  };
}, []);
```

### **2. Smart Foreground Notification Handling**
```typescript
messaging().onMessage(async remoteMessage => {
  const notificationData = remoteMessage.data || {};
  const isGroupNotification = notificationData.type === 'group_notification';
  
  if (isGroupNotification) {
    // ❌ DON'T show popup for group notifications in foreground
    console.log('📱 [Foreground] Group notification received - not showing popup');
    return;
  }
  
  // ✅ Show popup for other notifications
  await notifee.displayNotification({...});
});
```

### **3. Navigation Debouncing**
```typescript
// Track last navigation to prevent duplicates
let lastNavigationTime = 0;
let lastNavigationData: string = '';
const NAVIGATION_DEBOUNCE_TIME = 2000; // 2 seconds

export const handleNotificationNavigation = async (data: NotificationData) => {
  const navigationId = `${data.groupId}-${data.type}-${data.senderUserId}`;
  const currentTime = Date.now();
  
  // 🚫 Prevent duplicate navigation
  if (currentTime - lastNavigationTime < NAVIGATION_DEBOUNCE_TIME && 
      lastNavigationData === navigationId) {
    console.log('🚫 Duplicate navigation prevented');
    return;
  }
  
  // Update tracking
  lastNavigationTime = currentTime;
  lastNavigationData = navigationId;
  
  // Proceed with navigation...
};
```

### **4. Proper Handler Organization**
```typescript
const setupMessageHandlers = () => {
  // ✅ Handle initial notification (app killed → opened)
  messaging().getInitialNotification().then(...)
  
  // ✅ Handle foreground messages (smart popup logic)
  foregroundMessageUnsubscribe = messaging().onMessage(...)
  
  // ✅ Handle background → foreground via notification
  backgroundMessageUnsubscribe = messaging().onNotificationOpenedApp(...)
  
  // ✅ Handle local notification tap
  notifeeUnsubscribe = notifee.onBackgroundEvent(...)
};
```

## 📱 **User Experience Now:**

### **App Foreground (đang mở):**
- **Group notifications**: Chỉ hiển thị trong notification bar, KHÔNG popup
- **Other notifications**: Hiển thị popup bình thường
- **Tap notification**: Auto-navigate đến group hoặc notifications screen

### **App Background:**
- **All notifications**: Hiển thị popup đầy đủ
- **Tap notification**: Auto-navigate + bring app to foreground

### **App Killed:**
- **Tap notification**: Launch app + auto-navigate

## 🔧 **Technical Improvements:**

1. **Memory Management**: Proper cleanup của event handlers
2. **Performance**: Tránh duplicate API calls và navigation
3. **Reliability**: Debounce mechanism ngăn race conditions
4. **UX**: Smart popup logic không làm phiền user khi app đang mở

## 🎯 **Result:**

- ✅ **Không còn multiple popups** khi nhận notification
- ✅ **Smart notification display** dựa trên app state và notification type
- ✅ **Smooth navigation** với debounce protection
- ✅ **Clean code structure** với proper cleanup

## 📊 **Testing:**

### **Test Cases:**
1. **Foreground + Group notification** → ❌ No popup, ✅ Navigation on tap
2. **Foreground + Other notification** → ✅ Popup, ✅ Navigation on tap  
3. **Background + Any notification** → ✅ Popup, ✅ Navigation on tap
4. **Multiple rapid notifications** → ✅ Debounced navigation
5. **App restart** → ✅ Handlers properly cleanup and re-setup

### **Console Logs để verify:**
```
📱 [Foreground] Group notification received - not showing popup
🚫 [NotificationNavigation] Duplicate navigation prevented: 8-group_notification-48
✅ [RootLayout] Notification handlers setup complete
🧹 [RootLayout] Cleaning up notification handlers...
```

## 🚀 **Future Enhancements:**

1. **User Preferences**: Cho phép user tùy chỉnh notification behavior
2. **Notification Grouping**: Group multiple notifications từ cùng một source
3. **Smart Timing**: Intelligent timing cho notification display
4. **Analytics**: Track notification engagement metrics

