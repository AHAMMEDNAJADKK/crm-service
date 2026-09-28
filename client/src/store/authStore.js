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
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
    }
  },

  // Log in using credentials
  login: async (mobile, pin) => {
    try {
      const response = await api.post('/api/v1/auth/login', { mobile, pin });
      if (response.data?.success) {
        set({
          user: response.data.data,
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
      set({
        user: null,
        isAuthenticated: false
      });
      // Clear storage
      localStorage.removeItem('auth-storage');
    }
  }
}));

export default useAuthStore;
