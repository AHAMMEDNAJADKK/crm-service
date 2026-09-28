import { create } from 'zustand';
import api from '../services/api';

const useUiStore = create((set) => ({
  sidebarCollapsed: false,
  loading: false,
  toasts: [],
  unseenNotifications: 0,
  stationSettings: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  setLoading: (loading) => set({ loading }),

  // Add toast notification
  addToast: (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }]
    }));

    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id)
      }));
    }, 4000);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  // Notification management
  setUnseenNotifications: (unseenNotifications) => set({ unseenNotifications }),
  incrementNotifications: () => set((state) => ({ unseenNotifications: state.unseenNotifications + 1 })),
  clearNotifications: () => set({ unseenNotifications: 0 }),

  // Public Settings Cache
  setStationSettings: (stationSettings) => set({ stationSettings }),
  fetchStationSettings: async () => {
    try {
      const { data } = await api.get('/api/v1/public/settings');
      if (data?.success) {
        set({ stationSettings: data.data });
      }
    } catch (e) {
      console.error('Failed to fetch public settings:', e);
    }
  }
}));

export default useUiStore;
