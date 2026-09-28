import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  IndianRupee,
  Search,
  ArrowUpDown,
  CreditCard,
  FileText,
  User,
  Car,
  Calendar,
  Clock,
  Phone
} from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import QuickPaymentModal from '../../components/payments/QuickPaymentModal';
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

export const Outstanding = () => {
  const { addToast } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('highest'); // 'highest', 'oldest', 'recent'
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [receiptModalJob, setReceiptModalJob] = useState(null);

  // Fetch all jobs with balance > 0
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['adminOutstandingJobs'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/jobs?paymentStatus=pending,partial&limit=200');
      // Filter strictly for balance > 0
      const list = res.data?.data || [];
      return list.filter((j) => (j.balance || (j.finalAmount - j.amountPaid)) > 0);
    }
  });

  // Filter & Sort
  const filteredJobs = jobs.filter((job) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const custName = (job.customerName || job.customerId?.name || '').toLowerCase();
    const custMalayalam = (job.customerId?.nameMalayalam || '').toLowerCase();
    const mobile = (job.customerMobile || job.customerId?.mobile || '');
    const reg = (job.vehicleReg || '').toLowerCase();
    const token = (job.tokenNumber || '').toLowerCase();

    return (
      custName.includes(term) ||
      custMalayalam.includes(term) ||
      mobile.includes(term) ||
      reg.includes(term) ||
      token.includes(term)
    );
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const balA = Number(a.balance || (a.finalAmount - a.amountPaid) || 0);
    const balB = Number(b.balance || (b.finalAmount - b.amountPaid) || 0);
    const dateA = new Date(a.createdAt || a.serviceDate).getTime();
    const dateB = new Date(b.createdAt || b.serviceDate).getTime();

    if (sortBy === 'highest') return balB - balA;
    if (sortBy === 'oldest') return dateA - dateB;
    return dateB - dateA; // 'recent'
  });

  const totalOutstanding = sortedJobs.reduce((acc, j) => acc + Number(j.balance || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Outstanding Receivables
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track unpaid and partially paid customer balances for AHAMMED SONS WATER SERVICE
          </p>
        </div>

        {/* Quick Summary Pill */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5 font-bold" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">
              Total Outstanding Due
            </span>
            <span className="text-lg font-black text-amber-900 dark:text-amber-300 font-mono">
              {formatCurrency(totalOutstanding)}
            </span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400/80 block mt-0.5">
              Across {sortedJobs.length} active pending service tickets
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer, Malayalam name, mobile, plate (KL 11...)"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="highest">Highest Balance First</option>
            <option value="oldest">Oldest Due Date First</option>
            <option value="recent">Most Recent First</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 mt-2 font-semibold">Loading outstanding balances...</p>
        </div>
      ) : sortedJobs.length === 0 ? (
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            No Outstanding Dues Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm ? 'No results matched your search term.' : 'All completed services have been fully paid. Great job!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50/75 dark:bg-navy-850 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Token & Date</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Vehicle & Service</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-750">
                {sortedJobs.map((job) => {
                  const finalAmt = Number(job.finalAmount || job.price || 0);
                  const paidAmt = Number(job.amountPaid || 0);
                  const balanceAmt = Number(job.balance || (finalAmt - paidAmt) || 0);

                  return (
                    <tr
                      key={job._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-navy-750/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 block">
                          {job.tokenNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(job.createdAt || job.serviceDate)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {job.customerName || job.customerId?.name || 'Walk-in Customer'}
                        </div>
                        {job.customerId?.nameMalayalam && (
                          <div className="text-[11px] text-brand-600 dark:text-brand-400 font-malayalam">
                            {job.customerId.nameMalayalam}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" />
                          {job.customerMobile || job.customerId?.mobile || 'N/A'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            {job.vehicleReg}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-300 uppercase">
                            {job.vehicleType}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                          {job.serviceName || job.washPackage}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(finalAmt)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(paidAmt)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                        {formatCurrency(balanceAmt)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={job.paymentStatus === 'partial' ? 'warning' : 'danger'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {job.paymentStatus || 'pending'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => setPaymentModalJob(job)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          Collect
                        </button>
                        <button
                          onClick={() => setReceiptModalJob(job)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors inline-block cursor-pointer"
                          title="View Receipt"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
            {sortedJobs.map((job) => {
              const finalAmt = Number(job.finalAmount || job.price || 0);
              const paidAmt = Number(job.amountPaid || 0);
              const balanceAmt = Number(job.balance || (finalAmt - paidAmt) || 0);

              return (
                <div
                  key={job._id}
                  className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-750 pb-2.5">
                    <div>
                      <span className="font-mono font-black text-sm text-brand-600 dark:text-brand-400">
                        {job.tokenNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {formatDate(job.createdAt || job.serviceDate)}
                      </span>
                    </div>
                    <Badge variant={job.paymentStatus === 'partial' ? 'warning' : 'danger'} className="text-[10px] uppercase font-bold">
                      {job.paymentStatus || 'pending'}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white uppercase font-mono tracking-wider">
                        {job.vehicleReg}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-750 text-slate-600 dark:text-slate-300 uppercase">
                        {job.vehicleType}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {job.customerName || job.customerId?.name || 'Walk-in'}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {job.customerMobile || job.customerId?.mobile}
                      </span>
                    </div>

                    {job.customerId?.nameMalayalam && (
                      <span className="text-xs text-brand-600 dark:text-brand-400 font-malayalam block">
                        {job.customerId.nameMalayalam}
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      Service: {job.serviceName || job.washPackage}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-amber-700 dark:text-amber-400 block">
                        Balance Due
                      </span>
                      <span className="text-base font-black text-amber-900 dark:text-amber-300 font-mono">
                        {formatCurrency(balanceAmt)}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div>Total: <span className="font-bold text-slate-700 dark:text-slate-200">{formatCurrency(finalAmt)}</span></div>
                      <div>Paid: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmt)}</span></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setPaymentModalJob(job)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      Collect Payment
                    </button>
                    <button
                      onClick={() => setReceiptModalJob(job)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-navy-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors cursor-pointer"
                      title="View Receipt"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collect Balance Payment Modal */}
      {paymentModalJob && (
        <QuickPaymentModal
          job={paymentModalJob}
          onClose={() => setPaymentModalJob(null)}
          onSuccess={() => {
            setPaymentModalJob(null);
            refetch();
            addToast('Payment recorded successfully!', 'success');
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

export default Outstanding;
