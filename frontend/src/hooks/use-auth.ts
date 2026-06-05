'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { User, AuthResponse } from '@/types';

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: user } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const { data } = await api.get<User>('/auth/profile');
      return data;
    },
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/quotations');
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>('/auth/register', payload);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      router.push('/quotations');
    },
  });

  const logout = () => {
    localStorage.removeItem('token');
    queryClient.clear();
    router.push('/login');
  };

  return {
    user: user ?? null,
    isLoading: !user && typeof window !== 'undefined' && !!localStorage.getItem('token'),
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    registerError: registerMutation.error,
    logout,
  };
}
