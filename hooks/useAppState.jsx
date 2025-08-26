import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import { SessionManager } from '../utils/SessionManager';

export const useAppState = () => {
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);
  const backgroundTime = useRef(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('App has come to the foreground!');
      
      // Check session validity when app comes to foreground
      const isSessionValid = await SessionManager.handleAppStateChange(
        nextAppState, 
        backgroundTime.current || new Date().getTime()
      );
      
      if (!isSessionValid) {
        console.log('Session expired, redirecting to login');
        // Clear all stored data except saved credentials
        await SessionManager.clearSession();
        // Redirect to login
        router.replace('/loginRequestOTP');
      }
    } else if (nextAppState.match(/inactive|background/)) {
      console.log('App has gone to the background!');
      backgroundTime.current = new Date().getTime();
    }

    appState.current = nextAppState;
    setAppStateVisible(appState.current);
  };

  return appStateVisible;
};