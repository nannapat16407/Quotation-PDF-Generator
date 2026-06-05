'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export function useProfileActions() {
  const queryClient = useQueryClient();

  const updateProfile = useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      const { data: result } = await api.put('/auth/profile', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const uploadSignature = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/auth/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      toast.success('Signature uploaded');
    },
    onError: () => {
      toast.error('Failed to upload signature');
    },
  });

  const removeSignature = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/auth/signature');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'profile'] });
      toast.success('Signature removed');
    },
    onError: () => {
      toast.error('Failed to remove signature');
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const { data: result } = await api.put('/auth/password', data);
      return result;
    },
    onSuccess: () => {
      toast.success('Password changed');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to change password';
      toast.error(msg);
    },
  });

  return {
    updateProfile: updateProfile.mutateAsync,
    uploadSignature: uploadSignature.mutateAsync,
    removeSignature: removeSignature.mutateAsync,
    changePassword: changePassword.mutateAsync,
    isUpdating: updateProfile.isPending,
    isUploading: uploadSignature.isPending,
    isChangingPassword: changePassword.isPending,
  };
}
