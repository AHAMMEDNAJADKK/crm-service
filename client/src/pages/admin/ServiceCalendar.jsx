import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Car,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Tag,
  CheckCircle,
  Clock,
  Printer,
  CreditCard,
  Droplet
} from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatCurrency from '../../utils/formatCurrency';
import NewServiceModal from '../../components/jobs/NewServiceModal';
import QuickPaymentModal from '../../components/payments/QuickPaymentModal';
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ServiceCalendar = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth() + 1); // 1-12

  // Format YYYY-MM-DD helper
  const formatDateKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayKey = formatDateKey(now);
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Modals state
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [receiptModalJob, setReceiptModalJob] = useState(null);

  // 1. Fetch Month-wide Data
  const { data: calendarData, isLoading: isCalendarLoading } = useQuery({
    queryKey: ['adminCalendar', currentYear, currentMonth],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/calendar', {
        params: { year: currentYear, month: currentMonth }
      });
      return res.data?.data;
    }
  });

  // 2. Fetch Selected Day's Jobs
  const { data: dayJobs = [], isLoading: isDayJobsLoading } = useQuery({
    queryKey: ['adminWashJobs', 'date', selectedDateKey],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/jobs', {
        params: { date: selectedDateKey, limit: 100 }
      });
      return res.data?.data || [];
    }
  });

  // Quick Complete Job Mutation
  const completeMutation = useMutation({
    mutationFn: async (jobId) => {
      return await api.patch(`/api/v1/admin/jobs/${jobId}/status`, { status: 'completed' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCalendar'] });
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      addToast('Vehicle marked as completed!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to update job status', 'error');
    }
  });

  // Calendar Grid Calculation
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  // Adjust so Monday is 0, Sunday is 6
  const startDayOffset = (firstDayOfMonth + 6) % 7;

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handleGoToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDateKey(formatDateKey(today));
  };

  // Day navigation for selected day
  const handleStepDay = (delta) => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + delta);
    setSelectedDateKey(formatDateKey(dateObj));
    if (dateObj.getFullYear() !== currentYear || (dateObj.getMonth() + 1) !== currentMonth) {
      setCurrentYear(dateObj.getFullYear());
      setCurrentMonth(dateObj.getMonth() + 1);
    }
  };

  // Selected Day Summary metrics
  const daySummary = calendarData?.days?.[selectedDateKey] || {
    totalVehicles: dayJobs.length,
    serviceValue: dayJobs.reduce((acc, j) => acc + (j.finalAmount || 0), 0),
    collection: dayJobs.reduce((acc, j) => acc + (j.amountPaid || 0), 0),
    expenses: 0,
    profit: dayJobs.reduce((acc, j) => acc + (j.amountPaid || 0), 0),
    outstanding: dayJobs.reduce((acc, j) => acc + (j.balance || 0), 0)
  };

  const monthSummary = calendarData?.monthSummary || {
    totalVehicles: 0,
    serviceValue: 0,
    collection: 0,
    expenses: 0,
    profit: 0,
    outstanding: 0
  };

  // Format nice human-readable date title
  const formattedSelectedDate = (() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  })();

  const isToday = selectedDateKey === todayKey;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Service Calendar
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              Date Tracking
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select any day to inspect vehicles washed, revenue, actual collections, and net profit.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Vehicle ({selectedDateKey})</span>
          </button>
        </div>
      </div>

      {/* Month Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-xs">
        <div className="flex flex-col px-3 py-1.5 border-r border-slate-100 dark:border-navy-700/60 last:border-r-0">
          <span className="text-[10px] uppercase font-bold text-slate-400">Month Vehicles</span>
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
            {monthSummary.totalVehicles}
          </span>
        </div>
        <div className="flex flex-col px-3 py-1.5 border-r border-slate-100 dark:border-navy-700/60 last:border-r-0">
          <span className="text-[10px] uppercase font-bold text-slate-400">Month Value</span>
          <span className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 font-mono">
            {formatCurrency(monthSummary.serviceValue)}
          </span>
        </div>
        <div className="flex flex-col px-3 py-1.5 border-r border-slate-100 dark:border-navy-700/60 last:border-r-0">
          <span className="text-[10px] uppercase font-bold text-blue-500">Month Collection</span>
          <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
            {formatCurrency(monthSummary.collection)}
          </span>
        </div>
        <div className="flex flex-col px-3 py-1.5 border-r border-slate-100 dark:border-navy-700/60 last:border-r-0">
          <span className="text-[10px] uppercase font-bold text-red-500">Month Expenses</span>
          <span className="text-base sm:text-lg font-black text-red-600 dark:text-red-400 font-mono">
            {formatCurrency(monthSummary.expenses)}
          </span>
        </div>
        <div className="flex flex-col px-3 py-1.5 border-r border-slate-100 dark:border-navy-700/60 last:border-r-0">
          <span className="text-[10px] uppercase font-bold text-green-500">Month Profit</span>
          <span className="text-base sm:text-lg font-black text-green-600 dark:text-green-400 font-mono">
            {formatCurrency(monthSummary.profit)}
          </span>
        </div>
        <div className="flex flex-col px-3 py-1.5">
          <span className="text-[10px] uppercase font-bold text-amber-500">Outstanding</span>
          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
            {formatCurrency(monthSummary.outstanding)}
          </span>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Day Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Calendar Widget (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 p-4 sm:p-5 shadow-xs">
          {/* Calendar Header with Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {MONTH_NAMES[currentMonth - 1]} {currentYear}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 rounded-lg text-xs font-bold border border-brand-300 dark:border-brand-700 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mobile Quick Date Picker (Part 17) */}
          <div className="sm:hidden flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-navy-700/60">
            <span className="text-xs font-bold text-slate-500">Pick Date:</span>
            <input
              type="date"
              value={selectedDateKey}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDateKey(e.target.value);
                  const [y, m] = e.target.value.split('-').map(Number);
                  setCurrentYear(y);
                  setCurrentMonth(m);
                }
              }}
              className="text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-300 dark:border-navy-600 bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white"
            />
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_OF_WEEK.map((day) => (
              <span key={day} className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400 py-0.5 sm:py-1">
                {day}
              </span>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading slots */}
            {Array.from({ length: startDayOffset }).map((_, idx) => (
              <div key={`empty-${idx}`} className="min-h-[42px] sm:h-16 rounded-lg sm:rounded-xl bg-slate-50/50 dark:bg-navy-900/30" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = dateStr === selectedDateKey;
              const isTodayCell = dateStr === todayKey;
              const dayData = calendarData?.days?.[dateStr];
              const hasVehicles = dayData && dayData.totalVehicles > 0;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDateKey(dateStr)}
                  className={`min-h-[42px] sm:h-16 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border flex flex-col justify-between transition-all cursor-pointer text-left relative ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 ring-2 ring-brand-500 shadow-sm'
                      : isTodayCell
                      ? 'border-brand-400 bg-white dark:bg-navy-800'
                      : 'border-slate-100 dark:border-navy-700/60 bg-white dark:bg-navy-850 hover:bg-slate-50 dark:hover:bg-navy-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isSelected
                          ? 'text-brand-700 dark:text-brand-300 font-black'
                          : isTodayCell
                          ? 'text-brand-600 font-extrabold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isTodayCell && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" title="Today" />
                    )}
                  </div>

                  {/* Activity Indicator / Count */}
                  {hasVehicles ? (
                    <div className="flex flex-col mt-auto overflow-hidden">
                      <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 truncate">
                        {dayData.totalVehicles} veh
                      </span>
                      {dayData.collection > 0 && (
                        <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 truncate">
                          ₹{Math.round(dayData.collection)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] text-slate-300 dark:text-slate-600">—</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Date Input for Mobile/Direct Access */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-700 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-brand-500" />
              Jump to date:
            </span>
            <input
              type="date"
              value={selectedDateKey}
              onChange={(e) => {
                if (!e.target.value) return;
                setSelectedDateKey(e.target.value);
                const [y, m] = e.target.value.split('-').map(Number);
                if (y !== currentYear || m !== currentMonth) {
                  setCurrentYear(y);
                  setCurrentMonth(m);
                }
              }}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-600 bg-white dark:bg-navy-900 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Selected Day Details (5-7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-7 space-y-4">
          {/* Day Header Banner with Prev / Today / Next Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {formattedSelectedDate}
                </span>
                {isToday && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-brand-500 text-white">
                    Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {daySummary.totalVehicles} vehicle{daySummary.totalVehicles === 1 ? '' : 's'} recorded for this service date
              </p>
            </div>

            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <button
                onClick={() => handleStepDay(-1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Previous Day
              </button>
              <button
                onClick={() => handleStepDay(1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Next Day
              </button>
            </div>
          </div>

          {/* 6 Day KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. Vehicles */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicles</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {daySummary.totalVehicles}
                </span>
              </div>
            </div>

            {/* 2. Service Value */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-navy-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Value</span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono">
                  {formatCurrency(daySummary.serviceValue)}
                </span>
              </div>
            </div>

            {/* 3. Collection (Blue) */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                  Collection
                </span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-300 font-mono">
                  {formatCurrency(daySummary.collection)}
                </span>
              </div>
            </div>

            {/* 4. Expenses (Red) */}
            <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 block">
                  Expenses
                </span>
                <span className="text-lg font-black text-rose-700 dark:text-rose-300 font-mono">
                  {formatCurrency(daySummary.expenses)}
                </span>
              </div>
            </div>

            {/* 5. Profit (Green) */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">
                  Net Profit
                </span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {formatCurrency(daySummary.profit)}
                </span>
              </div>
            </div>

            {/* 6. Outstanding (Orange) */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block">
                  Outstanding
                </span>
                <span className="text-lg font-black text-amber-700 dark:text-amber-300 font-mono">
                  {formatCurrency(daySummary.outstanding)}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicles List for Selected Day */}
          <div className="bg-white dark:bg-navy-800 rounded-2xl border border-slate-200 dark:border-navy-700 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-navy-700/80 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-brand-500" />
                Vehicles for {selectedDateKey} ({dayJobs.length})
              </span>
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
              >
                + Add Record
              </button>
            </div>

            {isDayJobsLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading service records...</div>
            ) : dayJobs.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Droplet className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No vehicle service entries recorded for this date.
                </p>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors cursor-pointer"
                >
                  + Add First Vehicle for {selectedDateKey}
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-navy-700/60">
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-navy-900/60 text-slate-400 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Vehicle</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3">Balance</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-navy-700/40 font-medium">
                      {dayJobs.map((job) => {
                        const isPaid = job.paymentStatus === 'paid' || job.balance <= 0;
                        const isPartial = job.paymentStatus === 'partial' || (job.amountPaid > 0 && job.balance > 0);

                        return (
                          <tr key={job._id} className="hover:bg-slate-50/70 dark:hover:bg-navy-750/50">
                            <td className="py-2.5 px-3">
                              <span className="font-mono font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                                {job.vehicleReg}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {job.tokenNumber}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                                {job.vehicleType}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                              {job.serviceName || 'Standard Wash'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-white font-mono">
                              {formatCurrency(job.finalAmount)}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400 font-mono">
                              {formatCurrency(job.amountPaid)}
                            </td>
                            <td className="py-2.5 px-3 font-bold font-mono">
                              {job.balance > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400">
                                  {formatCurrency(job.balance)}
                                </span>
                              ) : (
                                <span className="text-slate-400">₹0</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isPaid
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : isPartial
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                }`}
                              >
                                {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {job.balance > 0 && (
                                  <button
                                    onClick={() => setPaymentModalJob(job)}
                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 text-emerald-600"
                                    title="Collect Payment"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => setReceiptModalJob(job)}
                                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                  title="Receipt"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                {job.status !== 'completed' && job.status !== 'delivered' && (
                                  <button
                                    onClick={() => completeMutation.mutate(job._id)}
                                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-navy-700 text-blue-600"
                                    title="Mark Complete"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
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

                {/* Mobile Cards View */}
                <div className="sm:hidden divide-y divide-slate-100 dark:divide-navy-700/60 p-2 space-y-2">
                  {dayJobs.map((job) => {
                    const isPaid = job.paymentStatus === 'paid' || job.balance <= 0;
                    const isPartial = job.paymentStatus === 'partial' || (job.amountPaid > 0 && job.balance > 0);

                    return (
                      <div key={job._id} className="p-3 rounded-xl bg-slate-50/70 dark:bg-navy-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                            {job.vehicleReg}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : isPartial
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}
                          >
                            {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                            {job.vehicleType} • {job.serviceName || 'Wash'}
                          </span>
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrency(job.finalAmount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-navy-700/40 text-xs font-mono">
                          <span className="text-blue-600 dark:text-blue-400">
                            Paid: {formatCurrency(job.amountPaid)}
                          </span>
                          {job.balance > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              Due: {formatCurrency(job.balance)}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">Cleared</span>
                          )}
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {job.balance > 0 && (
                            <button
                              onClick={() => setPaymentModalJob(job)}
                              className="px-2 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              Pay
                            </button>
                          )}
                          <button
                            onClick={() => setReceiptModalJob(job)}
                            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Vehicle Modal with Selected Date pre-filled */}
      {isAddVehicleOpen && (
        <NewServiceModal
          isOpen={isAddVehicleOpen}
          initialDate={selectedDateKey}
          onClose={() => setIsAddVehicleOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['adminCalendar'] });
            queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
          }}
        />
      )}

      {/* Collect Payment Modal */}
      {paymentModalJob && (
        <QuickPaymentModal
          isOpen={!!paymentModalJob}
          job={paymentModalJob}
          onClose={() => setPaymentModalJob(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['adminCalendar'] });
            queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
          }}
        />
      )}

      {/* Service Receipt Modal */}
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

export default ServiceCalendar;
