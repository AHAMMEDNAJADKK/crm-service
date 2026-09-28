import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  TrendingDown,
  Receipt,
  Calendar,
  AlertTriangle,
  ChevronRight,
  Plus,
  Droplet,
  Settings as SettingsIcon,
  PlayCircle
} from 'lucide-react';

import api from '../../services/api';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';

import Stat from '../../components/ui/Stat';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';

// Import Recharts wrappers
import RevenueChart from '../../components/charts/RevenueChart';
import ExpenseChart from '../../components/charts/ExpenseChart';
import JobStatsChart from '../../components/charts/JobStatsChart';

export const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch Dashboard KPI metrics
  const { data: dashboardData, isLoading, isError } = useQuery({
    queryKey: ['adminDashboardKPI'],
    queryFn: async () => {
      const [jobsRes, invoicesRes, apptsRes, expensesRes, revRes, waterRes] = await Promise.all([
        api.get('/api/v1/admin/jobs?limit=50'),
        api.get('/api/v1/admin/invoices?limit=100'),
        api.get('/api/v1/admin/appointments?limit=100'),
        api.get('/api/v1/admin/expenses?limit=100'),
        api.get('/api/v1/admin/reports/revenue'),
        api.get('/api/v1/admin/reports/water-usage')
      ]);

      const jobsList = jobsRes.data.data;
      const openJobs = jobsList.filter(j => !['delivered', 'cancelled'].includes(j.status)).length;
      
      const invoicesList = invoicesRes.data.data;
      const pendingInvoices = invoicesList.filter(i => i.paymentStatus === 'unpaid').length;
      
      // Calculate today's revenue (sum payments received today)
      const todayStr = new Date().toDateString();
      let todayRev = 0;
      invoicesList.forEach(inv => {
        inv.payments.forEach(p => {
          if (new Date(p.date).toDateString() === todayStr) {
            todayRev += p.amount;
          }
        });
      });

      // Active bays occupied
      const activeBaysOccupied = jobsList.filter(j => ['in-bay', 'washing', 'drying'].includes(j.status)).length;

      // Today's total water volume logged in jobs
      let todayWaterLitres = 0;
      jobsList.forEach(j => {
        if (new Date(j.createdAt).toDateString() === todayStr) {
          todayWaterLitres += j.waterUsedLitres || 0;
        }
      });

      const apptsList = apptsRes.data.data;
      const todayAppts = apptsList.filter(a => new Date(a.preferredDate).toDateString() === todayStr && a.status !== 'cancelled').length;

      // Group wash statuses for pie chart
      const statusCounts = {};
      jobsList.forEach(j => {
        statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
      });
      const jobStatusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.toUpperCase(),
        status,
        count
      }));

      // Group expenses by category
      const expenseList = expensesRes.data.data;
      const categoryMap = {};
      expenseList.forEach(e => {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      });
      const expenseBreakdown = Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount
      }));

      return {
        kpis: {
          todayRevenue: todayRev,
          openJobs,
          pendingInvoices,
          activeBaysOccupied,
          todayAppointments: todayAppts,
          todayWaterLitres
        },
        recentJobs: jobsList.slice(0, 5),
        upcomingAppts: apptsList.filter(a => ['pending', 'confirmed'].includes(a.status)).slice(0, 5),
        jobStatusDistribution,
        expenseBreakdown,
        revenueTrend: revRes.data.data?.dailyTrends || []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="p-6 text-center text-red-500 font-bold bg-red-50 rounded-2xl border border-red-200">
        Failed to load dashboard metrics. Please check that the server is active.
      </div>
    );
  }

  const { kpis, recentJobs, upcomingAppts, jobStatusDistribution, expenseBreakdown, revenueTrend } = dashboardData;

  return (
    <div className="flex flex-col gap-8">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status updates and operation KPIs.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Walk-in Check-in
          </Link>
          <Link
            to="/admin/appointments"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
          >
            <Calendar className="w-4 h-4" />
            Calendar Bookings
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <Stat
          title="Today's Revenue"
          value={formatCurrency(kpis.todayRevenue)}
          icon={Receipt}
          iconBgColor="bg-emerald-50 text-emerald-600"
          description="Payments processed today"
          shouldAnimate={false}
        />
        <Stat
          title="Active Bays In-Use"
          value={kpis.activeBaysOccupied}
          icon={PlayCircle}
          iconBgColor="bg-blue-50 text-blue-600"
          description="Vehicles in washing decks"
        />
        <Stat
          title="Water Volume Logged"
          value={`${kpis.todayWaterLitres} L`}
          icon={Droplet}
          iconBgColor="bg-sky-50 text-sky-600"
          description="Wash water used today"
        />
        <Stat
          title="Unpaid Wash Bills"
          value={kpis.pendingInvoices}
          icon={AlertTriangle}
          iconBgColor={kpis.pendingInvoices > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'}
          description="Tickets awaiting payment"
        />
        <Stat
          title="Appointments Today"
          value={kpis.todayAppointments}
          icon={Calendar}
          iconBgColor="bg-purple-50 text-purple-600"
          description="Bookings for today"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <Card title="Revenue Trend" subtitle="Daily billed amounts (last 30 days)" className="lg:col-span-2">
          <RevenueChart data={revenueTrend} height={260} />
        </Card>

        {/* Wash Status Pie Chart */}
        <Card title="Wash Status Distribution" subtitle="Active wash stages">
          <JobStatsChart data={jobStatusDistribution} height={260} />
        </Card>
      </div>

      {/* Tables Segment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Wash Jobs */}
        <Card
          title="Recent Wash Jobs"
          className="lg:col-span-2"
          headerAction={
            <Link to="/admin/jobs" className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center">
              View Board <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <TableContainer>
            <Thead>
              <Tr>
                <Th isSticky>Token</Th>
                <Th>Reg Number</Th>
                <Th>Package</Th>
                <Th>Status</Th>
                <Th>Water used</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recentJobs.length === 0 ? (
                <Tr>
                  <Td colSpan={5} className="text-center text-slate-400 py-6">No recent jobs logged</Td>
                </Tr>
              ) : (
                recentJobs.map((job) => (
                  <Tr key={job._id} onClick={() => navigate(`/admin/jobs?id=${job._id}`)} className="cursor-pointer">
                    <Td isSticky className="font-mono font-bold text-brand-600">{job.tokenNumber}</Td>
                    <Td className="uppercase font-bold tracking-wide font-mono">{job.vehicleReg}</Td>
                    <Td className="uppercase text-xs text-brand-500 font-bold">{job.washPackage.replace('-', ' ')}</Td>
                    <Td>
                      <Badge variant={job.status}>{job.status}</Badge>
                    </Td>
                    <Td className="text-xs font-semibold text-blue-600">{job.waterUsedLitres} L</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </TableContainer>
        </Card>

        {/* Upcoming Appointments */}
        <Card
          title="Upcoming Appointments"
          headerAction={
            <Link to="/admin/appointments" className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center">
              Calendar <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {upcomingAppts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No pending appointments scheduled</p>
            ) : (
              upcomingAppts.map((appt) => (
                <div key={appt._id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs hover:shadow-xs transition-shadow">
                  <div>
                    <h5 className="font-bold text-slate-700">{appt.customerName}</h5>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">{appt.vehicleReg} | {appt.washPackage.replace('-', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block text-[10px] font-extrabold text-brand-600 bg-brand-50 border border-brand-100 px-2 py-0.5 rounded-md">
                      {appt.preferredTime}
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">{formatDate(appt.preferredDate)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>
      
    </div>
  );
};

export default Dashboard;
