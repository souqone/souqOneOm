import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../auth';

interface JobUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  phone?: string | null;
  governorate?: string | null;
  isVerified: boolean;
  createdAt?: string;
}

export interface JobItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  jobType: 'OFFERING' | 'HIRING';
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT';
  salary?: string | null;
  salaryPeriod?: 'DAILY' | 'MONTHLY' | 'YEARLY' | 'NEGOTIABLE' | null;
  currency: string;
  licenseTypes: string[];
  experienceYears?: number | null;
  minAge?: number | null;
  maxAge?: number | null;
  languages: string[];
  nationality?: string | null;
  vehicleTypes: string[];
  hasOwnVehicle: boolean;
  governorate: string;
  city?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsapp?: string | null;
  status: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  user?: JobUser;
  _count?: { applications: number };
}

export interface JobsResponse {
  items: JobItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface JobApplicationItem {
  id: string;
  message?: string | null;
  resumeUrl?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  jobId: string;
  applicantId: string;
  applicant: JobUser;
  createdAt: string;
}

export function useJobs(params: Record<string, string> = {}, enabled = true) {
  const searchParams = new URLSearchParams(params);
  return useQuery<JobsResponse>({
    queryKey: ['jobs', params],
    queryFn: () => apiRequest<JobsResponse>(`/jobs?${searchParams.toString()}`),
    enabled,
  });
}

export function useJob(id: string) {
  return useQuery<JobItem>({
    queryKey: ['job', id],
    queryFn: () => apiRequest<JobItem>(`/jobs/${id}`),
    enabled: !!id,
  });
}

export function useCreateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest<JobItem>('/jobs', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); },
  });
}

export function useUpdateJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Record<string, any>) =>
      apiRequest<JobItem>(`/jobs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); },
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/jobs/${id}`, { method: 'DELETE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); },
  });
}

export function useMyJobs() {
  return useQuery<JobsResponse>({
    queryKey: ['jobs', 'my'],
    queryFn: () => apiRequest<JobsResponse>('/jobs/my'),
  });
}

export function useWithdrawApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      apiRequest(`/jobs/applications/${applicationId}/withdraw`, { method: 'POST' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['job-applications'] });
    },
  });
}

export function useApplyToJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, ...data }: { jobId: string; message?: string; resumeUrl?: string }) =>
      apiRequest<JobApplicationItem>(`/jobs/${jobId}/apply`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['job-applications'] });
    },
  });
}

export function useJobApplications(jobId: string) {
  return useQuery<JobApplicationItem[]>({
    queryKey: ['job-applications', jobId],
    queryFn: () => apiRequest<JobApplicationItem[]>(`/jobs/${jobId}/applications`),
    enabled: !!jobId,
  });
}

export function useUpdateApplicationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: string }) =>
      apiRequest(`/jobs/applications/${applicationId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['job-applications'] }); },
  });
}

export interface EmployerApplicationItem {
  id: string;
  message?: string | null;
  resumeUrl?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  jobId: string;
  applicantId: string;
  createdAt: string;
  job: { id: string; title: string };
  applicant: JobUser & { averageRating?: number | null; governorate?: string | null };
  driverProfile?: {
    id: string;
    licenseTypes: string[];
    experienceYears?: number | null;
    isVerified: boolean;
  } | null;
}

export function useEmployerApplications() {
  return useQuery<EmployerApplicationItem[]>({
    queryKey: ['employer-applications'],
    queryFn: () => apiRequest<EmployerApplicationItem[]>('/jobs/applications/employer'),
  });
}

export function useCloseJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      apiRequest(`/jobs/${jobId}/close`, { method: 'PATCH' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['employer-applications'] });
    },
  });
}

// ─── Driver Applications (own) ───

export interface MyApplicationItem {
  id: string;
  message?: string | null;
  resumeUrl?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  jobId: string;
  applicantId: string;
  createdAt: string;
  job: {
    id: string;
    title: string;
    salary?: string | null;
    salaryPeriod?: string | null;
    currency: string;
    governorate: string;
    status: string;
    userId: string;
    user: JobUser;
  };
}

export function useMyApplications() {
  return useQuery<MyApplicationItem[]>({
    queryKey: ['my-applications'],
    queryFn: () => apiRequest<MyApplicationItem[]>('/jobs/applications/my'),
  });
}

// ─── Driver & Employer Profiles ───

export interface DriverProfileItem {
  id: string;
  userId: string;
  licenseTypes: string[];
  experienceYears?: number | null;
  languages: string[];
  nationality?: string | null;
  vehicleTypes: string[];
  hasOwnVehicle: boolean;
  bio?: string | null;
  governorate: string;
  city?: string | null;
  contactPhone?: string | null;
  whatsapp?: string | null;
  isAvailable: boolean;
  isVerified: boolean;
  averageRating?: number | null;
  reviewCount: number;
  createdAt: string;
  user: JobUser;
}

export interface EmployerProfileItem {
  id: string;
  userId: string;
  companyName?: string | null;
  companySize?: string | null;
  industry?: string | null;
  bio?: string | null;
  governorate: string;
  city?: string | null;
  contactPhone?: string | null;
  whatsapp?: string | null;
  isVerified: boolean;
  averageRating?: number | null;
  reviewCount: number;
  createdAt: string;
  user: JobUser;
}

export interface DriversResponse {
  items: DriverProfileItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Driver Profile Hooks ───

export function useMyDriverProfile(enabled = true) {
  return useQuery<DriverProfileItem>({
    queryKey: ['driver-profile', 'me'],
    queryFn: () => apiRequest<DriverProfileItem>('/jobs/driver-profile/me'),
    retry: false,
    enabled,
  });
}

export function useCreateDriverProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest<DriverProfileItem>('/jobs/driver-profile', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-profile'] }); },
  });
}

export function useUpdateDriverProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest<DriverProfileItem>('/jobs/driver-profile', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['driver-profile'] }); },
  });
}

export function useDrivers(params: Record<string, string> = {}, enabled = true) {
  const searchParams = new URLSearchParams(params);
  return useQuery<DriversResponse>({
    queryKey: ['drivers', params],
    enabled,
    queryFn: () => apiRequest<DriversResponse>(`/jobs/drivers?${searchParams.toString()}`),
  });
}

export function useDriver(id: string) {
  return useQuery<DriverProfileItem>({
    queryKey: ['driver', id],
    queryFn: () => apiRequest<DriverProfileItem>(`/jobs/drivers/${id}`),
    enabled: !!id,
  });
}

// ─── Employer Profile Hooks ───

export function useMyEmployerProfile(enabled = true) {
  return useQuery<EmployerProfileItem>({
    queryKey: ['employer-profile', 'me'],
    queryFn: () => apiRequest<EmployerProfileItem>('/jobs/employer-profile/me'),
    retry: false,
    enabled,
  });
}

export function useCreateEmployerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest<EmployerProfileItem>('/jobs/employer-profile', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-profile'] }); },
  });
}

export function useUpdateEmployerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) =>
      apiRequest<EmployerProfileItem>('/jobs/employer-profile', { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['employer-profile'] }); },
  });
}

export function useEmployer(id: string) {
  return useQuery<EmployerProfileItem>({
    queryKey: ['employer', id],
    queryFn: () => apiRequest<EmployerProfileItem>(`/jobs/employers/${id}`),
    enabled: !!id,
  });
}


// ─── Driver Verification ───

export interface VerificationItem {
  id: string;
  driverProfileId: string;
  licenseImageUrl: string;
  idImageUrl: string;
  notes?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  driverProfile?: {
    id: string;
    user: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null; email: string };
  };
}

export function useMyVerificationStatus() {
  return useQuery<VerificationItem[]>({
    queryKey: ['verification', 'my'],
    queryFn: () => apiRequest<VerificationItem[]>('/jobs/verification/status'),
  });
}

export function useSubmitVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { licenseImageUrl: string; idImageUrl: string; notes?: string }) =>
      apiRequest<VerificationItem>('/jobs/verification/submit', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verification'] });
    },
  });
}

export function useAdminVerifications(status?: string) {
  const params = status ? `?status=${status}` : '';
  return useQuery<VerificationItem[]>({
    queryKey: ['admin', 'verifications', status],
    queryFn: () => apiRequest<VerificationItem[]>(`/jobs/admin/verifications${params}`),
  });
}

// ─── Driver Reviews ───

export interface DriverReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  entityType: string;
  entityId: string;
  reviewer: { id: string; username: string; displayName?: string | null; avatarUrl?: string | null };
  reply?: { id: string; body: string; createdAt: string } | null;
  createdAt: string;
}

export interface DriverReviewsResponse {
  items: DriverReviewItem[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useDriverReviews(profileId: string, page = 1) {
  return useQuery<DriverReviewsResponse>({
    queryKey: ['driver-reviews', profileId, page],
    queryFn: () => apiRequest<DriverReviewsResponse>(`/jobs/drivers/${profileId}/reviews?page=${page}`),
    enabled: !!profileId,
  });
}

export function useAdminReviewVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, rejectionReason }: { id: string; decision: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
      apiRequest(`/jobs/admin/verifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ decision, rejectionReason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'verifications'] });
      qc.invalidateQueries({ queryKey: ['verification'] });
    },
  });
}

