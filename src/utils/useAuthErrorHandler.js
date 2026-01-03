import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { setAuthToken } from '@/utils/api';

/**
 * Hook for handling authentication errors
 * Automatically logs out user on 401 (Unauthorized) errors
 */
export const useAuthErrorHandler = () => {
  const router = useRouter();

  const handleError = useCallback(async (error) => {
    if (error.status === 401 || error.type === 'UNAUTHORIZED') {
      // Clear token and redirect to login
      await setAuthToken(null);
      router.replace('/login');
      return true;
    }
    return false;
  }, [router]);

  return { handleError };
};

export default useAuthErrorHandler;
