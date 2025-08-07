import { getNavigationState, resetNavigationState } from './notificationNavigationUtils';

// Debug utilities for notification issues
export class NotificationDebugger {
  private static logs: string[] = [];
  private static maxLogs = 50;

  static addLog(message: string) {
    const timestamp = new Date().toISOString().substr(11, 12); // HH:mm:ss.SSS
    const logEntry = `${timestamp} - ${message}`;
    
    this.logs.unshift(logEntry);
    
    // Keep only the latest logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    console.log(`🐛 [DEBUG] ${logEntry}`);
  }

  static getLogs(): string[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
    console.log('🧹 [DEBUG] Logs cleared');
  }

  static printDebugInfo() {
    console.log('🔍 [DEBUG] =================================');
    console.log('📱 [DEBUG] NOTIFICATION DEBUG INFO');
    console.log('🔍 [DEBUG] =================================');
    
    // Navigation state
    const navState = getNavigationState();
    console.log('🎯 [DEBUG] Navigation State:', navState);
    
    // Recent logs
    console.log('📝 [DEBUG] Recent Logs (latest first):');
    this.logs.slice(0, 10).forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    console.log('🔍 [DEBUG] =================================');
  }

  static resetAll() {
    this.clearLogs();
    resetNavigationState();
    console.log('🔄 [DEBUG] All debug state reset');
  }

  // Track notification handler calls
  static trackHandlerCall(handlerName: string, data?: any) {
    this.addLog(`Handler called: ${handlerName} ${data ? `with data: ${JSON.stringify(data)}` : ''}`);
  }

  // Track navigation attempts
  static trackNavigationAttempt(action: string, details?: any) {
    this.addLog(`Navigation: ${action} ${details ? `- ${JSON.stringify(details)}` : ''}`);
  }
}

// Make it available globally for debugging in console
if (typeof global !== 'undefined') {
  (global as any).NotificationDebugger = NotificationDebugger;
}

// Export helper functions
export const debugLog = (message: string) => NotificationDebugger.addLog(message);
export const printDebugInfo = () => NotificationDebugger.printDebugInfo();
export const resetDebugState = () => NotificationDebugger.resetAll();
