export type JobType = 'HIRING' | 'OFFERING'
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'TEMPORARY' | 'CONTRACT'
export type SalaryPeriod = 'DAILY' | 'MONTHLY' | 'YEARLY' | 'NEGOTIABLE'
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'EXPIRED'
export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
export type LicenseType = 'LIGHT' | 'HEAVY' | 'TRANSPORT' | 'MOTORCYCLE'
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface UserSummary {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  isVerified: boolean
}

export interface DriverProfile {
  id: string
  userId: string
  user: UserSummary
  licenseTypes: LicenseType[]
  experienceYears?: number
  vehicleTypes: string[]
  languages: string[]
  nationality?: string
  hasOwnVehicle: boolean
  bio?: string
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
  isAvailable: boolean
  isVerified: boolean
  averageRating: number
  reviewCount: number
  completedJobs: number
  responseTimeHours?: number
  completionRate?: number
  createdAt: string
}

export interface EmployerProfile {
  id: string
  userId: string
  user: UserSummary
  companyName?: string
  companySize?: string
  industry?: string
  bio?: string
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
  averageRating: number
  reviewCount: number
  createdAt: string
}

export interface DriverJob {
  id: string
  userId: string
  user: UserSummary
  employerProfile?: EmployerProfile
  driverProfile?: DriverProfile
  title: string
  slug: string
  description: string
  jobType: JobType
  employmentType: EmploymentType
  salary?: number
  salaryPeriod?: SalaryPeriod
  currency: string
  licenseTypes: LicenseType[]
  experienceYears?: number
  minAge?: number
  maxAge?: number
  languages: string[]
  nationality?: string
  vehicleTypes: string[]
  hasOwnVehicle: boolean
  governorate: string
  city?: string
  contactPhone?: string
  contactEmail?: string
  whatsapp?: string
  status: JobStatus
  viewCount: number
  _count: { applications: number }
  createdAt: string
  updatedAt: string
}

export interface JobApplication {
  id: string
  jobId: string
  job?: DriverJob
  applicantId: string
  applicant?: UserSummary
  driverProfile?: DriverProfile
  status: ApplicationStatus
  message?: string
  resumeUrl?: string
  isRevealed: boolean
  createdAt: string
}

export interface DriverVerification {
  id: string
  driverProfileId: string
  status: VerificationStatus
  licenseImageUrl: string
  idImageUrl: string
  notes?: string
  rejectionReason?: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface CreateJobDto {
  title: string
  description: string
  jobType: JobType
  employmentType: EmploymentType
  salary?: number
  salaryPeriod?: SalaryPeriod
  licenseTypes: LicenseType[]
  experienceYears?: number
  minAge?: number
  maxAge?: number
  languages: string[]
  nationality?: string
  vehicleTypes: string[]
  hasOwnVehicle: boolean
  governorate: string
  city?: string
  contactPhone?: string
  contactEmail?: string
  whatsapp?: string
}

export interface CreateApplicationDto {
  message?: string
  resumeUrl?: string
}

export interface CreateDriverProfileDto {
  licenseTypes: LicenseType[]
  experienceYears?: number
  vehicleTypes: string[]
  languages: string[]
  nationality?: string
  hasOwnVehicle: boolean
  bio?: string
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
}

export interface CreateEmployerProfileDto {
  companyName?: string
  companySize?: string
  industry?: string
  bio?: string
  governorate: string
  city?: string
  contactPhone?: string
  whatsapp?: string
}
