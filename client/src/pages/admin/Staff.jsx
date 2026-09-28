import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, CalendarCheck, FileText, User, UserCheck, Wrench, ShieldAlert } from 'lucide-react';

import api from '../../services/api';
import useUiStore from '../../store/uiStore';
import formatDate from '../../utils/formatDate';
import formatCurrency from '../../utils/formatCurrency';
import printPDF from '../../utils/printPDF';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

export const Staff = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  // Navigation tabs
  const [tab, setTab] = useState('list'); // 'list', 'attendance', 'workload'
  
  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSlipOpen, setIsSlipOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    role: 'mechanic',
    skills: '',
    salary: 15000,
    commissionRate: 0
  });

  const [attendanceData, setAttendanceData] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    checkIn: '09:00 AM',
    checkOut: '06:00 PM'
  });

  const [slipData, setSlipData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth().toString() // Previous month default
  });

  // 1. Fetch Staff List Query
  const { data: staffData, isLoading: isListLoading } = useQuery({
    queryKey: ['adminStaff'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/staff');
      return data.data;
    }
  });

  // 2. Fetch Workload Query
  const { data: workloadData, isLoading: isWorkloadLoading } = useQuery({
    queryKey: ['adminMechanicWorkload'],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/staff/workload');
      return data.data;
    },
    enabled: tab === 'workload'
  });

  // 3. Create / Edit Staff Mutations
  const saveStaffMutation = useMutation({
    mutationFn: async (payload) => {
      const mappedPayload = {
        ...payload,
        skills: payload.skills.split(',').map(s => s.trim()).filter(Boolean),
        salary: parseFloat(payload.salary),
        commissionRate: parseFloat(payload.commissionRate)
      };

      if (editingStaff) {
        return await api.put(`/api/v1/admin/staff/${editingStaff._id}`, mappedPayload);
      } else {
        return await api.post('/api/v1/admin/staff', mappedPayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStaff'] });
      addToast(editingStaff ? 'Staff profile updated' : 'Staff registered successfully', 'success');
      closeFormModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to save staff member', 'error');
    }
  });

  // Mark Attendance Mutation
  const markAttendanceMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      return await api.post(`/api/v1/admin/staff/${id}/attendance`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStaff'] });
      addToast('Attendance sheet logged successfully', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to log attendance', 'error');
    }
  });

  // Delete Mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id) => {
      return await api.delete(`/api/v1/admin/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminStaff'] });
      addToast('Staff member record removed', 'success');
    }
  });

  const openFormModal = (member = null) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        name: member.name,
        mobile: member.mobile,
        role: member.role,
        skills: member.skills.join(', '),
        salary: member.salary,
        commissionRate: member.commissionRate
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        mobile: '',
        role: 'mechanic',
        skills: '',
        salary: 15000,
        commissionRate: 0
      });
    }
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setIsFormOpen(false);
    setEditingStaff(null);
  };

  const openSlipModal = (id) => {
    setSelectedStaffId(id);
    setIsSlipOpen(true);
  };

  const closeSlipModal = () => {
    setIsSlipOpen(false);
    setSelectedStaffId(null);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    saveStaffMutation.mutate(formData);
  };

  const triggerSlipDownload = () => {
    if (!selectedStaffId) return;
    printPDF(
      `/api/v1/admin/staff/${selectedStaffId}/slip?year=${slipData.year}&month=${slipData.month}`,
      `salary_slip_${selectedStaffId}.pdf`
    );
    closeSlipModal();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Staff & Attendance</h1>
          <p className="text-xs text-slate-500 mt-1">Audit daily check-ins, record commissions, and print salary slips.</p>
        </div>
        <div className="flex gap-2">
          {/* Tab buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setTab('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                tab === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`}
            >
              Staff List
            </button>
            <button
              onClick={() => setTab('attendance')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                tab === 'attendance' ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`}
            >
              Daily Attendance
            </button>
            <button
              onClick={() => setTab('workload')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                tab === 'workload' ? 'bg-brand-50 text-brand-600' : 'text-slate-500'
              }`}
            >
              Workload Chart
            </button>
          </div>
          <Button onClick={() => openFormModal()} icon={Plus}>
            New Employee
          </Button>
        </div>
      </div>

      {/* Main content grid */}
      {isListLoading ? (
        <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
      ) : tab === 'list' ? (
        /* STAFF LIST TABLE */
        <TableContainer>
          <Thead>
            <Tr>
              <Th isSticky>Employee Name</Th>
              <Th>Mobile</Th>
              <Th>Role</Th>
              <Th>Skills</Th>
              <Th>Monthly Base</Th>
              <Th>Commission</Th>
              <Th className="text-right">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {staffData?.length === 0 ? (
              <Tr>
                <Td colSpan={7} className="text-center text-slate-400 py-10">No employee records found</Td>
              </Tr>
            ) : (
              staffData.map((member) => (
                <Tr key={member._id} className={!member.isActive ? 'opacity-55 bg-slate-100/50' : ''}>
                  <Td isSticky className="font-bold text-slate-800">
                    {member.name}
                    {!member.isActive && <Badge className="ml-2 bg-red-50 text-red-600">Inactive</Badge>}
                  </Td>
                  <Td className="font-medium text-slate-600">{member.mobile}</Td>
                  <Td className="uppercase"><Badge variant="neutral">{member.role}</Badge></Td>
                  <Td className="text-xs text-slate-500">{member.skills.join(', ') || 'N/A'}</Td>
                  <Td className="font-bold text-slate-700">{formatCurrency(member.salary)}</Td>
                  <Td className="font-semibold text-slate-500">{member.commissionRate}%</Td>
                  <Td className="text-right flex items-center justify-end gap-1.5 py-3">
                    <button
                      onClick={() => openSlipModal(member._id)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                      title="Print Salary Slip PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openFormModal(member)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Delete employee record?')) {
                          deleteStaffMutation.mutate(member._id);
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
      ) : tab === 'attendance' ? (
        /* DAILY ATTENDANCE MARKER GRID */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="Attendance logger configurations" bodyClassName="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Check-in Date</label>
                <input
                  type="date"
                  value={attendanceData.date}
                  onChange={(e) => setAttendanceData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Check-in Time</label>
                  <input
                    type="text"
                    value={attendanceData.checkIn}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, checkIn: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Check-out Time</label>
                  <input
                    type="text"
                    value={attendanceData.checkOut}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, checkOut: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                Select checking parameters and click status badges on the employee list to save daily logs.
              </p>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Mark Employee Status">
              <div className="flex flex-col gap-4">
                {staffData?.filter(s => s.isActive).map((member) => {
                  // Find if status already saved for this date
                  const targetTime = new Date(attendanceData.date).setHours(0,0,0,0);
                  const existingLog = member.attendance?.find(a => new Date(a.date).getTime() === targetTime);
                  
                  return (
                    <div key={member._id} className="p-3.5 border border-slate-100 rounded-xl flex items-center justify-between hover:shadow-xs transition-shadow">
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm">{member.name}</h5>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{member.role}</p>
                      </div>

                      {/* Status selectors */}
                      <div className="flex gap-1.5">
                        {['present', 'absent', 'half-day', 'leave'].map((st) => {
                          const isSelected = existingLog ? existingLog.status === st : st === 'present';
                          
                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => {
                                markAttendanceMutation.mutate({
                                  id: member._id,
                                  payload: {
                                    date: attendanceData.date,
                                    status: st,
                                    checkIn: attendanceData.checkIn,
                                    checkOut: attendanceData.checkOut
                                  }
                                });
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide capitalize cursor-pointer border ${
                                isSelected
                                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* MECHANIC WORKLOAD DETAILS */
        isWorkloadLoading ? (
          <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workloadData?.map((item) => (
              <Card key={item.mechanicId} title={item.name} bodyClassName="flex flex-col gap-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-500">Active Assignments</span>
                  <span className="font-black text-2xl text-brand-600 bg-brand-50 border border-brand-100 px-3.5 py-1 rounded-xl">
                    {item.activeJobs}
                  </span>
                </div>
                <div className="border-t border-slate-100 pt-3 flex gap-2">
                  <Link
                    to={`/admin/jobs?search=${item.name}`}
                    className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                  >
                    View Assigned jobs
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {/* CREATE / EDIT FORM MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingStaff ? 'Update Employee Profile' : 'Register New Employee'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="staffName" className="block text-xs font-bold text-slate-500 uppercase mb-2">Employee Name</label>
            <input
              type="text"
              id="staffName"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="staffMobile" className="block text-xs font-bold text-slate-500 uppercase mb-2">Mobile Number</label>
            <input
              type="tel"
              id="staffMobile"
              name="mobile"
              value={formData.mobile}
              onChange={handleFormChange}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="staffRole" className="block text-xs font-bold text-slate-500 uppercase mb-2">Role</label>
              <select
                id="staffRole"
                name="role"
                value={formData.role}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="mechanic">Mechanic</option>
                <option value="receptionist">Receptionist / Frontdesk</option>
                <option value="supervisor">Garage Supervisor</option>
              </select>
            </div>
            <div>
              <label htmlFor="staffSalary" className="block text-xs font-bold text-slate-500 uppercase mb-2">Base Salary (₹)</label>
              <input
                type="number"
                id="staffSalary"
                name="salary"
                value={formData.salary}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="commissionRate" className="block text-xs font-bold text-slate-500 uppercase mb-2">Commission rate (%)</label>
              <input
                type="number"
                id="commissionRate"
                name="commissionRate"
                value={formData.commissionRate}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="skills" className="block text-xs font-bold text-slate-500 uppercase mb-2">Skills Tags (Comma separated)</label>
              <input
                type="text"
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleFormChange}
                placeholder="E.g. engine, electrical, ac"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saveStaffMutation.isPending}>
              Save Details
            </Button>
          </div>
        </form>
      </Modal>

      {/* SALARY RECEIPT RANGE MODAL */}
      <Modal
        isOpen={isSlipOpen}
        onClose={closeSlipModal}
        title="Download Pay Slip"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Year</label>
              <input
                type="number"
                value={slipData.year}
                onChange={(e) => setSlipData(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Month</label>
              <select
                value={slipData.month}
                onChange={(e) => setSlipData(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeSlipModal}>
              Cancel
            </Button>
            <Button onClick={triggerSlipDownload}>
              Download PDF Slip
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Staff;
