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
      j.tokenNumber?.toLowerCase().includes(term) ||
      j.serviceName?.toLowerCase().includes(term) ||
      j.washPackage?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase">
              TODAY'S VEHICLES ({jobs.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
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
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand-500"
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
        <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
          <Car className="w-8 h-8 text-slate-300" />
          <span>No vehicles registered yet today. Tap "+ New Service" to check in a vehicle.</span>
        </div>
      ) : (
        <>
          {/* MOBILE CARDS VIEW (Under 768px) */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredJobs.map((job) => {
              const custName = job.customerName || job.customerId?.name || 'Walk-in Customer';
              const svcName = job.serviceName || job.washPackage || 'Service';
              const amount = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
              const balance = job.balance !== undefined ? job.balance : Math.max(0, amount - (job.amountPaid || 0));
              const isCompleted = ['completed', 'delivered'].includes(job.status);
              const isPaid = job.paymentStatus === 'paid';

              return (
                <div key={job._id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                  {/* Top Line: Reg Plate & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-black text-slate-900 text-base tracking-wide uppercase">
                        {job.vehicleReg}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                        {job.vehicleType} • {job.tokenNumber}
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={job.status}>{job.serviceStatus || job.status}</Badge>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {job.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Middle Line: Customer & Service info */}
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{custName}</span>
                      <p className="text-[11px] text-slate-500 capitalize">{svcName}</p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm block">
                        {formatCurrency(amount)}
                      </span>
                      {balance > 0 ? (
                        <span className="text-[10px] text-red-600 font-bold">Due: {formatCurrency(balance)}</span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">Cleared</span>
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
                          className="px-2.5 py-1 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
                        >
                          Pay
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onViewReceipt(job)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Print Receipt"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onManageJob(job)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="View Details"
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
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Vehicle Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Payment</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const custName = job.customerName || job.customerId?.name || 'Walk-in';
                  const svcName = job.serviceName || job.washPackage || 'Service';
                  const amount = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
                  const isCompleted = ['completed', 'delivered'].includes(job.status);
                  const isPaid = job.paymentStatus === 'paid';

                  return (
                    <tr key={job._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-slate-900 text-sm uppercase">
                          {job.vehicleReg}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {job.tokenNumber}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {custName}
                        {job.customerMobile && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {job.customerMobile}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 uppercase font-semibold text-[11px]">
                        {job.vehicleType}
                      </td>

                      <td className="py-3 px-4 capitalize text-slate-700 font-medium">
                        {svcName}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(amount)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isPaid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {job.paymentStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge variant={job.status}>{job.serviceStatus || job.status}</Badge>
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formatDate(job.createdAt, false, true)}
                      </td>

                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => onQuickComplete(job)}
                            className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => onQuickPayment(job)}
                            className="px-2 py-1 text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 rounded hover:bg-brand-100 transition-colors cursor-pointer"
                          >
                            Pay
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewReceipt(job)}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5 inline" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onManageJob(job)}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Manage"
                        >
                          <Eye className="w-3.5 h-3.5 inline" />
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
