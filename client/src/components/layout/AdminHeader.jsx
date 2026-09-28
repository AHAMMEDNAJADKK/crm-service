import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Bell,
  LogOut,
  Sparkles,
  Command
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import ThemeSwitcher from '../common/ThemeSwitcher';

const ROUTE_TITLES = {
  '/admin/dashboard': 'Command Dashboard',
  '/admin/jobs': "Today's Active Services",
  '/admin/history': 'Service History & Logs',
  '/admin/customers': 'Customer Directory',
  '/admin/vehicles': 'Vehicle Registry',
  '/admin/settings/pricing': 'Service Types & Pricing Matrix',
  '/admin/billing': 'Payments & Income Ledger',
  '/admin/expenses': 'Expense Management',
  '/admin/outstanding': 'Outstanding Receivables',
  '/admin/reports': 'Business Analytics & Reports',
  '/admin/settings': 'Station Configuration',
  '/admin/staff': 'Staff Management'
};

export const AdminHeader = ({ onOpenNewService }) => {
  const { user, logout } = useAuthStore();
  const {
    toggleSidebar,
    toggleMobileNav,
    openGlobalSearch,
    unseenNotifications,
    addToast
  } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTitle = ROUTE_TITLES[location.pathname] || 'AHAMMED SONS CRM';

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'info');
    navigate('/admin/login');
  };

  return (
    <header className="h-16 bg-white dark:bg-navy-850 border-b border-slate-200 dark:border-navy-700 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20 select-none transition-colors">
      {/* Left: Mobile Drawer Trigger / Desktop Sidebar Collapse & Page Title */}
      <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileNav}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-750 lg:hidden cursor-pointer"
          aria-label="Open mobile navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop collapse button */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-750 cursor-pointer"
          aria-label="Toggle sidebar collapse"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col overflow-hidden">
          <h1 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide truncate">
            {currentTitle}
          </h1>
          <span className="hidden sm:inline text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase tracking-wider">
            AHAMMED SONS WATER SERVICE
          </span>
        </div>
      </div>

      {/* Center: Global Search trigger button */}
      <div className="flex-1 max-w-xs md:max-w-md mx-2 sm:mx-6">
        <button
          type="button"
          onClick={openGlobalSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-navy-900 hover:bg-slate-100 dark:hover:bg-navy-750 border border-slate-200 dark:border-navy-750 rounded-xl text-xs text-slate-400 dark:text-slate-500 transition-colors shadow-2xs cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-brand-500 shrink-0" />
            <span className="truncate">Search plate, customer, Malayalam...</span>
          </div>
          <span className="hidden md:flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-navy-750 text-slate-500 dark:text-slate-400 rounded">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Right: Quick Action, Notifications, Theme, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* + New Service Quick Action Button */}
        {onOpenNewService && (
          <button
            type="button"
            onClick={onOpenNewService}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-black shadow-xs shadow-brand-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 font-bold" />
            <span className="hidden sm:inline">New Service</span>
          </button>
        )}

        {/* Theme Switcher (Compact icon in header) */}
        <div className="hidden sm:block">
          <ThemeSwitcher compact />
        </div>

        {/* Notifications */}
        <button
          type="button"
          onClick={() => addToast('No unread notifications at this time', 'info')}
          className="relative p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-750 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unseenNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-navy-700">
          <div className="w-8 h-8 rounded-xl bg-navy-950 dark:bg-navy-800 text-brand-400 border border-navy-800 dark:border-navy-700 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
            {user?.name ? user.name.substring(0, 1).toUpperCase() : 'A'}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
              {user?.name || 'Owner'}
            </span>
            <span className="text-[9px] uppercase font-semibold text-brand-600 dark:text-brand-400 tracking-wider mt-0.5">
              {user?.role || 'Admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
