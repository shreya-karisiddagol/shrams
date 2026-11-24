import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../services/api';
import toast from 'react-hot-toast';

export function useTasks(filters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.getTasks(filters).then(r => r.data),
  });
}

export function useTaskDetail(id) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.getTaskDetail(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }) => taskApi.updateStatus(id, { status, note }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      qc.invalidateQueries({ queryKey: ['task', variables.id] });
      qc.invalidateQueries({ queryKey: ['workload'] });
      toast.success(`Status updated to "${variables.status}"`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }) => taskApi.addNote(id, note),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['task', variables.id] });
      toast.success('Work note added.');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add note.');
    },
  });
}

export function useTaskHistory(params) {
  return useQuery({
    queryKey: ['history', params],
    queryFn: () => taskApi.getHistory(params).then(r => r.data),
  });
}
