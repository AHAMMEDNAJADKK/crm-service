import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, ArrowLeft, Car, Wrench, Receipt, ArrowRight, UserPlus } from 'lucide-react';

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

export const Customers = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Navigation states
  const [profileId, setProfileId] = useState(null);
  
  // Search & Pagination states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', address: '', notes: '' });

  // Add Vehicle modal states (in customer profile)
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleData, setVehicleData] = useState({ regNumber: '', make: '', model: '', year: new Date().getFullYear(), fuelType: 'petrol', colour: '', engineCC: 1200, notes: '' });

  // 1. Fetch Customers List Query
  const { data: customerData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminCustomers', search, page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/customers', {
        params: { page, limit: 10, search }
      });
      return data;
    }
  });

  // 2. Fetch Selected Customer Profile Query
  const { data: profileData, isLoading: isProfileLoading } = useQuery({
    queryKey: ['adminCustomerProfile', profileId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/customers/${profileId}/profile`);
      return data.data;
    },
    enabled: !!profileId
  });

  // 3. Create / Edit Customer Mutations
  const saveCustomerMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingCustomer) {
        return await api.put(`/api/v1/admin/customers/${editingCustomer._id}`, payload);
      } else {
        return await api.post('/api/v1/admin/customers', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] });
      if (profileId) {
        queryClient.invalidateQueries({ queryKey: ['adminCustomerProfile', profileId] });
      }
      addToast(editingCustomer ? 'Customer updated successfully' : 'Customer created successfully', 'success');
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

  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/vehicles', {
        ...payload,
        customerId: profileId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomerProfile', profileId] });
      addToast('Vehicle added successfully', 'success');
      closeVehicleModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to add vehicle', 'error');
    }
  });

  const openFormModal = (cust = null) => {
    if (cust) {
      setEditingCustomer(cust);
      setFormData({
        name: cust.name,
        mobile: cust.mobile,
        email: cust.email || '',
        address: cust.address || '',
        notes: cust.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', mobile: '', email: '', address: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const closeFormModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const openVehicleModal = () => {
    setVehicleData({ regNumber: '', make: '', model: '', year: new Date().getFullYear(), fuelType: 'petrol', colour: '', engineCC: 1200, notes: '' });
    setIsVehicleModalOpen(true);
  };

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVehicleChange = (e) => {
    setVehicleData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveCustomerMutation.mutate(formData);
  };

  const handleVehicleSubmit = (e) => {
    e.preventDefault();
    addVehicleMutation.mutate(vehicleData);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      {!profileId ? (
        /* LIST HEADER */
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Customer Database</h1>
            <p className="text-xs text-slate-500 mt-1">Manage garage customers and view spend logs.</p>
          </div>
          <Button onClick={() => openFormModal()} icon={Plus}>
            Add Customer
          </Button>
        </div>
      ) : (
        /* PROFILE HEADER */
        <div className="flex items-center gap-4">
          <button
            onClick={() => setProfileId(null)}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Go back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {profileData?.customer?.name || 'Customer Profile'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">Detailed history and mechanical files.</p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!profileId ? (
        /* CUSTOMER LIST TABLE */
        <div className="flex flex-col gap-5">
          {/* Search Filter bar */}
          <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex items-center justify-between shadow-xs">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, phone or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1); // Reset page on filter
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all"
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
                    <Th isSticky>Customer Name</Th>
                    <Th>Mobile Number</Th>
                    <Th>Email</Th>
                    <Th>Address</Th>
                    <Th className="text-right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customerData?.data?.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} className="text-center text-slate-400 py-10">No customer records found</Td>
                    </Tr>
                  ) : (
                    customerData.data.map((cust) => (
                      <Tr key={cust._id}>
                        <Td isSticky className="font-bold text-slate-800">
                          <button
                            onClick={() => setProfileId(cust._id)}
                            className="hover:text-brand-600 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer text-left"
                          >
                            {cust.name}
                            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-600" />
                          </button>
                        </Td>
                        <Td className="font-medium">{cust.mobile}</Td>
                        <Td>{cust.email || 'N/A'}</Td>
                        <Td className="truncate max-w-xs">{cust.address || 'N/A'}</Td>
                        <Td className="text-right flex items-center justify-end gap-1.5 py-3">
                          <button
                            onClick={() => openFormModal(cust)}
                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Delete customer? All historical records will remain intact.')) {
                                deleteCustomerMutation.mutate(cust._id);
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
              {customerData?.pagination && (
                <div className="flex justify-between items-center bg-white px-6 py-4.5 border border-slate-200/60 rounded-xl shadow-xs">
                  <span className="text-xs text-slate-500">
                    Showing Page <span className="font-bold text-slate-800">{page}</span> of {customerData.pagination.pages}
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
                      onClick={() => setPage(p => Math.min(customerData.pagination.pages, p + 1))}
                      disabled={page === customerData.pagination.pages}
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
        /* CUSTOMER PROFILE VIEW */
        isProfileLoading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Contact Card */}
            <div className="flex flex-col gap-6 lg:col-span-1">
              <Card title="Customer info" bodyClassName="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Mobile</span>
                    <span className="font-bold text-slate-700">{profileData?.customer?.mobile}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Email</span>
                    <span className="font-bold text-slate-700">{profileData?.customer?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Address</span>
                    <span className="font-bold text-slate-700 text-right max-w-[150px] truncate" title={profileData?.customer?.address}>
                      {profileData?.customer?.address || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                    <span className="text-slate-400">Total Spend</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(profileData?.totalSpend)}</span>
                  </div>
                </div>

                {profileData?.customer?.notes && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Administrative Notes</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{profileData.customer.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => openFormModal(profileData.customer)}
                    variant="outline"
                    className="flex-1"
                    size="sm"
                  >
                    Edit details
                  </Button>
                </div>
              </Card>

              {/* Vehicles List */}
              <Card
                title="Registered Vehicles"
                headerAction={
                  <button onClick={openVehicleModal} className="text-xs font-bold text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 cursor-pointer">
                    <UserPlus className="w-3.5 h-3.5" /> Add Vehicle
                  </button>
                }
              >
                <div className="flex flex-col gap-3">
                  {profileData?.vehicles?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No vehicles linked to customer</p>
                  ) : (
                    profileData.vehicles.map((v) => (
                      <div key={v._id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:shadow-xs transition-shadow">
                        <div>
                          <h5 className="text-sm font-extrabold text-slate-800 uppercase">{v.regNumber}</h5>
                          <p className="text-xs text-slate-500 mt-0.5">{v.make} {v.model} ({v.year})</p>
                        </div>
                        <span className="inline-block text-[10px] font-bold text-slate-600 uppercase bg-slate-200/80 px-2.5 py-0.5 rounded-md">
                          {v.fuelType}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>

            {/* Right: Servicing History */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              {/* Job history list */}
              <Card title="Repair & Service History">
                {profileData?.jobCards?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No service records registered yet.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {profileData.jobCards.map((jc) => (
                      <div key={jc._id} className="p-4 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{jc.jobNumber}</span>
                            <Badge variant={jc.status}>{jc.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5">
                            Services: <span className="font-semibold text-slate-700">{jc.serviceType.join(', ')}</span>
                          </p>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs font-semibold text-slate-700">Labour: {formatCurrency(jc.labourCharges)}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{formatDate(jc.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Invoices history */}
              <Card title="Invoices & Billing">
                {profileData?.invoices?.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-10">No billing history found.</p>
                ) : (
                  <TableContainer>
                    <Thead>
                      <Tr>
                        <Th>Invoice No</Th>
                        <Th>Billed Amount</Th>
                        <Th>Status</Th>
                        <Th>Due Date</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {profileData.invoices.map((inv) => (
                        <Tr key={inv._id}>
                          <Td className="font-bold text-brand-600">{inv.invoiceNumber}</Td>
                          <Td className="font-semibold">{formatCurrency(inv.grandTotal)}</Td>
                          <Td>
                            <Badge variant={inv.paymentStatus}>{inv.paymentStatus}</Badge>
                          </Td>
                          <Td className="text-xs">{formatDate(inv.dueDate)}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </TableContainer>
                )}
              </Card>
            </div>

          </div>
        )
      )}

      {/* CUSTOMER FORM MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeFormModal}
        title={editingCustomer ? 'Update Customer details' : 'Register New Customer'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="mobile" className="block text-xs font-bold text-slate-500 uppercase mb-2">Mobile Number</label>
            <input
              type="tel"
              id="mobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-xs font-bold text-slate-500 uppercase mb-2">Home Address</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="3"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveCustomerMutation.isPending}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ADD VEHICLE MODAL */}
      <Modal
        isOpen={isVehicleModalOpen}
        onClose={closeVehicleModal}
        title="Add Vehicle to Customer Profile"
        size="lg"
      >
        <form onSubmit={handleVehicleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="regNumber" className="block text-xs font-bold text-slate-500 uppercase mb-2">Registration Number</label>
              <input
                type="text"
                id="regNumber"
                name="regNumber"
                value={vehicleData.regNumber}
                onChange={handleVehicleChange}
                placeholder="E.g. DL3CAN1234"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                required
              />
            </div>
            <div>
              <label htmlFor="fuelType" className="block text-xs font-bold text-slate-500 uppercase mb-2">Fuel Type</label>
              <select
                id="fuelType"
                name="fuelType"
                value={vehicleData.fuelType}
                onChange={handleVehicleChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="petrol">Petrol</option>
                <option value="diesel">Diesel</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
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
                value={vehicleData.make}
                onChange={handleVehicleChange}
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
                value={vehicleData.model}
                onChange={handleVehicleChange}
                placeholder="E.g. Swift"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="year" className="block text-xs font-bold text-slate-500 uppercase mb-2">Year</label>
              <input
                type="number"
                id="year"
                name="year"
                value={vehicleData.year}
                onChange={handleVehicleChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="colour" className="block text-xs font-bold text-slate-500 uppercase mb-2">Colour</label>
              <input
                type="text"
                id="colour"
                name="colour"
                value={vehicleData.colour}
                onChange={handleVehicleChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="engineCC" className="block text-xs font-bold text-slate-500 uppercase mb-2">Engine capacity (CC)</label>
              <input
                type="number"
                id="engineCC"
                name="engineCC"
                value={vehicleData.engineCC}
                onChange={handleVehicleChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="vehicleNotes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Notes</label>
            <textarea
              id="vehicleNotes"
              name="notes"
              value={vehicleData.notes}
              onChange={handleVehicleChange}
              rows="2"
              placeholder="E.g. Dent on rear bumpers"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeVehicleModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={addVehicleMutation.isPending}>
              Register Vehicle
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
