import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, ArrowLeft, Wrench, User, Calendar, ShieldAlert } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const Vehicles = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Navigation states
  const [detailsId, setDetailsId] = useState(null);

  // Search & Pagination states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modal forms states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    customerId: '',
    regNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'petrol',
    colour: '',
    engineCC: 1200,
    notes: ''
  });

  // 1. Fetch Vehicles List Query
  const { data: vehicleData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminVehicles', search, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/vehicles', {
        params: { page, limit: 10, search }
      });
      return data;
    }
  });

  // 2. Fetch Selected Vehicle Details Query
  const { data: detailsData, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['adminVehicleDetails', detailsId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/vehicles/${detailsId}/details`);
      return data.data;
    },
    enabled: !!detailsId
  });

  // 3. Fetch Customers for Add/Edit dropdown
  const { data: customersList } = useQuery({
    queryKey: ['adminDropdownCustomers'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/customers?limit=100');
      return data.data;
    }
  });

  // 4. Create / Edit Vehicle Mutations
  const saveVehicleMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingVehicle) {
        return await api.put(`/api/v1/admin/vehicles/${editingVehicle._id}`, payload);
      } else {
        return await api.post('/api/v1/admin/vehicles', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminVehicles'] });
      if (detailsId) {
        queryClient.invalidateQueries({ queryKey: ['adminVehicleDetails', detailsId] });
      }
      addToast(editingVehicle ? 'Vehicle details updated' : 'Vehicle registered successfully', 'success');
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
      addToast('Vehicle deleted successfully', 'success');
      if (detailsId) setDetailsId(null);
    }
  });

  const openFormModal = (v = null) => {
    if (v) {
      setEditingVehicle(v);
      setFormData({
        customerId: v.customerId?._id || v.customerId || '',
        regNumber: v.regNumber,
        make: v.make,
        model: v.model,
        year: v.year,
        fuelType: v.fuelType,
        colour: v.colour || '',
        engineCC: v.engineCC,
        notes: v.notes || ''
      });
    } else {
      setEditingVehicle(null);
      setFormData({
        customerId: '',
        regNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        fuelType: 'petrol',
        colour: '',
        engineCC: 1200,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveVehicleMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      {!detailsId ? (
        /* LIST HEADER */
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vehicles Registry</h1>
            <p className="text-xs text-slate-500 mt-1">Manage workshop vehicle logs and service histories.</p>
          </div>
          <Button onClick={() => openFormModal()} icon={Plus}>
            Register Vehicle
          </Button>
        </div>
      ) : (
        /* DETAILS HEADER */
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDetailsId(null)}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Go back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
              {detailsData?.vehicle?.regNumber || 'Vehicle Details'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Full service history and active jobs.</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!detailsId ? (
        /* VEHICLES LIST TABLE */
        <div className="flex flex-col gap-5">
          <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex items-center justify-between shadow-xs">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search registration number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
              />
            </div>
          </div>

          {isListLoading ? (
            <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
          ) : (
            <>
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th isSticky>Reg Number</Th>
                    <Th>Make & Model</Th>
                    <Th>Customer</Th>
                    <Th>Fuel Type</Th>
                    <Th>Engine (CC)</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {vehicleData?.data?.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} className="text-center text-slate-400 py-10">No vehicle records found</Td>
                    </Tr>
                  ) : (
                    vehicleData.data.map((v) => (
                      <Tr key={v._id}>
                        <Td isSticky className="font-bold text-slate-800">
                          <button
                            onClick={() => setDetailsId(v._id)}
                            className="hover:text-brand-600 font-bold uppercase transition-colors cursor-pointer text-left"
                          >
                            {v.regNumber}
                          </button>
                        </Td>
                        <Td className="font-medium">{v.make} {v.model} ({v.year})</Td>
                        <Td className="text-slate-500 font-medium">{v.customerId?.name || 'N/A'}</Td>
                        <Td className="capitalize"><Badge variant="neutral">{v.fuelType}</Badge></Td>
                        <Td className="font-semibold text-slate-600">{v.engineCC} cc</Td>
                        <Td className="text-right flex items-center justify-end gap-1.5 py-3">
                          <button
                            onClick={() => openFormModal(v)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete vehicle record?')) {
                                deleteVehicleMutation.mutate(v._id);
                              }
                            }}
                            className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </TableContainer>

              {/* Pagination controls */}
              {vehicleData?.pagination && (
                <div className="flex justify-between items-center bg-white px-6 py-4.5 border border-slate-200/60 rounded-xl shadow-xs">
                  <span className="text-xs text-slate-500">
                    Showing Page <span className="font-bold text-slate-800">{page}</span> of {vehicleData.pagination.pages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(vehicleData.pagination.pages, p + 1))}
                      disabled={page === vehicleData.pagination.pages}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* VEHICLE PROFILE DETAILS VIEW */
        isDetailsLoading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Vehicle Specs & Owner */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              {/* Specs Card */}
              <Card title="Vehicle Specification" bodyClassName="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Make / Model</span>
                    <span className="font-bold text-slate-700">{detailsData.vehicle.make} {detailsData.vehicle.model}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Manufacturing Year</span>
                    <span className="font-bold text-slate-700">{detailsData.vehicle.year}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Fuel Category</span>
                    <span className="font-bold text-slate-700 uppercase">{detailsData.vehicle.fuelType}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Engine displacement</span>
                    <span className="font-bold text-slate-700">{detailsData.vehicle.engineCC} cc</span>
                  </div>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-slate-400">Colour</span>
                    <span className="font-bold text-slate-700">{detailsData.vehicle.colour || 'N/A'}</span>
                  </div>
                </div>

                {detailsData.vehicle.notes && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Vehicle Notes</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{detailsData.vehicle.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => openFormModal(detailsData.vehicle)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Edit details
                  </Button>
                </div>
              </Card>

              {/* Owner Info Card */}
              <Card title="Customer Profile" bodyClassName="flex flex-col gap-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 rounded-full bg-slate-100 text-slate-600">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-sm">{detailsData.vehicle.customerId?.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Vehicle Owner</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 text-xs text-slate-500">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span>Mobile</span>
                    <span className="font-semibold text-slate-700">{detailsData.vehicle.customerId?.mobile}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Email</span>
                    <span className="font-semibold text-slate-700">{detailsData.vehicle.customerId?.email || 'N/A'}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Active Service & History */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Active Open Job Card */}
              <Card title="Active Repair Status">
                {detailsData.openJobCard ? (
                  <div className="p-5 bg-brand-50/20 border border-brand-100/50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-base">{detailsData.openJobCard.jobNumber}</span>
                        <Badge variant={detailsData.openJobCard.status}>{detailsData.openJobCard.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Service type: <span className="font-bold text-slate-700">{detailsData.openJobCard.serviceType.join(', ')}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned Mechanic: <span className="font-bold text-slate-700">{detailsData.openJobCard.mechanicId?.name || 'Unassigned'}</span>
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate(`/admin/jobs?id=${detailsData.openJobCard._id}`)}
                      size="sm"
                    >
                      Open Job Card
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 text-center py-6">No active repairs. Vehicle is not checked in.</p>
                )}
              </Card>

              {/* Service history timeline list */}
              <Card title="Servicing History Logs">
                {detailsData.history?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No past services registered for this vehicle.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {detailsData.history.map((h) => (
                      <div key={h._id} className="p-4 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-slate-200 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{h.jobNumber}</span>
                            <Badge variant={h.status}>{h.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5">
                            Services: <span className="font-semibold text-slate-700">{h.serviceType.join(', ')}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs font-semibold text-slate-700">Labour Billed: {formatCurrency(h.labourCharges)}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(h.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

          </div>
        )
      )}

      {/* VEHICLE FORM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingVehicle ? 'Update Vehicle Details' : 'Register New Vehicle'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="regNumber" className="block text-xs font-bold text-slate-500 uppercase mb-2">Registration Number</label>
              <input
                type="text"
                id="regNumber"
                name="regNumber"
                value={formData.regNumber}
                onChange={handleFormChange}
                placeholder="E.g. DL3CAN1234"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                required
              />
            </div>
            <div>
              <label htmlFor="customerId" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Owner (Customer)</label>
              <select
                id="customerId"
                name="customerId"
                value={formData.customerId}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                required
              >
                <option value="">-- Select Customer --</option>
                {customersList?.map((cust) => (
                  <option key={cust._id} value={cust._id}>{cust.name} ({cust.mobile})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="make" className="block text-xs font-bold text-slate-500 uppercase mb-2">Manufacturer (Make)</label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleFormChange}
                placeholder="E.g. Maruti Suzuki"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Model</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleFormChange}
                placeholder="E.g. Swift"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="year" className="block text-xs font-bold text-slate-500 uppercase mb-2">Manufacturing Year</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="fuelType" className="block text-xs font-bold text-slate-500 uppercase mb-2">Fuel Type</label>
              <select
                id="fuelType"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label htmlFor="engineCC" className="block text-xs font-bold text-slate-500 uppercase mb-2">Engine capacity (CC)</label>
              <input
                type="number"
                id="engineCC"
                name="engineCC"
                value={formData.engineCC}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="colour" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Colour</label>
            <input
              type="text"
              id="colour"
              name="colour"
              value={formData.colour}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="2"
              placeholder="E.g. Minor scratches on doors"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveVehicleMutation.isPending}>
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
