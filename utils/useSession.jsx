import { useEffect, useCallback } from 'react';
import sessionManager from '../utils/SessionManager.jsx';

export const useSession = () => {
  // Update activity when user interacts with the app
  const updateActivity = useCallback(() => {
    sessionManager.updateActivity();
  }, []);

  // Manual logout function
  const logout = useCallback(async () => {
    await sessionManager.logout();
  }, []);

  // Check session validity
  const checkSession = useCallback(async () => {
    return await sessionManager.checkSessionOnAppStart();
  }, []);

  // Set custom session timeout
  const setSessionTimeout = useCallback((minutes) => {
    sessionManager.setSessionTimeout(minutes);
  }, []);

  // Optional: Update activity on component mount
  useEffect(() => {
    updateActivity();
  }, [updateActivity]);

  return {
    updateActivity,
    logout,
    checkSession,
    setSessionTimeout,
  };
};