# Fix Multiple Notification Popups - Version 2

## 🚨 **Vấn đề:** User báo cáo vẫn nhận được **8 popup giống nhau**

Sau fix đầu tiên, user vẫn gặp vấn đề multiple popups, cho thấy cần giải pháp mạnh hơn.

## 🔍 **Root Cause Analysis:**

### **1. Handler Re-initialization**
- `useEffect` trong `RootLayout` chạy mỗi khi component re-render
- Mỗi lần chạy lại setup tất cả handlers mà **không cleanup handlers cũ**
- Dẫn đến có thể có 8+ handlers cùng chạy cho 1 notification

### **2. No Global State Protection**
- Không có mechanism để prevent multiple handler setups
- Component lifecycle có thể gây multiple mount/unmount

### **3. Race Conditions**
- Multiple handlers call `handleNotificationNavigation` đồng thời
- Navigation debouncing chưa đủ mạnh

## ✅ **Advanced Solutions Implemented:**

### **1. Global Handler Initialization Flag**
```typescript
// Global flag to prevent multiple handler setups
let handlersInitialized = false;

useEffect(() => {
  // Prevent multiple initialization
  if (handlersInitialized) {
    console.log('🚫 Handlers already initialized, skipping...');
    return;
  }
  
  // Setup handlers...
  
  // Mark as initialized
  handlersInitialized = true;
  
  return () => {
    // Reset on cleanup
    handlersInitialized = false;
  };
}, []);
```

### **2. Enhanced Navigation Locking**
```typescript
// Track last navigation to prevent duplicates
let lastNavigationTime = 0;
let lastNavigationData: string = '';
const NAVIGATION_DEBOUNCE_TIME = 3000; // Increased to 3 seconds

// Track active navigation to prevent concurrent navigations
let isNavigating = false;

export const handleNotificationNavigation = async (data: NotificationData) => {
  // Prevent concurrent navigations
  if (isNavigating) {
    console.log('🚫 Navigation already in progress, skipping...');
    return;
  }
  
  // Enhanced debouncing check
  const navigationId = `${data.groupId}-${data.type}-${data.senderUserId}`;
  if (currentTime - lastNavigationTime < NAVIGATION_DEBOUNCE_TIME && 
      lastNavigationData === navigationId) {
    console.log('🚫 Duplicate navigation prevented (debounce)');
    return;
  }
  
  // Set navigation lock
  isNavigating = true;
  
  try {
    // Navigation logic...
  } finally {
    // Release lock after delay
    setTimeout(() => {
      isNavigating = false;
    }, 1000);
  }
};
```

### **3. Comprehensive Debug System**
```typescript
// Debug utilities for tracking issues
export class NotificationDebugger {
  static addLog(message: string) {
    const timestamp = new Date().toISOString().substr(11, 12);
    const logEntry = `${timestamp} - ${message}`;
    this.logs.unshift(logEntry);
    console.log(`🐛 [DEBUG] ${logEntry}`);
  }
  
  static trackHandlerCall(handlerName: string, data?: any) {
    this.addLog(`Handler called: ${handlerName}`);
  }
}

// Global debug commands (available in dev console)
global.debugNotifications = () => { /* Show debug info */ };
global.resetNotificationDebug = () => { /* Reset all state */ };
```

### **4. Handler ID Tracking**
```typescript
// Add unique handler IDs to track duplicate calls
messaging().onMessage(async remoteMessage => {
  console.log('📩 [onMessage - Foreground] Handler ID:', Date.now());
  // Handler logic...
});

messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('📱 [NotificationOpenedApp] Handler ID:', Date.now());
  // Handler logic...
});
```

### **5. Proper Background Handler Management**
```typescript
// Move background handler inside useEffect for proper lifecycle
const setupMessageHandlers = () => {
  // All handlers inside function for proper cleanup
  
  // Setup background message handler
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('📩 [onBackgroundMessage] Handler ID:', Date.now());
  });
  
  console.log('✅ Notification handlers setup complete');
};
```

## 🎯 **Multi-Layer Protection:**

### **Layer 1: Global Flag**
- Prevent handler re-initialization at component level
- Only allow 1 setup per app session

### **Layer 2: Navigation Lock**
- Prevent concurrent navigation calls
- Enhanced debouncing with longer timeout

### **Layer 3: Handler Tracking**
- Unique IDs for each handler call
- Debug logs to track duplicate handlers

### **Layer 4: Proper Cleanup**
- Cleanup all handlers on component unmount
- Reset global flags for fresh start

## 🔧 **Debug Commands:**

### **In Development Console:**
```javascript
// Show current debug state
debugNotifications()

// Reset all notification state
resetNotificationDebug()

// Get detailed navigation state
getNavigationState()

// View recent debug logs
NotificationDebugger.getLogs()
```

## 📊 **Expected Results:**

### **Before Fix:**
```
📩 [onMessage - Foreground] Handler ID: 1673123456789
📩 [onMessage - Foreground] Handler ID: 1673123456790
📩 [onMessage - Foreground] Handler ID: 1673123456791
... (8 duplicate handlers)
```

### **After Fix:**
```
🚫 [RootLayout] Handlers already initialized, skipping...
📩 [onMessage - Foreground] Handler ID: 1673123456789
🚫 [NotificationNavigation] Navigation already in progress, skipping...
🚫 [NotificationNavigation] Duplicate navigation prevented (debounce)
```

## 🧪 **Testing Strategy:**

### **1. Handler Initialization Test:**
- Open/close app multiple times
- Check console for "Handlers already initialized" message
- Should only see 1 setup per app session

### **2. Multiple Notification Test:**
- Send rapid notifications
- Check for navigation lock messages
- Should only navigate once

### **3. Debug Console Test:**
```javascript
// In dev console
debugNotifications() // Should show current state
resetNotificationDebug() // Reset for fresh test
```

## 🚀 **Rollout Plan:**

1. **Phase 1:** Deploy with debug logging enabled
2. **Phase 2:** Monitor console logs for duplicate handlers
3. **Phase 3:** Fine-tune debounce timing if needed
4. **Phase 4:** Remove verbose debug logs once confirmed working

## 📈 **Success Metrics:**

- ✅ **Handler ID count:** Only 1 unique ID per notification
- ✅ **Navigation lock:** "Navigation already in progress" messages visible
- ✅ **Debounce protection:** "Duplicate navigation prevented" messages
- ✅ **User experience:** Only 1 popup per notification

## 🔮 **Fallback Plan:**

If issues persist, we can:
1. **Singleton Pattern:** Move all notification logic to a separate singleton service
2. **Event Bus:** Use custom event system instead of direct navigation calls
3. **Queue System:** Queue notifications and process them sequentially

---

**🎯 This comprehensive fix should eliminate the 8 popup issue by preventing handler duplication at multiple levels and providing robust debugging tools to track any remaining issues.**

