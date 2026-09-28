import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  FileText,
  Upload,
  TrendingDown,
  Filter,
  DollarSign
} from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';

import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import MalayalamInputHelper from '../../components/common/MalayalamInputHelper';

const REQUIRED_CATEGORIES = [
  'Cleaning Materials',
  'Foam / Shampoo',
  'Undercoating Materials',
  'Water',
  'Electricity',
  'Salary',
  'Equipment',
  'Equipment Maintenance',
  'Rent',
  'Transport',
  'Miscellaneous',
  'Other'
];

export const Expenses = () => {
  const queryClient = useQueryClient();
  const { addToast, stationSettings } = useUiStore();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Cleaning Materials',
    title: '',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    vendor: '',
    notes: ''
  });

  const categories = stationSettings?.expenseCategories?.length > 0
    ? stationSettings.expenseCategories
    : REQUIRED_CATEGORIES;

  // 1. Fetch Expenses Query
  const { data: expensesData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminExpenses', search, category, startDate, endDate, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/expenses', {
        params: { page, limit: 30, search, category, startDate, endDate }
      });
      return data;
    }
  });

  // 2. Fetch Category Summary
  const { data: summaryData } = useQuery({
    queryKey: ['adminExpensesSummary', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/expenses/summary', {
        params: { startDate, endDate }
      });
      return data.data;
    }
  });

  // Create / Edit Mutation
  const saveExpenseMutation = useMutation({
    mutationFn: async (payload) => {
      const mapped = {
        ...payload,
        amount: parseFloat(payload.amount)
      };
      if (editingExpense) {
        return await api.put(`/api/v1/admin/expenses/${editingExpense._id}`, mapped);
      } else {
        return await api.post('/api/v1/admin/expenses', mapped);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['adminExpensesSummary'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      addToast(editingExpense ? 'Expense updated successfully' : 'Expense recorded successfully', 'success');
      closeFormModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save expense', 'error');
    }
  });

  // Delete Mutation
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['adminExpensesSummary'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      addToast('Expense entry deleted', 'info');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to delete expense', 'error');
    }
  });

  const openCreateModal = () => {
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      category: categories[0] || 'Cleaning Materials',
      title: '',
      description: '',
      amount: '',
      paymentMethod: 'cash',
      vendor: '',
      notes: ''
    });
    setIsFormOpen(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setFormData({
      date: exp.date ? new Date(exp.date).toISOString().split('T')[0] : '',
      category: exp.category,
      title: exp.title || exp.description,
      description: exp.description || exp.title,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod || 'cash',
      vendor: exp.vendor || '',
      notes: exp.notes || ''
    });
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const expensesList = expensesData?.data || [];
  const totalSpent = expensesData?.summary?.totalSpent || summaryData?.totalSpent || 0;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-800 p-6 rounded-2xl border border-slate-200/80 dark:border-navy-700 shadow-xs transition-colors">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Expense Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track cleaning chemicals, shampoo, electricity, water, rent, and staff maintenance costs for AHAMMED SONS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 rounded-xl">
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase block">Total Expenses:</span>
            <span className="text-lg font-black font-mono text-red-700 dark:text-red-300">{formatCurrency(totalSpent)}</span>
          </div>

          <Button icon={Plus} onClick={openCreateModal}>
            Log Expense
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-navy-800 p-4 border border-slate-200/60 dark:border-navy-700 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search expense description, vendor, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
          />

          {(search || category || startDate || endDate) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setCategory(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-semibold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700 rounded-2xl shadow-xs overflow-hidden transition-colors">
        {isListLoading ? (
          <div className="py-20 text-center"><Spinner size="lg" /></div>
        ) : expensesList.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">No expense records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-navy-850 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title / Particulars</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-750">
                {expensesList.map(exp => (
                  <tr key={exp._id} className="hover:bg-slate-50/60 dark:hover:bg-navy-750/50 transition-colors">
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {formatDate(exp.date, false)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-navy-750 px-2 py-0.5 rounded text-[11px]">
                        {exp.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                      {exp.title || exp.description}
                      {exp.notes && <span className="block text-[10px] text-slate-400 font-normal">{exp.notes}</span>}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {exp.vendor || '-'}
                    </td>

                    <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {exp.paymentMethod}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-red-600 dark:text-red-400 text-sm">
                      {formatCurrency(exp.amount)}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-750 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this expense entry?')) {
                            deleteExpenseMutation.mutate(exp._id);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT EXPENSE MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingExpense ? 'Edit Expense' : 'Log Station Expense'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveExpenseMutation.mutate(formData);
          }}
          className="flex flex-col gap-4 text-slate-800 dark:text-slate-200 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Expense Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Expense Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 cursor-pointer"
                required
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Title / Description</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value, description: e.target.value }))}
              placeholder="E.g. 50L Foam wash shampoo can"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm capitalize text-slate-800 dark:text-slate-100 cursor-pointer"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI / GPay</option>
                <option value="card">Card</option>
                <option value="bank-transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Vendor / Shop Name (Optional)</label>
            <input
              type="text"
              value={formData.vendor}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
              placeholder="E.g. Kozhikode Auto Chemical Distributors"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Notes (Supports Malayalam)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional remarks..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded-xl text-sm resize-none text-slate-800 dark:text-slate-100"
            />
            <MalayalamInputHelper
              onSelectPhrase={(phrase) => setFormData(prev => ({
                ...prev,
                notes: prev.notes ? `${prev.notes}, ${phrase}` : phrase
              }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeFormModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saveExpenseMutation.isPending}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Expenses;
