import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../auth';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  bio: string | null;
  country: string | null;
  governorate: string | null;
  city: string | null;
  isVerified: boolean;
  role: string;
  createdAt: string;
  totalListings?: number;
}

export function useMe(enabled = true) {
  return useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: () => apiRequest<UserProfile>('/users/me'),
    enabled,
    retry: false,
    staleTime: 30 * 1000, // 30s — fast enough after login, avoids excessive re-fetching
  });
}

export function usePublicProfile(id: string) {
  return useQuery<UserProfile>({
    queryKey: ['user', id],
    queryFn: () => apiRequest<UserProfile>(`/users/${id}`),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest<UserProfile>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      apiRequest('/users/me/password', { method: 'PATCH', body: JSON.stringify(data) }),
  });
}
