import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifApi } from '../services/api';
import toast from 'react-hot-toast';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifApi.getAll().then(r => r.data),
    refetchInterval: 60_000, // poll every minute as fallback
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => notifApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: () => toast.error('Failed to mark as read.'),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notifApi.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read.'); },
    onError: () => toast.error('Failed.'),
  });
}
