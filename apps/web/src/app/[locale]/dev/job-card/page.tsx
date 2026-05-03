'use client';

/**
 * 🛠 DEV ONLY — Job Card Sandbox
 * صفحة تطوير لعرض JobCard في جميع حالاته
 * الرابط: /[locale]/dev/job-card
 */

import { JobCard, type JobCardItem } from '@/features/listings/components/JobCard';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const JOBS: Array<{ label: string; desc: string; item: JobCardItem }> = [
  {
    label: '💼 توظيف — دوام كامل مع راتب',
    desc: 'شركة موثقة، راتب شهري، 3 سنوات خبرة',
    item: {
      id: 'job-1',
      title: 'مطلوب سائق شاحنة ثقيلة — رخصة 5',
      employerName: 'شركة نقل الخليج',
      jobType: 'HIRING',
      employmentType: 'دوام كامل',
      salary: 450,
      salaryPeriod: 'شهر',
      currency: 'OMR',
      experienceYears: 3,
      governorate: 'مسقط',
      city: 'السيب',
      tags: ['رخصة 5', 'شاحنة ثقيلة', 'عماني / وافد'],
      postedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      isVerifiedEmployer: true,
      href: '#',
    },
  },
  {
    label: '⚡ عاجل — راتب قابل للتفاوض',
    desc: 'طلب عاجل، بدون خبرة، صاحب سيارة',
    item: {
      id: 'job-2',
      title: 'سائق توصيل عاجل — تطبيق توصيل',
      employerName: 'سريع للتوصيل',
      jobType: 'HIRING',
      employmentType: 'دوام جزئي',
      isNegotiable: true,
      currency: 'OMR',
      governorate: 'صحار',
      tags: ['سيارة خاصة', 'رخصة خاصة'],
      postedAt: new Date(Date.now() - 30 * 60000).toISOString(),
      isUrgent: true,
      href: '#',
    },
  },
  {
    label: '🙋 عرض عمل — سائق يبحث عن وظيفة',
    desc: 'فئة OFFERING، بدون أزرار تواصل',
    item: {
      id: 'job-3',
      title: 'سائق خبرة 7 سنوات يبحث عن فرصة عمل',
      employerName: 'محمد العبري',
      jobType: 'OFFERING',
      employmentType: 'دوام كامل',
      experienceYears: 7,
      governorate: 'نزوى',
      tags: ['رخصة 4', 'رخصة 5', 'باص', 'شاحنة'],
      postedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      isVerifiedEmployer: false,
      href: '#',
    },
  },
  {
    label: '🏢 شركة كبيرة — رواتب مرتفعة',
    desc: 'شركة موثقة، راتب مرتفع، خبرة 5 سنوات',
    item: {
      id: 'job-4',
      title: 'كابتن حافلة مدرسية — مؤسسة تعليمية كبرى',
      employerName: 'مجموعة التعليم المتقدم',
      jobType: 'HIRING',
      employmentType: 'دوام كامل',
      salary: 650,
      salaryPeriod: 'شهر',
      currency: 'OMR',
      experienceYears: 5,
      governorate: 'مسقط',
      city: 'بوشر',
      tags: ['رخصة باص', 'خبرة مدرسية', 'عماني مفضل'],
      postedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      isVerifiedEmployer: true,
      isUrgent: false,
      href: '#',
    },
  },
  {
    label: '💰 راتب يومي',
    desc: 'سائق يومي بدون تفاصيل خبرة',
    item: {
      id: 'job-5',
      title: 'سائق رافعة شوكية — مستودعات',
      employerName: 'مستودعات الشرق',
      jobType: 'HIRING',
      salary: 25,
      salaryPeriod: 'يوم',
      currency: 'OMR',
      governorate: 'صلالة',
      tags: ['رافعة شوكية', 'مستودعات'],
      postedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      href: '#',
    },
  },
  {
    label: '🚫 بدون راتب / بدون تواصل',
    desc: 'مفيش سعر، مفيش أزرار — fallback',
    item: {
      id: 'job-6',
      title: 'سائق خاص للعائلة — وقت كامل',
      employerName: 'عائلة كريمة',
      jobType: 'HIRING',
      employmentType: 'دوام كامل',
      governorate: 'مسقط',
      tags: ['خاص', 'مرن'],
      postedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      href: '#',
    },
  },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function JobCardSandboxPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <h1 className="text-lg font-black">🛠 Job Card Sandbox</h1>
          <p className="text-xs text-on-surface-variant">تصميم كارت الوظائف — جميع الحالات</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ── Individual cases ── */}
        {JOBS.map(({ label, desc, item }) => (
          <section key={item.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-outline-variant/20" />
              <div className="text-center">
                <p className="text-sm font-black">{label}</p>
                <p className="text-xs text-on-surface-variant">{desc}</p>
              </div>
              <div className="h-px flex-1 bg-outline-variant/20" />
            </div>
            {/* Show card at ~350px width to mimic grid context */}
            <div className="flex justify-center">
              <div className="w-full max-w-sm">
                <JobCard item={item} />
              </div>
            </div>
          </section>
        ))}

        {/* ── All cards in responsive grid ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-outline-variant/20" />
            <p className="text-sm font-black">🗂 كل الكروت في Grid واحد</p>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {JOBS.map(({ item }) => (
              <JobCard key={`grid-${item.id}`} item={item} />
            ))}
          </div>
        </section>

        <div className="pb-20 text-center text-xs text-on-surface-variant/40">
          🔒 صفحة للتطوير فقط — لا تنشرها في Production
        </div>
      </div>
    </div>
  );
}
