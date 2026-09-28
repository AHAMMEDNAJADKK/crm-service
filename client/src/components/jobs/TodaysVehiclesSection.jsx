import React, { useState } from 'react';
import {
  Car,
  Clock,
  CheckCircle,
  IndianRupee,
  Printer,
  ChevronRight,
  Eye,
  Plus,
  PlayCircle,
  Search,
  AlertCircle
} from 'lucide-react';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export const TodaysVehiclesSection = ({
  jobs = [],
  isLoading = false,
  onQuickComplete,
  onQuickPayment,
  onViewReceipt,
  onManageJob,
  onNewService
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJobs = jobs.filter(j => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      j.vehicleReg?.toLowerCase().includes(term) ||
      j.customerName?.toLowerCase().includes(term) ||
      j.customerId?.name?.toLowerCase().includes(term) ||
      j.customerId?.nameMalayalam?.toLowerCase().includes(term) ||
      j.tokenNumber?.toLowerCase().includes(term) ||
      j.serviceName?.toLowerCase().includes(term) ||
      j.washPackage?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-navy-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-navy-850">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm tracking-wide uppercase">
              TODAY'S VEHICLES ({jobs.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active service entries & washing queue for today
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Fast Search Filter */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vehicle / customer..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <Button size="sm" variant="primary" icon={Plus} onClick={onNewService}>
            Add Vehicle
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs">Loading today's vehicle entries...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
          <Car className="w-8 h-8 text-slate-300 dark:text-navy-600" />
          <span>No vehicles registered yet today. Tap "+ New Service" to check in a vehicle.</span>
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (Under 768px) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-navy-750">
            {filteredJobs.map((job) => {
              const custName = job.customerName || job.customerId?.name || 'Walk-in Customer';
              const custMalayalam = job.customerId?.nameMalayalam;
              const svcName = job.serviceName || job.washPackage || 'Service';
              const amount = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
              const balance = job.balance !== undefined ? job.balance : Math.max(0, amount - (job.amountPaid || 0));
              const isCompleted = ['completed', 'delivered'].includes(job.status);
              const isPaid = job.paymentStatus === 'paid';

              return (
                <div key={job._id} className="p-4 space-y-3 bg-white dark:bg-navy-800 hover:bg-slate-50/50 dark:hover:bg-navy-750/50 transition-colors">
                  {/* Top Line: Reg Plate & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-base tracking-wide uppercase">
                        {job.vehicleReg}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        {job.vehicleType} • {job.tokenNumber}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={job.status}>{job.serviceStatus || job.status}</Badge>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isPaid
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      }`}>
                        {job.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Middle Line: Customer & Service info */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-navy-850 p-2.5 rounded-xl border border-slate-100 dark:border-navy-750">
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{custName}</span>
                      {custMalayalam && (
                        <span className="text-[11px] text-brand-600 dark:text-brand-400 font-malayalam block">
                          {custMalayalam}
                        </span>
                      )}
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{svcName}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm block">
                        {formatCurrency(amount)}
                      </span>
                      {balance > 0 ? (
                        <span className="text-[10px] text-red-600 dark:text-red-400 font-bold">Due: {formatCurrency(balance)}</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Cleared</span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Line: Quick Actions Bar */}
                  <div className="flex items-center justify-between pt-1 gap-1.5">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.createdAt, false, true)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => onQuickComplete(job)}
                          className="px-2.5 py-1 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
                        >
                          Complete
                        </button>
                      )}

                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => onQuickPayment(job)}
                          className="px-2.5 py-1 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors cursor-pointer"
                        >
                          Pay
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onViewReceipt(job)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-750 transition-colors cursor-pointer"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onManageJob(job)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-750 transition-colors cursor-pointer"
                        title="Open Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE VIEW (768px and up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-700 bg-slate-50/75 dark:bg-navy-850 text-slate-400 dark:text-slate-500 font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Token & Time</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-750 text-xs">
                {filteredJobs.map((job) => {
                  const custName = job.customerName || job.customerId?.name || 'Walk-in';
                  const custMalayalam = job.customerId?.nameMalayalam;
                  const svcName = job.serviceName || job.washPackage || 'Service';
                  const amount = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
                  const balance = job.balance !== undefined ? job.balance : Math.max(0, amount - (job.amountPaid || 0));
                  const isCompleted = ['completed', 'delivered'].includes(job.status);
                  const isPaid = job.paymentStatus === 'paid';

                  return (
                    <tr
                      key={job._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-navy-750/50 transition-colors"
                    >
                      {/* Token & Time */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 block text-xs">
                          {job.tokenNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {formatDate(job.createdAt, false, true)}
                        </span>
                      </td>

                      {/* Vehicle Number & Type */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 dark:text-white uppercase tracking-wider block text-xs">
                          {job.vehicleReg}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {job.vehicleType}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 block">
                          {custName}
                        </span>
                        {custMalayalam && (
                          <span className="text-[11px] text-brand-600 dark:text-brand-400 font-malayalam block">
                            {custMalayalam}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block">
                          {job.customerMobile || job.customerId?.mobile || 'No Mobile'}
                        </span>
                      </td>

                      {/* Service Package */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                          {svcName}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                        {formatCurrency(amount)}
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {balance > 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold">{formatCurrency(balance)}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Cleared</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={job.status}>{job.serviceStatus || job.status}</Badge>
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={isPaid ? 'success' : job.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                          {job.paymentStatus}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => onQuickComplete(job)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Done
                          </button>
                        )}

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => onQuickPayment(job)}
                            className="px-2 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewReceipt(job)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors inline-block cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onManageJob(job)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors inline-block cursor-pointer"
                          title="Manage Details"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default TodaysVehiclesSection;
