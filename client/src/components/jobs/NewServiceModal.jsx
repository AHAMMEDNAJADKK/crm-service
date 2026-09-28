import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car,
  IndianRupee,
  Check,
  Tag,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  FileText,
  Sparkles,
  Truck,
  Bike
} from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';

// Quick touch presets for the most common vehicle station categories
const POPULAR_VEHICLES = [
  { name: 'Bike', code: 'bike' },
  { name: 'Auto', code: 'auto' },
  { name: 'Car / Hatchback', code: 'hatchback' },
  { name: 'Sedan', code: 'sedan' },
  { name: 'SUV / MUV', code: 'suv' },
  { name: 'Pickup / Van', code: 'pickup' },
  { name: 'Lorry / Truck', code: 'lorry' },
  { name: 'BharatBenz', code: 'bharatbenz' },
  { name: 'JCB', code: 'jcb' },
  { name: 'Hitachi / Excavator', code: 'hitachi' },
  { name: 'Tractor', code: 'tractor' },
  { name: 'Other', code: 'other' }
];

export const NewServiceModal = ({ isOpen = true, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // 1. Core Required Fields
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('suv');
  const [amount, setAmount] = useState('700');

  // 2. Optional Service
  const [washPackage, setWashPackage] = useState('');

  // 3. Payment State
  const [paymentChoice, setPaymentChoice] = useState('paid'); // 'paid', 'partial', 'unpaid'
  const [paidAmount, setPaidAmount] = useState('700');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // 4. Notes & Optional Customer
  const [notes, setNotes] = useState('');
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');

  // Fetch active Vehicle Types from DB
  const { data: vTypesData } = useQuery({
    queryKey: ['activeVehicleTypes'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/vehicle-types/active');
      return res.data?.data || [];
    },
    enabled: isOpen
  });

  // Fetch active Service Packages from DB
  const { data: servicesData } = useQuery({
    queryKey: ['activeServices'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/services/active');
      return res.data?.data || [];
    },
    enabled: isOpen
  });

  // When amount changes and paymentChoice is 'paid', keep paidAmount in sync
  useEffect(() => {
    if (paymentChoice === 'paid') {
      setPaidAmount(amount);
    }
  }, [amount, paymentChoice]);

  // When vehicle type or service changes, lookup suggested price as convenience
  useEffect(() => {
    if (!washPackage || !vehicleType) return;
    const fetchSuggestedPrice = async () => {
      try {
        const res = await api.post('/api/v1/admin/jobs/calculate-price', {
          vehicleType,
          washPackage
        });
        if (res.data?.data?.finalAmount !== undefined) {
          const suggested = String(res.data.data.finalAmount);
          setAmount(suggested);
          if (paymentChoice === 'paid') {
            setPaidAmount(suggested);
          }
        }
      } catch {
        // Suggested price lookup is optional convenience, silently ignore
      }
    };
    fetchSuggestedPrice();
  }, [vehicleType, washPackage, paymentChoice]);

  // Create Job Mutation
  const createJobMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/jobs', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminBilling'] });
      addToast(
        `Service recorded for ${res.data?.data?.vehicleReg || 'Vehicle'} (₹${res.data?.data?.finalAmount || amount})`,
        'success'
      );
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to record service entry', 'error');
    }
  });

  const handleSave = (e) => {
    if (e) e.preventDefault();

    const cleanVeh = vehicleNumber.trim().toUpperCase();
    if (!cleanVeh) {
      addToast('Please enter Vehicle Number or Name (e.g. KL 10 AB 1234, JCB, BharatBenz)', 'error');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      addToast('Please enter a valid amount (₹)', 'error');
      return;
    }

    let finalPaid = 0;
    if (paymentChoice === 'paid') {
      finalPaid = numericAmount;
    } else if (paymentChoice === 'partial') {
      finalPaid = parseFloat(paidAmount) || 0;
      if (finalPaid > numericAmount) {
        addToast('Paid amount cannot exceed total service amount', 'error');
        return;
      }
    }

    const payload = {
      vehicleNumber: cleanVeh,
      vehicleReg: cleanVeh,
      vehicleType,
      amount: numericAmount,
      washPackage: washPackage || undefined,
      paymentChoice,
      paymentAmount: finalPaid,
      amountPaid: finalPaid,
      paymentMethod: paymentChoice !== 'unpaid' ? paymentMethod : 'pending',
      notes: notes.trim() || undefined,
      customerName: customerName.trim() || undefined,
      customerMobile: customerMobile.trim() || undefined
    };

    createJobMutation.mutate(payload);
  };

  const remainingBalance = Math.max(0, (parseFloat(amount) || 0) - (parseFloat(paidAmount) || 0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Vehicle Service Entry"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Top Highlight: Business Context */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-brand-50/80 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 text-brand-800 dark:text-brand-300">
          <span className="font-semibold uppercase tracking-wider">AHAMMED SONS WATER SERVICE</span>
          <span>Fast Owner Entry</span>
        </div>

        {/* 1. Vehicle Number / Name (Required) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Vehicle Number / Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              autoFocus
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. KL 10 AB 1234, JCB, BharatBenz, Lorry"
              className="w-full text-base sm:text-lg font-black tracking-wider uppercase px-4 py-2.5 rounded-xl border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 shadow-sm"
            />
            {vehicleNumber && (
              <button
                type="button"
                onClick={() => setVehicleNumber('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Accepts any vehicle registration plate, commercial name, or heavy machinery.
          </p>
        </div>

        {/* 2. Vehicle Category (Required) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Vehicle Category <span className="text-red-500">*</span>
            </label>
            {/* Extended dropdown selector */}
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="text-xs font-semibold px-2 py-1 rounded border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-200"
            >
              {(vTypesData && vTypesData.length > 0 ? vTypesData : POPULAR_VEHICLES).map((vt) => (
                <option key={vt.code} value={vt.code}>
                  {vt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Touch Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto no-scrollbar p-1 rounded-xl bg-slate-100 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
            {(vTypesData && vTypesData.length > 0 ? vTypesData : POPULAR_VEHICLES).map((vt) => {
              const isSelected = vehicleType === vt.code;
              return (
                <button
                  key={vt.code}
                  type="button"
                  onClick={() => setVehicleType(vt.code)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition-all text-center truncate ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                      : 'bg-white dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 border border-slate-200 dark:border-navy-700'
                  }`}
                >
                  {vt.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Amount & Optional Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Service Amount (Direct Entry) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Service Amount (₹) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-400">₹</span>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="700"
                className="w-full text-lg font-black pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Enter actual business charge.</p>
          </div>

          {/* Service Selection (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Service Package <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <select
              value={washPackage}
              onChange={(e) => setWashPackage(e.target.value)}
              className="w-full text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="">-- General Washing / No Package --</option>
              {servicesData?.map((sp) => (
                <option key={sp.code} value={sp.code}>
                  {sp.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Optional. Can be left empty.</p>
          </div>
        </div>

        {/* 4. Payment Selection */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Payment Status
          </label>

          {/* 3 Segment Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setPaymentChoice('paid');
                setPaidAmount(amount);
              }}
              className={`py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                paymentChoice === 'paid'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              Paid in Full
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentChoice('partial');
                setPaidAmount(String(Math.round((parseFloat(amount) || 0) / 2)));
              }}
              className={`py-2 px-3 rounded-lg text-xs font-black transition-all text-center ${
                paymentChoice === 'partial'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700'
              }`}
            >
              Partial Paid
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentChoice('unpaid');
                setPaidAmount('0');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-black transition-all text-center ${
                paymentChoice === 'unpaid'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700'
              }`}
            >
              Credit / Unpaid
            </button>
          </div>

          {/* Partial payment detail */}
          {paymentChoice === 'partial' && (
            <div className="flex items-center gap-3 pt-2">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                  Amount Paid Now (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={amount}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full text-sm font-bold px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800"
                />
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 block">Balance Due</span>
                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(remainingBalance)}
                </span>
              </div>
            </div>
          )}

          {/* Payment Method Selector (if paid or partial) */}
          {paymentChoice !== 'unpaid' && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Method:</span>
              {['cash', 'upi', 'card', 'bank transfer'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                    paymentMethod === m
                      ? 'bg-brand-600 text-white'
                      : 'bg-white dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 5. Notes / Malayalam Support */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Notes / മലയാളം കുറിപ്പ് <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. വാഹനം നാളെ വരണം, Full Underbody, VIP customer"
            className="w-full text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* 6. Optional Customer Accordion (Never Required) */}
        <div className="border-t border-slate-200 dark:border-navy-800 pt-2">
          <button
            type="button"
            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1"
          >
            <span>+ Customer Details (Optional)</span>
            {showCustomerDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCustomerDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. അഹമ്മദ് / Rahul"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-0.5">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-600 bg-white dark:bg-navy-800"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-navy-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-navy-800 transition-colors"
          >
            Cancel
          </button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createJobMutation.isPending}
            className="px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg shadow-brand-600/30"
          >
            Save Vehicle & Service (₹{amount || 0})
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewServiceModal;
