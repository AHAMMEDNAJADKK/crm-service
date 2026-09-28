import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const fetchWashJobs = async ({ page = 1, limit = 20, search = '', status = '', sortBy = 'createdAt', order = 'desc' }) => {
  const { data } = await api.get('/api/v1/admin/jobs', {
    params: { page, limit, search, status, sortBy, order }
  });
  return data;
};

const fetchWashJobById = async (id) => {
  if (!id) return null;
  const { data } = await api.get(`/api/v1/admin/jobs/${id}`);
  return data.data;
};

export const useWashJobs = (filters = {}) => {
  const queryClient = useQueryClient();

  const washJobsQuery = useQuery({
    queryKey: ['washJobs', filters],
    queryFn: () => fetchWashJobs(filters),
    placeholderData: (prev) => prev
  });

  const createWashJobMutation = useMutation({
    mutationFn: async (jobData) => {
      const { data } = await api.post('/api/v1/admin/jobs', jobData);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washJobs'] });
    }
  });

  const updateWashJobMutation = useMutation({
    mutationFn: async ({ id, updateData }) => {
      const { data } = await api.put(`/api/v1/admin/jobs/${id}`, updateData);
      return data.data;
    },
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['washJobs'] });
      queryClient.invalidateQueries({ queryKey: ['washJob', updatedData._id] });
    }
  });

  const deleteWashJobMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/api/v1/admin/jobs/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washJobs'] });
    }
  });

  return {
    washJobsQuery,
    createWashJob: createWashJobMutation.mutateAsync,
    isCreating: createWashJobMutation.isPending,
    updateWashJob: updateWashJobMutation.mutateAsync,
    isUpdating: updateWashJobMutation.isPending,
    deleteWashJob: deleteWashJobMutation.mutateAsync
  };
};

export const useWashJobDetails = (id) => {
  return useQuery({
    queryKey: ['washJob', id],
    queryFn: () => fetchWashJobById(id),
    enabled: !!id
  });
};
