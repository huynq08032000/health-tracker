import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { DailyLog, UpsertDailyLogInput } from '@health-tracker/shared';

export function useDailyLog(userId: number | null, date: string) {
  return useQuery({
    queryKey: ['daily-log', userId, date],
    queryFn: () => apiClient.get<DailyLog | null>(`/api/daily-logs/${userId}/date/${date}`),
    enabled: userId != null,
  });
}

export function useDailyLogRange(userId: number | null, from: string, to: string) {
  return useQuery({
    queryKey: ['daily-log-range', userId, from, to],
    queryFn: () =>
      apiClient.get<DailyLog[]>(`/api/daily-logs/${userId}/range?from=${from}&to=${to}`),
    enabled: userId != null,
  });
}

export function useUpsertDailyLog(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertDailyLogInput) =>
      apiClient.post<DailyLog>(`/api/daily-logs/${userId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['daily-log', userId] }),
  });
}
