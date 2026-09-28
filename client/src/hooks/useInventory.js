import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

// Fetch inventory list
const fetchInventory = async ({ page = 1, limit = 20, search = '', category = '', sortBy = 'createdAt', order = 'desc' }) => {
  const { data } = await api.get('/api/v1/admin/inventory', {
    params: { page, limit, search, category, sortBy, order }
  });
  return data;
};

// Fetch single item by ID
const fetchInventoryById = async (id) => {
  if (!id) return null;
  const { data } = await api.get(`/api/v1/admin/inventory/${id}`);
  return data.data;
};

// Fetch stock adjustment logs
const fetchAdjustmentLogs = async (id) => {
  if (!id) return [];
  const { data } = await api.get(`/api/v1/admin/inventory/${id}/logs`);
  return data.data;
};

// Fetch low stock alert items
const fetchLowStockItems = async () => {
  const { data } = await api.get('/api/v1/admin/inventory/low-stock');
  return data.data;
};

export const useInventory = (filters = {}) => {
  const queryClient = useQueryClient();

  // List Query
  const inventoryQuery = useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => fetchInventory(filters),
    placeholderData: (prev) => prev
  });

  // Create Mutation
  const createItemMutation = useMutation({
    mutationFn: async (itemData) => {
      const { data } = await api.post('/api/v1/admin/inventory', itemData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
    }
  });

  // Update Mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updateData }) => {
      const { data } = await api.put(`/api/v1/admin/inventory/${id}`, updateData);
      return data.data;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItem', updatedData._id] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
    }
  });

  // Manual Stock Adjustment Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({ id, adjustmentQty, reason }) => {
      const { data } = await api.post(`/api/v1/admin/inventory/${id}/adjust`, { adjustmentQty, reason });
      return data.data;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryItem', updatedData._id] });
      queryClient.invalidateQueries({ queryKey: ['adjustmentLogs', updatedData._id] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
    }
  });

  // Delete Mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/v1/admin/inventory/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
    }
  });

  return {
    inventoryQuery,
    createItem: createItemMutation.mutateAsync,
    isCreating: createItemMutation.isPending,
    updateItem: updateItemMutation.mutateAsync,
    isUpdating: updateItemMutation.isPending,
    adjustStock: adjustStockMutation.mutateAsync,
    isAdjusting: adjustStockMutation.isPending,
    deleteItem: deleteItemMutation.mutateAsync
  };
};

export const useInventoryItemDetails = (id) => {
  return useQuery({
    queryKey: ['inventoryItem', id],
    queryFn: () => fetchInventoryById(id),
    enabled: !!id
  });
};

export const useInventoryLogs = (id) => {
  return useQuery({
    queryKey: ['adjustmentLogs', id],
    queryFn: () => fetchAdjustmentLogs(id),
    enabled: !!id
  });
};

export const useLowStock = () => {
  return useQuery({
    queryKey: ['lowStock'],
    queryFn: fetchLowStockItems
  });
};
