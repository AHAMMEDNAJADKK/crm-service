import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Car,
  Droplet,
  Package,
  Receipt,
  CalendarDays,
  UserCheck,
  TrendingDown,
  Gauge,
  BarChart3,
  Settings,
  ArrowLeftRight,
  Sliders,
  BookOpen,
  IndianRupee
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
    { name: 'Wash Jobs', path: '/admin/jobs', icon: Droplet },
    { name: 'Inventory', path: '/admin/inventory', icon: Package },
    { name: 'Billing', path: '/admin/billing', icon: Receipt },
    { name: 'Appointments', path: '/admin/appointments', icon: CalendarDays },
    { name: 'Staff & Attendance', path: '/admin/staff', icon: UserCheck },
    { name: 'Expenses', path: '/admin/expenses', icon: TrendingDown },
    { name: 'Fuel Logs', path: '/admin/fuel-logs', icon: Gauge },
    { name: 'Ledger', path: '/admin/ledger', icon: BookOpen },
    { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'Pricing Editor', path: '/admin/settings/pricing', icon: IndianRupee },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-400 min-h-screen flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-16 md:w-20' : 'w-64'
      } shrink-0 shadow-lg select-none`}
    >
      {/* Brand area (Logo / Fallback name) */}
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-slate-800 bg-slate-950/40 shrink-0 overflow-hidden">
        {stationSettings?.logoUrl ? (
          <img
            src={`${api.defaults.baseURL || ''}${stationSettings.logoUrl}`}
            alt="Logo"
            className="max-h-9 object-contain"
          />
        ) : (
          <div className="p-2 rounded-xl bg-brand-600 text-white shrink-0 flex items-center justify-center">
            <Droplet className="w-5 h-5 fill-current" />
          </div>
        )}
        {!sidebarCollapsed && (
          <span className="font-extrabold text-white text-[13px] tracking-wider truncate uppercase transition-all">
            {stationSettings?.stationName || 'AQUACLEAN'}
          </span>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 py-4 overflow-y-auto px-2 flex flex-col gap-1.5">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-brand-600 text-white font-bold'
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
          {!sidebarCollapsed && <span className="text-xs font-semibold">Exit CRM Portal</span>}
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
