import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import {
  Calendar,
  List,
  Plus,
  Check,
  X,
  RefreshCw,
  FolderSync,
  Search,
  UserCheck,
  Clock
} from 'lucide-react';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

export const Appointments = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Search & view states
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'list'
  const [search, setSearch] = useState('');
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedApptId, setSelectedApptId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    vehicleReg: '',
    serviceType: 'General Service Checkup',
    preferredDate: '',
    preferredTime: '09:30 AM',
    notes: '',
    assignedMechanic: ''
  });

  const [rescheduleData, setRescheduleData] = useState({
    preferredDate: '',
    preferredTime: '09:30 AM'
  });

  // time slots list
  const timeSlots = ['09:30 AM', '11:00 AM', '12:30 PM', '02:00 PM', '03:30 PM', '05:00 PM'];

  // 1. Fetch Appointments Query
  const { data: apptsData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminAppointments', search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/appointments', {
        params: { search }
      });
      return data.data;
    }
  });

  // 2. Fetch Mechanics for assignment
  const { data: staffList } = useQuery({
    queryKey: ['adminMechanicsApptDropdown'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/staff');
      return data.data.filter(s => s.role === 'mechanic');
    }
  });

  // 3. Create Appointment Mutation
  const createApptMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/appointments', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAppointments'] });
      addToast('Appointment scheduled successfully', 'success');
      setIsFormOpen(false);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to book slot', 'error');
    }
  });

  // 4. Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return await api.put(`/api/v1/admin/appointments/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAppointments'] });
      addToast('Appointment status updated & notification sent', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  });

  // 5. Reschedule Mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, preferredDate, preferredTime }) => {
      return await api.put(`/api/v1/admin/appointments/${id}`, { preferredDate, preferredTime });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAppointments'] });
      addToast('Appointment rescheduled & notification sent', 'success');
      setIsRescheduleOpen(false);
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Reschedule slot is fully booked', 'error');
    }
  });

  // 6. Convert to Job Card Mutation
  const convertJobMutation = useMutation({
    mutationFn: async (id) => {
      return await api.post(`/api/v1/admin/appointments/${id}/convert`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminAppointments'] });
      addToast('Converted to active Job Card!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Conversion failed', 'error');
    }
  });

  const openRescheduleModal = (appt) => {
    setSelectedApptId(appt._id);
    setRescheduleData({
      preferredDate: appt.preferredDate ? new Date(appt.preferredDate).toISOString().split('T')[0] : '',
      preferredTime: appt.preferredTime
    });
    setIsRescheduleOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    createApptMutation.mutate(formData);
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    rescheduleMutation.mutate({
      id: selectedApptId,
      ...rescheduleData
    });
  };

  // Convert calendar events list
  const events = (apptsData || []).map((appt) => {
    const start = new Date(appt.preferredDate);
    // Add time component helper
    const timeParts = appt.preferredTime.split(' ');
    const hourMin = timeParts[0].split(':');
    let hour = parseInt(hourMin[0]);
    const min = parseInt(hourMin[1]);
    
    if (timeParts[1] === 'PM' && hour !== 12) hour += 12;
    if (timeParts[1] === 'AM' && hour === 12) hour = 0;
    
    start.setHours(hour, min, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

    return {
      id: appt._id,
      title: `${appt.customerName} - ${appt.serviceType}`,
      start,
      end,
      resource: appt
    };
  });

  const handleSelectEvent = (event) => {
    const appt = event.resource;
    if (window.confirm(`Convert appointment for ${appt.customerName} to Job Card?`)) {
      convertJobMutation.mutate(appt._id);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Appointments Booking</h1>
          <p className="text-xs text-slate-500 mt-1">Confirm online requests, reschedule slots, and convert to active jobs.</p>
        </div>
        <div className="flex gap-2">
          {/* View Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'calendar' ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button onClick={() => setIsFormOpen(true)} icon={Plus}>
            New Booking
          </Button>
        </div>
      </div>

      {/* Main Boards */}
      {isListLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : viewMode === 'calendar' ? (
        /* CALENDAR VIEW GRID */
        <Card title="Appointment calendar grid" subtitle="Click event to convert into Job Card">
          <div className="mt-2 min-h-[500px]">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultView="week"
              onSelectEvent={handleSelectEvent}
              style={{ height: 600 }}
            />
          </div>
        </Card>
      ) : (
        /* LIST VIEW TABLE */
        <div className="flex flex-col gap-5">
          <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex items-center justify-between shadow-xs">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search name, phone or vehicle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
              />
            </div>
          </div>

          <TableContainer>
            <Thead>
              <Tr>
                <Th isSticky>Customer</Th>
                <Th>Vehicle Reg</Th>
                <Th>Service Type</Th>
                <Th>Date & Time</Th>
                <Th>Status</Th>
                <Th>Source</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {apptsData?.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center text-slate-400 py-10">No appointments scheduled</Td>
                </Tr>
              ) : (
                apptsData.map((appt) => (
                  <Tr key={appt._id}>
                    <Td isSticky className="font-bold text-slate-800">
                      {appt.customerName}
                      <span className="block text-[10px] text-slate-400 font-bold uppercase mt-0.5">{appt.mobile}</span>
                    </Td>
                    <Td className="uppercase font-bold text-slate-600">{appt.vehicleReg}</Td>
                    <Td className="font-medium text-slate-500">{appt.serviceType}</Td>
                    <Td>
                      <span className="font-semibold text-slate-700 block text-xs">{formatDate(appt.preferredDate)}</span>
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-100/50 px-2 py-0.5 rounded-md mt-1 inline-block">
                        {appt.preferredTime}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant={appt.status}>{appt.status}</Badge>
                    </Td>
                    <Td className="uppercase"><Badge variant="neutral">{appt.source}</Badge></Td>
                    <Td className="text-right flex items-center justify-end gap-1 py-4">
                      {/* Confirm status action */}
                      {appt.status === 'pending' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'confirmed' })}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 cursor-pointer"
                          title="Confirm slot"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Reschedule trigger */}
                      {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                        <button
                          onClick={() => openRescheduleModal(appt)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Reschedule slot"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}

                      {/* Convert to job card */}
                      {appt.status === 'confirmed' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Convert to Job Card?')) {
                              convertJobMutation.mutate(appt._id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 cursor-pointer"
                          title="Convert to Job Card"
                        >
                          <FolderSync className="w-4 h-4" />
                        </button>
                      )}

                      {/* Cancel status action */}
                      {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: appt._id, status: 'cancelled' })}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Cancel booking"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </TableContainer>
        </div>
      )}

      {/* APPOINTMENT FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Schedule Service Appointment Slot"
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="customerName" className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Name</label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
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
            <label htmlFor="vehicleReg" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Reg Number</label>
            <input
              type="text"
              id="vehicleReg"
              name="vehicleReg"
              value={formData.vehicleReg}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="serviceType" className="block text-xs font-bold text-slate-500 uppercase mb-2">Service Type</label>
              <input
                type="text"
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="preferredDate" className="block text-xs font-bold text-slate-500 uppercase mb-2">Preferred Date</label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="preferredTime" className="block text-xs font-bold text-slate-500 uppercase mb-2">Time Slot</label>
            <select
              id="preferredTime"
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {timeSlots.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assignedMechanic" className="block text-xs font-bold text-slate-500 uppercase mb-2">Assign mechanic</label>
            <select
              id="assignedMechanic"
              name="assignedMechanic"
              value={formData.assignedMechanic}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              <option value="">-- Choose Mechanic --</option>
              {staffList?.map(s => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="apptNotes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Complaints Details (Optional)</label>
            <textarea
              id="apptNotes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              rows="2"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createApptMutation.isPending}>
              Schedule Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* RESCHEDULE SLOT MODAL */}
      <Modal
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        title="Reschedule Appointment Date/Time"
      >
        <form onSubmit={handleRescheduleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="reschedDate" className="block text-xs font-bold text-slate-500 uppercase mb-2">New Date</label>
            <input
              type="date"
              id="reschedDate"
              name="preferredDate"
              value={rescheduleData.preferredDate}
              onChange={(e) => setRescheduleData(prev => ({ ...prev, preferredDate: e.target.value }))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="reschedTime" className="block text-xs font-bold text-slate-500 uppercase mb-2">New Time Slot</label>
            <select
              id="reschedTime"
              name="preferredTime"
              value={rescheduleData.preferredTime}
              onChange={(e) => setRescheduleData(prev => ({ ...prev, preferredTime: e.target.value }))}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
            >
              {timeSlots.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={rescheduleMutation.isPending}>
              Reschedule Slot
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Appointments;
