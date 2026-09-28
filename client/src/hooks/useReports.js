import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

const fetchRevenueReport = async (startDate, endDate) => {
  const { data } = await api.get('/api/v1/admin/reports/revenue', { params: { startDate, endDate } });
  return data.data;
};

const fetchExpenseReport = async (startDate, endDate) => {
  const { data } = await api.get('/api/v1/admin/reports/expense', { params: { startDate, endDate } });
  return data.data;
};

const fetchPLReport = async (startDate, endDate) => {
  const { data } = await api.get('/api/v1/admin/reports/pl', { params: { startDate, endDate } });
  return data.data;
};

const fetchJobCardReport = async (startDate, endDate) => {
  const { data } = await api.get('/api/v1/admin/reports/jobcard', { params: { startDate, endDate } });
  return data.data;
};

const fetchInventoryReport = async () => {
  const { data } = await api.get('/api/v1/admin/reports/inventory');
  return data.data;
};

const fetchCustomerReport = async (startDate, endDate) => {
  const { data } = await api.get('/api/v1/admin/reports/customer', { params: { startDate, endDate } });
  return data.data;
};

export const useReports = (startDate, endDate) => {
  const revenueQuery = useQuery({
    queryKey: ['reportRevenue', startDate, endDate],
    queryFn: () => fetchRevenueReport(startDate, endDate)
  });

  const expenseQuery = useQuery({
    queryKey: ['reportExpense', startDate, endDate],
    queryFn: () => fetchExpenseReport(startDate, endDate)
  });

  const plQuery = useQuery({
    queryKey: ['reportPL', startDate, endDate],
    queryFn: () => fetchPLReport(startDate, endDate)
  });

  const jobCardQuery = useQuery({
    queryKey: ['reportJobCard', startDate, endDate],
    queryFn: () => fetchJobCardReport(startDate, endDate)
  });

  const inventoryQuery = useQuery({
    queryKey: ['reportInventory'],
    queryFn: fetchInventoryReport
  });

  const customerQuery = useQuery({
    queryKey: ['reportCustomer', startDate, endDate],
    queryFn: () => fetchCustomerReport(startDate, endDate)
  });

  return {
    revenueQuery,
    expenseQuery,
    plQuery,
    jobCardQuery,
    inventoryQuery,
    customerQuery
  };
};
