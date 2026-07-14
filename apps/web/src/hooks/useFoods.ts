import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Food, CreateFoodInput } from '@health-tracker/shared';

export function useFoodSearch(q: string) {
  const [localQuery, setLocalQuery] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setLocalQuery(q);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  return useQuery({
    queryKey: ['foods', localQuery],
    queryFn: () =>
      apiClient.get<Food[]>(`/api/foods${localQuery ? `?q=${encodeURIComponent(localQuery)}` : ''}`),
    enabled: localQuery.trim().length > 0,
    staleTime: 30_000,
  });
}

export function useCreateFood() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFoodInput) => apiClient.post<Food>('/api/foods', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['foods'] }),
  });
}
