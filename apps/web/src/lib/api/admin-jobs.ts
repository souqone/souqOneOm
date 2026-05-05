import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../auth';

export interface AdminJobItem {
  id: string;
  title: string;
  status: string;
  governorate: string;
  jobType: string;
  createdAt: string;
  user: { id: string; username: string; displayName?: string | null; email: string };
  _count: { applications: number };
}

export interface AdminStatsResponse {
  jobs: { total: number; active: number; closed: number; expired: number };
  applications: { total: number; accepted: number };
  drivers: { total: number; verified: number };
  employers: { total: number };
  verifications: { pending: number };
}

export function useAdminJobs(query?: { page?: number; status?: string; search?: string }) {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.status) params.set('status', query.status);
  if (query?.search) params.set('search', query.search);
  const qs = params.toString() ? `?${params.toString()}` : '';

  return useQuery<{ items: AdminJobItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: ['admin', 'jobs', query],
    queryFn: () => apiRequest(`/admin/jobs${qs}`),
  });
}

export function useAdminJobStats() {
  return useQuery<AdminStatsResponse>({
    queryKey: ['admin', 'jobs', 'stats'],
    queryFn: () => apiRequest('/admin/jobs/stats'),
  });
}

export function useAdminUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest(`/admin/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
  });
}

export function useAdminDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/admin/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    },
  });
}

export function useAdminDrivers(query?: { page?: number; isVerified?: string }) {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.isVerified) params.set('isVerified', query.isVerified);
  const qs = params.toString() ? `?${params.toString()}` : '';

  return useQuery({
    queryKey: ['admin', 'drivers', query],
    queryFn: () => apiRequest(`/admin/jobs/drivers${qs}`),
  });
}

export function useAdminEmployers(query?: { page?: number }) {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  const qs = params.toString() ? `?${params.toString()}` : '';

  return useQuery({
    queryKey: ['admin', 'employers', query],
    queryFn: () => apiRequest(`/admin/jobs/employers${qs}`),
  });
}
