import { useEffect } from 'react';
import useAuthStore from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isCheckingAuth, checkAuth, login, logout } = useAuthStore();

  // Run checkAuth once when component using this hook mounts (normally done at root App layer)
  useEffect(() => {
    if (isCheckingAuth && !isAuthenticated) {
      checkAuth();
    }
  }, [isCheckingAuth, isAuthenticated, checkAuth]);

  return {
    user,
    isAuthenticated,
    isCheckingAuth,
    login,
    logout,
    checkAuth
  };
};

export default useAuth;
