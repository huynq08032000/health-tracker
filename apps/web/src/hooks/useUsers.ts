import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { User, UpdateUserInput } from '@health-tracker/shared';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.get<User[]>('/api/users'),
  });
}

export function useUser(id: number | null) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.get<User>(`/api/users/${id}`),
    enabled: id != null,
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateUserInput }) =>
      apiClient.put<User>(`/api/users/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
