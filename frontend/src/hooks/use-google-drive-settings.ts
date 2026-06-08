'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { GoogleDriveSettings } from '@/types';

export function useGoogleDriveSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['google-drive-settings'],
    queryFn: async () => {
      const { data } = await api.get<GoogleDriveSettings>('/google-drive-settings');
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (dto: { folderUrl: string; folderId: string }) => {
      const { data } = await api.put<GoogleDriveSettings>('/google-drive-settings', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-drive-settings'] });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ valid: boolean; error?: string; folderName?: string }>(
        '/google-drive-settings/validate-folder',
      );
      return data;
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<{ connected: boolean; error?: string }>(
        '/google-drive-settings/test-connection',
      );
      return data;
    },
  });

  return {
    settings: data ?? null,
    isLoading,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    validate: validateMutation.mutateAsync,
    isValidating: validateMutation.isPending,
    validationResult: validateMutation.data,
    testConnection: testConnectionMutation.mutateAsync,
    isTestingConnection: testConnectionMutation.isPending,
    connectionResult: testConnectionMutation.data,
  };
}
