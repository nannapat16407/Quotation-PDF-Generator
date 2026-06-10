'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  Quotation,
  QuotationListItem,
  PaginatedResponse,
  QuotationQueryParams,
} from '@/types';

export function useQuotations(params?: QuotationQueryParams) {
  const { data, isLoading } = useQuery({
    queryKey: ['quotations', params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<QuotationListItem>>(
        '/quotations',
        { params },
      );
      return data;
    },
  });

  return {
    quotations: data?.data ?? [],
    meta: data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 0 },
    isLoading,
  };
}

export function useQuotation(id: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['quotations', id],
    queryFn: async () => {
      const { data } = await api.get<Quotation>(`/quotations/${id}`);
      return data;
    },
    enabled: !!id,
  });

  return { quotation: data ?? null, isLoading };
}

export function useQuotationActions() {
  const queryClient = useQueryClient();

  const getNextNumber = async () => {
    const { data } = await api.get<{ quotationNumber: string }>(
      '/quotations/next-number',
    );
    return data.quotationNumber;
  };

  const createMutation = useMutation({
    mutationFn: async (dto: any) => {
      const { data } = await api.post<Quotation>('/quotations', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...dto }: any) => {
      const { data } = await api.put<Quotation>(`/quotations/${id}`, dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/quotations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  return {
    getNextNumber,
    validateQuotationNumber: async (number: string, excludeId?: string) => {
      const { data } = await api.get<{ errors: string[]; warnings: string[] }>(
        '/quotations/validate-number',
        { params: { number, excludeId } },
      );
      return data;
    },
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
  };
}
