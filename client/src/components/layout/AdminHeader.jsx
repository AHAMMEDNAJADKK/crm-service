import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, LogOut, Plus, Bell } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';

export const AdminHeader = ({ onOpenNewService }) => {
  const { user, logout } = useAuthStore();
  const { toggleSidebar, addToast, stationSettings } = useUiStore();
  const navigate = useNavigate();

  const [globalSearchInput, setGlobalSearchInput] = useState('');

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'info');
    navigate('/admin/login');
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (globalSearchInput.trim()) {
      navigate(`/admin/reports?search=${encodeURIComponent(globalSearchInput.trim())}`);
    }
  };

  const logoUrl = stationSettings?.logoUrl || '/uploads/logo/station-logo.jpg';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-30 select-none">
      {/* Left: Sidebar Toggle & Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          style={{ minWidth: '40px', minHeight: '40px' }}
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <img
            src={`${api.defaults.baseURL || ''}${logoUrl}`}
            alt="Logo"
            className="h-8 w-8 object-contain rounded"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="hidden sm:flex flex-col">
            <span className="font-black text-xs text-slate-800 tracking-wider uppercase leading-none">
              {stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE'}
            </span>
            <span className="text-[10px] text-brand-600 font-bold uppercase tracking-widest mt-0.5">
              Service Management
            </span>
          </div>
        </div>
      </div>

      {/* Center: Quick Search (on md+ screens) */}
      <form onSubmit={handleGlobalSearch} className="hidden md:flex items-center flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={globalSearchInput}
            onChange={(e) => setGlobalSearchInput(e.target.value)}
            placeholder="Search vehicle number, customer, mobile..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>
      </form>

      {/* Right: Quick Action & User Session */}
      <div className="flex items-center gap-2 sm:gap-4">
        {onOpenNewService && (
          <button
            type="button"
            onClick={onOpenNewService}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Service</span>
          </button>
        )}

        {/* User Info */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'Owner'}</p>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{user?.role || 'Admin'}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-extrabold shadow-xs">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AS'}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          title="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
