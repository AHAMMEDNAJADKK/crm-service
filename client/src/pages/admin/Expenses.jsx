import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Calendar, FileText, Upload } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const Expenses = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

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
    category: 'utilities',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    vendor: '',
    notes: ''
  });

  const categories = ['fuel', 'utilities', 'wages', 'parts-purchase', 'maintenance', 'marketing', 'other'];

  // 1. Fetch Expenses Query
  const { data: expensesData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminExpenses', search, category, startDate, endDate, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/expenses', {
        params: { page, limit: 10, search, category, startDate, endDate }
      });
      return data;
    }
  });

  // 2. Fetch Category Summary
  const { data: summaryData } = useQuery({
    queryKey: ['adminExpensesSummary'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/expenses/summary');
      return data.data;
    }
  });

  // 3. Create / Edit Mutations
  const saveExpenseMutation = useMutation({
    mutationFn: async (payload) => {
      const mappedPayload = {
        ...payload,
        amount: parseFloat(payload.amount)
      };

      if (editingExpense) {
        return await api.put(`/api/v1/admin/expenses/${editingExpense._id}`, mappedPayload);
      } else {
        return await api.post('/api/v1/admin/expenses', mappedPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['adminExpensesSummary'] });
      addToast(editingExpense ? 'Expense updated successfully' : 'Expense recorded successfully', 'success');
      closeFormModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save expense', 'error');
    }
  });

  // Upload Receipt Mutation
  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ id, file }) => {
      const fileData = new FormData();
      fileData.append('receipt', file);
      return await api.post(`/api/v1/admin/expenses/${id}/receipt`, fileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminExpenses'] });
      addToast('Receipt uploaded and linked successfully', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to upload receipt', 'error');
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
      addToast('Expense record deleted', 'success');
    }
  });

  const openFormModal = (exp = null) => {
    if (exp) {
      setEditingExpense(exp);
      setFormData({
        date: exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0],
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        vendor: exp.vendor || '',
        notes: exp.notes || ''
      });
    } else {
      setEditingExpense(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: 'utilities',
        description: '',
        amount: '',
        paymentMethod: 'cash',
        vendor: '',
        notes: ''
      });
    }
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveExpenseMutation.mutate(formData);
  };

  const handleReceiptUpload = (e, id) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadReceiptMutation.mutate({
      id,
      file: e.target.files[0]
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Operating Expenses</h1>
          <p className="text-xs text-slate-500 mt-1">Audit utility bills, inventory parts orders, wages, and vendor receipts.</p>
        </div>
        <Button onClick={() => openFormModal()} icon={Plus}>
          Record Expense
        </Button>
      </div>

      {/* Category breakdown summaries */}
      {summaryData && summaryData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {summaryData.map((item) => (
            <div key={item._id} className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-xs text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block capitalize">{item._id}</span>
              <span className="font-extrabold text-sm text-slate-800 mt-1 block">{formatCurrency(item.total)}</span>
              <span className="text-[9px] text-slate-400 mt-0.5 block">{item.count} items</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search description or vendor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-3.5 items-center">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none capitalize"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      {isListLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <TableContainer>
            <Thead>
              <Tr>
                <Th isSticky>Date</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th>Method</Th>
                <Th>Vendor</Th>
                <Th className="text-right">Receipt / Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {expensesData?.data?.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-10">No expenses recorded for this range</Td>
                </Tr>
              ) : (
                expensesData.data.map((exp) => (
                  <Tr key={exp._id}>
                    <Td isSticky className="font-bold text-slate-800">{formatDate(exp.date)}</Td>
                    <Td className="capitalize"><Badge variant="neutral">{exp.category}</Badge></Td>
                    <Td className="font-medium text-slate-600 truncate max-w-xs">{exp.description}</Td>
                    <Td className="font-extrabold text-red-600">-{formatCurrency(exp.amount)}</Td>
                    <Td className="uppercase font-semibold text-slate-500 text-xs">{exp.paymentMethod}</Td>
                    <Td className="font-semibold text-slate-700 text-xs">{exp.vendor || 'N/A'}</Td>
                    <Td className="text-right flex items-center justify-end gap-1.5 py-3">
                      {/* Receipt upload / view indicator */}
                      {exp.receipt ? (
                        <a
                          href={exp.receipt}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg hover:bg-slate-100 text-emerald-600 font-bold inline-flex items-center"
                          title="View receipt attachment"
                        >
                          <FileText className="w-4 h-4" />
                        </a>
                      ) : (
                        <label className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer inline-flex items-center">
                          <Upload className="w-4 h-4" />
                          <input
                            type="file"
                            onChange={(e) => handleReceiptUpload(e, exp._id)}
                            className="hidden"
                            accept="image/*,application/pdf"
                          />
                        </label>
                      )}

                      <button
                        onClick={() => openFormModal(exp)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete expense record?')) {
                            deleteExpenseMutation.mutate(exp._id);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </TableContainer>

          {/* Pagination controls */}
          {expensesData?.pagination && (
            <div className="flex justify-between items-center bg-white px-6 py-4.5 border border-slate-200/60 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-bold text-slate-800">{page}</span> of {expensesData.pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(expensesData.pagination.pages, p + 1))}
                  disabled={page === expensesData.pagination.pages}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* EXPENSE LOGGER FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingExpense ? 'Edit Expense Record' : 'Record Operating Cost'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expDate" className="block text-xs font-bold text-slate-500 uppercase mb-2">Expense Date</label>
              <input
                type="date"
                id="expDate"
                name="date"
                value={formData.date}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="expCategory" className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
              <select
                id="expCategory"
                name="category"
                value={formData.category}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white capitalize"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expAmount" className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount (₹)</label>
              <input
                type="number"
                id="expAmount"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label htmlFor="expMethod" className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Method</label>
              <select
                id="expMethod"
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI (GPay / PhonePe)</option>
                <option value="card">Debit / Credit Card</option>
                <option value="credit">Store Credit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expVendor" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vendor / Vendor Name</label>
              <input
                type="text"
                id="expVendor"
                name="vendor"
                value={formData.vendor}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="expNotes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Administrative Notes</label>
              <input
                type="text"
                id="expNotes"
                name="notes"
                value={formData.notes}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expDesc" className="block text-xs font-bold text-slate-500 uppercase mb-2">Expense Description</label>
            <textarea
              id="expDesc"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              rows="2"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
              placeholder="Provide cost descriptors..."
              required
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveExpenseMutation.isPending}>
              Save expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Expenses;
