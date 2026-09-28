import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Receipt, Plus, Download, Mail, DollarSign, Eye, CreditCard } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';
import printPDF from '../../utils/printPDF';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const Billing = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Payment form states
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'upi',
    note: 'Payment process complete'
  });

  // 1. Fetch Invoices Query
  const { data: invoicesData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminInvoices', search, paymentStatus, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/invoices', {
        params: { page, limit: 10, search, paymentStatus }
      });
      return data;
    }
  });

  // 2. Fetch Single Invoice details
  const { data: detailsData, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['adminInvoiceDetails', selectedInvoiceId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/invoices/${selectedInvoiceId}`);
      return data.data;
    },
    enabled: !!selectedInvoiceId
  });

  // 3. Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return await api.post(`/api/v1/admin/invoices/${id}/payments`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['adminInvoiceDetails', selectedInvoiceId] });
      addToast('Payment transaction successfully processed!', 'success');
      closePaymentModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to record payment', 'error');
    }
  });

  // 4. Email PDF Mutation
  const emailInvoiceMutation = useMutation({
    mutationFn: async (id) => {
      return await api.post(`/api/v1/admin/invoices/${id}/email`);
    },
    onSuccess: () => {
      addToast('Invoice PDF has been successfully emailed to customer', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to dispatch email', 'error');
    }
  });

  const openDetailsModal = (id) => {
    setSelectedInvoiceId(id);
    setIsDetailsOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsOpen(false);
    setSelectedInvoiceId(null);
  };

  const openPaymentModal = (inv) => {
    setSelectedInvoiceId(inv._id);
    const totalPaid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, inv.grandTotal - totalPaid);
    
    setPaymentData({
      amount: balance,
      method: 'upi',
      note: 'Payment complete'
    });
    setIsPaymentOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentOpen(false);
    setSelectedInvoiceId(null);
  };

  const handlePaymentChange = (e) => {
    setPaymentData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    recordPaymentMutation.mutate({
      id: selectedInvoiceId,
      payload: {
        amount: parseFloat(paymentData.amount),
        method: paymentData.method,
        note: paymentData.note
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Billing & Invoicing</h1>
          <p className="text-xs text-slate-500 mt-1">Audit customer balances, verify UPI deposits, and print tax receipts.</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-xs">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search invoice number or customer..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
          />
        </div>
        <select
          value={paymentStatus}
          onChange={(e) => {
            setPaymentStatus(e.target.value);
            setPage(1);
          }}
          className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none"
        >
          <option value="">All Payment Statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {/* Invoices table */}
      {isListLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <TableContainer>
            <Thead>
              <Tr>
                <Th isSticky>Invoice Number</Th>
                <Th>Customer</Th>
                <Th>Billed Amount</Th>
                <Th>Paid Amount</Th>
                <Th>Status</Th>
                <Th>Due Date</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {invoicesData?.data?.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-10">No invoice records found</Td>
                </Tr>
              ) : (
                invoicesData.data.map((inv) => {
                  const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0);
                  const balance = Math.max(0, inv.grandTotal - paid);

                  return (
                    <Tr key={inv._id}>
                      <Td isSticky className="font-bold text-slate-800">
                        {inv.invoiceNumber}
                        {inv.washJobId && (
                          <span className="block text-[10px] text-slate-400 font-bold uppercase mt-0.5">Token: {inv.washJobId.tokenNumber}</span>
                        )}
                      </Td>
                      <Td className="font-medium text-slate-700">{inv.customerId?.name || 'Customer'}</Td>
                      <Td className="font-extrabold text-slate-800">{formatCurrency(inv.grandTotal)}</Td>
                      <Td className="font-bold text-emerald-600">{formatCurrency(paid)}</Td>
                      <Td>
                        <Badge variant={inv.paymentStatus}>{inv.paymentStatus}</Badge>
                      </Td>
                      <Td className="text-xs text-slate-500 font-medium">{formatDate(inv.dueDate)}</Td>
                      <Td className="text-right flex items-center justify-end gap-1.5 py-3">
                        <button
                          onClick={() => openDetailsModal(inv._id)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                          title="View items detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {balance > 0 && (
                          <button
                            onClick={() => openPaymentModal(inv)}
                            className="p-2 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 cursor-pointer"
                            title="Record payment transaction"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => printPDF(`/api/v1/admin/invoices/${inv._id}/pdf`, `invoice_${inv.invoiceNumber}.pdf`)}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                          title="Print tax invoice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Email invoice PDF to customer ${inv.customerId?.email || ''}?`)) {
                              emailInvoiceMutation.mutate(inv._id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 cursor-pointer"
                          title="Email receipt PDF"
                          disabled={!inv.customerId?.email}
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </TableContainer>

          {/* Pagination controls */}
          {invoicesData?.pagination && (
            <div className="flex justify-between items-center bg-white px-6 py-4.5 border border-slate-200/60 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-bold text-slate-800">{page}</span> of {invoicesData.pagination.pages}
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
                  onClick={() => setPage(p => Math.min(invoicesData.pagination.pages, p + 1))}
                  disabled={page === invoicesData.pagination.pages}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={closePaymentModal}
        title="Record Payment Transaction"
      >
        <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="paymentAmount" className="block text-xs font-bold text-slate-500 uppercase mb-2">Billed Payment Amount (₹)</label>
            <input
              type="number"
              id="paymentAmount"
              name="amount"
              value={paymentData.amount}
              onChange={handlePaymentChange}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm font-extrabold text-center text-slate-800"
              required
            />
          </div>
          <div>
            <label htmlFor="paymentMethod" className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Method</label>
            <select
              id="paymentMethod"
              name="method"
              value={paymentData.method}
              onChange={handlePaymentChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="upi">UPI (GPay / PhonePe)</option>
              <option value="cash">Cash</option>
              <option value="card">Credit / Debit Card</option>
              <option value="credit">Store Credit</option>
            </select>
          </div>
          <div>
            <label htmlFor="paymentNote" className="block text-xs font-bold text-slate-500 uppercase mb-2">Transaction Notes</label>
            <input
              type="text"
              id="paymentNote"
              name="note"
              value={paymentData.note}
              onChange={handlePaymentChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closePaymentModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordPaymentMutation.isPending}>
              Record payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* INVOICE DETAILS MODAL */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={closeDetailsModal}
        title={detailsData?.invoice ? `Invoice details: ${detailsData.invoice.invoiceNumber}` : 'Invoice Details'}
        size="lg"
      >
        {isDetailsLoading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : detailsData ? (
          <div className="flex flex-col gap-6">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-slate-50 p-4 border border-slate-100 rounded-xl">
              <div>
                <p>Billing Customer: <span className="font-bold text-slate-800">{detailsData.invoice.customerId?.name}</span></p>
                <p className="mt-1">Mobile: <span className="font-semibold text-slate-700">{detailsData.invoice.customerId?.mobile}</span></p>
              </div>
              <div className="text-right">
                <p>Date Created: <span className="font-semibold text-slate-700">{formatDate(detailsData.invoice.createdAt)}</span></p>
                <p className="mt-1">Invoice Status: <span className="uppercase font-bold"><Badge variant={detailsData.invoice.paymentStatus}>{detailsData.invoice.paymentStatus}</Badge></span></p>
              </div>
            </div>

            {/* Line Items List */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Line Items Billed</span>
              <div className="flex flex-col gap-2.5">
                {detailsData.invoice.lineItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:shadow-xs transition-shadow">
                    <div className="max-w-[70%]">
                      <h6 className="font-bold text-slate-800">{item.description}</h6>
                      <p className="text-[10px] text-slate-400 mt-1">₹{item.unitPrice} × {item.qty}</p>
                    </div>
                    <span className="font-extrabold text-slate-800">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Summary */}
            <div className="flex flex-col gap-2 pt-4 border-t border-slate-100 items-end text-xs">
              <div className="flex justify-between w-48 py-0.5 text-slate-500">
                <span>Sub Total:</span>
                <span>{formatCurrency(detailsData.invoice.subTotal)}</span>
              </div>
              <div className="flex justify-between w-48 py-0.5 text-slate-500">
                <span>GST ({detailsData.invoice.taxRate}%):</span>
                <span>{formatCurrency(detailsData.invoice.taxAmount)}</span>
              </div>
              {detailsData.invoice.discount > 0 && (
                <div className="flex justify-between w-48 py-0.5 text-slate-500">
                  <span>Discount:</span>
                  <span>-{formatCurrency(detailsData.invoice.discount)}</span>
                </div>
              )}
              <div className="flex justify-between w-48 py-1.5 font-bold text-sm text-slate-800 border-t border-slate-200 mt-1">
                <span>Grand Total:</span>
                <span>{formatCurrency(detailsData.invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between w-48 py-0.5 text-brand-600 font-bold">
                <span>Total Paid:</span>
                <span>{formatCurrency(detailsData.totalPaid)}</span>
              </div>
              <div className="flex justify-between w-48 py-0.5 text-red-600 font-bold">
                <span>Outstanding:</span>
                <span>{formatCurrency(detailsData.balance)}</span>
              </div>
            </div>

            {/* Download PDF Trigger */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="secondary" onClick={closeDetailsModal}>
                Close
              </Button>
              <Button
                onClick={() => printPDF(`/api/v1/admin/invoices/${detailsData.invoice._id}/pdf`, `invoice_${detailsData.invoice.invoiceNumber}.pdf`)}
                icon={Download}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Billing;
