import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export function useStravaStatus(userId: number | null) {
  return useQuery({
    queryKey: ['strava-status', userId],
    queryFn: () => apiClient.get<{ connected: boolean; athleteId?: number }>(`/api/strava/${userId}/status`),
    enabled: userId != null,
  });
}

export function useStravaConnect(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.get<{ url: string }>(`/api/strava/authorize?userId=${userId}`),
    onSuccess: (data) => {
      window.open(data.url, '_blank', 'noopener,noreferrer');
      qc.invalidateQueries({ queryKey: ['strava-status', userId] });
    },
  });
}

export function useStravaDisconnect(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete(`/api/strava/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava-status', userId] });
    },
  });
}

export function useStravaSync(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<{ activitiesSynced: number; stepsAdded: number; caloriesBurnedAdded: number; exerciseMinAdded: number }>(`/api/strava/${userId}/sync`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strava-status', userId] });
      qc.invalidateQueries({ queryKey: ['daily-log', userId] });
    },
  });
}
