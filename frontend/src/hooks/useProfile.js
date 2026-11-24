import { useQuery } from '@tanstack/react-query';
import { staffApi } from '../services/api';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => staffApi.getProfile().then(r => r.data),
  });
}

export function useWorkloadStats() {
  return useQuery({
    queryKey: ['workload'],
    queryFn: () => staffApi.getWorkloadStats().then(r => r.data),
  });
}
