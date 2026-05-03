'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useDrivers } from '@/lib/api/jobs';
import { getGovernorates } from '@/lib/location-data';
import { LICENSE_TYPE_CONFIG } from '@/lib/constants/jobs';
import { Button } from '@/components/ui/button';
import { DriverProfileCard } from '@/features/jobs/components/DriverProfileCard';
import type { JobItem } from '@/lib/api/jobs';

interface EmployerInviteTabProps {
  activeJobs: Pick<JobItem, 'id' | 'title'>[];
}

export function EmployerInviteTab({ activeJobs }: EmployerInviteTabProps) {
  const tp = useTranslations('pages');
  const locale = useLocale();
  const govs = getGovernorates('OM', locale);

  const [filters, setFilters] = useState({ governorate: '', licenseType: '', minExp: 0 });
  const [queryParams, setQueryParams] = useState<Record<string, string> | null>(null);
  const [selectedJobId, setSelectedJobId] = useState('');

  const { data, isLoading } = useDrivers(queryParams ?? {}, !!queryParams);
  const drivers = data?.items ?? [];

  const handleSearch = () => {
    const p: Record<string, string> = { limit: '10', isAvailable: 'true' };
    if (filters.governorate) p.governorate = filters.governorate;
    if (filters.licenseType) p.licenseType = filters.licenseType;
    if (filters.minExp > 0) p.minExperience = String(filters.minExp);
    setQueryParams(p);
  };

  const inputClass = 'w-full h-9 rounded-xl bg-surface-container-low border border-outline-variant/20 text-[12px] px-3 text-on-surface focus:border-primary focus:outline-none';

  return (
    <div className="space-y-4">
      {/* Search filters */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
        <h3 className="font-semibold text-on-surface text-[13px] mb-3">{tp('searchDrivers')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-[11px] text-on-surface-variant font-semibold mb-1 block">{tp('governorate')}</label>
            <select value={filters.governorate} onChange={(e) => setFilters((f) => ({ ...f, governorate: e.target.value }))} className={inputClass}>
              <option value="">{tp('selectGovernorate')}</option>
              {govs.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-on-surface-variant font-semibold mb-1 block">{tp('licenseType')}</label>
            <select value={filters.licenseType} onChange={(e) => setFilters((f) => ({ ...f, licenseType: e.target.value }))} className={inputClass}>
              <option value="">{tp('selectLicense')}</option>
              {Object.entries(LICENSE_TYPE_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{tp(cfg.labelKey)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-on-surface-variant font-semibold mb-1 block">{tp('experience')}</label>
            <select value={String(filters.minExp)} onChange={(e) => setFilters((f) => ({ ...f, minExp: Number(e.target.value) }))} className={inputClass}>
              {[0, 1, 2, 3, 5, 8].map((n) => (
                <option key={n} value={String(n)}>
                  {n === 0 ? tp('anyExperience') : `${n}+ ${tp('yearsExp')}`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={handleSearch} disabled={isLoading} className="w-full h-10 rounded-xl bg-primary text-on-primary font-semibold text-[13px] shadow-md shadow-primary/20">
          {isLoading && <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />}
          <span className="material-symbols-outlined text-base">search</span>
          {tp('searchDrivers')}
        </Button>
      </div>

      {/* Results */}
      {queryParams !== null && (
        isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 space-y-3 animate-pulse" aria-hidden>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-surface-container-high" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 rounded-full bg-surface-container-high" />
                    <div className="h-3 w-20 rounded-full bg-surface-container-high" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 block mb-2">person_search</span>
            <p className="text-on-surface-variant text-sm">{tp('noDriversFound')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <DriverProfileCard
                key={driver.id}
                profile={driver}
                variant="invite"
                activeJobs={activeJobs}
                selectedJobId={selectedJobId}
                onJobSelect={setSelectedJobId}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}
