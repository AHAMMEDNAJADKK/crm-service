import { create } from 'zustand';
import api from '../services/api';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem('crm_theme') || 'dark'; // Dark theme default for AHAMMED SONS CRM
};

const applyThemeToDOM = (theme) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

const useUiStore = create((set, get) => ({
  // Layout states
  sidebarCollapsed: false,
  mobileNavOpen: false,
  globalSearchOpen: false,
  loading: false,

  // Notification / Toast
  toasts: [],
  unseenNotifications: 0,
  stationSettings: null,

  // Theme: 'light' | 'dark' | 'system'
  theme: getInitialTheme(),

  setTheme: (newTheme) => {
    localStorage.setItem('crm_theme', newTheme);
    applyThemeToDOM(newTheme);
    set({ theme: newTheme });
  },

  initTheme: () => {
    const currentTheme = getInitialTheme();
    applyThemeToDOM(currentTheme);
    set({ theme: currentTheme });

    // Listen for OS scheme changes if in 'system' mode
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (get().theme === 'system') {
          applyThemeToDOM('system');
        }
      };
      try {
        mediaQuery.addEventListener('change', handleChange);
      } catch (e) {
        mediaQuery.addListener(handleChange);
      }
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  
  toggleMobileNav: () => set((state) => ({ mobileNavOpen: !state.mobileNavOpen })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  openGlobalSearch: () => set({ globalSearchOpen: true }),
  closeGlobalSearch: () => set({ globalSearchOpen: false }),

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
