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
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

import QuickActionsBar from '../../components/common/QuickActionsBar';
import TodaysVehiclesSection from '../../components/jobs/TodaysVehiclesSection';
import NewServiceModal from '../../components/jobs/NewServiceModal';
import QuickPaymentModal from '../../components/payments/QuickPaymentModal';
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

const CHART_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

export const Dashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addToast, stationSettings } = useUiStore();

  const [activeTab, setActiveTab] = useState('today'); // 'today', 'weekly', 'monthly', 'closing'

  // Modal states
  const [isNewServiceOpen, setIsNewServiceOpen] = useState(false);
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [receiptModalJob, setReceiptModalJob] = useState(null);

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
    totalServiceValue: 0,
    amountCollected: 0,
    outstanding: 0,
    totalExpenses: 0,
    netCashFlow: 0
  };

  const todayVehicles = todayData?.todayVehicles || [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
      
      {/* Top Banner / Mobile Quick Actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Service Station Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE'} • Real-time Operations
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
              onClick={() => setIsNewServiceOpen(true)}
              className="font-bold text-xs"
            >
              New Service
            </Button>
          </div>
        </div>

        {/* Mobile Quick Action Buttons Bar */}
        <QuickActionsBar
          onNewService={() => setIsNewServiceOpen(true)}
          onNewCustomer={() => navigate('/admin/customers')}
          onNewVehicle={() => navigate('/admin/vehicles')}
          onNewExpense={() => navigate('/admin/expenses')}
          onViewTodaysVehicles={() => setActiveTab('today')}
          onViewOutstanding={() => navigate('/admin/reports')}
        />
      </div>

      {/* Tabs Bar: Today / Weekly / Monthly / Daily Closing */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2 no-scrollbar">
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
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: TODAY ===================== */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          {/* Today's 8 Core Operational KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* 1. Total Services */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Services</span>
                <Car className="w-4 h-4 text-brand-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {todayStats.totalServices}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Vehicles checked-in today</p>
            </div>

            {/* 2. Completed Services */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                {todayStats.completedServices}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{todayStats.pendingServices} pending in service</p>
            </div>

            {/* 3. Service Work Done (Sales Value) */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Service Value</span>
                <IndianRupee className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(todayStats.totalServiceValue)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total work value today</p>
            </div>

            {/* 4. Amount Collected */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Money Collected</span>
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">
                {formatCurrency(todayStats.amountCollected)}
              </div>
              <p className="text-[11px] text-emerald-700/70 mt-1">Actual collections received</p>
            </div>

            {/* 5. Outstanding Receivables */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Outstanding Due</span>
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-red-600 font-mono">
                {formatCurrency(todayStats.outstanding)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Pending payments from today</p>
            </div>

            {/* 6. Today's Expenses */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Expenses</span>
                <TrendingDown className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono">
                {formatCurrency(todayStats.totalExpenses)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Materials, fuel, wages</p>
            </div>

            {/* 7. Net Cash Flow */}
            <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs col-span-2 bg-gradient-to-br from-white to-blue-50/30">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800">
                  Net Cash Flow (Collected - Spent)
                </span>
                <ArrowUpRight className="w-4 h-4 text-brand-600" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono ${
                todayStats.netCashFlow >= 0 ? 'text-brand-600' : 'text-red-600'
              }`}>
                {formatCurrency(todayStats.netCashFlow)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Calculated safely from actual cash collected minus expenses</p>
            </div>

          </div>

          {/* Prominent Section: TODAY'S VEHICLES */}
          <TodaysVehiclesSection
            jobs={todayVehicles}
            isLoading={isTodayLoading}
            onQuickComplete={handleQuickComplete}
            onQuickPayment={handleQuickPayment}
            onViewReceipt={handleViewReceipt}
            onManageJob={handleManageJob}
            onNewService={() => setIsNewServiceOpen(true)}
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
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Jobs</span>
                  <span className="text-2xl font-black font-mono text-slate-900">{weeklyData?.summary?.totalJobs || 0}</span>
                  <span className="text-xs text-slate-500 block mt-1">{weeklyData?.summary?.completedJobs || 0} Completed</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Weekly Service Value</span>
                  <span className="text-xl font-black font-mono text-slate-900">{formatCurrency(weeklyData?.summary?.totalServiceValue || 0)}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase block">Total Collected</span>
                  <span className="text-xl font-black font-mono text-emerald-600">{formatCurrency(weeklyData?.summary?.totalCollection || 0)}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Net Cash Flow</span>
                  <span className="text-xl font-black font-mono text-brand-600">{formatCurrency(weeklyData?.summary?.netCashFlow || 0)}</span>
                </div>
              </div>

              {/* Weekly Collection Trend Chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">
                  Daily Collection Trend (This Week)
                </h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData?.dailyCollectionTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [formatCurrency(value), 'Collection']} />
                      <Bar dataKey="collection" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================== TAB 3: MONTHLY ===================== */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {isMonthlyLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <>
              {/* Monthly KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Monthly Services</span>
                  <span className="text-2xl font-black font-mono text-slate-900">{monthlyData?.summary?.totalServices || 0}</span>
                  <span className="text-xs text-slate-500 block mt-1">Avg: {formatCurrency(monthlyData?.summary?.avgServiceValue || 0)} / job</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Total Revenue</span>
                  <span className="text-xl font-black font-mono text-slate-900">{formatCurrency(monthlyData?.summary?.totalRevenue || 0)}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase block">Total Collected</span>
                  <span className="text-xl font-black font-mono text-emerald-600">{formatCurrency(monthlyData?.summary?.totalCollection || 0)}</span>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                  <span className="text-[11px] font-bold text-brand-600 uppercase block">Net Cash Flow</span>
                  <span className="text-xl font-black font-mono text-brand-600">{formatCurrency(monthlyData?.summary?.netCashFlow || 0)}</span>
                </div>
              </div>

              {/* Highlights: Top Service & Top Vehicle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Most In-Demand Service</span>
                    <p className="text-base font-extrabold capitalize mt-1">{monthlyData?.summary?.mostUsedService || 'N/A'}</p>
                  </div>
                  <Sparkles className="w-6 h-6 text-brand-400" />
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Vehicle Category</span>
                    <p className="text-base font-extrabold uppercase mt-1">{monthlyData?.summary?.mostServicedVehicleType || 'N/A'}</p>
                  </div>
                  <Car className="w-6 h-6 text-brand-400" />
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Daily Collection Trend (Day 1 - 31) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">
                    Daily Collection Trend (Day 1 → End)
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData?.dailyCollectionTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => [formatCurrency(v), 'Collection']} />
                        <Bar dataKey="collection" fill="#0284c7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Service Package Distribution */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-4">
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
                        <Tooltip />
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-6">
              <div className="border-b border-slate-100 pb-4 text-center sm:text-left">
                <h3 className="text-lg font-black text-slate-900 uppercase">
                  Daily Closing & Cash Reconciliation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  End of day cash drawer balance check for {formatDate(closingData?.date || new Date())}
                </p>
              </div>

              {/* Collections breakdown */}
              <div className="space-y-3 text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Collections by Payment Mode
                </span>
                
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Cash Collections</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(closingData?.cashCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">UPI / GPay Collections</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(closingData?.upiCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Card Collections</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(closingData?.cardCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Bank Transfer Collections</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(closingData?.bankCollections || 0)}</span>
                </div>

                <div className="flex justify-between py-2 border-b border-slate-200 font-bold bg-slate-50 px-3 rounded-lg">
                  <span>Total Collections</span>
                  <span className="font-mono text-emerald-600">{formatCurrency(closingData?.totalCollected || 0)}</span>
                </div>
              </div>

              {/* Expense deductions */}
              <div className="space-y-3 text-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Day's Expenses
                </span>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-700">Total Expenses Logged</span>
                  <span className="font-mono font-bold text-red-600">{formatCurrency(closingData?.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100 text-xs text-slate-500">
                  <span>Cash Paid for Expenses</span>
                  <span className="font-mono font-semibold">{formatCurrency(closingData?.cashExpenses || 0)}</span>
                </div>
              </div>

              {/* Expected physical cash in hand */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase block">
                    Expected Physical Cash in Drawer
                  </span>
                  <span className="text-[11px] text-emerald-600">Cash Collections - Cash Expenses</span>
                </div>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {formatCurrency(closingData?.expectedCash || 0)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Fast New Service Registration */}
      <NewServiceModal
        isOpen={isNewServiceOpen}
        onClose={() => setIsNewServiceOpen(false)}
        onSuccess={(createdJob) => {
          if (createdJob) {
            setReceiptModalJob(createdJob);
          }
        }}
      />

      {/* MODAL 2: Record Service Payment */}
      <QuickPaymentModal
        isOpen={!!paymentModalJob}
        onClose={() => setPaymentModalJob(null)}
        job={paymentModalJob}
      />

      {/* MODAL 3: Printable Service Receipt */}
      <ServiceReceiptModal
        isOpen={!!receiptModalJob}
        onClose={() => setReceiptModalJob(null)}
        job={receiptModalJob}
        stationSettings={stationSettings}
      />

    </div>
  );
};

export default Dashboard;
