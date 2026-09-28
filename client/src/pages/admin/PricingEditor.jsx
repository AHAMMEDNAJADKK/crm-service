import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  RefreshCw,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  IndianRupee,
  Layers,
  Car,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import formatCurrency from '../../utils/formatCurrency';

export const PricingEditor = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix', 'services', 'vehicleTypes'

  // Pricing matrix state: { "vehicleType_washPackage": { price, isNA } }
  const [prices, setPrices] = useState({});
  const [dirty, setDirty] = useState({});
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Service modal states
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    shortName: '',
    code: '',
    description: '',
    basePrice: 0,
    estimatedDuration: 30,
    displayOrder: 0
  });

  // Vehicle type modal states
  const [isVTypeModalOpen, setIsVTypeModalOpen] = useState(false);
  const [editingVType, setEditingVType] = useState(null);
  const [vTypeFormData, setVTypeFormData] = useState({
    name: '',
    code: '',
    category: 'medium',
    icon: 'Car',
    displayOrder: 0,
    description: ''
  });

  // 1. Fetch Pricing Matrix & Metadata
  const { data: pricingData, isLoading: isMatrixLoading } = useQuery({
    queryKey: ['adminSettingsPricing'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/settings/pricing');
      return data;
    }
  });

  // 2. Fetch Services
  const { data: servicesList = [], isLoading: isServicesLoading } = useQuery({
    queryKey: ['adminAllServices'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/services');
      return res.data?.data || [];
    }
  });

  // 3. Fetch Vehicle Types
  const { data: vehicleTypesList = [], isLoading: isVTypesLoading } = useQuery({
    queryKey: ['adminAllVehicleTypes'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/vehicle-types');
      return res.data?.data || [];
    }
  });

  // Sync DB pricing data to local state
  useEffect(() => {
    if (pricingData?.data) {
      const initialPrices = {};
      pricingData.data.forEach(p => {
        initialPrices[`${p.vehicleType}_${p.washPackage}`] = {
          price: p.price === null || p.price === undefined ? '' : p.price,
          isNA: !!p.isNA
        };
      });
      setPrices(initialPrices);
      setDirty({});
    }
  }, [pricingData]);

  // Bulk save pricing mutation
  const saveMatrixMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.put('/api/v1/admin/settings/pricing', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      addToast('Pricing matrix saved successfully!', 'success');
      setDirty({});
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save prices', 'error');
    }
  });

  // Reset prices mutation
  const resetMatrixMutation = useMutation({
    mutationFn: async () => {
      return await api.put('/api/v1/admin/settings/pricing/reset');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      addToast('Prices restored to system defaults!', 'success');
      setIsResetOpen(false);
    },
    onError: (err) => {
      addToast('Failed to reset prices', 'error');
    }
  });

  // Service CRUD Mutations
  const saveServiceMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingService) {
        return await api.put(`/api/v1/admin/services/${editingService._id}`, payload);
      }
      return await api.post('/api/v1/admin/services', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllServices'] });
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      queryClient.invalidateQueries({ queryKey: ['activeServices'] });
      addToast(editingService ? 'Service updated successfully' : 'Service created successfully', 'success');
      setIsServiceModalOpen(false);
      setEditingService(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save service', 'error');
    }
  });

  const toggleServiceMutation = useMutation({
    mutationFn: async (id) => {
      return await api.patch(`/api/v1/admin/services/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllServices'] });
      queryClient.invalidateQueries({ queryKey: ['activeServices'] });
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      addToast('Service status updated', 'success');
    }
  });

  // Vehicle Type CRUD Mutations
  const saveVTypeMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingVType) {
        return await api.put(`/api/v1/admin/vehicle-types/${editingVType._id}`, payload);
      }
      return await api.post('/api/v1/admin/vehicle-types', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllVehicleTypes'] });
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleTypes'] });
      addToast(editingVType ? 'Vehicle category updated' : 'Vehicle category created', 'success');
      setIsVTypeModalOpen(false);
      setEditingVType(null);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save vehicle category', 'error');
    }
  });

  const toggleVTypeMutation = useMutation({
    mutationFn: async (id) => {
      return await api.patch(`/api/v1/admin/vehicle-types/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAllVehicleTypes'] });
      queryClient.invalidateQueries({ queryKey: ['activeVehicleTypes'] });
      queryClient.invalidateQueries({ queryKey: ['adminSettingsPricing'] });
      addToast('Vehicle category status updated', 'success');
    }
  });

  // Handle cell price change
  const handleCellChange = (vehicleTypeCode, serviceCode, value) => {
    const key = `${vehicleTypeCode}_${serviceCode}`;
    const cleanVal = value === '' ? '' : Math.max(0, parseFloat(value));

    setPrices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        price: isNaN(cleanVal) ? '' : cleanVal
      }
    }));

    setDirty(prev => ({ ...prev, [key]: true }));
  };

  // Handle NA Toggle
  const handleNAToggle = (vehicleTypeCode, serviceCode) => {
    const key = `${vehicleTypeCode}_${serviceCode}`;
    const currentNA = prices[key]?.isNA || false;

    setPrices(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isNA: !currentNA
      }
    }));

    setDirty(prev => ({ ...prev, [key]: true }));
  };

  // Submit bulk matrix changes
  const handleSaveMatrix = () => {
    const payload = Object.entries(prices).map(([key, val]) => {
      const [vehicleType, ...rest] = key.split('_');
      const washPackage = rest.join('_');
      return {
        vehicleType,
        washPackage,
        price: val.price === '' ? null : parseFloat(val.price),
        isNA: Boolean(val.isNA)
      };
    });

    saveMatrixMutation.mutate({ prices: payload });
  };

  const vehicleTypes = pricingData?.vehicleTypes || vehicleTypesList.filter(v => v.isActive);
  const servicePackages = pricingData?.servicePackages || servicesList.filter(s => s.isActive);
  const dirtyCount = Object.values(dirty).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Services & Pricing Architecture
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure vehicle categories, service packages, and vehicle-specific service rates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'matrix' && (
            <Button
              variant="primary"
              size="sm"
              icon={Save}
              isLoading={saveMatrixMutation.isPending}
              disabled={dirtyCount === 0}
              onClick={handleSaveMatrix}
            >
              {dirtyCount > 0 ? `Save Changes (${dirtyCount})` : 'Save Matrix'}
            </Button>
          )}

          {activeTab === 'services' && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingService(null);
                setServiceFormData({
                  name: '',
                  shortName: '',
                  code: '',
                  description: '',
                  basePrice: 0,
                  estimatedDuration: 30,
                  displayOrder: servicesList.length + 1
                });
                setIsServiceModalOpen(true);
              }}
            >
              Add Service
            </Button>
          )}

          {activeTab === 'vehicleTypes' && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingVType(null);
                setVTypeFormData({
                  name: '',
                  code: '',
                  category: 'medium',
                  icon: 'Car',
                  displayOrder: vehicleTypesList.length + 1,
                  description: ''
                });
                setIsVTypeModalOpen(true);
              }}
            >
              Add Category
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'matrix', label: 'Vehicle Pricing Matrix' },
          { id: 'services', label: `Service Packages (${servicesList.length})` },
          { id: 'vehicleTypes', label: `Vehicle Categories (${vehicleTypesList.length})` }
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 px-3 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'border-b-2 border-brand-600 text-brand-600'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===================== TAB 1: PRICING MATRIX ===================== */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {isMatrixLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="py-3.5 px-4 sticky left-0 z-20 bg-slate-900 min-w-[150px] font-bold uppercase text-[11px] tracking-wider">
                        Vehicle Type
                      </th>
                      {servicePackages.map(sp => (
                        <th key={sp.code} className="py-3.5 px-4 min-w-[160px] font-bold uppercase text-[11px] tracking-wider text-center">
                          <div>{sp.name}</div>
                          {sp.shortName && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{sp.shortName}</div>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicleTypes.map((vt) => (
                      <tr key={vt.code} className="hover:bg-slate-50/70 transition-colors">
                        {/* Vehicle Row Header */}
                        <td className="py-3 px-4 font-bold text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-100 shadow-2xs">
                          <span className="uppercase tracking-wide">{vt.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal uppercase">
                            {vt.category || 'medium'}
                          </span>
                        </td>

                        {/* Service Rate Cells */}
                        {servicePackages.map((sp) => {
                          const key = `${vt.code}_${sp.code}`;
                          const cell = prices[key] || { price: '', isNA: false };
                          const isDirty = dirty[key];

                          return (
                            <td key={sp.code} className="py-2.5 px-3 text-center">
                              {cell.isNA ? (
                                <button
                                  type="button"
                                  onClick={() => handleNAToggle(vt.code, sp.code)}
                                  className="w-full py-1.5 px-2 bg-slate-100 text-slate-400 font-semibold text-xs rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                                  title="Click to enable service for this vehicle type"
                                >
                                  N/A (Disabled)
                                </button>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <div className="relative max-w-[120px] w-full">
                                    <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">₹</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={cell.price}
                                      onChange={(e) => handleCellChange(vt.code, sp.code, e.target.value)}
                                      placeholder="0"
                                      className={`w-full pl-6 pr-2 py-1.5 border rounded-lg text-sm font-mono font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all ${
                                        isDirty
                                          ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-400'
                                          : 'border-slate-200 bg-slate-50 hover:bg-white'
                                      }`}
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleNAToggle(vt.code, sp.code)}
                                    className="p-1 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Mark Not Applicable"
                                  >
                                    <span className="text-[10px] font-bold">N/A</span>
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Matrix Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-slate-400" />
                  Type real prices for each vehicle type. Click "N/A" to disable a service for specific vehicles.
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsResetOpen(true)}
                  >
                    Reset Defaults
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Save}
                    isLoading={saveMatrixMutation.isPending}
                    disabled={dirtyCount === 0}
                    onClick={handleSaveMatrix}
                  >
                    Save All Rates
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: MANAGE SERVICES ===================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          {isServicesLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {servicesList.map((svc) => (
                  <div key={svc._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{svc.name}</span>
                        {svc.shortName && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                            {svc.shortName}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          svc.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {svc.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{svc.description || 'No description provided.'}</p>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Code: {svc.code} • Duration: ~{svc.estimatedDuration} mins
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleServiceMutation.mutate(svc._id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        {svc.isActive ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingService(svc);
                          setServiceFormData({
                            name: svc.name,
                            shortName: svc.shortName || '',
                            code: svc.code,
                            description: svc.description || '',
                            basePrice: svc.basePrice || 0,
                            estimatedDuration: svc.estimatedDuration || 30,
                            displayOrder: svc.displayOrder || 0
                          });
                          setIsServiceModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 3: MANAGE VEHICLE TYPES ===================== */}
      {activeTab === 'vehicleTypes' && (
        <div className="space-y-4">
          {isVTypesLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="divide-y divide-slate-100">
                {vehicleTypesList.map((vt) => (
                  <div key={vt._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm uppercase">{vt.name}</span>
                        <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded font-bold uppercase">
                          {vt.category || 'medium'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          vt.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}>
                          {vt.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono">
                        Code: {vt.code} • Display Order: #{vt.displayOrder}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleVTypeMutation.mutate(vt._id)}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                      >
                        {vt.isActive ? 'Deactivate' : 'Activate'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingVType(vt);
                          setVTypeFormData({
                            name: vt.name,
                            code: vt.code,
                            category: vt.category || 'medium',
                            icon: vt.icon || 'Car',
                            displayOrder: vt.displayOrder || 0,
                            description: vt.description || ''
                          });
                          setIsVTypeModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 cursor-pointer"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SERVICE MODAL (Add / Edit) */}
      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        title={editingService ? 'Edit Service Package' : 'Add New Service Package'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveServiceMutation.mutate(serviceFormData);
          }}
          className="flex flex-col gap-4 text-slate-800 text-xs"
        >
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Service Name</label>
            <input
              type="text"
              value={serviceFormData.name}
              onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="E.g. Full Underbody + Interior + Exterior"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Short Name</label>
              <input
                type="text"
                value={serviceFormData.shortName}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, shortName: e.target.value }))}
                placeholder="E.g. Underbody Wash"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={serviceFormData.estimatedDuration}
                onChange={(e) => setServiceFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Description</label>
            <textarea
              rows={2}
              value={serviceFormData.description}
              onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Service details and cleaning inclusions..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsServiceModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saveServiceMutation.isPending}>
              Save Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* VEHICLE TYPE MODAL (Add / Edit) */}
      <Modal
        isOpen={isVTypeModalOpen}
        onClose={() => setIsVTypeModalOpen(false)}
        title={editingVType ? 'Edit Vehicle Category' : 'Add Vehicle Category'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveVTypeMutation.mutate(vTypeFormData);
          }}
          className="flex flex-col gap-4 text-slate-800 text-xs"
        >
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Category Name</label>
            <input
              type="text"
              value={vTypeFormData.name}
              onChange={(e) => setVTypeFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="E.g. SUV, Hatchback, Auto, Bike"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Category Tier</label>
              <select
                value={vTypeFormData.category}
                onChange={(e) => setVTypeFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="light">Light (Bike/Auto)</option>
                <option value="medium">Medium (Car/Sedan/SUV)</option>
                <option value="heavy">Heavy (Pickup/Truck)</option>
                <option value="special">Special</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Display Order</label>
              <input
                type="number"
                value={vTypeFormData.displayOrder}
                onChange={(e) => setVTypeFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsVTypeModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saveVTypeMutation.isPending}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESET MODAL */}
      <Modal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title="Reset Pricing Matrix"
        size="sm"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>Are you sure you want to reset all vehicle rates to system defaults? This will erase any customized price matrix values.</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsResetOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              isLoading={resetMatrixMutation.isPending}
              onClick={() => resetMatrixMutation.mutate()}
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default PricingEditor;
