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
  Phone,
  Receipt,
  UserPlus,
  MapPin,
  AlertCircle,
  CheckCircle,
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
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import MalayalamInputHelper from '../../components/common/MalayalamInputHelper';

export const Customers = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [profileId, setProfileId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Customer Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nameMalayalam: '',
    mobile: '',
    alternateMobile: '',
    email: '',
    address: '',
    place: '',
    notes: ''
  });

  // Add Vehicle in profile
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleData, setVehicleData] = useState({
    regNumber: '',
    vehicleType: 'car',
    brand: '',
    model: '',
    colour: '',
    notes: ''
  });

  // Fetch Customers List Query
  const { data: customerData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminCustomers', search, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/customers', {
        params: { page, limit: 15, search }
      });
      return data;
    }
  });

  // Fetch Selected Customer Profile Query
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['adminCustomerProfile', profileId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/customers/${profileId}/profile`);
      return data.data;
    },
    enabled: !!profileId
  });

  // Fetch Active Vehicle Types
  const { data: vTypes = [] } = useQuery({
    queryKey: ['activeVehicleTypes'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/vehicle-types/active');
      return res.data?.data || [];
    }
  });

  // Save Customer Mutation
  const saveCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCustomer) {
        return await api.put(`/api/v1/admin/customers/${editingCustomer._id}`, payload);
      }
      return await api.post('/api/v1/admin/customers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: ['adminCustomerProfile', profileId] });
      }
      addToast(editingCustomer ? 'Customer details updated' : 'Customer registered successfully', 'success');
      closeFormModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save customer', 'error');
    }
  });

  // Delete customer mutation
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      addToast('Customer deleted successfully', 'success');
      if (profileId) setProfileId(null);
    }
  });

  // Add vehicle for this customer mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/vehicles', {
        ...payload,
        customerId: profileId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomerProfile', profileId] });
      queryClient.invalidateQueries({ queryKey: ['adminVehicles'] });
      addToast('Vehicle added to customer profile!', 'success');
      setIsVehicleModalOpen(false);
      setVehicleData({ regNumber: '', vehicleType: 'car', brand: '', model: '', colour: '', notes: '' });
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to add vehicle', 'error');
    }
  });

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: '',
      nameMalayalam: '',
      mobile: '',
      alternateMobile: '',
      email: '',
      address: '',
      place: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name || '',
      nameMalayalam: cust.nameMalayalam || '',
      mobile: cust.mobile || '',
      alternateMobile: cust.alternateMobile || '',
      email: cust.email || '',
      address: cust.address || '',
      place: cust.place || '',
      notes: cust.notes || ''
    });
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const customersList = customerData?.data || [];
  const pagination = customerData?.pagination || { page: 1, pages: 1, total: 0 };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto select-none">
      
      {/* If viewing a customer profile */}
      {profileId ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setProfileId(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-navy-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-navy-700 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Customers Directory</span>
            </button>

            <Button
              size="sm"
              variant="outline"
              icon={Edit2}
              onClick={() => profileData?.customer && openEditModal(profileData.customer)}
            >
              Edit Customer Info
            </Button>
          </div>

          {isProfileLoading ? (
            <div className="py-20 text-center"><Spinner size="lg" /></div>
          ) : profileData?.customer ? (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/60 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{profileData.customer.name}</h2>
                    {profileData.customer.nameMalayalam && (
                      <span className="text-sm text-brand-600 dark:text-brand-400 font-bold bg-brand-50 dark:bg-brand-950/50 px-2.5 py-0.5 rounded-md">
                        {profileData.customer.nameMalayalam}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {profileData.customer.mobile}
                    </span>
                    {profileData.customer.alternateMobile && (
                      <span className="text-slate-400 dark:text-slate-500">Alt: {profileData.customer.alternateMobile}</span>
                    )}
                    {profileData.customer.place && (
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {profileData.customer.place}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Financial Summary */}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-navy-950 border border-slate-100 dark:border-navy-800 rounded-xl text-center min-w-[90px]">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase block">Total Visits</span>
                    <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">{profileData.stats?.totalVisits || 0}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-center min-w-[110px]">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase block">Total Paid</span>
                    <span className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                      {formatCurrency(profileData.stats?.totalPaid || 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl text-center min-w-[110px]">
                    <span className="text-[10px] text-red-500 dark:text-red-400 font-bold uppercase block">Outstanding</span>
                    <span className="text-lg font-black font-mono text-red-700 dark:text-red-400">
                      {formatCurrency(profileData.stats?.outstandingBalance || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer's Vehicles */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/60 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                    <Car className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    Customer's Vehicles ({(profileData.vehicles || []).length})
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={() => setIsVehicleModalOpen(true)}
                  >
                    Add Vehicle
                  </Button>
                </div>

                {(profileData.vehicles || []).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No vehicles linked to this customer yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {profileData.vehicles.map(v => (
                      <div key={v._id} className="p-3.5 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm uppercase block">
                            {v.regNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                            {v.vehicleType} {v.brand ? `• ${v.brand}` : ''} {v.model ? v.model : ''}
                          </span>
                        </div>
                        <span className="text-[10px] bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-600 dark:text-slate-300 font-bold px-2 py-1 rounded">
                          {v.colour || 'Vehicle'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service History Timeline */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/60 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  Service History
                </h3>

                {(profileData.jobCards || []).length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">No service records found for this customer.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-navy-800">
                    {profileData.jobCards.map(j => (
                      <div key={j._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">{j.serviceName || j.washPackage}</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300 uppercase bg-slate-100 dark:bg-navy-950 px-1.5 py-0.5 rounded">
                              {j.vehicleReg}
                            </span>
                            <Badge variant={j.status}>{j.serviceStatus || j.status}</Badge>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            {formatDate(j.createdAt, true)} • Token: {j.tokenNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="font-mono font-bold text-slate-900 dark:text-white block text-sm">
                              {formatCurrency(j.finalAmount !== undefined ? j.finalAmount : (j.price || 0))}
                            </span>
                            <span className={`text-[10px] font-bold uppercase ${
                              j.paymentStatus === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
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
        /* Customers Directory View */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-slate-200/80 dark:border-navy-700/60 shadow-xs">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Customer Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Directory of registered clients with Malayalam search support and service tracking.
              </p>
            </div>

            <Button icon={UserPlus} onClick={openCreateModal}>
              New Customer
            </Button>
          </div>

          {/* Search Box */}
          <div className="bg-white dark:bg-navy-900 p-4 border border-slate-200/60 dark:border-navy-700/60 rounded-xl shadow-xs">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, മലയാളം പേര്, mobile, or place..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-navy-900 transition-all placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-700/60 rounded-2xl shadow-xs overflow-hidden">
            {isListLoading ? (
              <div className="py-20 text-center"><Spinner size="lg" /></div>
            ) : customersList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">No customer records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-navy-950/80 border-b border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">മലയാളം പേര്</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Place / Address</th>
                      <th className="py-3 px-4 text-center">Washes</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-navy-800">
                    {customersList.map(cust => (
                      <tr key={cust._id} className="hover:bg-slate-50/60 dark:hover:bg-navy-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                          <button
                            type="button"
                            onClick={() => setProfileId(cust._id)}
                            className="hover:text-brand-500 text-left cursor-pointer"
                          >
                            {cust.name}
                          </button>
                        </td>

                        <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          {cust.nameMalayalam || '-'}
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {cust.mobile}
                          {cust.alternateMobile && <span className="block text-[10px] text-slate-400 dark:text-slate-500">{cust.alternateMobile}</span>}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {cust.place || cust.address || '-'}
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {cust.totalWashes || 0}
                        </td>

                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProfileId(cust._id)}
                          >
                            Profile
                          </Button>
                          <button
                            type="button"
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5 inline" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete customer ${cust.name}?`)) {
                                deleteCustomerMutation.mutate(cust._id);
                              }
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-navy-700 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
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

      {/* CREATE / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingCustomer ? 'Edit Customer' : 'Register New Customer'}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCustomerMutation.mutate(formData);
          }}
          className="flex flex-col gap-4 text-slate-800 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Customer Name (English)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="E.g. Muhammed"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">പേര് (Malayalam Name)</label>
              <input
                type="text"
                value={formData.nameMalayalam}
                onChange={(e) => setFormData(prev => ({ ...prev, nameMalayalam: e.target.value }))}
                placeholder="E.g. മുഹമ്മദ്"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="10-digit number"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-semibold"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Alternate Mobile (Optional)</label>
              <input
                type="tel"
                value={formData.alternateMobile}
                onChange={(e) => setFormData(prev => ({ ...prev, alternateMobile: e.target.value }))}
                placeholder="Optional backup phone"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">സ്ഥലം / Place</label>
              <input
                type="text"
                value={formData.place}
                onChange={(e) => setFormData(prev => ({ ...prev, place: e.target.value }))}
                placeholder="E.g. Kozhikode"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Optional email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Customer Notes (Supports Malayalam)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes or customer preferences..."
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
            <Button type="submit" variant="primary" isLoading={saveCustomerMutation.isPending}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD VEHICLE MODAL (Within profile) */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        title="Add Vehicle to Customer Profile"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addVehicleMutation.mutate(vehicleData);
          }}
          className="flex flex-col gap-4 text-slate-800 text-xs"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Registration Plate</label>
              <input
                type="text"
                value={vehicleData.regNumber}
                onChange={(e) => setVehicleData(prev => ({ ...prev, regNumber: e.target.value.toUpperCase() }))}
                placeholder="E.g. KL 11 AB 1234"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold uppercase"
                required
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Vehicle Category</label>
              <select
                value={vehicleData.vehicleType}
                onChange={(e) => setVehicleData(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                required
              >
                {vTypes.map(vt => (
                  <option key={vt.code} value={vt.code}>{vt.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Brand / Make</label>
              <input
                type="text"
                value={vehicleData.brand}
                onChange={(e) => setVehicleData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="E.g. Toyota, Honda"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Model / Color</label>
              <input
                type="text"
                value={vehicleData.model}
                onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="E.g. Innova / White"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setIsVehicleModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={addVehicleMutation.isPending}>
              Link Vehicle
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Customers;
