import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { Modal, View } from 'react-native';
import { useAuthModal, useAuthStore, authKey, erpAuthKey } from './store';


/**
 * This hook provides authentication functionality.
 * It may be easier to use the `useAuthModal` or `useRequireAuth` hooks
 * instead as those will also handle showing authentication to the user
 * directly.
 */
export const useAuth = () => {
  const { isReady, auth, erpAuth, user, setAuth, setErpAuth, setUser } = useAuthStore();
  const { isOpen, close, open } = useAuthModal();

  const initiate = useCallback(async () => {
    try {
      console.log('[AUTH] Initializing...');
      const [authToken, erpToken] = await Promise.all([
        SecureStore.getItemAsync(authKey),
        SecureStore.getItemAsync(erpAuthKey),
      ]);

      if (authToken) {
        console.log('[AUTH] ResQ token found');
        useAuthStore.setState({ auth: authToken });
      } else {
        console.log('[AUTH] No ResQ token found');
      }

      if (erpToken) {
        console.log('[AUTH] ERP token found');
        useAuthStore.setState({ erpAuth: erpToken });
        // Fetch user profile if we have ERP token
        // We import it dynamically to avoid circular dependencies if any
        const api = require('../api').default;
        try {
          const profile = await api.getProfile();
          console.log('[AUTH] User profile loaded');
          useAuthStore.setState({ user: profile });
        } catch (e) {
          console.error('[AUTH] Failed to fetch profile during init:', e);
        }
      } else {
        console.log('[AUTH] No ERP token found');
      }

      useAuthStore.setState({ isReady: true });
    } catch (error) {
      console.error('[AUTH] Initialization error:', error);
      useAuthStore.setState({ isReady: true });
    }
  }, []);

  useEffect(() => { }, []);

  const signIn = useCallback(() => {
    open({ mode: 'signin' });
  }, [open]);
  const signUp = useCallback(() => {
    open({ mode: 'signup' });
  }, [open]);

  const signOut = useCallback(async () => {
    console.log('[AUTH] Signing out...');
    const api = require('../api').default;
    try {
      await api.logoutUser();
      console.log('[AUTH] Signed out from API');
    } catch (e) {
      console.warn('[AUTH] Logout API failed, clearing local state anyway');
      setAuth(null);
      setErpAuth(null);
    }
    setUser(null);
    close();
  }, [close, setAuth, setErpAuth, setUser]);

  return {
    isReady,
    isAuthenticated: isReady ? !!auth : null,
    isErpAuthenticated: !!erpAuth,
    signIn,
    signOut,
    signUp,
    auth,
    erpAuth,
    user,
    setAuth,
    setErpAuth,
    setUser,
    initiate,
  };
};

/**
 * This hook will automatically open the authentication modal if the user is not authenticated.
 */
export const useRequireAuth = (options) => {
  const { isAuthenticated, isReady } = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      open({ mode: options?.mode });
    }
  }, [isAuthenticated, open, options?.mode, isReady]);
};

export default useAuth;