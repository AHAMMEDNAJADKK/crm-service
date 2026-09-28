import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import {
  Plus,
  Search,
  Grid,
  List,
  Edit2,
  Trash2,
  Paperclip,
  CheckCircle,
  FileText,
  User,
  Clock,
  Car,
  ChevronRight,
  Upload,
  AlertTriangle,
  Droplet,
  DollarSign
} from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';
import printPDF from '../../utils/printPDF';
import VEHICLE_TYPES from '../../constants/vehicleTypes';
import WASH_PACKAGES from '../../constants/washPackages';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

const DraggableCard = ({ job, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: job._id
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
      }
    : undefined;

  const vTypeLabel = VEHICLE_TYPES.find(v => v.id === job.vehicleType)?.label || job.vehicleType;
  const pkgLabel = WASH_PACKAGES.find(p => p.id === job.washPackage)?.label || job.washPackage;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:shadow-md transition-all select-none flex flex-col gap-2 ${
        isDragging ? 'opacity-55 scale-95 border-brand-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/50">
          {job.tokenNumber}
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClick}
          className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col mt-1">
        <h5 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide font-mono">{job.vehicleReg}</h5>
        <span className="text-[10px] text-slate-400 font-semibold uppercase">{vTypeLabel}</span>
      </div>

      <div className="border-t border-slate-100 pt-3 mt-1 flex items-center justify-between text-[10px] text-slate-400">
        <span className="font-bold text-brand-500 uppercase">{pkgLabel}</span>
        <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
          {job.bayNumber ? `Bay ${job.bayNumber}` : 'Queued'}
        </span>
      </div>
    </div>
  );
};

const DroppableColumn = ({ status, title, jobs, onCardClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3.5 p-4 rounded-2xl w-72 shrink-0 border ${
        isOver ? 'bg-brand-50/20 border-brand-300' : 'bg-slate-50/50 border-slate-200/50'
      }`}
    >
      <div className="flex justify-between items-center px-1">
        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</h4>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
          {jobs.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[60vh] pr-1">
        {jobs.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 bg-white/40">
            Column Empty
          </div>
        ) : (
          jobs.map((job) => (
            <DraggableCard key={job._id} job={job} onClick={() => onCardClick(job._id)} />
          ))
        )}
      </div>
    </div>
  );
};

export const WashJobs = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const uiStore = useUiStore();
  
  // Custom toast fallbacks
  const addToast = (msg, type) => {
    if (uiStore.addToast) {
      uiStore.addToast({ message: msg, type });
    } else {
      console.log(`[Toast ${type}]: ${msg}`);
    }
  };

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('kanban');

  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  // Focus from URL redirect (e.g. tracking / billing redirects)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setSelectedJobId(id);
      setIsEditorOpen(true);
      navigate('/admin/jobs', { replace: true });
    }
  }, [location.search, navigate]);

  // Check-In Form State
  const [newJob, setNewJob] = useState({
    vehicleReg: '',
    vehicleType: 'car',
    washPackage: 'full-interior',
    customerName: '',
    mobile: '',
    notes: ''
  });

  // Editor states
  const [status, setStatus] = useState('queued');
  const [bayNumber, setBayNumber] = useState(0);
  const [assignedStaff, setAssignedStaff] = useState('Unassigned');
  const [waterUsedLitres, setWaterUsedLitres] = useState(0);
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [paymentMethod, setPaymentMethod] = useState('pending');

  // Queries
  const { data: jobsList = [], isLoading: isJobsLoading } = useQuery({
    queryKey: ['adminWashJobs', search],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/jobs', {
        params: { limit: 100, search }
      });
      return data.data;
    }
  });

  const { data: jobDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['adminWashJobDetails', selectedJobId],
    queryFn: async () => {
      const { data } = await api.get(`/api/v1/admin/jobs/${selectedJobId}`);
      const job = data.data;
      setStatus(job.status || 'queued');
      setBayNumber(job.bayNumber || 0);
      setAssignedStaff(job.assignedStaff || 'Unassigned');
      setWaterUsedLitres(job.waterUsedLitres || 0);
      setNotes(job.notes || '');
      setPaymentStatus(job.paymentStatus || 'unpaid');
      setPaymentMethod(job.paymentMethod || 'pending');
      return job;
    },
    enabled: !!selectedJobId
  });

  const { data: staffList = [] } = useQuery({
    queryKey: ['adminStaffNames'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/staff');
      return data.data;
    }
  });

  const { data: stationSettings } = useQuery({
    queryKey: ['adminSettingsForJobs'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/settings');
      return data.data;
    }
  });

  // Mutations
  const createJobMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/api/v1/admin/jobs', payload);
      return data.data;
    },
    onSuccess: (createdJob) => {
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      addToast(`Vehicle ${createdJob.vehicleReg} registered successfully!`, 'success');
      setIsCreatorOpen(false);
      setNewJob({ vehicleReg: '', vehicleType: 'car', washPackage: 'full-interior', customerName: '', mobile: '', notes: '' });
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to check-in vehicle.', 'error');
    }
  });

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data } = await api.put(`/api/v1/admin/jobs/${id}`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      queryClient.invalidateQueries({ queryKey: ['adminWashJobDetails', selectedJobId] });
      addToast('Wash job details updated successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to update wash job details.', 'error');
    }
  });

  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ id, files }) => {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('photos', files[i]);
      }
      return await api.post(`/api/v1/admin/jobs/${id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWashJobDetails', selectedJobId] });
      addToast('Inspection photos uploaded successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Photo upload failed.', 'error');
    }
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
      setIsEditorOpen(false);
      addToast('Wash record removed.', 'success');
    }
  });

  // Drag and drop updates
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const jobId = active.id;
    const newStatus = over.id;

    const original = jobsList.find(j => j._id === jobId);
    if (original && original.status !== newStatus) {
      try {
        await api.put(`/api/v1/admin/jobs/${jobId}`, { status: newStatus });
        queryClient.invalidateQueries({ queryKey: ['adminWashJobs'] });
        addToast(`Shifted ${original.vehicleReg} to ${newStatus}`, 'success');
      } catch (err) {
        addToast(err.response?.data?.error || 'Failed to shift status', 'error');
      }
    }
  };

  const openEditor = (id) => {
    setSelectedJobId(id);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedJobId(null);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createJobMutation.mutate(newJob);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateJobMutation.mutate({
      id: selectedJobId,
      payload: {
        status,
        bayNumber: status === 'queued' ? null : parseInt(bayNumber) || null,
        assignedStaff,
        waterUsedLitres,
        notes,
        paymentStatus,
        paymentMethod
      }
    });
  };

  const handlePhotoUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadPhotosMutation.mutate({
      id: selectedJobId,
      files: e.target.files
    });
  };

  // Kanban Column Categories
  const columns = {
    queued: 'Queued Waitlist',
    'in-bay': 'In Service Bay',
    washing: 'Washing Deck',
    drying: 'Drying & Polishing',
    ready: 'Ready / Unpaid',
    delivered: 'Completed / Delivered',
    cancelled: 'Cancelled'
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/50 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Active Wash Jobs</h1>
          <p className="text-xs text-slate-400 mt-1">Manage cleaning bays, log water volume consumption, and process checkout payments.</p>
        </div>
        <div className="flex gap-2">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md cursor-pointer ${
                viewMode === 'kanban' ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`}
            >
              <Grid className="w-4 h-4" />
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

          <Button onClick={() => setIsCreatorOpen(true)} icon={Plus}>
            Walk-in Check-in
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex items-center justify-between shadow-xs">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search Token, Reg Number or Customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
          />
        </div>
      </div>

      {/* Main Boards */}
      {isJobsLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : viewMode === 'kanban' ? (
        <DndContext onDragEnd={handleDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-4 items-start select-none">
            {Object.entries(columns).map(([colStatus, title]) => {
              const colJobs = jobsList.filter(j => j.status === colStatus) || [];
              return (
                <DroppableColumn
                  key={colStatus}
                  status={colStatus}
                  title={title}
                  jobs={colJobs}
                  onCardClick={openEditor}
                />
              );
            })}
          </div>
        </DndContext>
      ) : (
        <TableContainer>
          <Thead>
            <Tr>
              <Th isSticky>Token</Th>
              <Th>Vehicle Reg</Th>
              <Th>Type</Th>
              <Th>Package</Th>
              <Th>Staff Assigned</Th>
              <Th>Status</Th>
              <Th>Water (L)</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {jobsList.length === 0 ? (
              <Tr>
                <Td colSpan={8} className="text-center text-slate-400 py-10">No wash records found</Td>
              </Tr>
            ) : (
              jobsList.map((job) => (
                <Tr key={job._id}>
                  <Td isSticky className="font-mono font-bold text-brand-600">{job.tokenNumber}</Td>
                  <Td className="uppercase font-bold text-slate-800 tracking-wide font-mono">{job.vehicleReg}</Td>
                  <Td className="uppercase text-xs">{job.vehicleType}</Td>
                  <Td className="text-xs uppercase text-brand-500 font-bold">{job.washPackage.replace('-', ' ')}</Td>
                  <Td className="text-xs">{job.assignedStaff}</Td>
                  <Td><Badge variant={job.status}>{job.status}</Badge></Td>
                  <Td className="text-xs">{job.waterUsedLitres} L</Td>
                  <Td className="text-right py-3.5">
                    <Button onClick={() => openEditor(job._id)} size="sm" variant="outline">
                      Manage
                    </Button>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </TableContainer>
      )}

      {/* FAST CHECK-IN CREATOR MODAL */}
      <Modal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        title="Check-In Vehicle & Allocate Token"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicleReg" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Reg Plate</label>
              <input
                type="text"
                id="vehicleReg"
                value={newJob.vehicleReg}
                onChange={(e) => setNewJob(prev => ({ ...prev, vehicleReg: e.target.value.toUpperCase() }))}
                placeholder="E.G. KL07BY1234"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm uppercase"
                required
              />
            </div>

            <div>
              <label htmlFor="vehicleType" className="block text-xs font-bold text-slate-500 uppercase mb-2">Vehicle Type</label>
              <select
                id="vehicleType"
                value={newJob.vehicleType}
                onChange={(e) => setNewJob(prev => ({ ...prev, vehicleType: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                required
              >
                {VEHICLE_TYPES.map(v => (
                  <option key={v.id} value={v.id}>{v.label} ({v.category.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="washPackage" className="block text-xs font-bold text-slate-500 uppercase mb-2">Wash Package</label>
              <select
                id="washPackage"
                value={newJob.washPackage}
                onChange={(e) => setNewJob(prev => ({ ...prev, washPackage: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                required
              >
                {WASH_PACKAGES.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="mobile" className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Mobile (Optional)</label>
              <input
                type="tel"
                id="mobile"
                value={newJob.mobile}
                onChange={(e) => setNewJob(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="Mobile number"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="customerName" className="block text-xs font-bold text-slate-500 uppercase mb-2">Customer Name (Optional)</label>
            <input
              type="text"
              id="customerName"
              value={newJob.customerName}
              onChange={(e) => setNewJob(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="Name"
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Check-in Notes</label>
            <textarea
              id="notes"
              value={newJob.notes}
              onChange={(e) => setNewJob(prev => ({ ...prev, notes: e.target.value }))}
              rows="2"
              placeholder="E.g., muddy tires, clean underbody carefully..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreatorOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createJobMutation.isPending}>
              Register Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* DETAILED MANAGE EDITOR MODAL */}
      <Modal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={jobDetails ? `Manage Wash: ${jobDetails.tokenNumber}` : 'Wash Job Details'}
        size="xl"
      >
        {isDetailsLoading ? (
          <div className="py-10 flex justify-center"><Spinner /></div>
        ) : jobDetails ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <form onSubmit={handleUpdateSubmit} className="flex flex-col gap-4 bg-slate-50/50 p-5 border border-slate-100 rounded-2xl">
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Operations Stage</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white font-bold text-slate-700"
                    >
                      {Object.entries(columns).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Allocated Bay</label>
                    <select
                      value={bayNumber}
                      onChange={(e) => setBayNumber(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value={0}>Queued (No Bay)</option>
                      {Array.from({ length: stationSettings?.activeBaysCount || 3 }).map((_, idx) => (
                        <option key={idx + 1} value={idx + 1}>Bay {idx + 1}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Assigned Staff</label>
                    <select
                      value={assignedStaff}
                      onChange={(e) => setAssignedStaff(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="Unassigned">Unassigned</option>
                      {staffList.map(s => (
                        <option key={s._id} value={s.name}>{s.name} ({s.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Water Used (Litres)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={waterUsedLitres}
                        onChange={(e) => setWaterUsedLitres(parseInt(e.target.value) || 0)}
                        className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 font-bold absolute right-3 top-3">L</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Bill Payment</label>
                    <select
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid / Settled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold"
                      disabled={paymentStatus === 'unpaid'}
                    >
                      <option value="pending">Pending Checkout</option>
                      <option value="cash">Cash Settle</option>
                      <option value="upi">UPI / GPay</option>
                      <option value="card">Card Swipe</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes & Remarks</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    placeholder="Wipe dashboard thoroughly, polish alloys..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
                  />
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Delete this wash job?')) {
                        deleteJobMutation.mutate(jobDetails._id);
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>

                  <Button type="submit" size="sm" isLoading={updateJobMutation.isPending}>
                    Save Changes
                  </Button>
                </div>
              </form>

              {/* Photos Gallery */}
              <div className="bg-slate-50/50 p-5 border border-slate-100 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Before/After Inspections</h4>
                  <label className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50 cursor-pointer shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    Upload Photos
                    <input
                      type="file"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </label>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  {jobDetails.photos?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 col-span-3">No photos uploaded yet</p>
                  ) : (
                    jobDetails.photos.map((url, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden border border-slate-200">
                        <img src={url} alt="Inspection" className="w-full h-full object-cover" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Ticket Info & Invoicing */}
            <div className="flex flex-col gap-6">
              
              {/* Ticket details summary */}
              <Card title="Summary Billed">
                <div className="flex flex-col gap-3.5">
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500">Plate:</span>
                    <span className="font-mono font-bold text-slate-800 uppercase">{jobDetails.vehicleReg}</span>
                  </div>
                  
                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500">Service:</span>
                    <span className="font-bold text-brand-600 uppercase text-[10px]">
                      {WASH_PACKAGES.find(p => p.id === jobDetails.washPackage)?.label || jobDetails.washPackage}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                    <span className="text-slate-500">Water Consumption:</span>
                    <span className="font-bold text-blue-600 flex items-center gap-0.5">
                      <Droplet className="w-3.5 h-3.5" />
                      {jobDetails.waterUsedLitres} Litres
                    </span>
                  </div>

                  <div className="flex justify-between text-sm py-1 border-b border-slate-100 font-extrabold text-slate-800">
                    <span>Base Fare:</span>
                    <span>{formatCurrency(jobDetails.price)}</span>
                  </div>

                  {paymentStatus === 'paid' ? (
                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 flex items-center justify-center gap-1 text-xs font-bold uppercase">
                      <CheckCircle className="w-4 h-4" /> Paid via {jobDetails.paymentMethod.toUpperCase()}
                    </div>
                  ) : (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 flex items-center justify-center gap-1 text-xs font-bold uppercase">
                      <AlertTriangle className="w-4 h-4" /> Payment Awaiting Settle
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-4">
                    <Button
                      onClick={() => printPDF(`/api/v1/admin/jobs/${jobDetails._id}/pdf`, `ticket_${jobDetails.tokenNumber}.pdf`)}
                      variant="outline"
                      size="sm"
                      icon={FileText}
                    >
                      Print Wash Ticket
                    </Button>

                    {paymentStatus === 'paid' && (
                      <Button
                        onClick={async () => {
                          try {
                            // Find corresponding invoice to print
                            const { data } = await api.get(`/api/v1/admin/invoices`);
                            const matchingInvoice = data.data.find(inv => inv.washJobId?._id === jobDetails._id || inv.washJobId === jobDetails._id);
                            if (matchingInvoice) {
                              printPDF(`/api/v1/admin/invoices/${matchingInvoice._id}/pdf`, `invoice_${matchingInvoice.invoiceNumber}.pdf`);
                            } else {
                              addToast('No generated invoice found. Re-save paid status.', 'error');
                            }
                          } catch (err) {
                            addToast('Failed to retrieve invoice.', 'error');
                          }
                        }}
                        variant="secondary"
                        size="sm"
                        icon={DollarSign}
                      >
                        Print Tax Invoice
                      </Button>
                    )}
                  </div>

                </div>
              </Card>

            </div>

          </div>
        ) : null}
      </Modal>

    </div>
  );
};

export default WashJobs;
