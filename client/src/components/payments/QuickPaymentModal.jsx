import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IndianRupee, Check, CreditCard, X } from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';

export const QuickPaymentModal = ({ isOpen, onClose, job, onSuccess }) => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');

  const finalAmount = job?.finalAmount !== undefined ? job.finalAmount : (job?.price || 0);
  const amountPaid = job?.amountPaid || 0;
  const balance = Math.max(0, finalAmount - amountPaid);

  useEffect(() => {
    if (job) {
      setAmount(balance);
      setPaymentMethod('cash');
      setNotes('');
    }
  }, [job, balance]);

  const paymentMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post(`/api/v1/admin/payments/jobs/${job._id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardWeekly'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardMonthly'] });
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminInvoices'] });
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
      addToast('Payment recorded successfully!', 'success');
      onClose();
      if (onSuccess) onSuccess();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to record payment', 'error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payNum = parseFloat(amount);
    if (!payNum || payNum <= 0) {
      addToast('Please enter a valid payment amount', 'warning');
      return;
    }
    if (payNum > balance) {
      addToast(`Payment amount cannot exceed outstanding balance of ${formatCurrency(balance)}`, 'warning');
      return;
    }

    paymentMutation.mutate({
      amount: payNum,
      paymentMethod,
      notes: notes.trim()
    });
  };

  if (!job) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Service Payment" size="sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-slate-800">
        {/* Job Summary Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-mono font-bold text-slate-900 text-sm uppercase">{job.vehicleReg}</span>
            <span className="font-mono text-slate-500 font-semibold">{job.tokenNumber}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span className="font-semibold">{job.customerName || job.customerId?.name || 'Walk-in'}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Service:</span>
            <span className="capitalize">{job.serviceName || job.washPackage}</span>
          </div>
        </div>

        {/* Financial Numbers Card */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-slate-100 rounded-lg">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Bill Amount</span>
            <span className="font-mono font-bold text-slate-800">{formatCurrency(finalAmount)}</span>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100">
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">Already Paid</span>
            <span className="font-mono font-bold text-emerald-700">{formatCurrency(amountPaid)}</span>
          </div>
          <div className="p-2 bg-red-50 rounded-lg border border-red-100">
            <span className="text-[10px] text-red-500 font-bold uppercase block">Balance Due</span>
            <span className="font-mono font-bold text-red-700">{formatCurrency(balance)}</span>
          </div>
        </div>

        {/* Payment Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Collection Amount (₹)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={balance}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Payment Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'cash', label: 'Cash' },
              { id: 'upi', label: 'UPI / GPay' },
              { id: 'card', label: 'Card' },
              { id: 'bank-transfer', label: 'Bank Transfer' }
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentMethod === m.id
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Final settlement"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={paymentMutation.isPending}
            icon={Check}
          >
            Record Payment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default QuickPaymentModal;
