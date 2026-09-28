import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Search, RefreshCw, AlertCircle, HelpCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import formatCurrency from '../../utils/formatCurrency';
import useUiStore from '../../store/uiStore';

export const PricingMatrix = () => {
  const { addToast } = useUiStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editedPrices, setEditedPrices] = useState({}); // Stores changes: { "vehicleTypeId_packageId": price }

  // Fetch Pricing Matrix configuration from settings
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pricingMatrix'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/settings/pricing');
      return data.data;
    }
  });

  // Bulk update prices mutation
  const saveMutation = useMutation({
    mutationFn: async (pricesArray) => {
      const { data } = await api.put('/api/v1/admin/settings/pricing', { prices: pricesArray });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricingMatrix'] });
      setEditedPrices({});
      addToast('Pricing Matrix saved successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.message || 'Failed to update pricing matrix.', 'error');
    }
  });

  const handlePriceChange = (vTypeId, pkgId, value) => {
    const valFloat = parseFloat(value) || 0;
    setEditedPrices(prev => ({
      ...prev,
      [`${vTypeId}_${pkgId}`]: valFloat
    }));
  };

  const getPriceValue = (vTypeId, pkgId, originalPrice) => {
    const key = `${vTypeId}_${pkgId}`;
    if (editedPrices[key] !== undefined) {
      return editedPrices[key];
    }
    return originalPrice;
  };

  const handleSaveAll = () => {
    const updates = [];
    Object.entries(editedPrices).forEach(([key, val]) => {
      const [vehicleTypeId, packageId] = key.split('_');
      updates.push({
        vehicleTypeId,
        packageId,
        price: val
      });
    });

    if (updates.length === 0) {
      addToast('No changes detected to save.', 'info');
      return;
    }

    saveMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-2xl flex gap-3 border border-red-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <h4 className="font-bold">Error loading pricing matrix</h4>
          <p className="text-xs mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const { vehicleTypes = [], washPackages = [], matrix = [] } = data || {};

  const filteredMatrix = matrix.filter(row =>
    row.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasPendingChanges = Object.keys(editedPrices).length > 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">2D Pricing Matrix</h1>
          <p className="text-xs text-slate-400 mt-1">Configure service wash fees for all 15 vehicle categories against the 6 standard packages.</p>
        </div>

        <div className="flex gap-2">
          {hasPendingChanges && (
            <button
              onClick={handleSaveAll}
              disabled={saveMutation.isPending}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-brand-600/10 cursor-pointer flex items-center gap-1.5"
            >
              {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes ({Object.keys(editedPrices).length})
            </button>
          )}
        </div>
      </div>

      {/* Grid Container */}
      <div className="bg-white rounded-2xl border border-slate-200/50 shadow-xs p-6 flex flex-col gap-4">
        
        {/* Search */}
        <div className="relative max-w-md w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vehicle type or category (e.g. car, light)..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-600 font-semibold"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 min-w-[200px]">Vehicle Category</th>
                {washPackages.map(pkg => (
                  <th key={pkg.id} className="p-4 text-center min-w-[120px]">
                    {pkg.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMatrix.map(row => (
                <tr key={row.vehicleTypeId} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-bold text-xs text-slate-800">
                    <div className="flex flex-col">
                      <span>{row.label}</span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase mt-0.5">{row.category}</span>
                    </div>
                  </td>
                  
                  {washPackages.map(pkg => {
                    const priceVal = getPriceValue(row.vehicleTypeId, pkg.id, row.packages[pkg.id]);
                    const isChanged = editedPrices[`${row.vehicleTypeId}_${pkg.id}`] !== undefined;

                    // Disable engine wash for bicycle
                    const isDisabled = row.vehicleTypeId === 'bicycle' && pkg.id === 'engine';

                    if (isDisabled) {
                      return (
                        <td key={pkg.id} className="p-2 text-center text-slate-300 font-bold text-xs bg-slate-50/50 select-none">
                          N/A
                        </td>
                      );
                    }

                    return (
                      <td key={pkg.id} className="p-2">
                        <div className="flex items-center justify-center relative">
                          <span className="text-[10px] text-slate-400 absolute left-4 font-semibold">₹</span>
                          <input
                            type="number"
                            value={priceVal}
                            onChange={(e) => handlePriceChange(row.vehicleTypeId, pkg.id, e.target.value)}
                            className={`w-full max-w-[100px] text-center pl-7 pr-2 py-1.5 border rounded-lg text-xs font-bold focus:outline-none ${
                              isChanged
                                ? 'border-brand-600 bg-brand-50/30 text-brand-700'
                                : 'border-slate-200 bg-white text-slate-700'
                            }`}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};

export default PricingMatrix;
