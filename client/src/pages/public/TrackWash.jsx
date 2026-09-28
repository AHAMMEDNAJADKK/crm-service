import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ArrowRight, ShieldCheck, Droplet, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import formatCurrency from '../../utils/formatCurrency';

export const TrackWash = () => {
  const [refInput, setRefInput] = useState('');
  const [searchRef, setSearchRef] = useState('');

  // Fetch track wash details
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['trackWash', searchRef],
    queryFn: async () => {
      if (!searchRef) return null;
      const { data } = await api.get(`/api/v1/public/wash/track/${searchRef}`);
      return data.data;
    },
    enabled: !!searchRef,
    retry: false
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (refInput.trim()) {
      setSearchRef(refInput.toUpperCase().trim());
    }
  };

  const steps = [
    { id: 'queued', label: 'In Queue' },
    { id: 'in-bay', label: 'Positioned' },
    { id: 'washing', label: 'Washing' },
    { id: 'drying', label: 'Drying' },
    { id: 'ready', label: 'Ready' },
    { id: 'delivered', label: 'Delivered' }
  ];

  const getStepIndex = (status) => {
    return steps.findIndex(s => s.id === status);
  };

  const currentStepIdx = job ? getStepIndex(job.status) : -1;

  return (
    <div className="bg-slate-50 pt-28 pb-20 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Search Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/50 shadow-sm text-center">
          <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Live Wash Progress
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-3">Track Your Vehicle</h1>
          <p className="text-xs text-slate-400 mt-2">Enter your token code (e.g. TKN-YYYYMMDD-XXX) or registration plate</p>
          
          <form onSubmit={handleSearchSubmit} className="mt-8 flex gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                value={refInput}
                onChange={(e) => setRefInput(e.target.value)}
                placeholder="Enter Token (e.g. TKN-20260629-001) or Reg No..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-600 font-semibold"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            </div>
            <button
              type="submit"
              className="px-6 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/10 cursor-pointer flex items-center gap-1.5"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          </div>
        )}

        {/* Not Found Error */}
        {error && (
          <div className="bg-red-50 text-red-700 border border-red-200/50 p-6 rounded-2xl text-center mt-8 text-sm font-semibold">
            🚫 No active vehicle found matching reference "{searchRef}". Please verify your ticket inputs.
          </div>
        )}

        {/* Track Results */}
        {job && !isLoading && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/50 shadow-sm mt-8 flex flex-col gap-8">
            
            {/* Ticket Metadata */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-wide font-mono">{job.vehicleReg}</h3>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase mt-1 block">Token: {job.tokenNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-brand-600 font-extrabold bg-brand-50 px-2 py-1 rounded">
                  {job.washPackage.replace('-', ' ').toUpperCase()}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold block mt-1">Vehicle: {job.vehicleType.toUpperCase()}</span>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="flex flex-col gap-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Operation Timeline</h4>
              
              <div className="relative pl-8 border-l border-slate-100 flex flex-col gap-6">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  const isFuture = idx > currentStepIdx;

                  return (
                    <div key={step.id} className="relative flex items-center justify-between">
                      
                      {/* Bullet icon */}
                      <span className={`absolute -left-11 w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : isCurrent
                          ? 'bg-brand-600 border-brand-600 text-white animate-pulse shadow-sm'
                          : 'bg-white border-slate-200 text-slate-400'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                      </span>

                      <div>
                        <span className={`text-xs font-bold tracking-wide ${
                          isCompleted ? 'text-slate-500' : isCurrent ? 'text-brand-600 font-black' : 'text-slate-400'
                        }`}>
                          {step.label}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] block text-brand-500 font-semibold mt-0.5">
                            {job.status === 'in-bay' ? 'Brought into deck' : 'Operation active'}
                          </span>
                        )}
                      </div>

                      {/* Display Bay indicator */}
                      {step.id === 'in-bay' && job.bayNumber && (isCurrent || isCompleted) && (
                        <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200/50">
                          BAY {job.bayNumber}
                        </span>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Micro Stats Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/30">
              <div className="flex gap-3">
                <div className="p-2 bg-brand-50 rounded-xl text-brand-600 h-fit">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Water Consumption</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">{job.waterUsedLitres || 0} Litres</span>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="p-2 bg-brand-50 rounded-xl text-brand-600 h-fit">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Estimation Cost</span>
                  <span className="text-sm font-black text-slate-800 block mt-0.5">{formatCurrency(job.price)}</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default TrackWash;
