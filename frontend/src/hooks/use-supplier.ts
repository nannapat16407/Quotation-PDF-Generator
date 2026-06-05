'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { SupplierInfo } from '@/types';

export function useSupplier() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['supplier'],
    queryFn: async () => {
      const { data } = await api.get<SupplierInfo>('/supplier');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: Partial<SupplierInfo>) => {
      const { data } = await api.put<SupplierInfo>('/supplier', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier'] });
    },
  });

  return {
    supplier: data ?? null,
    isLoading,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
