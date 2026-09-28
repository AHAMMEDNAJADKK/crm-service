import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ArrowLeft,
  Car,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  IndianRupee
} from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import MalayalamInputHelper from '../../components/common/MalayalamInputHelper';

export const Vehicles = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [detailsId, setDetailsId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    regNumber: '',
    vehicleType: 'car',
    brand: '',
    model: '',
    variant: '',
    colour: '',
    fuelType: 'other',
    notes: ''
  });

  // 1. Fetch Vehicles List
  const { data: vehicleData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminVehicles', search, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/vehicles', {
        params: { page, limit: 15, search }
      });
      return data;
    }
  });

  // 2. Fetch Selected Vehicle Details & History
  const { data: detailsData, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['adminVehicleDetails', detailsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/vehicles/${detailsId}/profile`);
      return data.data;
    },
    enabled: !!detailsId
  });

  // 3. Fetch Customers for dropdown
  const { data: customersList = [] } = useQuery({
    queryKey: ['adminDropdownCustomers'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/customers?limit=100');
      return data.data || [];
    }
  });

  // 4. Fetch Active Vehicle Types
  const { data: vTypes = [] } = useQuery({
    queryKey: ['activeVehicleTypes'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/vehicle-types/active');
      return res.data?.data || [];
    }
  });

  // Save Vehicle Mutation
  const saveVehicleMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingVehicle) {
        return await api.put(`/api/v1/admin/vehicles/${editingVehicle._id}`, payload);
      }
      return await api.post('/api/v1/admin/vehicles', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVehicles'] });
      if (detailsId) {
        queryClient.invalidateQueries({ queryKey: ['adminVehicleDetails', detailsId] });
      }
      addToast(editingVehicle ? 'Vehicle updated successfully' : 'Vehicle registered successfully', 'success');
      closeFormModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save vehicle details', 'error');
    }
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/vehicles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVehicles'] });
      addToast('Vehicle removed successfully', 'success');
      if (detailsId) setDetailsId(null);
    }
  });

  const openCreateModal = () => {
    setEditingVehicle(null);
    setFormData({
      customerId: '',
      regNumber: '',
      vehicleType: vTypes?.[0]?.code || 'car',
      brand: '',
      model: '',
      variant: '',
      colour: '',
      fuelType: 'other',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (veh) => {
    setEditingVehicle(veh);
    setFormData({
      customerId: veh.customerId?._id || veh.customerId || '',
      regNumber: veh.regNumber || '',
      vehicleType: veh.vehicleType || 'car',
      brand: veh.brand || veh.make || '',
      model: veh.model || '',
      variant: veh.variant || '',
      colour: veh.colour || '',
      fuelType: veh.fuelType || 'other',
      notes: veh.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const vehiclesList = vehicleData?.data || [];
  const pagination = vehicleData?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
      
      {/* If viewing a vehicle profile */}
      {detailsId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setDetailsId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-2 rounded-xl border border-slate-200 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Vehicles Directory</span>
            </button>

            <Button
              size="sm"
              variant="outline"
              icon={Edit2}
              onClick={() => detailsData?.vehicle && openEditModal(detailsData.vehicle)}
            >
              Edit Vehicle Details
            </Button>
          </div>

          {isDetailsLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : detailsData?.vehicle ? (
            <div className="space-y-6">
              {/* Vehicle Profile Card Header */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black font-mono text-slate-900 uppercase tracking-wide">
                      {detailsData.vehicle.regNumber}
                    </span>
                    <span className="text-xs bg-brand-50 text-brand-700 font-bold uppercase px-2.5 py-1 rounded-md">
                      {detailsData.vehicle.vehicleType}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-medium pt-1">
                    {detailsData.vehicle.brand} {detailsData.vehicle.model} {detailsData.vehicle.colour ? `• ${detailsData.vehicle.colour}` : ''}
                  </p>

                  {detailsData.vehicle.customerId && (
                    <div className="text-xs text-slate-600 flex items-center gap-2 pt-1 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Owner: {detailsData.vehicle.customerId.name} ({detailsData.vehicle.customerId.mobile})</span>
                    </div>
                  )}
                </div>

                {/* Service Statistics */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Visits</span>
                    <span className="text-lg font-black font-mono text-slate-800">{detailsData.stats?.totalVisits || 0}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center min-w-[110px]">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Total Paid</span>
                    <span className="text-lg font-black font-mono text-emerald-700">
                      {formatCurrency(detailsData.stats?.totalPaid || 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-center min-w-[110px]">
                    <span className="text-[10px] text-red-500 font-bold uppercase block">Outstanding</span>
                    <span className="text-lg font-black font-mono text-red-700">
                      {formatCurrency(detailsData.stats?.outstanding || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service History Timeline */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600" />
                  Service History
                </h3>

                {(detailsData.serviceHistory || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No service records found for this vehicle.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {detailsData.serviceHistory.map(j => (
                      <div key={j._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 capitalize">{j.serviceName || j.washPackage}</span>
                            <Badge variant={j.status}>{j.serviceStatus || j.status}</Badge>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {formatDate(j.createdAt, true)} • Token: {j.tokenNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="font-mono font-bold text-slate-900 block text-sm">
                              {formatCurrency(j.finalAmount !== undefined ? j.finalAmount : (j.price || 0))}
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${
                              j.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                            }`}>
                              {j.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Vehicles Directory View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Vehicle Management
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Vehicle registry with intelligent Indian plate normalization and customer linkage.
              </p>
            </div>

            <Button icon={Plus} onClick={openCreateModal}>
              Register Vehicle
            </Button>
          </div>

          {/* Search Box */}
          <div className="bg-white p-4 border border-slate-200/60 rounded-xl shadow-xs">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search plate (e.g. KL 01 AB 1234), model, brand..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
              />
            </div>
          </div>

          {/* Vehicles List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
            {isListLoading ? (
              <div className="py-20 text-center"><Spinner size="lg" /></div>
            ) : vehiclesList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">No vehicle records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Registration Plate</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Make / Model</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Color</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehiclesList.map(v => (
                      <tr key={v._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-black text-slate-900 text-sm uppercase">
                          <button
                            type="button"
                            onClick={() => setDetailsId(v._id)}
                            className="hover:text-brand-600 cursor-pointer"
                          >
                            {v.regNumber}
                          </button>
                        </td>

                        <td className="py-3 px-4 uppercase font-semibold text-slate-600 text-[11px]">
                          {v.vehicleType}
                        </td>

                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {v.brand || v.make || ''} {v.model || ''}
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {v.customerId?.name ? (
                            <div>
                              <span>{v.customerId.name}</span>
                              <span className="text-[10px] text-slate-400 block">{v.customerId.mobile}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unlinked</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {v.colour || '-'}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDetailsId(v._id)}
                          >
                            Profile
                          </Button>
                          <button
                            type="button"
                            onClick={() => openEditModal(v)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete vehicle ${v.regNumber}?`)) {
                                deleteVehicleMutation.mutate(v._id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT VEHICLE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveVehicleMutation.mutate(formData);
          }}
          className="flex flex-col gap-4 text-slate-800 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Registration Plate</label>
              <input
                type="text"
                value={formData.regNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, regNumber: e.target.value.toUpperCase() }))}
                placeholder="E.g. KL 11 AB 1234"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Vehicle Category</label>
              <select
                value={formData.vehicleType}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              >
                {vTypes.map(vt => (
                  <option key={vt.code} value={vt.code}>{vt.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Linked Customer (Optional)</label>
            <select
              value={formData.customerId}
              onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="">-- No Customer / Walk-in --</option>
              {customersList.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Brand / Make</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="E.g. Maruti, Hyundai, Tata"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Model / Variant</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="E.g. Swift, Creta"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Color</label>
              <input
                type="text"
                value={formData.colour}
                onChange={(e) => setFormData(prev => ({ ...prev, colour: e.target.value }))}
                placeholder="E.g. White, Black, Silver"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Fuel Type</label>
              <select
                value={formData.fuelType}
                onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric (EV)</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Vehicle observations or customer preferences..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
            />
            <MalayalamInputHelper
              onSelectPhrase={(phrase) => setFormData(prev => ({
                ...prev,
                notes: prev.notes ? `${prev.notes}, ${phrase}` : phrase
              }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={closeFormModal}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={saveVehicleMutation.isPending}>
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Vehicles;
