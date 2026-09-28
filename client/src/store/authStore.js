import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isCheckingAuth: true,

  // Set user directly (useful for local state updating)
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  // Verify if owner session is active (runs at application startup)
  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await api.get('/api/v1/auth/me');
      if (response.data?.success) {
        set({
          user: response.data.data,
          isAuthenticated: true,
          isCheckingAuth: false
        });
      } else {
        localStorage.removeItem('crm_auth_token');
        localStorage.removeItem('crm_refresh_token');
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
      }
    } catch (error) {
      localStorage.removeItem('crm_auth_token');
      localStorage.removeItem('crm_refresh_token');
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  // Log in using credentials
  login: async (mobile, pin) => {
    try {
      const response = await api.post('/api/v1/auth/login', { mobile, pin });
      if (response.data?.success) {
        const userData = response.data.data;
        if (userData?.token) {
          localStorage.setItem('crm_auth_token', userData.token);
        }
        if (userData?.refreshToken) {
          localStorage.setItem('crm_refresh_token', userData.refreshToken);
        }
        set({
          user: userData,
          isAuthenticated: true
        });
        return { success: true };
      }
      return { success: false, error: response.data?.error || 'Login failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Server error. Please try again.';
      return { success: false, error: errorMsg };
    }
  },

  // Log out of session
  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error.message);
    } finally {
      localStorage.removeItem('crm_auth_token');
      localStorage.removeItem('crm_refresh_token');
      localStorage.removeItem('auth-storage');
      set({
        user: null,
        isAuthenticated: false
      });
    }
  }
}));

export default useAuthStore;
