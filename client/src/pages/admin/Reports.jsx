import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Search,
  IndianRupee,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Clock,
  Car,
  Users,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

export const Reports = () => {
  const location = useLocation();
  const { addToast } = useUiStore();

  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';
  const tabParam = queryParams.get('tab') || queryParams.get('report') || '';

  const [activeReport, setActiveReport] = useState(tabParam || 'outstanding'); // 'outstanding', 'income', 'expense', 'closing', 'search'
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (tabParam && ['outstanding', 'income', 'expense', 'closing', 'search'].includes(tabParam)) {
      setActiveReport(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (initialSearch) {
      setActiveReport('search');
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  // 1. Outstanding Report Query
  const { data: outstandingData, isLoading: isOutLoading } = useQuery({
    queryKey: ['reportOutstanding'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/outstanding');
      return res.data?.data;
    },
    enabled: activeReport === 'outstanding'
  });

  // 2. Income Report Query
  const { data: incomeData, isLoading: isIncLoading } = useQuery({
    queryKey: ['reportIncome', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/revenue', { params: { startDate, endDate } });
      return res.data?.data;
    },
    enabled: activeReport === 'income'
  });

  // 3. Expense Report Query
  const { data: expenseData, isLoading: isExpLoading } = useQuery({
    queryKey: ['reportExpense', startDate, endDate],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/expense', { params: { startDate, endDate } });
      return res.data?.data;
    },
    enabled: activeReport === 'expense'
  });

  // 4. Daily Closing Query
  const { data: closingData, isLoading: isClosingLoading } = useQuery({
    queryKey: ['reportDailyClosing', endDate],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/reports/daily-closing', { params: { date: endDate } });
      return res.data?.data;
    },
    enabled: activeReport === 'closing'
  });

  // 5. Global Search Query
  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['globalSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return { customers: [], vehicles: [], jobs: [] };
      const res = await api.get('/api/v1/admin/reports/search', { params: { q: searchQuery.trim() } });
      return res.data?.data || { customers: [], vehicles: [], jobs: [] };
    },
    enabled: activeReport === 'search' && !!searchQuery.trim()
  });

  const handleExportCSV = (endpoint, filename) => {
    window.open(`${api.defaults.baseURL || ''}/api/v1/admin/reports/${endpoint}?startDate=${startDate}&endDate=${endDate}&format=csv`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200/80 dark:border-navy-700/60 shadow-xs print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Accounts & Analytical Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Financial reconciliation, receivables, income transactions, and global search.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
            Print Report
          </Button>
          {['outstanding', 'income', 'expense'].includes(activeReport) && (
            <Button
              variant="secondary"
              size="sm"
              icon={FileSpreadsheet}
              onClick={() => {
                const ep = activeReport === 'income' ? 'revenue' : activeReport;
                handleExportCSV(ep, `${activeReport}_report.csv`);
              }}
            >
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-navy-700 gap-2 overflow-x-auto no-scrollbar print:hidden">
        {[
          { id: 'outstanding', label: 'Outstanding Receivables' },
          { id: 'income', label: 'Income Report' },
          { id: 'expense', label: 'Expense Report' },
          { id: 'closing', label: 'Cash Drawer Closing' },
          { id: 'search', label: 'Global Search' }
        ].map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActiveReport(r.id)}
            className={`pb-3 px-3 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeReport === r.id
                ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Date Filters (for date-range reports) */}
      {['income', 'expense', 'closing'].includes(activeReport) && (
        <div className="bg-white dark:bg-navy-900 p-4 border border-slate-200/60 dark:border-navy-700/60 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
            {activeReport === 'closing' ? 'Select Date for Daily Closing:' : 'Select Accounting Date Range:'}
          </span>

          <div className="flex items-center gap-2">
            {activeReport !== 'closing' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200 rounded-lg text-xs"
                />
                <span className="text-slate-400">to</span>
              </>
            )}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-navy-700 dark:bg-navy-950 dark:text-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      )}

      {/* Global Search Bar (when on search tab) */}
      {activeReport === 'search' && (
        <div className="bg-white dark:bg-navy-900 p-4 border border-slate-200/60 dark:border-navy-700/60 rounded-xl shadow-xs print:hidden">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search registration (KL07AB1234), customer name, Malayalam name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-navy-900 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>
      )}

      {/* ===================== REPORT 1: OUTSTANDING ===================== */}
      {activeReport === 'outstanding' && (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-red-800 dark:text-red-300 tracking-wider block">
                Total Outstanding Receivables Due
              </span>
              <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5">
                Uncollected customer balance across all completed & waiting jobs
              </p>
            </div>
            <span className="text-2xl font-black font-mono text-red-700 dark:text-red-400">
              {formatCurrency(outstandingData?.totalOutstanding || 0)}
            </span>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-xs overflow-hidden">
            {isOutLoading ? (
              <div className="py-20 text-center"><Spinner size="lg" /></div>
            ) : (outstandingData?.jobs || []).length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
                <span>Great news! There are zero outstanding balances across customer accounts.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Vehicle Plate</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4 text-right">Bill Total</th>
                      <th className="py-3 px-4 text-right">Paid</th>
                      <th className="py-3 px-4 text-right">Balance Due</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {outstandingData.jobs.map(j => (
                      <tr key={j._id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{j.tokenNumber}</td>
                        <td className="py-3 px-4 font-mono font-black text-slate-900 dark:text-white uppercase">{j.vehicleReg}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {j.customerName || j.customerId?.name || 'Walk-in'}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                          {j.customerMobile || j.customerId?.mobile || '-'}
                        </td>
                        <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">{j.serviceName || j.washPackage}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {formatCurrency(j.finalAmount || j.price)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatCurrency(j.amountPaid || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-red-600 dark:text-red-400 text-sm">
                          {formatCurrency(j.balance)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                          {formatDate(j.createdAt, false)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== REPORT 2: INCOME ===================== */}
      {activeReport === 'income' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
              Total Actual Collections in Selected Period
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {formatCurrency(incomeData?.totalCollected || 0)}
            </span>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-xs overflow-hidden">
            {isIncLoading ? (
              <div className="py-20 text-center"><Spinner size="lg" /></div>
            ) : (incomeData?.payments || []).length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">No collections found in this date range.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Payment ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Vehicle Plate</th>
                      <th className="py-3 px-4">Service</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {incomeData.payments.map(p => (
                      <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">{p.paymentId}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{formatDate(p.date, false)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{p.customerName || 'Walk-in'}</td>
                        <td className="py-3 px-4 font-mono font-bold uppercase text-slate-900 dark:text-white">{p.vehicleReg}</td>
                        <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">{p.serviceName}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-600 dark:text-slate-400">{p.paymentMethod}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">{formatCurrency(p.amount)}</td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{p.staffName || 'Admin'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== REPORT 3: EXPENSES ===================== */}
      {activeReport === 'expense' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 dark:bg-navy-950 border border-slate-800 dark:border-navy-700 text-white rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-300 dark:text-slate-400 tracking-wider">
              Total Expenses Incurred in Selected Period
            </span>
            <span className="text-2xl font-black font-mono text-white">
              {formatCurrency(expenseData?.totalExpenses || 0)}
            </span>
          </div>

          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl shadow-xs overflow-hidden">
            {isExpLoading ? (
              <div className="py-20 text-center"><Spinner size="lg" /></div>
            ) : (expenseData?.expenses || []).length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">No expenses recorded in this period.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Title / Particulars</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Vendor</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {expenseData.expenses.map(e => (
                      <tr key={e._id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">{formatDate(e.date, false)}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{e.category}</td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{e.title || e.description}</td>
                        <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">{e.paymentMethod}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{e.vendor || '-'}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-red-600 dark:text-red-400 text-sm">{formatCurrency(e.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== REPORT 4: CLOSING ===================== */}
      {activeReport === 'closing' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 dark:border-navy-800 pb-3">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase">
              Daily Drawer Closing & Cash Reconciliation
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Date: {formatDate(closingData?.date || new Date())}</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Cash Collections</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.cashCollections || 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
              <span className="text-slate-600 dark:text-slate-300 font-medium">UPI / GPay Collections</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.upiCollections || 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Card Collections</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.cardCollections || 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Bank Transfer Collections</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(closingData?.bankCollections || 0)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-200 dark:border-navy-700 font-bold bg-slate-50 dark:bg-navy-950 px-2 rounded">
              <span className="text-slate-800 dark:text-slate-200">Total Day Collections</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(closingData?.totalCollected || 0)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-navy-800 text-slate-500 dark:text-slate-400">
              <span>Cash Outflow for Expenses</span>
              <span className="font-mono text-red-600 dark:text-red-400">-{formatCurrency(closingData?.cashExpenses || 0)}</span>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-emerald-900 dark:text-emerald-300">
              Expected Cash in Drawer:
            </span>
            <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-400">
              {formatCurrency(closingData?.expectedCash || 0)}
            </span>
          </div>
        </div>
      )}

      {/* ===================== REPORT 5: GLOBAL SEARCH RESULTS ===================== */}
      {activeReport === 'search' && (
        <div className="space-y-6">
          {isSearchLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : !searchQuery.trim() ? (
            <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
              Type a vehicle registration number, customer name, Malayalam name, or mobile number to search.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Matched Vehicles */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-brand-500" />
                  Matched Vehicles ({(searchResults?.vehicles || []).length})
                </h4>
                {(searchResults?.vehicles || []).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No vehicles matching query.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {searchResults.vehicles.map(v => (
                      <div key={v._id} className="p-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl">
                        <span className="font-mono font-black text-slate-900 dark:text-white text-sm uppercase block">{v.regNumber}</span>
                        <span className="text-slate-500 dark:text-slate-400 uppercase">{v.vehicleType} {v.brand ? `• ${v.brand}` : ''}</span>
                        {v.customerId && (
                          <span className="text-slate-600 dark:text-slate-300 font-semibold block mt-1">Owner: {v.customerId.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Customers */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-500" />
                  Matched Customers ({(searchResults?.customers || []).length})
                </h4>
                {(searchResults?.customers || []).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No customers matching query.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                    {searchResults.customers.map(c => (
                      <div key={c._id} className="p-3 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{c.name}</span>
                          {c.nameMalayalam && (
                            <span className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded">
                              {c.nameMalayalam}
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-slate-600 dark:text-slate-400 block">{c.mobile}</span>
                        {c.place && <span className="text-slate-500 dark:text-slate-400 text-[11px] block">{c.place}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matched Jobs */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-2xl p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                  Matched Service Jobs ({(searchResults?.jobs || []).length})
                </h4>
                {(searchResults?.jobs || []).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500">No service jobs matching query.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-navy-800 text-xs">
                    {searchResults.jobs.map(j => (
                      <div key={j._id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <span className="font-mono font-bold text-slate-900 dark:text-white uppercase">{j.vehicleReg}</span>
                          <span className="text-slate-500 dark:text-slate-400 ml-2">Token: {j.tokenNumber}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-2">{formatDate(j.createdAt, false)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(j.finalAmount || j.price)}</span>
                          <Badge variant={j.status}>{j.serviceStatus || j.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Reports;
