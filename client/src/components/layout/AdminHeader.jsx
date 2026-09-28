import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, LogOut, ShieldAlert } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';

export const AdminHeader = () => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, unseenNotifications, setUnseenNotifications, addToast, stationSettings } = useUiStore();
  const navigate = useNavigate();

  // Load low stock alerts or open cards as mock notifications count
  useEffect(() => {
    const fetchNotificationsCount = async () => {
      try {
        const response = await api.get('/api/v1/admin/inventory/low-stock');
        if (response.data?.success) {
          // Set unseen notification count to count of low stock items
          setUnseenNotifications(response.data.data.length);
        }
      } catch (err) {
        console.error('Failed to load notifications count:', err.message);
      }
    };
    fetchNotificationsCount();
  }, [setUnseenNotifications]);

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'info');
    navigate('/admin/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 z-30 select-none">
      {/* Left side: Sidebar Toggle & breadcrumbs */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          style={{ minWidth: '44px', minHeight: '44px' }}
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-slate-700 hidden sm:inline-flex items-center gap-2.5 bg-slate-50 border border-slate-200/60 px-3.5 py-1 rounded-full">
          {stationSettings?.logoUrl ? (
            <img
              src={`${api.defaults.baseURL || ''}${stationSettings.logoUrl}`}
              alt="Logo"
              className="h-7 object-contain"
            />
          ) : (
            <ShieldAlert className="w-4 h-4 text-brand-600" />
          )}
          <span className="font-extrabold text-xs uppercase tracking-wider text-slate-600">
            {stationSettings?.stationName || 'Owner Console'}
          </span>
        </span>
      </div>

      {/* Right side: Actions & User Session Info */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button
          onClick={() => {
            navigate('/admin/inventory');
            addToast(`You have ${unseenNotifications} low stock items needing replenishment`, 'warning');
          }}
          className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all cursor-pointer"
          style={{ minWidth: '44px', minHeight: '44px' }}
        >
          <Bell className="w-5 h-5" />
          {unseenNotifications > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
              {unseenNotifications}
            </span>
          )}
        </button>

        {/* User Session Profile Card */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200/60">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-800 leading-none">{user?.name || 'Owner User'}</p>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{user?.role || 'owner'}</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md select-none">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'OW'}
          </div>
        </div>

        {/* Logout Trigger */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
          style={{ minWidth: '44px', minHeight: '44px' }}
          title="Log out session"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
