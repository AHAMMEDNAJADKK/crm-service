import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Car,
  User,
  Phone,
  Search,
  Check,
  Plus,
  IndianRupee,
  Calendar,
  Sparkles,
  AlertCircle,
  Tag,
  CreditCard
} from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import formatCurrency from '../../utils/formatCurrency';
import MalayalamInputHelper from '../common/MalayalamInputHelper';

export const NewServiceModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Step 1: Customer lookup state
  const [mobileSearch, setMobileSearch] = useState('');
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [customerVehicles, setCustomerVehicles] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Customer form fields
  const [customerName, setCustomerName] = useState('');
  const [customerMalayalam, setCustomerMalayalam] = useState('');
  const [customerPlace, setCustomerPlace] = useState('');

  // Step 2: Vehicle state
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');

  // Step 3: Service & Pricing state
  const [washPackage, setWashPackage] = useState('');
  const [servicePrice, setServicePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [additionalCharge, setAdditionalCharge] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);
  const [isNA, setIsNA] = useState(false);

  // Step 4: Payment state
  const [paymentChoice, setPaymentChoice] = useState('unpaid'); // 'paid', 'partial', 'unpaid'
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Notes
  const [notes, setNotes] = useState('');

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

  // Set default vehicle type & service package when data loads
  useEffect(() => {
    if (vTypesData && vTypesData.length > 0 && !vehicleType) {
      setVehicleType(vTypesData[0].code);
    }
  }, [vTypesData, vehicleType]);

  useEffect(() => {
    if (servicesData && servicesData.length > 0 && !washPackage) {
      setWashPackage(servicesData[0].code);
    }
  }, [servicesData, washPackage]);

  // Search customer when mobile input reaches 10 digits
  const handleMobileLookup = async (phone) => {
    const clean = phone.trim();
    setMobileSearch(clean);

    if (clean.length >= 10) {
      setIsSearchingCustomer(true);
      try {
        const res = await api.get(`/api/v1/admin/customers/by-mobile/${clean}`);
        if (res.data?.data?.customer) {
          const cust = res.data.data.customer;
          const vehiList = res.data.data.vehicles || [];
          setFoundCustomer(cust);
          setCustomerName(cust.name);
          setCustomerMalayalam(cust.nameMalayalam || '');
          setCustomerPlace(cust.place || '');
          setCustomerVehicles(vehiList);

          if (vehiList.length > 0) {
            setSelectedVehicleId(vehiList[0]._id);
            setVehicleReg(vehiList[0].regNumber);
            setVehicleType(vehiList[0].vehicleType || (vTypesData?.[0]?.code || ''));
            setVehicleBrand(vehiList[0].brand || '');
            setVehicleModel(vehiList[0].model || '');
          }
          addToast(`Found existing customer: ${cust.name}`, 'info');
        } else {
          setFoundCustomer(null);
          setCustomerVehicles([]);
        }
      } catch (e) {
        setFoundCustomer(null);
      } finally {
        setIsSearchingCustomer(false);
      }
    } else {
      setFoundCustomer(null);
      setCustomerVehicles([]);
    }
  };

  // Select an existing vehicle from found customer's fleet
  const handleSelectExistingVehicle = (v) => {
    setSelectedVehicleId(v._id);
    setVehicleReg(v.regNumber);
    if (v.vehicleType) setVehicleType(v.vehicleType);
    setVehicleBrand(v.brand || '');
    setVehicleModel(v.model || '');
  };

  // Lookup vehicle by registration when user types registration number
  const handleRegPlateBlur = async () => {
    const clean = vehicleReg.trim().toUpperCase();
    if (clean.length >= 5 && !selectedVehicleId) {
      try {
        const res = await api.get(`/api/v1/admin/vehicles/by-reg/${clean}`);
        if (res.data?.data?.vehicle) {
          const veh = res.data.data.vehicle;
          setSelectedVehicleId(veh._id);
          if (veh.vehicleType) setVehicleType(veh.vehicleType);
          setVehicleBrand(veh.brand || '');
          setVehicleModel(veh.model || '');

          if (veh.customerId && !foundCustomer) {
            setFoundCustomer(veh.customerId);
            setCustomerName(veh.customerId.name || '');
            setCustomerMalayalam(veh.customerId.nameMalayalam || '');
            setMobileSearch(veh.customerId.mobile || '');
            setCustomerPlace(veh.customerId.place || '');
          }
          addToast(`Matched vehicle: ${veh.regNumber}`, 'info');
        }
      } catch (e) {
        // Not found, continue
      }
    }
  };

  // Step 6: Automatically calculate price from Vehicle Type + Service Type + Discount + Additional Charge
  useEffect(() => {
    const fetchCalculatedPrice = async () => {
      if (!vehicleType || !washPackage) return;
      try {
        const res = await api.post('/api/v1/admin/jobs/calculate-price', {
          vehicleType,
          washPackage,
          discount: parseFloat(discount) || 0,
          additionalCharge: parseFloat(additionalCharge) || 0
        });

        if (res.data?.success) {
          const { servicePrice: sp, finalAmount: fa, isNA: na } = res.data.data;
          setServicePrice(sp);
          setFinalAmount(fa);
          setIsNA(na);

          // Update initial payment if "paid in full" is selected
          if (paymentChoice === 'paid') {
            setAmountPaid(fa);
          } else if (paymentChoice === 'unpaid') {
            setAmountPaid(0);
          }
        }
      } catch (e) {
        console.error('Price calculation error:', e);
      }
    };

    fetchCalculatedPrice();
  }, [vehicleType, washPackage, discount, additionalCharge, paymentChoice]);

  // Handle payment choice toggle (Full Paid, Partial, Unpaid)
  const handlePaymentChoiceChange = (choice) => {
    setPaymentChoice(choice);
    if (choice === 'paid') {
      setAmountPaid(finalAmount);
    } else if (choice === 'unpaid') {
      setAmountPaid(0);
    } else if (choice === 'partial' && amountPaid === 0) {
      setAmountPaid(Math.round(finalAmount / 2));
    }
  };

  // Submit Mutation
  const createJobMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/jobs', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboardToday'] });
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      queryClient.invalidateQueries({ queryKey: ['adminVehicles'] });
      addToast('Service Job registered successfully!', 'success');
      resetForm();
      onClose();
      if (onSuccess) onSuccess(res.data?.data);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to register service job', 'error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vehicleReg || !vehicleType || !washPackage) {
      addToast('Please fill in vehicle registration, vehicle category, and service', 'warning');
      return;
    }

    createJobMutation.mutate({
      vehicleReg: vehicleReg.trim().toUpperCase(),
      vehicleType,
      washPackage,
      customerName: customerName.trim(),
      customerMalayalam: customerMalayalam.trim(),
      customerMobile: mobileSearch.trim(),
      customerPlace: customerPlace.trim(),
      discount: parseFloat(discount) || 0,
      additionalCharge: parseFloat(additionalCharge) || 0,
      initialPayment: paymentChoice === 'unpaid' ? 0 : (parseFloat(amountPaid) || 0),
      paymentMethod,
      notes: notes.trim()
    });
  };

  const resetForm = () => {
    setMobileSearch('');
    setFoundCustomer(null);
    setCustomerVehicles([]);
    setCustomerName('');
    setCustomerMalayalam('');
    setCustomerPlace('');
    setSelectedVehicleId('');
    setVehicleReg('');
    setDiscount(0);
    setAdditionalCharge(0);
    setPaymentChoice('unpaid');
    setAmountPaid(0);
    setNotes('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Service Registration" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-slate-800">
        
        {/* Step 1: Customer Phone Search & Details */}
        <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-brand-600" />
              1. Customer Mobile Number
            </span>
            {foundCustomer && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Existing Customer
              </span>
            )}
          </div>

          <div className="relative">
            <input
              type="tel"
              value={mobileSearch}
              onChange={(e) => handleMobileLookup(e.target.value)}
              placeholder="Enter 10-digit mobile number (e.g. 9539691738)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
            {isSearchingCustomer && (
              <span className="absolute right-3 top-3 text-xs text-slate-400">Searching...</span>
            )}
          </div>

          {/* Customer Name & Malayalam Entry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Customer Name (English)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="E.g. Muhammed"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                പേര് (Malayalam Name - Optional)
              </label>
              <input
                type="text"
                value={customerMalayalam}
                onChange={(e) => setCustomerMalayalam(e.target.value)}
                placeholder="E.g. മുഹമ്മദ്"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              സ്ഥലം / Place / Address
            </label>
            <input
              type="text"
              value={customerPlace}
              onChange={(e) => setCustomerPlace(e.target.value)}
              placeholder="E.g. Kozhikode"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Step 2: Vehicle Details */}
        <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-brand-600" />
              2. Vehicle Details
            </span>
          </div>

          {/* Existing vehicles chip selector if found */}
          {customerVehicles.length > 0 && (
            <div>
              <span className="text-[11px] text-slate-500 block mb-1.5 font-medium">
                Customer's Saved Vehicles (Tap to select):
              </span>
              <div className="flex flex-wrap gap-2">
                {customerVehicles.map(v => (
                  <button
                    key={v._id}
                    type="button"
                    onClick={() => handleSelectExistingVehicle(v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedVehicleId === v._id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-700 hover:border-brand-400'
                    }`}
                  >
                    {v.regNumber} ({v.vehicleType?.toUpperCase()})
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicleId('');
                    setVehicleReg('');
                  }}
                  className="px-2.5 py-1.5 text-xs text-brand-600 hover:underline font-semibold"
                >
                  + Different Vehicle
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Vehicle Registration No.
              </label>
              <input
                type="text"
                value={vehicleReg}
                onChange={(e) => {
                  setVehicleReg(e.target.value.toUpperCase());
                  setSelectedVehicleId('');
                }}
                onBlur={handleRegPlateBlur}
                placeholder="E.g. KL 11 AB 1234"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Vehicle Category / Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold capitalize"
                required
              >
                {(vTypesData || []).map(vt => (
                  <option key={vt.code} value={vt.code}>
                    {vt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Service Selection & Dynamic Pricing */}
        <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              3. Service Package & Pricing
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
              Select Service
            </label>
            <select
              value={washPackage}
              onChange={(e) => setWashPackage(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
              required
            >
              {(servicesData || []).map(sp => (
                <option key={sp.code} value={sp.code}>
                  {sp.name} {sp.shortName ? `(${sp.shortName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {isNA && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>Note: This service is typically marked Not Applicable for this vehicle type.</span>
            </div>
          )}

          {/* Price Breakdown Matrix Calculation */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-center">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Standard Price</span>
              <span className="text-sm font-mono font-bold text-slate-800">{formatCurrency(servicePrice)}</span>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">
                Extra Chg (₹)
              </label>
              <input
                type="number"
                min="0"
                value={additionalCharge}
                onChange={(e) => setAdditionalCharge(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          {/* Final Calculated Amount */}
          <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wide text-brand-900">
              Final Amount To Charge:
            </span>
            <span className="text-lg font-mono font-black text-brand-700">
              {formatCurrency(finalAmount)}
            </span>
          </div>
        </div>

        {/* Step 4: Payment Details */}
        <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-xl space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-brand-600" />
            4. Payment Settlement
          </span>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'unpaid', label: 'Unpaid / Later' },
              { id: 'partial', label: 'Partial Deposit' },
              { id: 'paid', label: 'Paid in Full' }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handlePaymentChoiceChange(opt.id)}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  paymentChoice === opt.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {paymentChoice !== 'unpaid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Amount Paying Now (₹)
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={finalAmount}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold capitalize"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="card">Card</option>
                  <option value="bank-transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
          )}

          {/* Remaining Balance Indicator */}
          {paymentChoice !== 'paid' && (
            <div className="flex justify-between text-xs text-slate-600 font-semibold px-1">
              <span>Remaining Balance:</span>
              <span className="font-mono text-red-600 font-bold">
                {formatCurrency(Math.max(0, finalAmount - (parseFloat(amountPaid) || 0)))}
              </span>
            </div>
          )}
        </div>

        {/* Step 5: Notes & Malayalam Helper */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Service Notes (Supports Malayalam)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="E.g. Clean underbody thoroughly, customer will collect at 4 PM"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm resize-none"
          />
          <MalayalamInputHelper
            onSelectPhrase={(phrase) => setNotes(prev => prev ? `${prev}, ${phrase}` : phrase)}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createJobMutation.isPending}
            icon={Check}
          >
            Confirm & Save Service Job
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewServiceModal;
