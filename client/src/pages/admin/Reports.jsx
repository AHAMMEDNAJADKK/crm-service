import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Calendar, FileDown, TrendingUp, TrendingDown, Clock, AlertTriangle, Users, Droplet, Plus, Save } from 'lucide-react';
import api from '../../services/api';
import formatCurrency from '../../utils/formatCurrency';
import formatDate from '../../utils/formatDate';
import { TableContainer, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table';
import useUiStore from '../../store/uiStore';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';

// Import Recharts wrappers
import RevenueChart from '../../components/charts/RevenueChart';
import ExpenseChart from '../../components/charts/ExpenseChart';
import JobStatsChart from '../../components/charts/JobStatsChart';

export const Reports = () => {
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();

  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [activeReport, setActiveReport] = useState('revenue'); // 'revenue', 'expense', 'pl', 'jobcard', 'water-usage', 'customer'
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  
  // Water log form states
  const [waterDate, setWaterDate] = useState(new Date().toISOString().split('T')[0]);
  const [waterLitres, setWaterLitres] = useState('');
  const [waterNotes, setWaterNotes] = useState('');

  // 1. Fetch Revenue Report Query
  const { data: revenueData, isLoading: isRevLoading } = useQuery({
    queryKey: ['reportRevenue', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/reports/revenue', { params: { startDate, endDate } });
      return data.data;
    },
    enabled: activeReport === 'revenue'
  });

  // 2. Fetch Expense Report Query
  const { data: expenseData, isLoading: isExpLoading } = useQuery({
    queryKey: ['reportExpense', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/reports/expense', { params: { startDate, endDate } });
      return data.data;
    },
    enabled: activeReport === 'expense'
  });

  // 3. Fetch P&L Report Query
  const { data: plData, isLoading: isPLLoading } = useQuery({
    queryKey: ['reportPL', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/reports/pl', { params: { startDate, endDate } });
      return data.data;
    },
    enabled: activeReport === 'pl'
  });

  // 4. Fetch Job Card Report Query
  const { data: jobCardData, isLoading: isJcLoading } = useQuery({
    queryKey: ['reportJobCard', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/reports/jobcard', { params: { startDate, endDate } });
      return data.data;
    },
    enabled: activeReport === 'jobcard'
  });

  // 5. Fetch Water Usage Report Query
  const { data: waterData, isLoading: isWaterLoading } = useQuery({
    queryKey: ['reportWaterUsage', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/reports/water-usage', { params: { startDate, endDate } });
      return data.data;
    },
    enabled: activeReport === 'water-usage'
  });

  // 6. Fetch Customer Report Query
  const { data: customerData, isLoading: isCustLoading } = useQuery({
    queryKey: ['reportCustomer', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get('/api/v1/admin/reports/customer', { params: { startDate, endDate } });
      return data.data;
    },
    enabled: activeReport === 'customer'
  });

  // Log water usage mutation
  const logWaterMutation = useMutation({
    mutationFn: async (payload) => {
      return await api.post('/api/v1/admin/settings/water-logs', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportWaterUsage'] });
      addToast('Overhead water usage logged successfully!', 'success');
      setIsWaterModalOpen(false);
      setWaterLitres('');
      setWaterNotes('');
    },
    onError: (err) => {
      addToast(err.response?.data?.error || 'Failed to log water usage.', 'error');
    }
  });

  const handleCSVDownload = () => {
    const url = `/api/v1/admin/reports/${activeReport}?startDate=${startDate}&endDate=${endDate}&format=csv`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReport}_report.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast(`${activeReport.toUpperCase()} report CSV download started`, 'info');
  };

  const handleWaterSubmit = (e) => {
    e.preventDefault();
    logWaterMutation.mutate({
      date: waterDate,
      litresUsed: parseFloat(waterLitres),
      notes: waterNotes
    });
  };

  const reportTabs = [
    { id: 'revenue', name: 'Revenue Report' },
    { id: 'expense', name: 'Expenses Report' },
    { id: 'pl', name: 'Profit & Loss' },
    { id: 'jobcard', name: 'Wash Volume & TAT' },
    { id: 'water-usage', name: 'Water Consumption' },
    { id: 'customer', name: 'Customer spenders' }
  ];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Review wash deck performance metrics and export audit sheets.</p>
        </div>
        <div className="flex gap-2">
          {activeReport === 'water-usage' && (
            <Button onClick={() => setIsWaterModalOpen(true)} icon={Plus}>
              Log Daily Water
            </Button>
          )}
          <button
            onClick={handleCSVDownload}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer shadow-xs"
          >
            <FileDown className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Date selector and report tab navigation */}
      <div className="bg-white p-4 border border-slate-200/60 rounded-xl flex flex-wrap gap-4 items-center justify-between shadow-xs">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl">
          {reportTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeReport === tab.id
                  ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
          <span className="text-slate-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* 1. REVENUE REPORT */}
      {activeReport === 'revenue' && (
        isRevLoading ? <div className="py-20 flex justify-center"><Spinner /></div> : revenueData && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Billed</span>
                  <span className="font-extrabold text-2xl text-slate-800 mt-2 block">{formatCurrency(revenueData.summary.totalRevenue)}</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Collected</span>
                  <span className="font-extrabold text-2xl text-emerald-600 mt-2 block">{formatCurrency(revenueData.summary.totalCollected)}</span>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Uncollected Balance</span>
                  <span className="font-extrabold text-2xl text-rose-600 mt-2 block">{formatCurrency(revenueData.summary.totalPending)}</span>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl"><AlertTriangle className="w-5.5 h-5.5" /></div>
              </div>
            </div>

            <Card title="Revenue Trends" subtitle="Income daily tracking line chart">
              <RevenueChart data={revenueData.dailyTrends} height={260} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Revenue by Vehicle category">
                <TableContainer>
                  <Thead>
                    <Tr>
                      <Th>Vehicle Type</Th>
                      <Th>Wash Count</Th>
                      <Th>Total Billed</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {revenueData.vehicleTypeBreakdown.map((item) => (
                      <Tr key={item.vehicleType}>
                        <td className="p-4 font-bold text-xs uppercase text-slate-700">{item.vehicleType}</td>
                        <td className="p-4 text-xs font-semibold text-slate-500">{item.count} washes</td>
                        <td className="p-4 text-xs font-extrabold text-slate-800">{formatCurrency(item.total)}</td>
                      </Tr>
                    ))}
                  </Tbody>
                </TableContainer>
              </Card>

              <Card title="Revenue by Wash Package">
                <TableContainer>
                  <Thead>
                    <Tr>
                      <Th>Package</Th>
                      <Th>Wash Count</Th>
                      <Th>Total Billed</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {revenueData.packageBreakdown.map((item) => (
                      <Tr key={item.washPackage}>
                        <td className="p-4 font-bold text-xs uppercase text-slate-700">{item.washPackage.replace('-', ' ')}</td>
                        <td className="p-4 text-xs font-semibold text-slate-500">{item.count} washes</td>
                        <td className="p-4 text-xs font-extrabold text-slate-800">{formatCurrency(item.total)}</td>
                      </Tr>
                    ))}
                  </Tbody>
                </TableContainer>
              </Card>
            </div>
          </div>
        )
      )}

      {/* 2. EXPENSES REPORT */}
      {activeReport === 'expense' && (
        isExpLoading ? <div className="py-20 flex justify-center"><Spinner /></div> : expenseData && (
          <div className="flex flex-col gap-6">
            <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs max-w-sm">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Operating Expenses</span>
                <span className="font-extrabold text-2xl text-rose-600 mt-2 block">-{formatCurrency(expenseData.summary.totalExpenses)}</span>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-5.5 h-5.5" /></div>
            </div>

            <Card title="Expenses Category breakdown">
              {expenseData.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">No operating expenses found for this date range.</p>
              ) : (
                <ExpenseChart data={expenseData.categoryBreakdown} height={250} />
              )}
            </Card>

            <Card title="Expense Transaction Logs">
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Category</Th>
                    <Th>Description</Th>
                    <Th>Amount</Th>
                    <Th>Method</Th>
                    <Th>Vendor</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {expenseData.expenses.map((exp) => (
                    <Tr key={exp._id}>
                      <Td className="font-bold text-slate-800">{formatDate(exp.date)}</Td>
                      <Td className="capitalize"><Badge variant="neutral">{exp.category.replace('-', ' ')}</Badge></Td>
                      <Td className="font-medium text-slate-600 truncate max-w-xs">{exp.description}</Td>
                      <Td className="font-extrabold text-red-600">-{formatCurrency(exp.amount)}</Td>
                      <Td className="uppercase font-semibold text-slate-400 text-xs">{exp.paymentMethod}</Td>
                      <Td className="font-semibold text-slate-700 text-xs">{exp.vendor || 'N/A'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </Card>
          </div>
        )
      )}

      {/* 3. PROFIT & LOSS REPORT */}
      {activeReport === 'pl' && (
        isPLLoading ? <div className="py-20 flex justify-center"><Spinner /></div> : plData && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Revenue</span>
                  <span className="font-extrabold text-2xl text-slate-800 mt-2 block">{formatCurrency(plData.summary.totalRevenue)}</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Expenses</span>
                  <span className="font-extrabold text-2xl text-rose-600 mt-2 block">-{formatCurrency(plData.summary.totalExpenses)}</span>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-xl"><TrendingDown className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Net Profit margin</span>
                  <span className={`font-black text-2xl mt-2 block ${plData.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(plData.summary.netProfit)}
                    <span className="text-xs font-semibold text-slate-400 ml-1.5">({plData.summary.margin.toFixed(1)}% margin)</span>
                  </span>
                </div>
                <div className={`p-3 rounded-xl ${plData.summary.netProfit >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {plData.summary.netProfit >= 0 ? <TrendingUp className="w-5.5 h-5.5" /> : <TrendingDown className="w-5.5 h-5.5" />}
                </div>
              </div>
            </div>

            <Card title="Revenue vs Expenses Comparison">
              <RevenueChart data={plData.trends} height={260} />
            </Card>
          </div>
        )
      )}

      {/* 4. WASH VOLUME REPORT */}
      {activeReport === 'jobcard' && (
        isJcLoading ? <div className="py-20 flex justify-center"><Spinner /></div> : jobCardData && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Service Jobs logged</span>
                  <span className="font-extrabold text-2xl text-slate-800 mt-2 block">{jobCardData.summary.totalJobs}</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><BarChart3 className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Servicings Completed</span>
                  <span className="font-extrabold text-2xl text-green-600 mt-2 block">{jobCardData.summary.completedJobsCount}</span>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Avg Turnaround Time</span>
                  <span className="font-extrabold text-2xl text-indigo-600 mt-2 block">
                    {jobCardData.summary.avgTurnaroundHours.toFixed(2)} Hrs
                  </span>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Clock className="w-5.5 h-5.5" /></div>
              </div>
            </div>

            <Card title="Staff Wash Workloads">
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th>Staff Name</Th>
                    <Th>Jobs Allocated</Th>
                    <Th>Jobs Delivered</Th>
                    <Th>Total Ticket Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {jobCardData.staffPerformance.map((item, idx) => (
                    <Tr key={idx}>
                      <Td className="font-bold text-slate-800">{item.name}</Td>
                      <Td className="font-semibold text-slate-500">{item.totalJobs}</Td>
                      <Td className="font-bold text-emerald-600">{item.completedJobs}</Td>
                      <Td className="font-extrabold text-slate-700">{formatCurrency(item.revenueGenerated)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Wash Package Popularity">
                <TableContainer>
                  <Thead>
                    <Tr>
                      <Th>Wash Package</Th>
                      <Th>Orders Count</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {jobCardData.packageBreakdown.map((item, idx) => (
                      <Tr key={idx}>
                        <td className="p-4 font-bold text-xs uppercase text-slate-700">{item.washPackage.replace('-', ' ')}</td>
                        <td className="p-4 text-xs font-semibold text-slate-500">{item.count} items</td>
                      </Tr>
                    ))}
                  </Tbody>
                </TableContainer>
              </Card>

              <Card title="Peak Hours Distribution (Heatmap)">
                <TableContainer>
                  <Thead>
                    <Tr>
                      <Th>Hour of Day</Th>
                      <Th>Washes Logged</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {jobCardData.peakHours.map((item, idx) => {
                      const displayHour = item.hour >= 12 ? `${item.hour === 12 ? 12 : item.hour - 12} PM` : `${item.hour} AM`;
                      return (
                        <Tr key={idx}>
                          <td className="p-4 font-bold text-xs text-slate-700 font-mono">{displayHour}</td>
                          <td className="p-4 text-xs font-semibold text-slate-500">{item.count} check-ins</td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </TableContainer>
              </Card>
            </div>
          </div>
        )
      )}

      {/* 5. WATER USAGE REPORT */}
      {activeReport === 'water-usage' && (
        isWaterLoading ? <div className="py-20 flex justify-center"><Spinner /></div> : waterData && (
          <div className="flex flex-col gap-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Water Litres used</span>
                  <span className="font-extrabold text-2xl text-blue-600 mt-2 block">{waterData.summary.totalWaterUsed} Litres</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Droplet className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Washing Deck Consumption</span>
                  <span className="font-extrabold text-2xl text-slate-800 mt-2 block">{waterData.summary.jobConsumption} Litres</span>
                </div>
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl"><Droplet className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Overhead losses logged</span>
                  <span className="font-extrabold text-2xl text-slate-850 mt-2 block">{waterData.summary.overheadConsumption} Litres</span>
                </div>
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl"><Droplet className="w-5.5 h-5.5" /></div>
              </div>
            </div>

            {/* Consumption by Vehicle category */}
            <Card title="Average Water Volume per Vehicle type">
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th>Vehicle Type</Th>
                    <Th>Washes Count</Th>
                    <Th>Average Litres / Wash</Th>
                    <Th>Total Category Volume</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {waterData.vehicleTypeWater.map((item, idx) => (
                    <Tr key={idx}>
                      <Td className="font-bold text-slate-850 uppercase text-xs">{item.vehicleType}</Td>
                      <Td className="font-semibold text-slate-500">{item.count} items</Td>
                      <Td className="font-extrabold text-slate-700">{item.avgLitres} L</Td>
                      <Td className="font-black text-blue-600">{item.totalLitres} L</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </Card>

            {/* Daily logs */}
            <Card title="Daily Water Logs (Past 7 Days Overheads)">
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Litres Logged</Th>
                    <Th>Notes</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {waterData.dailyLogs.map((log) => (
                    <Tr key={log._id}>
                      <Td className="font-bold text-slate-800">{new Date(log.date).toLocaleDateString('en-IN')}</Td>
                      <Td className="font-extrabold text-blue-600">{log.litresUsed} L</Td>
                      <Td className="text-xs text-slate-500">{log.notes || 'None'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </Card>

          </div>
        )
      )}

      {/* 6. CUSTOMER REPORT */}
      {activeReport === 'customer' && (
        isCustLoading ? <div className="py-20 flex justify-center"><Spinner /></div> : customerData && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Registered Customers</span>
                  <span className="font-extrabold text-2xl text-slate-800 mt-2 block">{customerData.summary.totalCustomers}</span>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">New Registrations (Range)</span>
                  <span className="font-extrabold text-2xl text-brand-600 mt-2 block">{customerData.summary.newCustomersCount}</span>
                </div>
                <div className="p-3 bg-brand-50 text-brand-600 rounded-xl"><Plus className="w-5.5 h-5.5" /></div>
              </div>
              <div className="bg-white p-5 border border-slate-200/60 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Repeat Customer ratio</span>
                  <span className="font-extrabold text-2xl text-emerald-600 mt-2 block">
                    {customerData.summary.repeatRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="w-5.5 h-5.5" /></div>
              </div>
            </div>

            <Card title="Top Customer Spenders">
              <TableContainer>
                <Thead>
                  <Tr>
                    <Th>Customer Name</Th>
                    <Th>Mobile Number</Th>
                    <Th>Email</Th>
                    <Th>Washes Paid</Th>
                    <Th>Total Spend (Paid)</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customerData.topSpenders.map((cust) => (
                    <Tr key={cust.customerId}>
                      <Td className="font-bold text-slate-800">{cust.name}</Td>
                      <Td className="font-medium text-slate-600">{cust.mobile}</Td>
                      <Td>{cust.email || 'N/A'}</Td>
                      <Td className="font-semibold text-slate-500">{cust.invoicesCount}</Td>
                      <Td className="font-extrabold text-emerald-600">{formatCurrency(cust.totalSpend)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableContainer>
            </Card>
          </div>
        )
      )}

      {/* DAILY WATER LOGGER MODAL */}
      <Modal
        isOpen={isWaterModalOpen}
        onClose={() => setIsWaterModalOpen(false)}
        title="Log Station Water Overhead Loss"
        size="md"
      >
        <form onSubmit={handleWaterSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="waterDate" className="block text-xs font-bold text-slate-500 uppercase mb-2">Log Date</label>
            <input
              type="date"
              id="waterDate"
              value={waterDate}
              onChange={(e) => setWaterDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="waterLitres" className="block text-xs font-bold text-slate-500 uppercase mb-2">Overhead Litres Consumed</label>
            <div className="relative">
              <input
                type="number"
                id="waterLitres"
                value={waterLitres}
                onChange={(e) => setWaterLitres(e.target.value)}
                placeholder="E.g., 250"
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm font-semibold"
                required
              />
              <span className="text-xs text-slate-400 font-bold absolute right-3 top-3">Litres</span>
            </div>
          </div>

          <div>
            <label htmlFor="waterNotes" className="block text-xs font-bold text-slate-500 uppercase mb-2">Notes / Reason</label>
            <textarea
              id="waterNotes"
              value={waterNotes}
              onChange={(e) => setWaterNotes(e.target.value)}
              rows="2"
              placeholder="E.g., filtration loss, tank cleaning..."
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsWaterModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={logWaterMutation.isPending} icon={Save}>
              Save Log
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default Reports;
