import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  PieChart,
  BarChart2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

import QuickActionsBar from '../../components/common/QuickActionsBar';
import TodaysVehiclesSection from '../../components/jobs/TodaysVehiclesSection';
import NewServiceModal from '../../components/jobs/NewServiceModal';
import QuickPaymentModal from '../../components/payments/QuickPaymentModal';
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

const CHART_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Dashboard = ({ onOpenNewService }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast, stationSettings } = useUiStore();

  const [activeTab, setActiveTab] = useState('today'); // 'today', 'weekly', 'monthly', 'closing'

  // Modal states
  const [isInternalNewServiceOpen, setIsInternalNewServiceOpen] = useState(false);
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [receiptModalJob, setReceiptModalJob] = useState(null);

  const handleOpenNewService = onOpenNewService || (() => setIsInternalNewServiceOpen(true));

  // 1. Fetch Today's Dashboard Stats & Active Vehicles (backend aggregation)
  const { data: todayData, isLoading: isTodayLoading, refetch: refetchToday } = useQuery({
    queryKey: ['adminDashboardToday'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/today');
      return res.data?.data;
    }
  });

  // 2. Fetch Weekly Dashboard Stats
  const { data: weeklyData, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['adminDashboardWeekly'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/weekly');
      return res.data?.data;
    },
    enabled: activeTab === 'weekly'
  });

  // 3. Fetch Monthly Dashboard Stats
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['adminDashboardMonthly'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/monthly');
      return res.data?.data;
    },
    enabled: activeTab === 'monthly'
  });

  // 4. Fetch Daily Closing Summary
  const { data: closingData, isLoading: isClosingLoading } = useQuery({
    queryKey: ['adminDashboardClosing'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/daily-closing');
      return res.data?.data;
    },
    enabled: activeTab === 'closing'
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

  const handleQuickComplete = (job) => {
    completeMutation.mutate(job._id);
  };

  const handleQuickPayment = (job) => {
    setPaymentModalJob(job);
  };

  const handleViewReceipt = (job) => {
    setReceiptModalJob(job);
  };

  const handleManageJob = (job) => {
    navigate('/admin/jobs');
  };

  const todayStats = todayData?.today || {
    totalServices: 0,
    completedServices: 0,
    pendingServices: 0,
    cancelledServices: 0,
    totalServiceValue: 0,
    amountCollected: 0,
    outstanding: 0,
    totalExpenses: 0,
    netCashFlow: 0
  };

  const todayVehicles = todayData?.todayVehicles || [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none pb-12">
      {/* Top Banner / Mobile Quick Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Command Dashboard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE'} • Real-Time Operations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetchToday()}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenNewService}
              className="font-bold text-xs"
            >
              New Service
            </Button>
          </div>
        </div>

        {/* Mobile Quick Action Buttons Bar */}
        <QuickActionsBar
          onNewService={handleOpenNewService}
          onNewCustomer={() => navigate('/admin/customers')}
          onNewVehicle={() => navigate('/admin/vehicles')}
          onNewExpense={() => navigate('/admin/expenses')}
          onViewTodaysVehicles={() => setActiveTab('today')}
          onViewOutstanding={() => navigate('/admin/outstanding')}
        />
      </div>

      {/* Date Filter Tabs Bar: Today / Weekly / Monthly / Daily Closing */}
      <div className="flex border-b border-slate-200 dark:border-navy-700 overflow-x-auto gap-2 no-scrollbar">
        {[
          { id: 'today', label: "Today's Operations" },
          { id: 'weekly', label: 'Weekly Summary' },
          { id: 'monthly', label: 'Monthly Analytics' },
          { id: 'closing', label: 'Daily Cash Closing' }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 px-3.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: TODAY ===================== */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Top 6 KPI Cards as specified */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* 1. TODAY'S VEHICLES */}
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-4 rounded-2xl shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today's Vehicles
                </span>
                <Car className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {todayStats.totalServices}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Checked-in today</p>
            </div>

            {/* 2. TODAY'S SERVICES */}
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-4 rounded-2xl shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today's Services
                </span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {todayStats.completedServices}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {todayStats.pendingServices} in progress
              </p>
            </div>

            {/* 3. TODAY'S COLLECTION */}
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-4 rounded-2xl shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Today's Collection
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatCurrency(todayStats.amountCollected)}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Cash + UPI collected</p>
            </div>

            {/* 4. TODAY'S EXPENSES */}
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-4 rounded-2xl shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Today's Expenses
                </span>
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 font-mono">
                {formatCurrency(todayStats.totalExpenses)}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Chemicals & wages</p>
            </div>

            {/* 5. OUTSTANDING */}
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-4 rounded-2xl shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Outstanding Due
                </span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {formatCurrency(todayStats.outstanding)}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Pending payments</p>
            </div>

            {/* 6. NET CASH FLOW */}
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 p-4 rounded-2xl shadow-xs transition-colors">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                  Net Cash Flow
                </span>
                <ArrowUpRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div className={`text-xl sm:text-2xl font-black font-mono ${
                todayStats.netCashFlow >= 0 ? 'text-brand-600 dark:text-brand-400' : 'text-red-600'
              }`}>
                {formatCurrency(todayStats.netCashFlow)}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Collection - Expenses</p>
            </div>
          </div>

          {/* Prominent Section: TODAY'S SERVICE ACTIVITY (Table on Desktop, Cards on Mobile) */}
          <TodaysVehiclesSection
            jobs={todayVehicles}
            isLoading={isTodayLoading}
            onQuickComplete={handleQuickComplete}
            onQuickPayment={handleQuickPayment}
            onViewReceipt={handleViewReceipt}
            onManageJob={handleManageJob}
            onNewService={handleOpenNewService}
          />
        </div>
      )}

      {/* ===================== TAB 2: WEEKLY ===================== */}
      {activeTab === 'weekly' && (
        <div className="space-y-6">
          {isWeeklyLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Weekly KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Total Jobs</span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{weeklyData?.summary?.totalJobs || 0}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-1">{weeklyData?.summary?.completedJobs || 0} Completed</span>
                </div>

                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Weekly Service Value</span>
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{formatCurrency(weeklyData?.summary?.totalServiceValue || 0)}</span>
                </div>

                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Total Collected</span>
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(weeklyData?.summary?.totalCollection || 0)}</span>
                </div>

                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase block">Net Cash Flow</span>
                  <span className="text-xl font-black font-mono text-brand-600 dark:text-brand-400">{formatCurrency(weeklyData?.summary?.netCashFlow || 0)}</span>
                </div>
              </div>

              {/* Weekly Collection Trend Chart */}
              <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                  Daily Collection Trend (7 Days)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData?.dailyCollectionTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#131e35',
                          borderColor: '#1e2f50',
                          borderRadius: '0.75rem',
                          color: '#fff'
                        }}
                        formatter={(value) => [formatCurrency(value), 'Collection']}
                      />
                      <Bar dataKey="collection" fill="#0284c7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================== TAB 3: MONTHLY ANALYTICS ===================== */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {isMonthlyLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Monthly Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Total Month Services</span>
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">{monthlyData?.summary?.totalServices || 0}</span>
                </div>
                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Monthly Revenue</span>
                  <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{formatCurrency(monthlyData?.summary?.totalRevenue || 0)}</span>
                </div>
                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">Actual Collections</span>
                  <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(monthlyData?.summary?.totalCollection || 0)}</span>
                </div>
                <div className="p-4 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl">
                  <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase block">Total Expenses</span>
                  <span className="text-xl font-black font-mono text-red-600 dark:text-red-400">{formatCurrency(monthlyData?.summary?.totalExpenses || 0)}</span>
                </div>
              </div>

              {/* 4 Professional Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Daily Collection Trend */}
                <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                    Daily Collections (Month)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData?.dailyCollectionTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#131e35',
                            borderColor: '#1e2f50',
                            borderRadius: '0.75rem',
                            color: '#fff'
                          }}
                          formatter={(value) => [formatCurrency(value), 'Collection']}
                        />
                        <Bar dataKey="collection" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Service Package Distribution */}
                <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                    Service Types Breakdown
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={monthlyData?.serviceDistribution || []}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ name, percent }) => `${name.substring(0, 12)} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(monthlyData?.serviceDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#131e35',
                            borderColor: '#1e2f50',
                            borderRadius: '0.75rem',
                            color: '#fff'
                          }}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 3. Vehicle Categories Distribution */}
                <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                    Vehicle Type Breakdown
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData?.vehicleTypeDistribution || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#131e35',
                            borderColor: '#1e2f50',
                            borderRadius: '0.75rem',
                            color: '#fff'
                          }}
                        />
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 4. Payment Method Distribution */}
                <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wide mb-4">
                    Payment Method Share (Cash vs UPI vs Card)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={monthlyData?.paymentMethodDistribution || []}
                          dataKey="total"
                          nameKey="method"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {(monthlyData?.paymentMethodDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#131e35',
                            borderColor: '#1e2f50',
                            borderRadius: '0.75rem',
                            color: '#fff'
                          }}
                          formatter={(value) => [formatCurrency(value), 'Total Amount']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================== TAB 4: DAILY CLOSING ===================== */}
      {activeTab === 'closing' && (
        <div className="space-y-6">
          {isClosingLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
              <div className="border-b border-slate-100 dark:border-navy-700 pb-4 text-center sm:text-left">
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
                  Daily Closing & Cash Drawer Reconciliation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  End of day cash drawer balance check for {formatDate(closingData?.date || new Date())}
                </p>
              </div>

              {/* Collections breakdown */}
              <div className="space-y-3 text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Collections by Payment Mode
                </span>
                
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-750">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Cash Collections</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.cashCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-750">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">UPI / GPay Collections</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.upiCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-750">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Card Collections</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.cardCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-750">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Bank Transfer Collections</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.bankCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 dark:border-navy-700 font-bold bg-slate-50 dark:bg-navy-850 px-3 rounded-lg">
                  <span className="text-slate-900 dark:text-white">Total Collections</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(closingData?.totalCollected || 0)}</span>
                </div>
              </div>

              {/* Expense deductions */}
              <div className="space-y-3 text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                  Day's Expenses
                </span>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-750">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Total Expenses Logged</span>
                  <span className="font-mono font-bold text-red-600 dark:text-red-400">{formatCurrency(closingData?.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-navy-750 text-xs text-slate-500 dark:text-slate-400">
                  <span>Cash Paid for Expenses</span>
                  <span className="font-mono font-semibold">{formatCurrency(closingData?.cashExpenses || 0)}</span>
                </div>
              </div>

              {/* Expected physical cash in hand */}
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                    Expected Physical Cash in Drawer
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    (Cash Collections ₹{closingData?.cashCollections || 0} - Cash Expenses ₹{closingData?.cashExpenses || 0})
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {formatCurrency(closingData?.expectedCash || 0)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Internal New Service Modal (if triggered locally) */}
      {isInternalNewServiceOpen && (
        <NewServiceModal
          onClose={() => setIsInternalNewServiceOpen(false)}
          onSuccess={() => {
            setIsInternalNewServiceOpen(false);
            refetchToday();
          }}
        />
      )}

      {/* Quick Payment Modal */}
      {paymentModalJob && (
        <QuickPaymentModal
          job={paymentModalJob}
          onClose={() => setPaymentModalJob(null)}
          onSuccess={() => {
            setPaymentModalJob(null);
            refetchToday();
          }}
        />
      )}

      {/* Service Receipt Modal */}
      {receiptModalJob && (
        <ServiceReceiptModal
          job={receiptModalJob}
          onClose={() => setReceiptModalJob(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
