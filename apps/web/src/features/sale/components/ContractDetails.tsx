/**
 * Contract Details Section Component
 * Dedicated section for displaying contract information
 */

'use client';

import { memo, useState } from 'react';
import { FileText, Users, Calendar, TrendingUp, Clock, Building2, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { UnifiedListing } from '../types/unified.types';

interface ContractDetailsProps {
  listing: UnifiedListing;
}

export const ContractDetails = memo(function ContractDetails({ listing }: ContractDetailsProps) {
  const t = useTranslations('sale');
  const tc = useTranslations('common');
  const locale = useLocale();

  // Helper to get translated contract type
  const getContractTypeLabel = (type: string | undefined): string => {
    if (!type) return t('contractTypeOther');
    const typeMap: Record<string, string> = {
      'SCHOOL': 'contractTypeSchool',
      'COMPANY': 'contractTypeCompany',
      'GOVERNMENT': 'contractTypeGovernment',
      'TOURISM': 'contractTypeTourism',
      'OTHER_CONTRACT': 'contractTypeOther',
    };
    return t(typeMap[type] || 'contractTypeOther');
  };

  // Only show for bus listings with contract data
  if (listing.type !== 'bus' || !listing.busData?.contractType) {
    return null;
  }

  const { busData } = listing;

  const notSpecified = tc('unspecified') || '—';
  const currency = tc('currencyOMR') || 'OMR';

  const contractDetails = [
    {
      icon: FileText,
      label: t('specContractType'),
      value: getContractTypeLabel(busData.contractType),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Users,
      label: t('specContractClient'),
      value: busData.contractClient || notSpecified,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      icon: Calendar,
      label: t('specContractDuration'),
      value: busData.contractDuration
        ? t('highlightContractDuration', { months: busData.contractDuration })
        : notSpecified,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: TrendingUp,
      label: t('specProfitMargin'),
      value: busData.profitMargin
        ? t('highlightProfitMargin', { margin: busData.profitMargin })
        : notSpecified,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const monthlyDetails = [
    {
      icon: Building2,
      label: t('contractMonthlyValue'),
      value: busData.contractMonthly
        ? `${busData.contractMonthly} ${currency}`
        : notSpecified,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      icon: Clock,
      label: t('contractExpiryDate'),
      value: busData.contractExpiry
        ? new Date(busData.contractExpiry).toLocaleDateString(locale === 'ar' ? 'ar-OM' : 'en-US')
        : notSpecified,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden mb-6 shadow-sm">
      {/* ── Clickable Header ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-5 bg-gradient-to-br from-slate-50 to-blue-50 hover:from-slate-100/80 hover:to-blue-100/60 transition-colors duration-200 cursor-pointer select-none"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm flex-shrink-0">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 text-start">
          <h3 className="text-[15px] font-bold text-slate-900">{t('contractDetailsTitle')}</h3>
          <p className="text-[12px] text-slate-500">{t('contractDetailsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-[11px] font-semibold text-blue-600 bg-blue-100 px-2.5 py-1 rounded-full">
            {contractDetails.length + monthlyDetails.length} {t('specContractType') ? 'بنود' : 'items'}
          </span>
          <ChevronDown
            size={20}
            className={`text-slate-400 transition-transform duration-300 ease-out ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* ── Collapsible Content ── */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="bg-gradient-to-br from-slate-50/50 to-blue-50/30 p-5 pt-3 space-y-5">

            {/* Main Contract Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contractDetails.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200/80 hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-lg ${detail.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${detail.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-500 mb-0.5">{detail.label}</p>
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{detail.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {monthlyDetails.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/80 border border-slate-200/60 hover:shadow-md hover:border-slate-300 transition-all duration-200"
                  >
                    <div className={`w-10 h-10 rounded-lg ${detail.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${detail.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium text-slate-500 mb-0.5">{detail.label}</p>
                      <p className="text-[13px] font-semibold text-slate-900 truncate">{detail.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact for Details */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-100/80 to-indigo-100/60 border border-blue-200/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-blue-900">{t('contractContactNote')}</p>
                  <p className="text-[11px] text-blue-700">{t('contractContactSeller')}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
});
