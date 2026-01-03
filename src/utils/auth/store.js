import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// Use same key as api.js to ensure consistency
export const authKey = 'resq_auth_token';
export const erpAuthKey = 'erp_auth_token';

/**
 * This store manages the authentication state of the application.
 */
export const useAuthStore = create((set) => ({
  isReady: false,
  auth: null,
  erpAuth: null,
  user: null, // User profile object
  setAuth: (auth) => {
    if (auth) {
      SecureStore.setItemAsync(authKey, auth);
    } else {
      SecureStore.deleteItemAsync(authKey);
    }
    set({ auth });
  },
  setErpAuth: (token) => {
    if (token) {
      SecureStore.setItemAsync(erpAuthKey, token);
    } else {
      SecureStore.deleteItemAsync(erpAuthKey);
    }
    set({ erpAuth: token });
  },
  setUser: (user) => set({ user }),
}));

/**
 * This store manages the state of the authentication modal.
 */
export const useAuthModal = create((set) => ({
  isOpen: false,
  mode: 'signup',
  open: (options) => set({ isOpen: true, mode: options?.mode || 'signup' }),
  close: () => set({ isOpen: false }),
}));