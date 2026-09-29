import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car,
  CheckCircle,
  Clock,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Eye,
  FileText,
  CreditCard,
  Droplet,
  Truck,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import useAuthStore from '../../store/authStore';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

import QuickActionsBar from '../../components/common/QuickActionsBar';
import NewServiceModal from '../../components/jobs/NewServiceModal';
import QuickPaymentModal from '../../components/payments/QuickPaymentModal';
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

export const Dashboard = ({ onOpenNewService }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast, stationSettings } = useUiStore();

  // Chart range: '7d' or '30d'
  const [chartRange, setChartRange] = useState('7d');

  // Date Context Filter: 'today', 'yesterday', 'this-week', 'this-month', 'custom'
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  // Modals state
  const [isInternalNewServiceOpen, setIsInternalNewServiceOpen] = useState(false);
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [receiptModalJob, setReceiptModalJob] = useState(null);

  const handleOpenNewService = onOpenNewService || (() => setIsInternalNewServiceOpen(true));

  // 1. Fetch unified Dashboard stats & analytics matching the active date context
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    refetch: refetchDashboard
  } = useQuery({
    queryKey: ['adminDashboardToday', dateFilter, customDate],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/today', {
        params: {
          filter: dateFilter,
          date: dateFilter === 'custom' ? customDate : undefined
        }
      });
      return res.data?.data;
    }
  });

  // 2. Fetch Monthly Dashboard stats when chartRange is '30d'
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['adminDashboardMonthly'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/monthly');
      return res.data?.data;
    },
    enabled: chartRange === '30d'
  });

  // Quick Complete Job Mutation
  const completeMutation = useMutation({
    mutationFn: async (jobId) => {
      return await api.patch(`/api/v1/admin/jobs/${jobId}/status`, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      addToast('Vehicle marked as completed!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to update job status', 'error');
    }
  });

  const today = dashboardData?.today || {
    totalVehicles: 0,
    serviceValue: 0,
    collection: 0,
    outstanding: 0,
    expenses: 0,
    todayProfit: 0
  };

  const month = dashboardData?.month || {
    totalVehicles: 0,
    serviceValue: 0,
    collection: 0,
    expenses: 0,
    profit: 0
  };

  const performanceChartData =
    chartRange === '7d'
      ? dashboardData?.performanceChart7d || []
      : monthlyData?.performanceChart || [];

  const vehiclesByType = dashboardData?.vehiclesByType || [];
  const servicesBreakdown = dashboardData?.servicesBreakdown || [];
  const paymentsBreakdown = dashboardData?.paymentsBreakdown || [];
  const expensesBreakdown = dashboardData?.expensesBreakdown || [];
  const recentPayments = dashboardData?.recentPayments || [];
  const outstandingJobs = dashboardData?.outstandingJobs || [];
  const todayVehicles = dashboardData?.todayVehicles || [];

  // Greeting helper
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning';
    if (hr < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none pb-12">
      {/* 1. Header Banner & Quick Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {user?.name?.split(' ')[0] || 'Owner'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              <span className="font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                {stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE'}
              </span>
              {' '}• Owner Command Dashboard
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetchDashboard()}
              className="text-xs font-bold"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenNewService}
              className="font-black text-xs shadow-md shadow-brand-600/25"
            >
              + Add Vehicle
            </Button>
          </div>
        </div>

        {/* Action bar */}
        <QuickActionsBar
          onAddVehicle={handleOpenNewService}
          onAddPayment={() => navigate('/admin/billing')}
          onAddExpense={() => navigate('/admin/expenses')}
          onViewTodaysServices={() => navigate('/admin/jobs')}
          onViewOutstanding={() => navigate('/admin/outstanding')}
        />
      </div>

      {/* Date Filter Context Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            Filter Period:
          </span>
          <button
            type="button"
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              dateFilter === 'today'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('yesterday')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              dateFilter === 'yesterday'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            Yesterday
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('this-week')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              dateFilter === 'this-week'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('this-month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
              dateFilter === 'this-month'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700'
            }`}
          >
            This Month
          </button>

          {/* Custom Date Input */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-navy-700">
            <span className="text-[11px] font-bold text-slate-400">Custom:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setDateFilter('custom');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all ${
                dateFilter === 'custom'
                  ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300'
                  : 'bg-slate-100 dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300'
              }`}
            />
          </div>
        </div>

        <Link
          to="/admin/calendar"
          className="inline-flex items-center gap-1.5 text-xs font-black text-brand-600 dark:text-brand-400 hover:underline"
        >
          <Calendar className="w-3.5 h-3.5" />
          Full Service Calendar &rarr;
        </Link>
      </div>

      {/* 2. Top 8 Colorful KPI Cards (Controlled High-Readability Palette) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-3.5">
        {/* 1. VEHICLES (Blue) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              {dateFilter === 'today' ? "Today's" : dateFilter === 'yesterday' ? "Yesterday's" : dateFilter === 'this-week' ? 'This Week' : dateFilter === 'this-month' ? 'This Month' : customDate} Vehicles
            </span>
            <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Car className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
            {today.totalVehicles}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">Recorded count</p>
        </div>

        {/* 2. SERVICE VALUE (Indigo) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 truncate">
              Service Value
            </span>
            <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono truncate">
            {formatCurrency(today.serviceValue)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">Total work value</p>
        </div>

        {/* 3. COLLECTION (Emerald) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-emerald-200/60 dark:border-emerald-900/40 shadow-2xs hover:shadow-sm transition-all bg-emerald-50/20 dark:bg-emerald-950/10">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 truncate">
              Collection
            </span>
            <div className="p-1 rounded-lg bg-emerald-100/80 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
            {formatCurrency(today.collection)}
          </div>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/60 mt-1 truncate">Actual cash/UPI in</p>
        </div>

        {/* 4. OUTSTANDING (Amber) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 truncate">
              Outstanding
            </span>
            <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono truncate">
            {formatCurrency(today.outstanding)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">Pending payment</p>
        </div>

        {/* 5. EXPENSES (Rose) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400 truncate">
              Expenses
            </span>
            <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 font-mono truncate">
            {formatCurrency(today.expenses)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">Money spent</p>
        </div>

        {/* 6. PROFIT (Purple - True Cash Profit) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-purple-200/60 dark:border-purple-900/40 shadow-2xs hover:shadow-sm transition-all bg-purple-50/20 dark:bg-purple-950/10">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 truncate">
              {dateFilter === 'today' ? "Today's" : dateFilter === 'yesterday' ? "Yesterday's" : 'Period'} Profit
            </span>
            <div className="p-1 rounded-lg bg-purple-100/80 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-base sm:text-lg font-black font-mono truncate ${
            today.todayProfit >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600'
          }`}>
            {formatCurrency(today.todayProfit)}
          </div>
          <p className="text-[10px] text-purple-700/70 dark:text-purple-400/60 mt-1 truncate">Collection - Expense</p>
        </div>

        {/* 7. THIS MONTH COLLECTION (Cyan) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
              This Month
            </span>
            <div className="p-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-cyan-700 dark:text-cyan-400 font-mono truncate">
            {formatCurrency(month.collection)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{month.totalVehicles} vehicles</p>
        </div>

        {/* 8. MONTHLY PROFIT (Violet) */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-2xs hover:shadow-sm transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 dark:text-violet-400">
              Monthly Profit
            </span>
            <div className="p-1 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-base sm:text-lg font-black font-mono truncate ${
            month.profit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600'
          }`}>
            {formatCurrency(month.profit)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">Month Net Cash</p>
        </div>
      </div>

      {/* 3. Performance Chart: Income vs Expenses vs Profit */}
      <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Business Performance: Income vs Expenses vs Profit
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual cash flow breakdown based on real collected revenue and actual recorded expenses.
            </p>
          </div>

          {/* Timeframe Toggle Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartRange('7d')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                chartRange === '7d'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setChartRange('30d')}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${
                chartRange === '30d'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-64 sm:h-72 w-full">
          {isDashboardLoading || (chartRange === '30d' && isMonthlyLoading) ? (
            <div className="h-full flex items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : performanceChartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
              <p>No transactions recorded for this period.</p>
              <button
                type="button"
                onClick={handleOpenNewService}
                className="mt-2 text-brand-600 font-bold hover:underline"
              >
                + Record a service to view live trends
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === 'collection' ? 'Collection' : name === 'expenses' ? 'Expenses' : 'Net Profit'
                  ]}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '10px' }}
                />
                <Bar dataKey="collection" name="Collection" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Compact Analytics Sections: Vehicles by Type & Services Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Vehicles by Type */}
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Vehicles by Category (This Month)
            </h2>
            <Link to="/admin/settings/pricing" className="text-xs font-bold text-brand-600 hover:underline">
              Manage Types
            </Link>
          </div>

          {vehiclesByType.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No vehicles recorded this month.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {vehiclesByType.map((vt) => {
                const totalMonthVehicles = month.totalVehicles || 1;
                const pct = Math.round((vt.count / totalMonthVehicles) * 100);
                return (
                  <div key={vt.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300">{vt.name}</span>
                      <span className="text-slate-500 font-mono">
                        {vt.count} vehicles ({pct}%) • {formatCurrency(vt.totalValue)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-900 overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Services Breakdown */}
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Service Breakdown (This Month)
            </h2>
            <Link to="/admin/history" className="text-xs font-bold text-brand-600 hover:underline">
              History
            </Link>
          </div>

          {servicesBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No services recorded this month.</p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {servicesBreakdown.map((sb) => {
                const totalRev = month.serviceValue || 1;
                const pct = Math.round(((sb.totalValue || 0) / totalRev) * 100);
                return (
                  <div key={sb.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{sb.name}</span>
                      <span className="text-slate-500 font-mono">
                        {sb.count} services • {formatCurrency(sb.totalValue)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-navy-900 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. Payments & Expense Distribution Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Methods */}
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Payment Methods Breakdown
            </h2>
            <Link to="/admin/billing" className="text-xs font-bold text-brand-600 hover:underline">
              All Payments
            </Link>
          </div>

          {paymentsBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No collections recorded this month.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {paymentsBreakdown.map((pm) => (
                <div
                  key={pm.method}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-center"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    {pm.method}
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white font-mono block mt-0.5">
                    {formatCurrency(pm.total)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{pm.count} txns</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Categories */}
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Expense Categories Breakdown
            </h2>
            <Link to="/admin/expenses" className="text-xs font-bold text-rose-600 hover:underline">
              + Add Expense
            </Link>
          </div>

          {expensesBreakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No expenses recorded this month.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {expensesBreakdown.map((exp) => (
                <div
                  key={exp.category}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 text-center"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block truncate">
                    {exp.category}
                  </span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono block mt-0.5">
                    {formatCurrency(exp.total)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{exp.count} entries</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. Today's Activity / Services Section */}
      <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
              {dateFilter === 'today' ? "Today's" : dateFilter === 'yesterday' ? "Yesterday's" : dateFilter === 'this-week' ? 'This Week' : dateFilter === 'this-month' ? 'This Month' : customDate} Services Activity
            </h2>
            <p className="text-xs text-slate-500">
              Services recorded for {dateFilter === 'today' ? 'today' : dateFilter === 'yesterday' ? 'yesterday' : dateFilter === 'this-week' ? 'this week' : dateFilter === 'this-month' ? 'this month' : customDate}.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={handleOpenNewService}
            className="text-xs font-bold"
          >
            + Add Vehicle
          </Button>
        </div>

        {todayVehicles.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Car className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
            <p className="font-bold">No vehicles recorded for this period.</p>
            <p className="text-[11px] mt-0.5">Click "+ Add Vehicle" to log a service.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-navy-900/60 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-700">
                {todayVehicles.map((j) => {
                  const isPaid = j.paymentStatus === 'paid';
                  const isPartial = j.paymentStatus === 'partial';
                  return (
                    <tr key={j._id} className="hover:bg-slate-50/50 dark:hover:bg-navy-750 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono whitespace-nowrap">
                        {dateFilter === 'today'
                          ? new Date(j.createdAt || j.serviceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                          : formatDate(j.serviceDate || j.createdAt)}
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900 dark:text-white font-mono uppercase tracking-wider whitespace-nowrap">
                        {j.vehicleReg}
                      </td>
                      <td className="py-3 px-3 uppercase text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                        {j.vehicleType}
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {j.serviceName || 'General Service'}
                      </td>
                      <td className="py-3 px-3 font-black text-slate-900 dark:text-white font-mono whitespace-nowrap">
                        {formatCurrency(j.finalAmount || j.price)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : isPartial
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {j.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                          {j.status || 'Waiting'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {j.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => setPaymentModalJob(j)}
                              className="px-2 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px]"
                            >
                              + Pay
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReceiptModalJob(j)}
                            className="p-1 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                            title="Print / View Receipt"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          {j.status !== 'completed' && j.status !== 'delivered' && (
                            <button
                              type="button"
                              onClick={() => completeMutation.mutate(j._id)}
                              className="p-1 rounded text-slate-400 hover:text-emerald-600"
                              title="Mark Completed"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Bottom Row: Outstanding Payments & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Outstanding Receivables */}
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Outstanding Payments Due
              </h2>
              <p className="text-[11px] text-slate-400">Services awaiting customer balance payment.</p>
            </div>
            <Link to="/admin/outstanding" className="text-xs font-bold text-amber-600 hover:underline">
              View All Due
            </Link>
          </div>

          {outstandingJobs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No outstanding balances pending. All clear!</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-700">
              {outstandingJobs.map((j) => (
                <div key={j._id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-black text-slate-900 dark:text-white font-mono uppercase tracking-wider block">
                      {j.vehicleReg}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Total: {formatCurrency(j.finalAmount)} • Paid: {formatCurrency(j.amountPaid)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="font-black text-amber-600 dark:text-amber-400 font-mono block">
                        {formatCurrency(j.balance)} Due
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentModalJob(j)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px]"
                    >
                      + Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Collections */}
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                Recent Collections
              </h2>
              <p className="text-[11px] text-slate-400">Latest payment transactions recorded.</p>
            </div>
            <Link to="/admin/billing" className="text-xs font-bold text-brand-600 hover:underline">
              View All
            </Link>
          </div>

          {recentPayments.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No recent payments logged.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-navy-700">
              {recentPayments.map((p) => (
                <div key={p._id || p.paymentId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-black text-slate-900 dark:text-white font-mono uppercase tracking-wider block">
                      {p.vehicleReg || 'General Payment'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(p.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} • {p.paymentMethod?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                      +{formatCurrency(p.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Internal Modals */}
      {isInternalNewServiceOpen && (
        <NewServiceModal
          isOpen={isInternalNewServiceOpen}
          onClose={() => setIsInternalNewServiceOpen(false)}
          onSuccess={() => setIsInternalNewServiceOpen(false)}
        />
      )}

      {paymentModalJob && (
        <QuickPaymentModal
          isOpen={!!paymentModalJob}
          job={paymentModalJob}
          onClose={() => setPaymentModalJob(null)}
          onSuccess={() => {
            setPaymentModalJob(null);
            refetchDashboard();
          }}
        />
      )}

      {receiptModalJob && (
        <ServiceReceiptModal
          isOpen={!!receiptModalJob}
          job={receiptModalJob}
          onClose={() => setReceiptModalJob(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
