import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  FileDown,
  DollarSign,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Award,
  Clock,
  Sparkles,
  Droplet
} from 'lucide-react';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import VEHICLE_TYPES from '../../constants/vehicleTypes';
import WASH_PACKAGES from '../../constants/washPackages';

// Zod schemas for manual forms
const manualRevenueSchema = z.object({
  date: z.string().nonempty('Date is required'),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  vehicleType: z.string().optional(),
  washPackage: z.string().optional(),
  amount: z.string().transform((v) => parseFloat(v)).refine((v) => !isNaN(v) && v > 0, 'Amount must be positive'),
  paymentMethod: z.enum(['upi', 'cash', 'card', 'credit']),
  notes: z.string().optional()
});

const manualExpenseSchema = z.object({
  date: z.string().nonempty('Date is required'),
  category: z.enum([
    'water-supply',
    'electricity',
    'wages',
    'cleaning-chemicals',
    'equipment-repair',
    'fuel-generator',
    'marketing',
    'rent',
    'other'
  ]),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.string().transform((v) => parseFloat(v)).refine((v) => !isNaN(v) && v > 0, 'Amount must be positive'),
  vendor: z.string().optional(),
  notes: z.string().optional()
});

// Expanded Details Component
const LedgerDayDetailsRow = ({ date }) => {
  const { data: detailsData, isLoading } = useQuery({
    queryKey: ['adminLedgerDayDetails', date],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/ledger/day/${date}`);
      return data.data;
    }
  });

  if (isLoading) {
    return (
      <tr className="bg-slate-50/60">
        <td colSpan={6} className="p-4 text-center">
          <Spinner size="sm" />
        </td>
      </tr>
    );
  }

  const { invoices = [], manualRevenues = [], expenses = [] } = detailsData || {};

  return (
    <tr className="bg-slate-50/60 border-b border-slate-200">
      <td colSpan={6} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          {/* Revenue Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="font-extrabold text-slate-800 text-xs mb-3 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Day Revenue Breakdown
            </h4>
            {invoices.length === 0 && manualRevenues.length === 0 ? (
              <p className="text-slate-400 text-xs py-2">No revenue logged for this date.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {invoices.map((inv) => (
                  <div key={inv._id} className="flex justify-between items-center border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-700">{inv.invoiceNumber}</span>
                      <span className="text-[10px] text-slate-400 block uppercase mt-0.5">
                        {inv.vehicleReg} • {inv.washPackage.replace('-', ' ')}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(inv.grandTotal)}</span>
                  </div>
                ))}
                {manualRevenues.map((mr) => (
                  <div key={mr._id} className="flex justify-between items-center border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-700">{mr.description}</span>
                      <span className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                        <Badge variant="info">Manual</Badge>
                        {mr.paymentMethod.toUpperCase()}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(mr.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h4 className="font-extrabold text-slate-800 text-xs mb-3 uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              Day Expense Breakdown
            </h4>
            {expenses.length === 0 ? (
              <p className="text-slate-400 text-xs py-2">No expenses logged for this date.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                {expenses.map((exp) => (
                  <div key={exp._id} className="flex justify-between items-center border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <span className="font-bold text-slate-700 truncate block max-w-xs">{exp.description}</span>
                      <span className="text-[10px] text-slate-400 block capitalize mt-0.5">
                        {exp.category.replace('-', ' ')} {exp.vendor ? `• Vendor: ${exp.vendor}` : ''}
                      </span>
                    </div>
                    <span className="font-extrabold text-red-600">-{formatCurrency(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </td>
    </tr>
  );
};

export const Ledger = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [mode, setMode] = useState('day'); // 'day', 'month', 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedRows, setExpandedRows] = useState({});
  const [isManualRevOpen, setIsManualRevOpen] = useState(false);
  const [isManualExpOpen, setIsManualExpOpen] = useState(false);

  // Parse Period
  const getPeriodString = () => {
    const yyyy = currentDate.getFullYear();
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
    if (mode === 'day') return `${yyyy}-${mm}`;
    if (mode === 'month') return `${yyyy}`;
    return '';
  };

  const getPeriodLabel = () => {
    if (mode === 'day') {
      return currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    if (mode === 'month') {
      return currentDate.getFullYear().toString();
    }
    return 'Lifetime History';
  };

  // Fetch Ledger Data
  const { data: ledgerData, isLoading } = useQuery({
    queryKey: ['adminLedger', mode, getPeriodString()],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/ledger', {
        params: { mode, period: getPeriodString() }
      });
      return data.data;
    }
  });

  // Manual Revenue form
  const { register: regRev, handleSubmit: onSubmitRev, reset: resetRev, formState: { errors: revErrors } } = useForm({
    resolver: zodResolver(manualRevenueSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      description: '',
      vehicleType: '',
      washPackage: '',
      amount: '',
      paymentMethod: 'upi',
      notes: ''
    }
  });

  // Manual Expense form
  const { register: regExp, handleSubmit: onSubmitExp, reset: resetExp, formState: { errors: expErrors } } = useForm({
    resolver: zodResolver(manualExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      category: 'cleaning-chemicals',
      description: '',
      amount: '',
      vendor: '',
      notes: ''
    }
  });

  // Revenue Mutation
  const addRevenueMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/ledger/revenue', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLedger'] });
      addToast('Manual revenue backfilled successfully!', 'success');
      resetRev();
      setIsManualRevOpen(false);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to create revenue', 'error');
    }
  });

  // Expense Mutation
  const addExpenseMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/ledger/expense', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLedger'] });
      addToast('Manual expense backfilled successfully!', 'success');
      resetExp();
      setIsManualExpOpen(false);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to create expense', 'error');
    }
  });

  // Handlers
  const handlePrev = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (mode === 'day') next.setMonth(prev.getMonth() - 1);
      if (mode === 'month') next.setFullYear(prev.getFullYear() - 1);
      return next;
    });
    setExpandedRows({});
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      if (mode === 'day') next.setMonth(prev.getMonth() + 1);
      if (mode === 'month') next.setFullYear(prev.getFullYear() + 1);
      return next;
    });
    setExpandedRows({});
  };

  const handleJumpToCurrent = () => {
    setCurrentDate(new Date());
    setExpandedRows({});
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setExpandedRows({});
  };

  const toggleRowExpand = (date) => {
    setExpandedRows(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const handleExportCSV = () => {
    const period = getPeriodString();
    const url = `${api.defaults.baseURL || ''}/api/v1/admin/ledger/export?mode=${mode}&period=${period}`;
    window.open(url, '_blank');
    addToast('Starting ledger CSV download...', 'info');
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header and Download Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Revenue & Expense Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">Audit audited bookings, operational payouts, and backfill historical data.</p>
        </div>
        <Button onClick={handleExportCSV} icon={FileDown}>
          Download CSV
        </Button>
      </div>

      {/* Date Navigation and View selectors */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-xs">
        {/* Toggle Mode buttons */}
        <div className="flex gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
          {['day', 'month', 'year'].map(m => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                mode === m
                  ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              By {m}
            </button>
          ))}
        </div>

        {/* Date Stepper */}
        {mode !== 'year' && (
          <div className="flex items-center gap-3">
            <button onClick={handlePrev} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-extrabold text-slate-700 min-w-[100px] text-center">
              {getPeriodLabel()}
            </span>
            <button onClick={handleNext} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
            
            <button
              onClick={handleJumpToCurrent}
              className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 cursor-pointer transition-colors"
            >
              {mode === 'day' ? 'This Month' : 'This Year'}
            </button>
          </div>
        )}
      </div>

      {/* Section A: Summary KPI Cards */}
      {isLoading ? (
        <div className="py-10 flex justify-center"><Spinner size="lg" /></div>
      ) : ledgerData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs border-l-4 border-l-green-500">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Revenue</span>
                <span className="font-extrabold text-xl text-emerald-600 mt-2 block">
                  {formatCurrency(ledgerData.summary.revenue)}
                </span>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            </div>

            <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs border-l-4 border-l-red-500">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Expenses</span>
                <span className="font-extrabold text-xl text-rose-600 mt-2 block">
                  -{formatCurrency(ledgerData.summary.expenses)}
                </span>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-5 h-5" /></div>
            </div>

            <div className={`bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs border-l-4 ${
              ledgerData.summary.net >= 0 ? 'border-l-blue-500' : 'border-l-red-500'
            }`}>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Net Profit</span>
                <span className={`font-black text-xl mt-2 block ${ledgerData.summary.net >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                  {formatCurrency(ledgerData.summary.net)}
                </span>
              </div>
              <div className={`p-3 rounded-xl ${ledgerData.summary.net >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs border-l-4 border-l-slate-400">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Washes Logged</span>
                <span className="font-extrabold text-xl text-slate-800 mt-2 block">
                  {ledgerData.summary.washCount} washes
                </span>
              </div>
              <div className="p-3 bg-slate-50 text-slate-600 rounded-xl"><Droplet className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Section B: Recharts Composed Graphic */}
          <Card title="Revenue vs Expenses Comparison" subtitle="Financial overlay showing margin trends">
            <div className="w-full h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ledgerData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="revenue" name="Revenue (₹)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="expenses" name="Expense (₹)" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
                  <Line type="monotone" dataKey="net" name="Net Margin (₹)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Section C: Detailed Ledger Table */}
          <Card title="Financial Transaction Ledger">
            <TableContainer>
              <Thead>
                <Tr>
                  <Th>{mode === 'day' ? 'Date' : mode === 'month' ? 'Month' : 'Year'}</Th>
                  <Th>Revenue (₹)</Th>
                  <Th>Expenses (₹)</Th>
                  <Th>Net Margin (₹)</Th>
                  <Th>Washes</Th>
                  {mode === 'day' && <Th className="text-right">Breakdown</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {ledgerData.rows.length === 0 ? (
                  <Tr>
                    <td colSpan={mode === 'day' ? 6 : 5} className="p-8 text-center text-slate-400">No records found for this period</td>
                  </Tr>
                ) : (
                  ledgerData.rows.map((row) => {
                    const label = row.date || row.month || row.year;
                    const isExpanded = !!expandedRows[label];
                    const isNegative = row.net < 0;

                    return (
                      <React.Fragment key={label}>
                        <Tr
                          onClick={mode === 'month' ? () => {
                            const [y, m] = row.month.split('-');
                            setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
                            setMode('day');
                          } : undefined}
                          className={mode === 'month' ? 'hover:bg-slate-50 cursor-pointer' : ''}
                        >
                          <Td className="font-bold text-slate-800">
                            {mode === 'day' ? label.split('-')[2] + ' ' + currentDate.toLocaleDateString('en-IN', { month: 'short' }) : label}
                          </Td>
                          <Td className="font-bold text-emerald-600">{formatCurrency(row.revenue)}</Td>
                          <Td className="font-bold text-rose-600">-{formatCurrency(row.expenses)}</Td>
                          <Td className={`font-extrabold ${isNegative ? 'text-rose-600 bg-red-50/50' : 'text-blue-600'}`}>
                            {formatCurrency(row.net)}
                          </Td>
                          <Td className="font-medium text-slate-500">{row.washCount}</Td>
                          {mode === 'day' && (
                            <Td className="text-right">
                              <button
                                onClick={() => toggleRowExpand(label)}
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </Td>
                          )}
                        </Tr>
                        {mode === 'day' && isExpanded && (
                          <LedgerDayDetailsRow date={label} />
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </Tbody>
            </TableContainer>
          </Card>
        </>
      )}

      {/* Section D: Manual Entries panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
        {/* Panel 1: Manual Revenue Backfill */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
          <button
            onClick={() => setIsManualRevOpen(!isManualRevOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-colors cursor-pointer text-left"
          >
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Backfill Manual Revenue</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Add historical offline wash cash collections</p>
            </div>
            <Plus className={`w-4 h-4 text-slate-500 transition-transform ${isManualRevOpen ? 'rotate-45' : ''}`} />
          </button>
          
          {isManualRevOpen && (
            <form onSubmit={onSubmitRev((data) => addRevenueMutation.mutate(data))} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Date</label>
                  <input type="date" {...regRev('date')} className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  {revErrors.date && <span className="text-[10px] text-red-500 font-medium block mt-1">{revErrors.date.message}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Amount (₹)</label>
                  <input type="number" {...regRev('amount')} placeholder="e.g. 800" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  {revErrors.amount && <span className="text-[10px] text-red-500 font-medium block mt-1">{revErrors.amount.message}</span>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Description</label>
                <input type="text" {...regRev('description')} placeholder="e.g. Offline Walk-in Sedans combo" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                {revErrors.description && <span className="text-[10px] text-red-500 font-medium block mt-1">{revErrors.description.message}</span>}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Vehicle type</label>
                  <select {...regRev('vehicleType')} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="">None</option>
                    {VEHICLE_TYPES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Wash Package</label>
                  <select {...regRev('washPackage')} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="">None</option>
                    {WASH_PACKAGES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Method</label>
                  <select {...regRev('paymentMethod')} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="upi">UPI</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="credit">Store Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Internal Notes</label>
                <textarea {...regRev('notes')} rows="1" placeholder="Backfilled cash receipts" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs resize-none" />
              </div>

              <div className="flex justify-end mt-1">
                <Button type="submit" isLoading={addRevenueMutation.isPending}>Save Revenue</Button>
              </div>
            </form>
          )}
        </div>

        {/* Panel 2: Manual Expense Backfill */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden">
          <button
            onClick={() => setIsManualExpOpen(!isManualExpOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 border-b border-slate-100 transition-colors cursor-pointer text-left"
          >
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Backfill Manual Expense</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Add historical offline business operational costs</p>
            </div>
            <Plus className={`w-4 h-4 text-slate-500 transition-transform ${isManualExpOpen ? 'rotate-45' : ''}`} />
          </button>
          
          {isManualExpOpen && (
            <form onSubmit={onSubmitExp((data) => addExpenseMutation.mutate(data))} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Date</label>
                  <input type="date" {...regExp('date')} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  {expErrors.date && <span className="text-[10px] text-red-500 font-medium block mt-1">{expErrors.date.message}</span>}
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Category</label>
                  <select {...regExp('category')} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white">
                    <option value="water-supply">Water Tankers</option>
                    <option value="electricity">Electricity Grid</option>
                    <option value="wages">Deck Wages</option>
                    <option value="cleaning-chemicals">Chemical Refills</option>
                    <option value="equipment-repair">Pump Repair</option>
                    <option value="fuel-generator">Diesel Fuel</option>
                    <option value="marketing">Local Ads</option>
                    <option value="rent">Land Parcel Rent</option>
                    <option value="other">Other Overhead</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Amount (₹)</label>
                  <input type="number" {...regExp('amount')} placeholder="e.g. 1500" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  {expErrors.amount && <span className="text-[10px] text-red-500 font-medium block mt-1">{expErrors.amount.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Description</label>
                  <input type="text" {...regExp('description')} placeholder="e.g. Generator spare fanbelt" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                  {expErrors.description && <span className="text-[10px] text-red-500 font-medium block mt-1">{expErrors.description.message}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Vendor / Payee</label>
                  <input type="text" {...regExp('vendor')} placeholder="e.g. Kochi Machinery Union" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Notes</label>
                <textarea {...regExp('notes')} rows="1" placeholder="Backfilled petty cash vouchers" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs resize-none" />
              </div>

              <div className="flex justify-end mt-1">
                <Button type="submit" isLoading={addExpenseMutation.isPending}>Save Expense</Button>
              </div>
            </form>
          )}
        </div>
      </div>

    </div>
  );
};

export default Ledger;
