import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Gauge, Car, DollarSign } from 'lucide-react';

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

export const FuelLogs = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);

  // Form states
  const [formData, setFormData] = useState({
    vehicleId: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    costPerLiter: '',
    odometerReading: '',
    notes: ''
  });

  // 1. Fetch Fuel Logs Query
  const { data: logsData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminFuelLogs', page],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/fuel-logs', {
        params: { page, limit: 10 }
      });
      return data;
    }
  });

  // 2. Fetch Vehicles for refill select
  const { data: vehiclesList } = useQuery({
    queryKey: ['adminRefillVehiclesSelect'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/vehicles?limit=100');
      return data.data;
    }
  });

  // 3. Create Refill Mutation
  const createLogMutation = useMutation({
    mutationFn: async (payload) => {
      const formatted = {
        ...payload,
        liters: parseFloat(payload.liters),
        costPerLiter: parseFloat(payload.costPerLiter),
        odometerReading: parseInt(payload.odometerReading) || undefined
      };
      return await api.post('/api/v1/admin/fuel-logs', formatted);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFuelLogs'] });
      addToast('Refuel logged successfully', 'success');
      setIsFormOpen(false);
      setFormData({ vehicleId: '', date: new Date().toISOString().split('T')[0], liters: '', costPerLiter: '', odometerReading: '', notes: '' });
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to log refuel', 'error');
    }
  });

  // Delete Mutation
  const deleteLogMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/fuel-logs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFuelLogs'] });
      addToast('Refuel log removed', 'success');
    }
  });

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    createLogMutation.mutate(formData);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Fuel Log Registry</h1>
          <p className="text-xs text-slate-500 mt-1">Refueling logs and cost trends for garage fleet or operations.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} icon={Plus}>
          Log Refuel
        </Button>
      </div>

      {/* Fuel logs table */}
      {isListLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : (
        <>
          <TableContainer>
            <Thead>
              <Tr>
                <Th isSticky>Date</Th>
                <Th>Vehicle Reg</Th>
                <Th>Liters Filled</Th>
                <Th>Rate (₹/L)</Th>
                <Th>Total Cost</Th>
                <Th>Odometer Reading</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {logsData?.data?.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-10">No fuel records logged yet</Td>
                </Tr>
              ) : (
                logsData.data.map((log) => (
                  <Tr key={log._id}>
                    <Td isSticky className="font-bold text-slate-800">{formatDate(log.date)}</Td>
                    <Td className="uppercase font-bold text-brand-600">{log.vehicleId?.regNumber || 'FLEET'}</Td>
                    <Td className="font-semibold text-slate-600">{log.liters} L</Td>
                    <Td className="font-medium text-slate-500">{formatCurrency(log.costPerLiter)}</Td>
                    <Td className="font-extrabold text-slate-800">{formatCurrency(log.totalCost)}</Td>
                    <Td className="font-bold text-slate-500 text-xs flex items-center gap-1.5 py-4">
                      <Gauge className="w-4 h-4 text-slate-400" />
                      {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : 'N/A'}
                    </Td>
                    <Td className="text-right py-3">
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this fuel log record?')) {
                            deleteLogMutation.mutate(log._id);
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
          {logsData?.pagination && (
            <div className="flex justify-between items-center bg-white px-6 py-4.5 border border-slate-200/60 rounded-xl shadow-xs">
              <span className="text-xs text-slate-500">
                Showing Page <span className="font-bold text-slate-800">{page}</span> of {logsData.pagination.pages}
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
                  onClick={() => setPage(p => Math.min(logsData.pagination.pages, p + 1))}
                  disabled={page === logsData.pagination.pages}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* REFILL LOGGER FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Log Refueling Details"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="refillVehicle" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle</label>
            <select
              id="refillVehicle"
              name="vehicleId"
              value={formData.vehicleId}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              required
            >
              <option value="">-- Choose Vehicle --</option>
              {vehiclesList?.map(v => (
                <option key={v._id} value={v._id}>{v.regNumber} - {v.make} {v.model}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="refillDate" className="block text-xs font-bold text-slate-500 uppercase mb-2">Refuel Date</label>
            <input
              type="date"
              id="refillDate"
              name="date"
              value={formData.date}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="liters" className="block text-xs font-bold text-slate-500 uppercase mb-2">Volume (Liters)</label>
              <input
                type="number"
                id="liters"
                name="liters"
                value={formData.liters}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
            </div>
            <div>
              <label htmlFor="costPerLiter" className="block text-xs font-bold text-slate-500 uppercase mb-2">Rate (₹ / Liter)</label>
              <input
                type="number"
                id="costPerLiter"
                name="costPerLiter"
                value={formData.costPerLiter}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="odometer" className="block text-xs font-bold text-slate-500 uppercase mb-2">Odometer Reading (Km)</label>
            <input
              type="number"
              id="odometer"
              name="odometerReading"
              value={formData.odometerReading}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
            />
          </div>
          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Additional Notes</label>
            <input
              type="text"
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createLogMutation.isPending}>
              Save Fuel Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FuelLogs;
