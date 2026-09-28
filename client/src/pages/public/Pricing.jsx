import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShieldCheck, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import api from '../../services/api';
import VEHICLE_TYPES from '../../constants/vehicleTypes';
import WASH_PACKAGES from '../../constants/washPackages';
import formatCurrency from '../../utils/formatCurrency';
import FadeInSection from '../../components/animations/FadeInSection';
import ScrollReveal from '../../components/animations/ScrollReveal';

export const Pricing = () => {
  const [selectedVType, setSelectedVType] = useState('car');
  const [selectedPkg, setSelectedPkg] = useState('full-interior');

  // Fetch Pricing Matrix from public route
  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['publicPricingMatrix'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/public/pricing');
      return data.data;
    }
  });

  const getPrice = () => {
    if (!pricingData?.matrix) return 0;
    const row = pricingData.matrix.find(r => r.vehicleTypeId === selectedVType);
    return row?.packages[selectedPkg] || 150;
  };

  const getVTypeLabel = () => {
    return VEHICLE_TYPES.find(v => v.id === selectedVType)?.label || selectedVType;
  };

  const getPkgLabel = () => {
    return WASH_PACKAGES.find(p => p.id === selectedPkg)?.label || selectedPkg;
  };

  const getPkgDesc = () => {
    return WASH_PACKAGES.find(p => p.id === selectedPkg)?.desc || '';
  };

  return (
    <div className="bg-slate-50 pt-28 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <FadeInSection>
            <span className="text-xs font-extrabold text-brand-600 bg-brand-50 border border-brand-200/50 px-3 py-1 rounded-full uppercase tracking-widest">
              Pricing Calculator
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tight mt-4">
              Flexible Wash Packages
            </h1>
            <p className="text-sm text-slate-500 mt-4 leading-relaxed">
              We clean everything from bicycles to heavy JCB excavators. Select your vehicle type and wash package below to view our instant estimate.
            </p>
          </FadeInSection>
        </div>

        {/* Pricing Estimator Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-20">
          {/* Controls Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/50 shadow-sm lg:col-span-2 flex flex-col gap-6">
            <h3 className="text-lg font-bold text-slate-800">Customize Estimate</h3>
            
            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">1. Select Vehicle Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {VEHICLE_TYPES.map((type) => {
                  const isSelected = selectedVType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedVType(type.id)}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">⚙️</span>
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Package Selection */}
            <div className="border-t border-slate-100 pt-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">2. Choose Wash Package</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {WASH_PACKAGES.map((pkg) => {
                  // Disable engine wash for bicycle
                  const isDisabled = selectedVType === 'bicycle' && pkg.id === 'engine';
                  const isSelected = selectedPkg === pkg.id;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => !isDisabled && setSelectedPkg(pkg.id)}
                      disabled={isDisabled}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        isDisabled
                          ? 'opacity-40 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pkg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pricing Result Card */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white border border-slate-800 shadow-xl flex flex-col gap-6 relative overflow-hidden h-full min-h-[380px]">
            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex-grow">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">Total Billed Price</span>
              <div className="flex items-baseline mt-4">
                <span className="text-5xl font-black tracking-tight">
                  {isLoading ? '...' : formatCurrency(getPrice())}
                </span>
                <span className="text-xs text-slate-400 font-semibold ml-2">All Inclusive</span>
              </div>

              <div className="border-t border-slate-800 pt-6 mt-8 flex flex-col gap-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Vehicle:</span>
                  <span className="font-bold text-white uppercase">{getVTypeLabel()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Wash Package:</span>
                  <span className="font-bold text-white uppercase">{getPkgLabel()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-6 leading-relaxed bg-slate-800/40 p-3 rounded-xl border border-slate-800/30">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-brand-400" />
                {getPkgDesc()}
              </p>
            </div>

            <Link
              to="/book"
              state={{ preSelectedType: selectedVType, preSelectedPkg: selectedPkg }}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-brand-600/20"
            >
              Book Service Slot
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* trust badges */}
        <ScrollReveal className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Eco-Friendly Washing', desc: 'We employ high-pressure water recycle units saving up to 60% fresh water usage.' },
            { title: 'Spotless Underbody Clean', desc: 'Dedicated service bays fitted with ground-up washers to degrease underbody struts.' },
            { title: 'Transparent Matrix Pricing', desc: 'No hidden surcharges. The price you see is the final price you pay at the counter.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs flex gap-4">
              <div className="p-3 bg-brand-50 rounded-xl text-brand-600 h-fit"><ShieldCheck className="w-5.5 h-5.5" /></div>
              <div>
                <h4 className="font-bold text-sm text-slate-800">{item.title}</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </ScrollReveal>

      </div>
    </div>
  );
};

export default Pricing;
