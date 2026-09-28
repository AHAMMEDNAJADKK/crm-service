import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Clock, CheckCircle2, User, Phone, Car } from 'lucide-react';
import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';
import FadeInSection from '../../components/animations/FadeInSection';
import VEHICLE_TYPES from '../../constants/vehicleTypes';
import WASH_PACKAGES from '../../constants/washPackages';

export const BookAppointment = () => {
  const location = useLocation();
  const { preSelectedType = 'car', preSelectedPkg = 'full-interior' } = location.state || {};
  const { addToast, stationSettings } = useUiStore();
  
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    vehicleReg: '',
    vehicleType: preSelectedType,
    washPackage: preSelectedPkg,
    preferredDate: '',
    preferredTime: '09:30 AM',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const timeSlots = [
    '09:30 AM',
    '11:00 AM',
    '12:30 PM',
    '02:00 PM',
    '03:30 PM',
    '05:00 PM'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlotSelect = (slot) => {
    setFormData((prev) => ({ ...prev, preferredTime: slot }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.mobile || !formData.vehicleReg || !formData.preferredDate) {
      addToast('Please fill out all required fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/v1/public/appointments', {
        ...formData,
        source: 'online'
      });
      if (response.data?.success) {
        setSuccessData(response.data.data);
        addToast('Appointment scheduled successfully!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'This slot is fully booked. Please choose another date or time.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getVTypeLabel = (id) => VEHICLE_TYPES.find(v => v.id === id)?.label || id;
  const getPkgLabel = (id) => WASH_PACKAGES.find(p => p.id === id)?.label || id;

  return (
    <div className="bg-slate-50 pt-28 pb-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <FadeInSection>
            <span className="text-xs font-extrabold text-brand-600 bg-brand-50 border border-brand-200/50 px-3 py-1 rounded-full uppercase tracking-widest">
              Online Scheduler
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mt-4">
              Schedule Your Wash Slot
            </h1>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              Book your cleaning deck in seconds. You will receive an immediate confirmation SMS with details once confirmed.
            </p>
          </FadeInSection>
        </div>

        {successData ? (
          /* SUCCESS SCREEN */
          <div className="bg-white border border-slate-200/60 rounded-3xl p-8 text-center flex flex-col items-center gap-6 shadow-md max-w-lg mx-auto">
            {stationSettings?.logoUrl ? (
              <img
                src={`${api.defaults.baseURL || ''}${stationSettings.logoUrl}`}
                alt="Logo"
                className="max-h-12 object-contain"
              />
            ) : (
              <div className="p-4 rounded-full bg-green-50 text-green-500 shadow-sm">
                <CheckCircle2 className="w-12 h-12" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">Booking Confirmed!</h3>
              <p className="text-xs text-slate-400 mt-2">
                A confirmation SMS was dispatched to <span className="font-bold text-slate-600">{successData.mobile}</span>
              </p>
            </div>

            <div className="w-full bg-slate-50 rounded-2xl p-5 text-left border border-slate-100/80 flex flex-col gap-3">
              <div className="flex justify-between border-b border-slate-200/50 pb-2 text-sm">
                <span className="text-slate-400">Customer</span>
                <span className="font-bold text-slate-700">{successData.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-2 text-sm">
                <span className="text-slate-400">Vehicle Reg No</span>
                <span className="font-bold text-slate-700 uppercase">{successData.vehicleReg}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-2 text-sm">
                <span className="text-slate-400">Vehicle Type</span>
                <span className="font-bold text-slate-700 uppercase">{getVTypeLabel(successData.vehicleType)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/50 pb-2 text-sm">
                <span className="text-slate-400">Wash Package</span>
                <span className="font-bold text-slate-700">{getPkgLabel(successData.washPackage)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Scheduled Slot</span>
                <span className="font-bold text-brand-600">
                  {new Date(successData.preferredDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })} at {successData.preferredTime}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSuccessData(null)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm cursor-pointer transition-colors"
            >
              Book Another Service
            </button>
          </div>
        ) : (
          /* BOOKING FORM AND REAL IMAGE BANNER SPLIT */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Form */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/50 shadow-sm lg:col-span-2">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {/* Owner details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="customerName" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Owner Name
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="E.g. Rahul Varghese"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="vehicleReg" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5 text-slate-400" /> Vehicle Reg Number
                    </label>
                    <input
                      type="text"
                      id="vehicleReg"
                      name="vehicleReg"
                      value={formData.vehicleReg}
                      onChange={handleInputChange}
                      placeholder="E.g. KL07BY1234"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Service & Date picking */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label htmlFor="vehicleType" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Vehicle Type</label>
                    <select
                      id="vehicleType"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-brand-500"
                    >
                      {VEHICLE_TYPES.map(v => (
                        <option key={v.id} value={v.id}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="washPackage" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Wash Package</label>
                    <select
                      id="washPackage"
                      name="washPackage"
                      value={formData.washPackage}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-brand-500"
                    >
                      {WASH_PACKAGES.map(pkg => (
                        <option key={pkg.id} value={pkg.id}>{pkg.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="preferredDate" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Preferred Date
                    </label>
                    <input
                      type="date"
                      id="preferredDate"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]} // Block past dates
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Preferred Time Slot
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {timeSlots.map((slot) => {
                      const isSelected = formData.preferredTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Special Requests (Optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="E.g., clean mud flaps, check underbody shield..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  isLoading={loading}
                  className="py-3.5 mt-2"
                >
                  Schedule Appointment Slot
                </Button>
              </form>
            </div>
            
            {/* Sidebar with Premium Real Servicing Photo */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white border border-slate-800 shadow-xl flex flex-col gap-6 justify-between relative overflow-hidden min-h-[400px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">AquaClean Standards</span>
                <h3 className="text-xl font-black text-white mt-2 leading-tight">Priority Servicing Bay</h3>
                <p className="text-xs text-slate-450 mt-3 leading-relaxed font-light">
                  Pre-booking your slot guarantees priority access to our washing and undercoating decks. Skip the queue and get back on the road in no time.
                </p>
                
                <div className="mt-6 flex flex-col gap-4">
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Priority Check-in</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">No waiting in lines; our team receives you immediately at your slot time.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Advanced Undercoating</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Rubberized anti-rust protection applied by certified technicians.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-white">Zero Scratches</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Dual pre-rinse grit blasters lift surface dirt to preserve paint gloss.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real Photograph of vehicle wash bay */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-slate-800 mt-2 bg-slate-850">
                <img 
                  src="https://images.unsplash.com/photo-1601362840469-51e4d8d59085?auto=format&fit=crop&q=80&w=600" 
                  alt="Real car pressure wash" 
                  className="w-full h-full object-cover select-none"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 to-transparent" />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BookAppointment;
