import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { FoodLog, CreateFoodLogInput, UpdateFoodLogInput } from '@health-tracker/shared';

export function useFoodLogs(userId: number | null, date: string) {
  return useQuery({
    queryKey: ['food-logs', userId, date],
    queryFn: () => apiClient.get<FoodLog[]>(`/api/food-logs/${userId}/date/${date}`),
    enabled: userId != null,
  });
}

export function useCreateFoodLog(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFoodLogInput) =>
      apiClient.post<FoodLog>(`/api/food-logs/${userId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs', userId] });
      qc.invalidateQueries({ queryKey: ['daily-log', userId] });
    },
  });
}

export function useUpdateFoodLog(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFoodLogInput }) =>
      apiClient.put<FoodLog>(`/api/food-logs/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs', userId] });
      qc.invalidateQueries({ queryKey: ['daily-log', userId] });
    },
  });
}

export function useDeleteFoodLog(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/food-logs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs', userId] });
      qc.invalidateQueries({ queryKey: ['daily-log', userId] });
    },
  });
}
