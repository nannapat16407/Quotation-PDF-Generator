'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Package } from '@/types';

export function usePackages() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['packages'],
    queryFn: async () => {
      const { data } = await api.get<Package[]>('/packages');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: Partial<Package>) => {
      const { data } = await api.post<Package>('/packages', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...dto }: Partial<Package> & { id: string }) => {
      const { data } = await api.put<Package>(`/packages/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/packages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
  });

  return {
    packages: data ?? [],
    isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
