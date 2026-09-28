import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Receipt,
  Download,
  DollarSign,
  Eye,
  IndianRupee,
  Calendar,
  Filter,
  ArrowUpRight,
  Printer,
  FileText
} from 'lucide-react';

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
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

export const Billing = () => {
  const queryClient = useQueryClient();
  const { addToast, stationSettings } = useUiStore();

  const [activeTab, setActiveTab] = useState('payments'); // 'payments', 'invoices'

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Selected for receipt printing
  const [receiptModalJob, setReceiptModalJob] = useState(null);

  // 1. Fetch Income / Payments Transactions
  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ['adminPayments', search, paymentMethod, startDate, endDate, page],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/payments', {
        params: { search, paymentMethod, startDate, endDate, page, limit: 20 }
      });
      return res.data;
    }
  });

  // 2. Fetch Invoices List
  const { data: invoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['adminInvoices', search, page],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/invoices', {
        params: { search, page, limit: 20 }
      });
      return res.data;
    },
    enabled: activeTab === 'invoices'
  });

  const paymentsList = paymentsData?.data || [];
  const totalCollected = paymentsData?.summary?.totalCollected || 0;
  const paymentsPagination = paymentsData?.pagination || { page: 1, pages: 1, total: 0 };

  const invoicesList = invoicesData?.data || [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payments & Income Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real cash and digital receipts accounting generated from vehicle service operations.
          </p>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3">
          <span className="text-[11px] font-bold text-emerald-800 uppercase block">Total Filtered Income:</span>
          <span className="text-xl font-black font-mono text-emerald-700">{formatCurrency(totalCollected)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Income / Payments Received ({paymentsPagination.total || 0})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`pb-3 px-3 text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-b-2 border-brand-600 text-brand-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Service Tax Invoices
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search payment ID, customer, vehicle number..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'payments' && (
            <select
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold capitalize"
            >
              <option value="">All Payment Modes</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI / GPay</option>
              <option value="card">Card</option>
              <option value="bank-transfer">Bank Transfer</option>
            </select>
          )}

          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
          />

          {(search || paymentMethod || startDate || endDate) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setPaymentMethod(''); setStartDate(''); setEndDate(''); setPage(1); }}
              className="text-xs text-brand-600 hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ===================== TAB 1: PAYMENTS / INCOME ===================== */}
      {activeTab === 'payments' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {isPaymentsLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : paymentsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No income or payment records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Vehicle Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Service</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Staff</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentsList.map(pay => (
                    <tr key={pay._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {pay.paymentId}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(pay.date, true)}
                      </td>

                      <td className="py-3 px-4 font-mono font-black text-slate-900 uppercase">
                        {pay.vehicleReg}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {pay.customerName || 'Walk-in'}
                      </td>

                      <td className="py-3 px-4 capitalize text-slate-600">
                        {pay.serviceName}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold uppercase text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {pay.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                        {formatCurrency(pay.amount)}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {pay.staffName || 'Admin'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        {pay.jobId && (
                          <button
                            type="button"
                            onClick={() => setReceiptModalJob(pay.jobId)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Print Receipt"
                          >
                            <Printer className="w-3.5 h-3.5 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: INVOICES ===================== */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          {isInvoicesLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : invoicesList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">No invoice records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Vehicle Plate</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoicesList.map(inv => (
                    <tr key={inv._id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-brand-600">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {formatDate(inv.createdAt, false)}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold uppercase text-slate-800">
                        {inv.vehicleReg}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {inv.customerId?.name || 'Walk-in'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {inv.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          icon={Download}
                          onClick={() => printPDF(`/api/v1/admin/invoices/${inv._id}/pdf`, `invoice_${inv.invoiceNumber}.pdf`)}
                        >
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Service Receipt Modal */}
      <ServiceReceiptModal
        isOpen={!!receiptModalJob}
        onClose={() => setReceiptModalJob(null)}
        job={receiptModalJob}
        stationSettings={stationSettings}
      />

    </div>
  );
};

export default Billing;
