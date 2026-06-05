'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { SpecialOffer } from '@/types';

export function useSpecialOffers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['special-offers'],
    queryFn: async () => {
      const { data } = await api.get<SpecialOffer[]>('/special-offers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: Partial<SpecialOffer>) => {
      const { data } = await api.post<SpecialOffer>('/special-offers', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...dto }: Partial<SpecialOffer> & { id: string }) => {
      const { data } = await api.put<SpecialOffer>(`/special-offers/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/special-offers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special-offers'] });
    },
  });

  return {
    offers: data ?? [],
    isLoading,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
