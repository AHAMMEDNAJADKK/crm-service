import React from 'react';
import { Printer, X, CheckCircle, Car, Calendar, User, Phone, IndianRupee } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

export const ServiceReceiptModal = ({ isOpen, onClose, job, stationSettings }) => {
  if (!job) return null;

  const handlePrint = () => {
    window.print();
  };

  const businessName = stationSettings?.stationName || 'AHAMMED SONS WATER SERVICE';
  const tagline = stationSettings?.tagline || 'Vehicle Washing, Cleaning & Underbody/Undercoating Services';
  const address = stationSettings?.address || 'Kozhikode, Kerala';
  const phone = stationSettings?.mobile || '9539691738';
  const footerNote = stationSettings?.receiptFooter || 'Thank you for choosing AHAMMED SONS WATER SERVICE! Visit us again.';

  const customerName = job.customerName || job.customerId?.name || 'Walk-in Customer';
  const customerMobile = job.customerMobile || job.customerId?.mobile || '-';
  const serviceName = job.serviceName || job.washPackage || 'Service';
  const finalAmount = job.finalAmount !== undefined ? job.finalAmount : (job.price || 0);
  const amountPaid = job.amountPaid || 0;
  const balance = job.balance !== undefined ? job.balance : Math.max(0, finalAmount - amountPaid);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Service Receipt" size="md">
      <div className="flex flex-col gap-5">
        {/* Printable Area */}
        <div id="service-receipt-print" className="bg-white p-6 border border-slate-200 rounded-xl shadow-xs text-slate-800">
          {/* Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <h2 className="text-lg font-black tracking-wide uppercase text-slate-900">{businessName}</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{tagline}</p>
            <p className="text-[11px] text-slate-400 mt-1">{address} | Ph: {phone}</p>
          </div>

          {/* Receipt Info */}
          <div className="flex items-center justify-between text-xs py-3 border-b border-slate-100 text-slate-600">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Token / Job ID</span>
              <span className="font-mono font-bold text-slate-900">{job.tokenNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Date & Time</span>
              <span className="font-medium text-slate-800">{formatDate(job.createdAt, true)}</span>
            </div>
          </div>

          {/* Customer & Vehicle Details */}
          <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-100 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Customer</span>
              <p className="font-bold text-slate-800">{customerName}</p>
              {customerMobile !== '-' && <p className="text-slate-500 text-[11px]">{customerMobile}</p>}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Vehicle</span>
              <p className="font-mono font-extrabold text-brand-600 uppercase text-sm">{job.vehicleReg}</p>
              <p className="text-slate-500 text-[11px] uppercase font-semibold">{job.vehicleType}</p>
            </div>
          </div>

          {/* Service Particulars */}
          <div className="py-3 border-b border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase mb-2">
              <span>Service Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between text-xs py-1">
              <span className="font-semibold text-slate-800 capitalize">{serviceName}</span>
              <span className="font-mono font-semibold">{formatCurrency(job.servicePrice || job.price || 0)}</span>
            </div>

            {Number(job.additionalCharge) > 0 && (
              <div className="flex justify-between text-xs py-0.5 text-slate-600">
                <span>Additional Charges</span>
                <span className="font-mono">+{formatCurrency(job.additionalCharge)}</span>
              </div>
            )}

            {Number(job.discount) > 0 && (
              <div className="flex justify-between text-xs py-0.5 text-emerald-600">
                <span>Discount</span>
                <span className="font-mono">-{formatCurrency(job.discount)}</span>
              </div>
            )}
          </div>

          {/* Totals & Payments */}
          <div className="py-3 space-y-1.5 text-xs">
            <div className="flex justify-between font-bold text-slate-900 text-sm">
              <span>Final Bill Amount</span>
              <span className="font-mono">{formatCurrency(finalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Amount Paid ({job.paymentMethod?.toUpperCase() || 'CASH'})</span>
              <span className="font-mono font-bold text-emerald-600">{formatCurrency(amountPaid)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-semibold border-t border-slate-100 pt-1.5">
              <span>Balance Due</span>
              <span className={`font-mono font-bold ${balance > 0 ? 'text-red-600' : 'text-slate-600'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
            <div className="flex justify-between text-[11px] pt-1 text-slate-500">
              <span>Payment Status</span>
              <span className="font-bold uppercase tracking-wider text-slate-800">{job.paymentStatus}</span>
            </div>
          </div>

          {/* Footer message */}
          <div className="text-center pt-4 border-t border-slate-200 mt-2">
            <p className="text-[11px] font-medium text-slate-500 italic">{footerNote}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 print:hidden">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={Printer} onClick={handlePrint}>
            Print Receipt
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ServiceReceiptModal;
