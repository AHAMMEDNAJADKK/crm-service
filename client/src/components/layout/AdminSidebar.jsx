import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Droplet,
  IndianRupee,
  Receipt,
  TrendingDown,
  BarChart3,
  Settings,
  ArrowLeftRight,
  Package,
  CalendarDays,
  UserCheck,
  BookOpen
} from 'lucide-react';
import useUiStore from '../../store/uiStore';
import api from '../../services/api';

export const AdminSidebar = () => {
  const { sidebarCollapsed, stationSettings } = useUiStore();
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Vehicles', path: '/admin/vehicles', icon: Car },
    { name: "Today's Services", path: '/admin/jobs', icon: Droplet },
    { name: 'Services & Pricing', path: '/admin/settings/pricing', icon: IndianRupee },
    { name: 'Payments & Income', path: '/admin/billing', icon: Receipt },
    { name: 'Expenses', path: '/admin/expenses', icon: TrendingDown },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Staff', path: '/admin/staff', icon: UserCheck },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const brandName = stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE';
  const logoUrl = stationSettings?.logoUrl || '/uploads/logo/station-logo.jpg';

  return (
    <aside
      className={`bg-slate-900 text-slate-400 min-h-screen flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16 md:w-20' : 'w-64'
      } shrink-0 shadow-xl select-none z-40`}
    >
      {/* Brand area (Logo / Name) */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800 bg-slate-950/60 shrink-0 overflow-hidden">
        <img
          src={`${api.defaults.baseURL || ''}${logoUrl}`}
          alt="AHAMMED SONS Logo"
          className="h-9 w-9 object-contain shrink-0 rounded bg-slate-900"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        {!sidebarCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-black text-white text-[11px] tracking-wider truncate uppercase">
              AHAMMED SONS
            </span>
            <span className="text-[9px] text-brand-400 font-bold uppercase tracking-widest truncate">
              WATER SERVICE
            </span>
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 overflow-y-auto px-2 flex flex-col gap-1.5 no-scrollbar">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white font-bold shadow-md shadow-brand-600/30'
                  : 'hover:bg-slate-800 hover:text-slate-200'
              }`}
              style={{ minHeight: '46px' }}
              title={sidebarCollapsed ? link.name : ''}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span className="text-xs font-semibold truncate">{link.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer Exit Portal */}
      <div className="p-3 border-t border-slate-800 shrink-0 bg-slate-950/20">
        <Link
          to="/"
          className="flex items-center gap-3.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 hover:text-slate-200 text-slate-500 transition-colors"
          style={{ minHeight: '44px' }}
        >
          <ArrowLeftRight className="w-5 h-5 shrink-0" />
          {!sidebarCollapsed && <span className="text-xs font-semibold">Exit to Website</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
