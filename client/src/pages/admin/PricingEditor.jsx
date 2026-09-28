import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RefreshCw, AlertCircle, HelpCircle, Check, ShieldAlert, Clock } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import VEHICLE_TYPES from '../../constants/vehicleTypes';
import WASH_PACKAGES from '../../constants/washPackages';

export const PricingEditor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [prices, setPrices] = useState({}); // format: { "vehicleType_washPackage": { price, isNA } }
  const [dirty, setDirty] = useState({}); // format: { "vehicleType_washPackage": boolean }
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Fetch Pricing Matrix
  const { data: pricingData, isLoading } = useQuery({
    queryKey: ['adminSettingsPricing'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/settings/pricing');
      return data;
    }
  });

  // Sync DB pricing data to local state
  useEffect(() => {
    if (pricingData?.data) {
      const initialPrices = {};
      pricingData.data.forEach(p => {
        initialPrices[`${p.vehicleType}_${p.washPackage}`] = {
          price: p.price === null ? '' : p.price,
          isNA: !!p.isNA
        };
      });
      setPrices(initialPrices);
      setDirty({});
    }
  }, [pricingData]);

  // Bulk save pricing mutation
  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.put('/api/v1/admin/settings/pricing', payload);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      addToast('Pricing matrix saved successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save prices', 'error');
    }
  });

  // Reset to defaults mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      return await api.put('/api/v1/admin/settings/pricing/reset');
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      addToast('Prices restored to system defaults!', 'success');
      setIsResetOpen(false);
    },
    onError: (err) => {
      addToast('Failed to reset prices', 'error');
    }
  });

  const handleCellChange = (vehicleType, washPackage, value) => {
    const key = `${vehicleType}_${washPackage}`;
    const cleanVal = value === '' ? '' : parseFloat(value);
    
    setPrices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        price: isNaN(cleanVal) ? '' : cleanVal
      }
    }));

    // Mark as dirty
    const orig = pricingData?.data?.find(d => d.vehicleType === vehicleType && d.washPackage === washPackage);
    const origPrice = orig ? (orig.price === null ? '' : orig.price) : '';
    const origIsNA = orig ? !!orig.isNA : false;

    const isChanged = origPrice !== cleanVal;
    setDirty(prev => ({
      ...prev,
      [key]: isChanged
    }));
  };

  const handleNAToggle = (vehicleType, washPackage) => {
    const key = `${vehicleType}_${washPackage}`;
    const current = prices[key] || { price: '', isNA: false };
    const nextIsNA = !current.isNA;

    setPrices(prev => ({
      ...prev,
      [key]: {
        price: nextIsNA ? '' : 100, // default placeholder on toggle back
        isNA: nextIsNA
      }
    }));

    const orig = pricingData?.data?.find(d => d.vehicleType === vehicleType && d.washPackage === washPackage);
    const origIsNA = orig ? !!orig.isNA : false;

    setDirty(prev => ({
      ...prev,
      [key]: origIsNA !== nextIsNA
    }));
  };

  const handleBulkEditColumn = (pkgId) => {
    const defaultVal = prompt(`Set flat price for ${pkgId.toUpperCase()} wash across all vehicle types (skip N/A cells):`);
    if (defaultVal === null) return;
    const flatPrice = parseFloat(defaultVal);
    if (isNaN(flatPrice) || flatPrice < 0) {
      alert('Please enter a valid positive number');
      return;
    }

    const nextPrices = { ...prices };
    const nextDirty = { ...dirty };

    VEHICLE_TYPES.forEach(v => {
      const key = `${v.id}_${pkgId}`;
      const current = nextPrices[key] || { price: '', isNA: false };
      
      if (!current.isNA) {
        nextPrices[key] = {
          ...current,
          price: flatPrice
        };

        const orig = pricingData?.data?.find(d => d.vehicleType === v.id && d.washPackage === pkgId);
        const origPrice = orig ? (orig.price === null ? '' : orig.price) : '';
        nextDirty[key] = origPrice !== flatPrice;
      }
    });

    setPrices(nextPrices);
    setDirty(nextDirty);
    addToast(`Set flat rate of ₹${flatPrice} for ${pkgId.toUpperCase()}`, 'info');
  };

  const handleSave = () => {
    const payloadPrices = [];
    VEHICLE_TYPES.forEach(v => {
      WASH_PACKAGES.forEach(pkg => {
        const key = `${v.id}_${pkg.id}`;
        const cell = prices[key] || { price: '', isNA: false };
        payloadPrices.push({
          vehicleType: v.id,
          washPackage: pkg.id,
          price: cell.isNA ? null : (parseFloat(cell.price) || 0),
          isNA: cell.isNA
        });
      });
    });

    saveMutation.mutate({ prices: payloadPrices });
  };

  const handleResetConfirm = () => {
    resetMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
    );
  }

  // Format last saved timestamp
  const formatSavedTime = (dateStr) => {
    if (!dateStr) return 'Never saved';
    const d = new Date(dateStr);
    return `Last saved ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const categories = [
    { id: 'light', name: 'Light Vehicles (Bicycles, Bikes, Autos)' },
    { id: 'medium', name: 'Medium Vehicles (Cars, SUVs, Vans)' },
    { id: 'heavy', name: 'Heavy Machinery (Trucks, Buses, Tankers)' },
    { id: 'special', name: 'Special Equipment (JCBs, Cranes)' }
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-full overflow-hidden">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            2D Wash Pricing Editor
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure service ticket rates across categories and toggle package availability.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {pricingData?.lastSaved && (
            <span className="text-[11px] text-slate-400 font-semibold mr-2 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatSavedTime(pricingData.lastSaved)}
            </span>
          )}
          <Button
            onClick={() => setIsResetOpen(true)}
            variant="secondary"
            icon={RefreshCw}
          >
            Reset Defaults
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            icon={Save}
          >
            Save All Prices
          </Button>
        </div>
      </div>

      {/* Grid Matrix Container */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-xs overflow-hidden w-full">
        {/* Responsive Table Wrapper */}
        <div className="overflow-x-auto w-full max-w-full">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="sticky left-0 bg-slate-50 p-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px] border-r border-slate-200 z-10">
                  Vehicle Category
                </th>
                {WASH_PACKAGES.map(pkg => (
                  <th key={pkg.id} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-r border-slate-100 last:border-0">
                    <div className="flex flex-col items-center gap-1.5">
                      <span>{pkg.label}</span>
                      <button
                        onClick={() => handleBulkEditColumn(pkg.id)}
                        className="px-2 py-0.5 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-bold cursor-pointer transition-colors"
                        title={`Apply flat rate for all ${pkg.label} entries`}
                      >
                        Bulk Flat
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 text-xs">
              {categories.map(cat => {
                const catVehicles = VEHICLE_TYPES.filter(v => v.category === cat.id);
                if (catVehicles.length === 0) return null;

                return (
                  <React.Fragment key={cat.id}>
                    {/* Weight Group Section Header */}
                    <tr className="bg-slate-100/50 sticky top-0 z-5">
                      <td colSpan={WASH_PACKAGES.length + 1} className="p-2.5 font-black text-[10px] text-slate-400 uppercase tracking-widest border-y border-slate-200">
                        {cat.name}
                      </td>
                    </tr>

                    {/* Category Rows */}
                    {catVehicles.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="sticky left-0 bg-white p-4 font-bold text-slate-700 uppercase border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-5">
                          {v.label}
                        </td>
                        
                        {WASH_PACKAGES.map(pkg => {
                          const key = `${v.id}_${pkg.id}`;
                          const cell = prices[key] || { price: '', isNA: false };
                          const isDirty = !!dirty[key];

                          return (
                            <td
                              key={pkg.id}
                              className={`p-3 text-center border-r border-slate-100 last:border-0 transition-all ${
                                cell.isNA ? 'bg-slate-50' : ''
                              } ${isDirty ? 'bg-amber-50/60' : ''}`}
                            >
                              <div className="flex flex-col items-center gap-1.5 justify-center">
                                {cell.isNA ? (
                                  <span className="text-slate-400 font-bold text-sm h-8 flex items-center justify-center">—</span>
                                ) : (
                                  <div className="relative">
                                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                                    <input
                                      type="number"
                                      value={cell.price}
                                      onChange={(e) => handleCellChange(v.id, pkg.id, e.target.value)}
                                      className={`w-24 pl-6 pr-2 py-1.5 border rounded-lg text-center font-extrabold focus:outline-none focus:ring-1 ${
                                        isDirty
                                          ? 'border-amber-300 text-amber-900 focus:ring-amber-400'
                                          : 'border-slate-200 text-slate-700 focus:ring-brand-500'
                                      }`}
                                      placeholder="0"
                                      min={0}
                                    />
                                  </div>
                                )}
                                
                                {/* NA Checkbox */}
                                <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={cell.isNA}
                                    onChange={() => handleNAToggle(v.id, pkg.id)}
                                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-3 h-3 cursor-pointer"
                                  />
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">N/A</span>
                                </label>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM RESET MODAL */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Confirm Pricing Reset"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 text-amber-600 bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs font-semibold leading-relaxed">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <p>Warning: This action will permanently drop all overrides in your pricing grid and reset them to system base rates. Staged dirty cell changes will also be wiped.</p>
          </div>
          
          <div className="flex justify-end gap-2.5 mt-2">
            <button
              onClick={() => setIsResetOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleResetConfirm}
              className="px-4 py-2 bg-red-650 hover:bg-red-750 text-white font-bold rounded-lg text-xs cursor-pointer"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default PricingEditor;
