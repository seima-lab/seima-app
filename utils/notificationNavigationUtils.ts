import { NavigationContainerRef } from '@react-navigation/native';
import { InteractionManager } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { debugLog, NotificationDebugger } from './notificationDebugUtils';

// Reference to navigation container
let navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

// Track last navigation to prevent duplicates
let lastNavigationTime = 0;
let lastNavigationData: string = '';
const NAVIGATION_DEBOUNCE_TIME = 3000; // 3 seconds (increased from 2)

// Track active navigation to prevent concurrent navigations
let isNavigating = false;

export const setNavigationRef = (ref: NavigationContainerRef<RootStackParamList>) => {
  navigationRef = ref;
};

// Interface for notification data
export interface NotificationData {
  senderUserId?: string;
  senderUserName?: string;
  groupId?: string;
  type?: string;
  [key: string]: any;
}

// Function to handle navigation from notification
export const handleNotificationNavigation = async (data: NotificationData) => {
  debugLog(`handleNotificationNavigation called with data: ${JSON.stringify(data)}`);
  console.log('🎯 [NotificationNavigation] Handling notification data:', data);
  
  if (!navigationRef) {
    debugLog('Navigation ref not available');
    console.warn('⚠️ [NotificationNavigation] Navigation ref not available');
    return;
  }
  
  // Prevent concurrent navigations
  if (isNavigating) {
    debugLog('Navigation already in progress, blocked');
    console.log('🚫 [NotificationNavigation] Navigation already in progress, skipping...');
    return;
  }
  
  // Create unique identifier for this navigation request
  const navigationId = `${data.groupId || 'no-group'}-${data.type || 'no-type'}-${data.senderUserId || 'no-user'}`;
  const currentTime = Date.now();
  
  debugLog(`Navigation ID: ${navigationId}, currentTime: ${currentTime}, lastTime: ${lastNavigationTime}`);
  
  // Check if this is a duplicate navigation within debounce time
  if (currentTime - lastNavigationTime < NAVIGATION_DEBOUNCE_TIME && lastNavigationData === navigationId) {
    debugLog(`Duplicate navigation prevented (debounce): ${navigationId}`);
    console.log('🚫 [NotificationNavigation] Duplicate navigation prevented (debounce):', navigationId);
    return;
  }
  
  // Set navigation in progress
  isNavigating = true;
  debugLog('Navigation lock acquired');
  
  // Update last navigation tracking
  lastNavigationTime = currentTime;
  lastNavigationData = navigationId;
  
  try {
    const { groupId, senderUserName, type } = data;
    
    console.log('🧪 [NotificationNavigation] Checking navigation conditions:', {
      type: type,
      groupId: groupId,
      senderUserName: senderUserName,
      typeMatch: type === 'group_notification',
      hasGroupId: !!groupId,
      shouldNavigateToGroup: type === 'group_notification' && groupId
    });
    
    if (type === 'group_notification' && groupId) {
      debugLog(`Group notification detected, creating navigation stack for group: ${groupId}`);
      console.log('🎯 [NotificationNavigation] ✅ CONDITIONS MET - Group notification detected, creating navigation stack for group:', groupId);
      
      // Try alternative approach: Use reset navigation to create proper stack
      console.log('🧭 [NotificationNavigation] Creating navigation stack using reset approach');
      
      try {
        // Option 1: Try using reset to create the proper navigation stack
        console.log('🔄 [NotificationNavigation] Method 1: Reset navigation with stack');
        navigationRef.reset({
          index: 1,
          routes: [
            { 
              name: 'MainTab', 
              params: { initialTab: 'Finance' } 
            },
            { 
              name: 'GroupManagement', 
              params: {
                autoNavigateToGroupId: groupId,
                groupName: senderUserName ? `Group of ${senderUserName}` : undefined
              } 
            }
          ],
        });
        
        debugLog('Successfully reset navigation with GroupManagement stack');
        console.log('✅ [NotificationNavigation] Navigation stack created with reset method');
        
      } catch (resetError) {
        debugLog(`Reset navigation failed: ${resetError}`);
        console.error('🔴 [NotificationNavigation] Reset method failed, trying sequential method');
        
        // Fallback to sequential navigation with InteractionManager
        console.log('🧭 [NotificationNavigation] Fallback: Step 1 - Navigate to Finance tab');
        navigationRef.navigate('MainTab', { initialTab: 'Finance' });
        
        // Use InteractionManager to ensure UI updates complete before next navigation
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            try {
              console.log('🧭 [NotificationNavigation] Fallback: Step 2 - Navigate to GroupManagement');
              console.log('🔍 [NotificationNavigation] Parameters:', {
                autoNavigateToGroupId: groupId,
                groupName: senderUserName ? `Group of ${senderUserName}` : undefined
              });
              
              navigationRef?.navigate('GroupManagement', {
                autoNavigateToGroupId: groupId,
                groupName: senderUserName ? `Group of ${senderUserName}` : undefined
              });
              
              debugLog('Fallback sequential navigation completed');
              console.log('✅ [NotificationNavigation] Fallback navigation completed');
              
            } catch (fallbackError) {
              debugLog(`All navigation methods failed: ${fallbackError}`);
              console.error('🔴 [NotificationNavigation] All navigation methods failed:', fallbackError);
            }
          }, 2000); // 2 second delay for fallback
        });
      }
      
    } else {
      debugLog('Non-group notification, navigating to notifications screen');
      console.log('🔄 [NotificationNavigation] Non-group notification or missing groupId, navigating to notifications');
      
      // For other notification types, navigate to notifications screen
      navigationRef.navigate('Notifications');
    }
  } catch (error) {
    debugLog(`Navigation error: ${error}`);
    console.error('🔴 [NotificationNavigation] Error navigating from notification:', error);
    
    // Fallback navigation to notifications screen
    try {
      navigationRef.navigate('Notifications');
      debugLog('Fallback navigation to Notifications successful');
    } catch (fallbackError) {
      debugLog(`Fallback navigation also failed: ${fallbackError}`);
      console.error('🔴 [NotificationNavigation] Fallback navigation also failed:', fallbackError);
    }
  } finally {
    // Reset navigation flag after a delay
    setTimeout(() => {
      isNavigating = false;
      debugLog('Navigation lock released');
      console.log('🔓 [NotificationNavigation] Navigation lock released');
    }, 1000);
  }
};

// Function to extract notification data from different sources
export const extractNotificationData = (remoteMessage: any): NotificationData => {
  console.log('🔍 [NotificationNavigation] Raw remoteMessage:', JSON.stringify(remoteMessage, null, 2));
  
  // Check different possible data locations
  const data = remoteMessage?.data || remoteMessage?.notification?.data || {};
  
  console.log('📊 [NotificationNavigation] Raw extracted data:', JSON.stringify(data, null, 2));
  
  const extractedData = {
    senderUserId: data.senderUserId,
    senderUserName: data.senderUserName,
    groupId: data.groupId,
    type: data.type,
    ...data
  };
  
  console.log('🎯 [NotificationNavigation] Final extracted notification data:', {
    senderUserId: extractedData.senderUserId,
    senderUserName: extractedData.senderUserName,
    groupId: extractedData.groupId,
    type: extractedData.type,
    hasGroupId: !!extractedData.groupId,
    isGroupNotification: extractedData.type === 'group_notification'
  });
  
  return extractedData;
};

// Function to handle Firebase message navigation
export const handleFirebaseMessageNavigation = (remoteMessage: any) => {
  debugLog('handleFirebaseMessageNavigation called');
  NotificationDebugger.trackHandlerCall('FirebaseMessageNavigation', remoteMessage);
  const data = extractNotificationData(remoteMessage);
  handleNotificationNavigation(data);
};

// Function to handle Notifee event navigation 
export const handleNotifeeEventNavigation = (notificationData: any) => {
  debugLog('handleNotifeeEventNavigation called');
  NotificationDebugger.trackHandlerCall('NotifeeEventNavigation', notificationData);
  const data = extractNotificationData(notificationData);
  handleNotificationNavigation(data);
};

// Function to reset navigation state (for debugging/testing)
export const resetNavigationState = () => {
  lastNavigationTime = 0;
  lastNavigationData = '';
  isNavigating = false;
  console.log('🔄 [NotificationNavigation] Navigation state reset');
};

// Function to get current navigation state (for debugging)
export const getNavigationState = () => {
  return {
    lastNavigationTime,
    lastNavigationData,
    isNavigating,
    timeSinceLastNavigation: Date.now() - lastNavigationTime
  };
};

// Debug helper - make it available globally in development
if (__DEV__) {
  (global as any).debugNotifications = () => {
    console.log('🔍 =================================');
    console.log('📱 NOTIFICATION DEBUG CONSOLE');
    console.log('🔍 =================================');
    console.log('🎯 Navigation State:', getNavigationState());
    console.log('📝 Recent Debug Logs:');
    NotificationDebugger.getLogs().slice(0, 10).forEach((log, i) => {
      console.log(`   ${i + 1}. ${log}`);
    });
    console.log('🔍 =================================');
    console.log('💡 Available commands:');
    console.log('   - debugNotifications() - Show this debug info');
    console.log('   - resetNotificationDebug() - Reset all debug state');
    console.log('   - NotificationDebugger.printDebugInfo() - Detailed debug info');
    console.log('🔍 =================================');
  };
  
  (global as any).resetNotificationDebug = () => {
    resetNavigationState();
    NotificationDebugger.resetAll();
    console.log('🔄 All notification debug state reset!');
  };
}
