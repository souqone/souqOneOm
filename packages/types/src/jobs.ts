export enum JobType {
  OFFERING = 'OFFERING',
  HIRING = 'HIRING',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  FREELANCE = 'FREELANCE',
}

export enum SalaryPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  PER_TRIP = 'PER_TRIP',
}

export enum JobStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FILLED = 'FILLED',
  EXPIRED = 'EXPIRED',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWING = 'REVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IDriverJob {
  id: string;
  slug: string;
  title: string;
  description: string;
  jobType: JobType;
  employmentType: EmploymentType;
  requiredLicenses: string[];
  salaryAmount?: number | null;
  salaryPeriod: SalaryPeriod;
  hasOwnVehicle: boolean;
  governorate?: string | null;
  city?: string | null;
  status: JobStatus;
  posterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDriverProfile {
  id: string;
  userId: string;
  licenses: string[];
  experienceYears?: number | null;
  hasOwnVehicle: boolean;
  languages: string[];
  governorate?: string | null;
  bio?: string | null;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployerProfile {
  id: string;
  userId: string;
  companyName?: string | null;
  companyType?: string | null;
  contactPhone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  coverLetter?: string | null;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}
