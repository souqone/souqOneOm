type T = (key: string) => string;

export function employmentLabelsT(t: T): Record<string, string> {
  return { FULL_TIME: t('fullTime'), PART_TIME: t('partTime'), TEMPORARY: t('temporary'), CONTRACT: t('contract') };
}

export function employmentOptionsT(t: T) {
  return Object.entries(employmentLabelsT(t)).map(([value, label]) => ({ value, label }));
}

// ─── License Type Config ───

// Values must match Prisma LicenseType enum: LIGHT, HEAVY, TRANSPORT, BUS, MOTORCYCLE
export const LICENSE_TYPE_CONFIG: Record<string, { labelKey: string; icon: string }> = {
  LIGHT:       { labelKey: 'licenseLight',       icon: 'directions_car' },
  HEAVY:       { labelKey: 'licenseHeavy',       icon: 'local_shipping' },
  TRANSPORT:   { labelKey: 'licenseTransport',   icon: 'local_shipping' },
  BUS:         { labelKey: 'licenseBus',         icon: 'directions_bus' },
  MOTORCYCLE:  { labelKey: 'licenseMotorcycle',  icon: 'two_wheeler' },
};

// ─── Application Status Config ───

export const APP_STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  PENDING:   { labelKey: 'appStatusPending',   color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  ACCEPTED:  { labelKey: 'appStatusAccepted',  color: 'bg-green-50 text-green-600 border-green-200' },
  REJECTED:  { labelKey: 'appStatusRejected',  color: 'bg-error/10 text-error border-error/20' },
  WITHDRAWN: { labelKey: 'appStatusWithdrawn', color: 'bg-surface-container-high text-on-surface-variant border-outline-variant/20' },
};

// ─── Job Status Config ───

export const JOB_STATUS_CONFIG: Record<string, { labelKey: string; color: string }> = {
  ACTIVE:   { labelKey: 'jobStatusActive',   color: 'bg-green-50 text-green-600 border-green-200' },
  CLOSED:   { labelKey: 'jobStatusClosed',   color: 'bg-surface-container-high text-on-surface-variant border-outline-variant/20' },
  DRAFT:    { labelKey: 'jobStatusDraft',    color: 'bg-yellow-50 text-yellow-600 border-yellow-200' },
  EXPIRED:  { labelKey: 'jobStatusExpired',  color: 'bg-error/10 text-error border-error/20' },
};

// ─── Salary Period Config ───

export const SALARY_PERIOD_CONFIG: Record<string, { labelKey: string }> = {
  DAILY:      { labelKey: 'salaryDaily' },
  MONTHLY:    { labelKey: 'salaryMonthly' },
  YEARLY:     { labelKey: 'salaryYearly' },
  NEGOTIABLE: { labelKey: 'salaryNegotiable' },
};
