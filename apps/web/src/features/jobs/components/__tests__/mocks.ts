import type { DriverJob, DriverProfile, JobApplication } from '@/features/jobs/types'

const mockUser = {
  id: 'usr-1',
  username: 'mohammed_test',
  displayName: 'محمد البلوشي',
  avatarUrl: undefined,
  isVerified: false,
}

export const mockJob: DriverJob = {
  id: 'job-1',
  userId: 'usr-1',
  user: mockUser,
  title: 'سائق شاحنة',
  slug: 'driver-job-1',
  description: 'مطلوب سائق بخبرة 3 سنوات على الأقل',
  jobType: 'HIRING',
  employmentType: 'FULL_TIME',
  salary: 400,
  salaryPeriod: 'MONTHLY',
  currency: 'OMR',
  licenseTypes: ['HEAVY'],
  experienceYears: 3,
  languages: ['ARABIC'],
  vehicleTypes: [],
  hasOwnVehicle: false,
  governorate: 'مسقط',
  status: 'ACTIVE',
  viewCount: 100,
  _count: { applications: 5 },
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-01').toISOString(),
}

export const mockDriver: DriverProfile = {
  id: 'drv-1',
  userId: 'usr-1',
  user: mockUser,
  governorate: 'مسقط',
  licenseTypes: ['HEAVY', 'LIGHT'],
  vehicleTypes: ['HEAVY_TRUCK'],
  hasOwnVehicle: true,
  languages: ['ARABIC', 'ENGLISH'],
  isAvailable: true,
  isVerified: false,
  averageRating: 4.5,
  reviewCount: 10,
  completedJobs: 5,
  createdAt: new Date('2024-01-01').toISOString(),
}

export const mockApplication: JobApplication = {
  id: 'app-1',
  jobId: 'job-1',
  applicantId: 'usr-1',
  applicant: mockUser,
  job: mockJob,
  status: 'PENDING',
  message: 'أنا مهتم بهذه الوظيفة',
  createdAt: new Date('2024-01-01').toISOString(),
}

export const mockFilters = {
  jobType: '',
  employmentType: '',
  licenseType: '',
  governorate: '',
  wilayat: '',
  sortBy: 'createdAt_desc',
}
