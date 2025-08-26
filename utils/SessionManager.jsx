import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { AppState } from 'react-native';

class SessionManager {
  constructor() {
    this.sessionTimeout = 30 * 1000; // 30 seconds for testing (change back to 10 * 60 * 1000 for production)
    this.backgroundTime = null;
    this.appStateSubscription = null;
    this.activityTimer = null;
    this.lastActivityTime = Date.now();
    
    console.log('🔐 SessionManager initialized');
    console.log('⏰ Session timeout set to:', this.sessionTimeout / 1000, 'seconds');
    
    this.initializeAppStateHandler();
  }

  initializeAppStateHandler() {
    console.log('📱 Initializing AppState handler...');
    
    // Get current app state
    const currentState = AppState.currentState;
    console.log('📱 Current AppState:', currentState);
    
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    console.log('📱 AppState listener added successfully');
  }

  handleAppStateChange = async (nextAppState) => {
    console.log('📱 AppState changed to:', nextAppState);
    console.log('⏰ Current time:', new Date().toLocaleTimeString());
    
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App is going to background
      this.backgroundTime = Date.now();
      await this.storeBackgroundTime();
      console.log('🔴 App went to background at:', new Date(this.backgroundTime).toLocaleTimeString());
      console.log('🔴 Background timestamp stored:', this.backgroundTime);
    } else if (nextAppState === 'active') {
      // App is coming to foreground
      const foregroundTime = Date.now();
      console.log('🟢 App came to foreground at:', new Date(foregroundTime).toLocaleTimeString());
      
      if (this.backgroundTime) {
        const timeInBackground = foregroundTime - this.backgroundTime;
        console.log('⏱️ Time in background:', Math.floor(timeInBackground / 1000), 'seconds');
        console.log('⏱️ Session timeout limit:', Math.floor(this.sessionTimeout / 1000), 'seconds');
        
        if (timeInBackground > this.sessionTimeout) {
          console.log('❌ Session expired! Time in background (', Math.floor(timeInBackground / 1000), 's) > timeout (', Math.floor(this.sessionTimeout / 1000), 's)');
          await this.logout();
        } else {
          console.log('✅ Session still valid. Time remaining:', Math.floor((this.sessionTimeout - timeInBackground) / 1000), 'seconds');
        }
      } else {
        console.log('⚠️ No background time found - this might be first app launch');
      }
      
      // Reset background time
      this.backgroundTime = null;
      await this.clearBackgroundTime();
    }
  };

  async storeBackgroundTime() {
    try {
      console.log('💾 Storing background time:', this.backgroundTime);
      await SecureStore.setItemAsync('app_background_time', this.backgroundTime.toString());
      console.log('💾 Background time stored successfully');
    } catch (error) {
      console.error('❌ Error storing background time:', error);
    }
  }

  async clearBackgroundTime() {
    try {
      console.log('🗑️ Clearing background time from storage');
      await SecureStore.deleteItemAsync('app_background_time');
      console.log('🗑️ Background time cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing background time:', error);
    }
  }

  async checkSessionOnAppStart() {
    try {
      console.log('🔍 Checking session on app start...');
      const storedBackgroundTime = await SecureStore.getItemAsync('app_background_time');
      
      if (storedBackgroundTime) {
        const backgroundTime = parseInt(storedBackgroundTime);
        const currentTime = Date.now();
        const timeInBackground = currentTime - backgroundTime;
        
        console.log('🔍 Found stored background time:', new Date(backgroundTime).toLocaleTimeString());
        console.log('🔍 Current time:', new Date(currentTime).toLocaleTimeString());
        console.log('🔍 Time since background:', Math.floor(timeInBackground / 1000), 'seconds');
        console.log('🔍 Session timeout limit:', Math.floor(this.sessionTimeout / 1000), 'seconds');
        
        if (timeInBackground > this.sessionTimeout) {
          console.log('❌ Session expired on app start! Logging out...');
          await this.logout();
          return false; // Session expired
        } else {
          console.log('✅ Session still valid on app start');
        }
        
        // Clear the stored background time since session is still valid
        await this.clearBackgroundTime();
      } else {
        console.log('ℹ️ No stored background time found - first launch or clean start');
      }
      
      return true; // Session valid
    } catch (error) {
      console.error('❌ Error checking session on app start:', error);
      return true; // Default to valid session if error occurs
    }
  }

  async logout() {
    try {
      console.log('🚪 Starting logout process...');
      
      // Clear all user session data
      await this.clearAllUserData();
      
      // Navigate to login page
      console.log('🚪 Redirecting to login page...');
      router.replace('/loginRequestOTP');
      
      console.log('🚪 User logged out due to session timeout');
    } catch (error) {
      console.error('❌ Error during logout:', error);
    }
  }

  async clearAllUserData() {
    try {
      // Clear user authentication data
      await SecureStore.deleteItemAsync('user_mobile');
      await SecureStore.deleteItemAsync('user_nic');
      await SecureStore.deleteItemAsync('user_timestamp');
      await SecureStore.deleteItemAsync('userData');
      
      // Clear policy and member data
      await SecureStore.deleteItemAsync('selected_policy_number');
      await SecureStore.deleteItemAsync('selected_member_number');
      await SecureStore.deleteItemAsync('selected_policy_id');
      await SecureStore.deleteItemAsync('selected_policy_period');
      await SecureStore.deleteItemAsync('selected_policy_type');
      await SecureStore.deleteItemAsync('selected_policy_data');
      await SecureStore.deleteItemAsync('selected_member_complete');
      await SecureStore.deleteItemAsync('selected_member_name');
      
      // Clear any refresh flags
      await SecureStore.deleteItemAsync('should_refresh_home');
      await SecureStore.deleteItemAsync('from_add_policy');
      await SecureStore.deleteItemAsync('policy_selected_in_add_policy');
      
      // Clear background time
      await SecureStore.deleteItemAsync('app_background_time');
      
      // Keep saved credentials for convenience (saved_user_nic, saved_user_mobile)
      // These are used for auto-filling the login form
      
      console.log('All user session data cleared');
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Call this method to update last activity time (optional feature)
  updateActivity() {
    this.lastActivityTime = Date.now();
  }

  // Method to set custom timeout (in minutes)
  setSessionTimeout(minutes) {
    this.sessionTimeout = minutes * 60 * 1000;
    console.log(`Session timeout set to ${minutes} minutes`);
  }

  // Clean up when app is closed
  destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;