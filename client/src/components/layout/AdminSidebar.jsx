import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Droplet,
  PlusCircle,
  History,
  Users,
  Car,
  Layers,
  Sparkles,
  IndianRupee,
  Receipt,
  TrendingDown,
  TrendingUp,
  Calendar,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  X,
  UserCheck
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';
import ThemeSwitcher from '../common/ThemeSwitcher';

export const AdminSidebar = ({ onOpenNewService }) => {
  const { user, logout } = useAuthStore();
  const {
    sidebarCollapsed,
    mobileNavOpen,
    setMobileNavOpen,
    stationSettings,
    addToast
  } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Part 10 & 27: Keyboard Escape listener to close mobile navigation drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    if (mobileNavOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen, setMobileNavOpen]);

  // Part 11: Body scroll lock when mobile sidebar is open
  useEffect(() => {
    if (mobileNavOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileNavOpen]);

  const handleLogout = async () => {
    await logout();
    addToast('Logged out successfully', 'info');
    navigate('/admin/login');
  };

  const navSections = [
    {
      type: 'single',
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard
    },
    {
      type: 'section',
      title: 'Services',
      items: [
        {
          name: 'Add Vehicle',
          icon: PlusCircle,
          action: () => {
            if (onOpenNewService) onOpenNewService();
            else navigate('/admin/jobs?action=new');
            setMobileNavOpen(false);
          }
        },
        { name: "Today's Services", path: '/admin/jobs', icon: Droplet },
        { name: 'Calendar', path: '/admin/calendar', icon: Calendar },
        { name: 'Service History', path: '/admin/history', icon: History }
      ]
    },
    {
      type: 'section',
      title: 'Payments',
      items: [
        { name: 'Payments', path: '/admin/billing', icon: Receipt },
        { name: 'Outstanding', path: '/admin/outstanding', icon: AlertCircle }
      ]
    },
    {
      type: 'single',
      name: 'Expenses',
      path: '/admin/expenses',
      icon: TrendingDown
    },
    {
      type: 'single',
      name: 'Reports',
      path: '/admin/reports',
      icon: BarChart3
    },
    {
      type: 'section',
      title: 'Configuration',
      items: [
        { name: 'Pricing & Vehicle Types', path: '/admin/settings/pricing', icon: Layers },
        { name: 'Business Settings', path: '/admin/settings', icon: Settings }
      ]
    }
  ];

  const brandName = stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE';
  const logoUrl = stationSettings?.logoUrl || '/uploads/logo/station-logo.jpg';

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-navy-950 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-navy-800 bg-navy-950/80 shrink-0">
        <Link
          to="/admin/dashboard"
          onClick={() => setMobileNavOpen(false)}
          className="flex items-center gap-3 overflow-hidden cursor-pointer"
        >
          <img
            src={`${api.defaults.baseURL || ''}${logoUrl}`}
            alt="Logo"
            className="h-9 w-9 object-contain shrink-0 rounded bg-navy-900 border border-navy-700"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {(!sidebarCollapsed || mobileNavOpen) && (
            <div className="flex flex-col overflow-hidden">
              <span className="font-black text-white text-[12px] tracking-wider truncate uppercase">
                AHAMMED SONS
              </span>
              <span className="text-[9px] text-brand-400 font-bold uppercase tracking-widest truncate">
                WATER SERVICE CRM
              </span>
            </div>
          )}
        </Link>

        {mobileNavOpen && (
          <button
            onClick={() => setMobileNavOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-navy-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-4 no-scrollbar">
        {navSections.map((sec, idx) => {
          if (sec.type === 'single') {
            const isActive = location.pathname === sec.path;
            const Icon = sec.icon;

            return (
              <div key={sec.name}>
                <Link
                  to={sec.path}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/30'
                      : 'hover:bg-navy-800 text-slate-300 hover:text-white'
                  }`}
                  title={sidebarCollapsed && !mobileNavOpen ? sec.name : ''}
                >
                  <Icon className="w-4 h-4 shrink-0 text-brand-400" />
                  {(!sidebarCollapsed || mobileNavOpen) && (
                    <span className="text-xs font-semibold truncate">{sec.name}</span>
                  )}
                </Link>
              </div>
            );
          }

          return (
            <div key={sec.title} className="space-y-1">
              {(!sidebarCollapsed || mobileNavOpen) && (
                <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  {sec.title}
                </span>
              )}
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path && (location.pathname + location.search) === item.path;

                  if (item.action) {
                    return (
                      <button
                        key={item.name}
                        onClick={item.action}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-brand-400 hover:bg-brand-950/40 hover:text-brand-300 transition-all font-bold text-xs text-left cursor-pointer"
                        title={sidebarCollapsed && !mobileNavOpen ? item.name : ''}
                      >
                        <Icon className="w-4 h-4 shrink-0 text-brand-400" />
                        {(!sidebarCollapsed || mobileNavOpen) && (
                          <span className="truncate">{item.name}</span>
                        )}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileNavOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-600/20'
                          : 'hover:bg-navy-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={sidebarCollapsed && !mobileNavOpen ? item.name : ''}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      {(!sidebarCollapsed || mobileNavOpen) && (
                        <span className="text-xs font-medium truncate">{item.name}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Profile, Theme & Logout */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/60 shrink-0 space-y-2">
        {(!sidebarCollapsed || mobileNavOpen) ? (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Theme</span>
              <ThemeSwitcher variant="buttons" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-navy-850">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-navy-800 text-brand-400 border border-navy-700 flex items-center justify-center font-black text-xs shrink-0">
                  {user?.name ? user.name.substring(0, 1).toUpperCase() : 'A'}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Owner'}</span>
                  <span className="text-[9px] uppercase font-semibold text-brand-400 tracking-wider truncate">
                    {user?.role || 'Admin'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-800 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ThemeSwitcher compact />
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-navy-800 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex flex-col min-h-screen border-r border-navy-800 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } shrink-0 shadow-2xl z-30`}
      >
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (Sheet) */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-navy-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Slide-out drawer */}
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
