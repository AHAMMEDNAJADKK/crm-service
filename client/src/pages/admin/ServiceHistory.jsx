import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  History,
  Search,
  Filter,
  Calendar,
  IndianRupee,
  FileText,
  User,
  Car,
  CreditCard,
  CheckCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import QuickPaymentModal from '../../components/payments/QuickPaymentModal';
import ServiceReceiptModal from '../../components/receipt/ServiceReceiptModal';

export const ServiceHistory = () => {
  const { addToast } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [paymentModalJob, setPaymentModalJob] = useState(null);
  const [receiptModalJob, setReceiptModalJob] = useState(null);

  // Fetch complete jobs history
  const { data: jobs = [], isLoading, refetch } = useQuery({
    queryKey: ['adminAllServiceHistory', statusFilter, paymentFilter],
    queryFn: async () => {
      let url = '/api/v1/admin/jobs?limit=500';
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;
      if (paymentFilter !== 'all') url += `&paymentStatus=${paymentFilter}`;
      const res = await api.get(url);
      return res.data?.data || [];
    }
  });

  // Client-side search matching customer name, Malayalam name, mobile, reg, token
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <Badge variant="success">Completed</Badge>;
      case 'in_progress':
      case 'washing':
        return <Badge variant="info">In Service</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="warning">Waiting</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Service History & Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete operational timeline and wash tickets for AHAMMED SONS WATER SERVICE
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 px-3.5 py-2 rounded-xl">
          <History className="w-4 h-4 text-brand-500" />
          <span>Total Records: <strong className="text-slate-900 dark:text-white">{filteredJobs.length}</strong></span>
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
            placeholder="Search by customer, Malayalam name, phone, plate (KL 11...)"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Service:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Stages</option>
              <option value="waiting">Waiting</option>
              <option value="in_progress">In Service</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Payment:</span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Spinner size="lg" />
          <p className="text-xs text-slate-400 mt-2 font-semibold">Loading service records...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl p-12 text-center space-y-2">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            No Service Records Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchTerm ? 'No tickets matched your query.' : 'No service history matches the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white dark:bg-navy-800 border border-slate-200 dark:border-navy-700 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50/75 dark:bg-navy-850 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Date & Token</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Stage</th>
                  <th className="py-3.5 px-4 text-center">Payment</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-750">
                {filteredJobs.map((job) => {
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
                          {job.customerName || job.customerId?.name || 'Walk-in'}
                        </div>
                        {job.customerId?.nameMalayalam && (
                          <div className="text-[11px] text-brand-600 dark:text-brand-400 font-malayalam">
                            {job.customerId.nameMalayalam}
                          </div>
                        )}
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {job.customerMobile || job.customerId?.mobile}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 dark:text-white uppercase tracking-wider block">
                          {job.vehicleReg}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          {job.vehicleType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {job.serviceName || job.washPackage}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                        {formatCurrency(finalAmt)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(paidAmt)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        <span className={balanceAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                          {formatCurrency(balanceAmt)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(job.status)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={job.paymentStatus === 'paid' ? 'success' : job.paymentStatus === 'partial' ? 'warning' : 'danger'}
                          className="text-[10px] uppercase font-bold"
                        >
                          {job.paymentStatus || 'pending'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1">
                        {balanceAmt > 0 && (
                          <button
                            onClick={() => setPaymentModalJob(job)}
                            className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all active:scale-95 inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pay
                          </button>
                        )}
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
            {filteredJobs.map((job) => {
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
                    <div className="flex items-center gap-1.5">
                      {getStatusBadge(job.status)}
                      <Badge variant={job.paymentStatus === 'paid' ? 'success' : job.paymentStatus === 'partial' ? 'warning' : 'danger'} className="text-[10px] uppercase font-bold">
                        {job.paymentStatus || 'pending'}
                      </Badge>
                    </div>
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

                  <div className="p-3 bg-slate-50 dark:bg-navy-900 border border-slate-100 dark:border-navy-750 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Service Total
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        {formatCurrency(finalAmt)}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div>Paid: <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmt)}</span></div>
                      <div>
                        Balance:{' '}
                        <span className={`font-bold ${balanceAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {formatCurrency(balanceAmt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    {balanceAmt > 0 && (
                      <button
                        onClick={() => setPaymentModalJob(job)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        Collect Balance
                      </button>
                    )}
                    <button
                      onClick={() => setReceiptModalJob(job)}
                      className={`${balanceAmt > 0 ? 'p-2.5' : 'flex-1 py-2.5'} rounded-xl border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-navy-750 transition-colors font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer`}
                      title="View Receipt"
                    >
                      <FileText className="w-4 h-4" />
                      <span>{balanceAmt > 0 ? '' : 'View Receipt'}</span>
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

export default ServiceHistory;
