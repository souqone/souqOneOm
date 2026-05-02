'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { useCreateDriverProfile, useCreateEmployerProfile, useMyDriverProfile, useMyEmployerProfile } from '@/lib/api';
import { useToast } from '@/components/toast';
import { getGovernorates } from '@/lib/location-data';
import { useLocale } from 'next-intl';

const LICENSE_OPTIONS = [
  { value: 'LIGHT', label: 'خفيفة' },
  { value: 'HEAVY', label: 'ثقيلة' },
  { value: 'TRANSPORT', label: 'نقل' },
  { value: 'BUS', label: 'حافلات' },
  { value: 'MOTORCYCLE', label: 'دراجة نارية' },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: 'SEDAN', label: 'سيدان' },
  { value: 'SUV', label: 'دفع رباعي' },
  { value: 'LIGHT_TRUCK', label: 'شاحنة خفيفة' },
  { value: 'HEAVY_TRUCK', label: 'شاحنة ثقيلة' },
  { value: 'BUS', label: 'حافلة' },
  { value: 'VAN', label: 'فان' },
  { value: 'PICKUP', label: 'بيك أب' },
];

const LANGUAGE_OPTIONS = [
  { value: 'ARABIC', label: 'العربية' },
  { value: 'ENGLISH', label: 'الإنجليزية' },
  { value: 'URDU', label: 'الأردية' },
  { value: 'HINDI', label: 'الهندية' },
  { value: 'BENGALI', label: 'البنغالية' },
  { value: 'FILIPINO', label: 'الفلبينية' },
];

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}

type ProfileType = null | 'driver' | 'employer';

function OnboardingContent() {
  const router = useRouter();
  const { addToast } = useToast();
  const locale = useLocale();
  const govs = getGovernorates('OM', locale);

  const { data: existingDriver, isLoading: loadingDriver } = useMyDriverProfile();
  const { data: existingEmployer, isLoading: loadingEmployer } = useMyEmployerProfile();
  const createDriver = useCreateDriverProfile();
  const createEmployer = useCreateEmployerProfile();

  const [profileType, setProfileType] = useState<ProfileType>(null);

  // Driver form state
  const [driverForm, setDriverForm] = useState({
    licenseTypes: [] as string[],
    experienceYears: '',
    languages: [] as string[],
    nationality: '',
    vehicleTypes: [] as string[],
    hasOwnVehicle: false,
    bio: '',
    governorate: '',
    city: '',
    contactPhone: '',
    whatsapp: '',
  });

  // Employer form state
  const [employerForm, setEmployerForm] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    bio: '',
    governorate: '',
    city: '',
    contactPhone: '',
    whatsapp: '',
  });

  function toggleArray(_form: 'driver', key: 'licenseTypes' | 'languages' | 'vehicleTypes', value: string) {
    setDriverForm((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value],
    }));
  }

  async function handleDriverSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!driverForm.governorate || driverForm.licenseTypes.length === 0) {
      addToast('error', 'المحافظة ونوع الرخصة مطلوبان');
      return;
    }
    const payload: Record<string, any> = {
      licenseTypes: driverForm.licenseTypes,
      languages: driverForm.languages,
      vehicleTypes: driverForm.vehicleTypes,
      hasOwnVehicle: driverForm.hasOwnVehicle,
      governorate: driverForm.governorate,
    };
    if (driverForm.experienceYears) payload.experienceYears = Number(driverForm.experienceYears);
    if (driverForm.nationality) payload.nationality = driverForm.nationality;
    if (driverForm.bio) payload.bio = driverForm.bio;
    if (driverForm.city) payload.city = driverForm.city;
    if (driverForm.contactPhone) payload.contactPhone = driverForm.contactPhone;
    if (driverForm.whatsapp) payload.whatsapp = driverForm.whatsapp;

    try {
      await createDriver.mutateAsync(payload);
      addToast('success', 'تم إنشاء بروفايل السائق بنجاح');
      router.push('/jobs');
    } catch (err: any) {
      addToast('error', err?.message || 'حدث خطأ');
    }
  }

  async function handleEmployerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employerForm.governorate) {
      addToast('error', 'المحافظة مطلوبة');
      return;
    }
    const payload: Record<string, any> = { governorate: employerForm.governorate };
    if (employerForm.companyName) payload.companyName = employerForm.companyName;
    if (employerForm.companySize) payload.companySize = employerForm.companySize;
    if (employerForm.industry) payload.industry = employerForm.industry;
    if (employerForm.bio) payload.bio = employerForm.bio;
    if (employerForm.city) payload.city = employerForm.city;
    if (employerForm.contactPhone) payload.contactPhone = employerForm.contactPhone;
    if (employerForm.whatsapp) payload.whatsapp = employerForm.whatsapp;

    try {
      await createEmployer.mutateAsync(payload);
      addToast('success', 'تم إنشاء بروفايل صاحب العمل بنجاح');
      router.push('/jobs');
    } catch (err: any) {
      addToast('error', err?.message || 'حدث خطأ');
    }
  }

  if (loadingDriver || loadingEmployer) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-surface-container-low rounded w-1/2" />
            <div className="h-48 bg-surface-container-low rounded" />
          </div>
        </main>
      </>
    );
  }

  if ((existingDriver || existingEmployer) && !profileType) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
          <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">badge</span>
            إدارة بروفايلك
          </h1>
          <p className="text-on-surface-variant mb-8">اختر ما تريد القيام به</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {existingDriver && (
              <button
                onClick={() => router.push('/dashboard/driver')}
                className="glass-card rounded-xl p-8 text-center hover:border-primary/50 transition-all border-2 border-primary/30"
              >
                <span className="material-symbols-outlined text-5xl text-primary mb-3 block">local_shipping</span>
                <h2 className="text-xl font-extrabold mb-2">لوحة تحكم السائق</h2>
                <p className="text-sm text-on-surface-variant">إدارة طلباتك ودعواتك</p>
              </button>
            )}
            {!existingDriver && (
              <button
                onClick={() => setProfileType('driver')}
                className="glass-card rounded-xl p-8 text-center hover:border-primary/50 transition-all border-2 border-transparent"
              >
                <span className="material-symbols-outlined text-5xl text-primary mb-3 block">local_shipping</span>
                <h2 className="text-xl font-extrabold mb-2">سائق</h2>
                <p className="text-sm text-on-surface-variant">أبحث عن فرص عمل كسائق</p>
              </button>
            )}
            {existingEmployer && (
              <button
                onClick={() => router.push('/jobs/my')}
                className="glass-card rounded-xl p-8 text-center hover:border-primary/50 transition-all border-2 border-primary/30"
              >
                <span className="material-symbols-outlined text-5xl text-brand-green mb-3 block">business</span>
                <h2 className="text-xl font-extrabold mb-2">إعلاناتي</h2>
                <p className="text-sm text-on-surface-variant">إدارة وظائفك المنشورة</p>
              </button>
            )}
            {!existingEmployer && (
              <button
                onClick={() => setProfileType('employer')}
                className="glass-card rounded-xl p-8 text-center hover:border-primary/50 transition-all border-2 border-transparent"
              >
                <span className="material-symbols-outlined text-5xl text-brand-green mb-3 block">business</span>
                <h2 className="text-xl font-extrabold mb-2">صاحب عمل</h2>
                <p className="text-sm text-on-surface-variant">أبحث عن سائقين لتوظيفهم</p>
              </button>
            )}
          </div>
          <button onClick={() => router.push('/jobs')} className="mt-8 text-sm text-on-surface-variant hover:text-on-surface transition">
            العودة لقائمة الوظائف
          </button>
        </main>
        <Footer />
      </>
    );
  }

  const inputClass = 'w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-3 px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none';

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 max-w-3xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">badge</span>
          أنشئ بروفايلك
        </h1>
        <p className="text-on-surface-variant mb-8">اختر نوع حسابك في سوق الوظائف</p>

        {/* Step 1: Choose Type */}
        {!profileType && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => setProfileType('driver')}
              className="glass-card rounded-xl p-8 text-center hover:border-primary/50 transition-all border-2 border-transparent"
            >
              <span className="material-symbols-outlined text-5xl text-primary mb-3 block">local_shipping</span>
              <h2 className="text-xl font-extrabold mb-2">سائق</h2>
              <p className="text-sm text-on-surface-variant">أبحث عن فرص عمل كسائق</p>
            </button>
            <button
              onClick={() => setProfileType('employer')}
              className="glass-card rounded-xl p-8 text-center hover:border-primary/50 transition-all border-2 border-transparent"
            >
              <span className="material-symbols-outlined text-5xl text-brand-green mb-3 block">business</span>
              <h2 className="text-xl font-extrabold mb-2">صاحب عمل</h2>
              <p className="text-sm text-on-surface-variant">أبحث عن سائقين لتوظيفهم</p>
            </button>
          </div>
        )}

        {/* Step 2: Driver Form */}
        {profileType === 'driver' && (
          <form onSubmit={handleDriverSubmit} className="space-y-6">
            <button type="button" onClick={() => setProfileType(null)} className="text-sm text-primary font-bold flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-sm icon-flip">arrow_forward</span>
              رجوع
            </button>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                نوع الرخصة *
              </h2>
              <div className="flex flex-wrap gap-2">
                {LICENSE_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => toggleArray('driver', 'licenseTypes', o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                      driverForm.licenseTypes.includes(o.value)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">info</span>
                المعلومات الأساسية
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">سنوات الخبرة</label>
                  <input type="number" min="0" value={driverForm.experienceYears} onChange={(e) => setDriverForm({ ...driverForm, experienceYears: e.target.value })} placeholder="مثال: 5" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">الجنسية</label>
                  <input type="text" value={driverForm.nationality} onChange={(e) => setDriverForm({ ...driverForm, nationality: e.target.value })} placeholder="مثال: عماني" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">نبذة عنك</label>
                <textarea value={driverForm.bio} onChange={(e) => setDriverForm({ ...driverForm, bio: e.target.value })} placeholder="اكتب نبذة مختصرة عن خبرتك..." className={`${inputClass} min-h-[100px] resize-none`} />
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">directions_car</span>
                المركبات
              </h2>
              <div className="flex flex-wrap gap-2">
                {VEHICLE_TYPE_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => toggleArray('driver', 'vehicleTypes', o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                      driverForm.vehicleTypes.includes(o.value)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-sm font-bold cursor-pointer">
                <input type="checkbox" checked={driverForm.hasOwnVehicle} onChange={(e) => setDriverForm({ ...driverForm, hasOwnVehicle: e.target.checked })} className="w-5 h-5 accent-primary" />
                لدي مركبة خاصة
              </label>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">translate</span>
                اللغات
              </h2>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((o) => (
                  <button key={o.value} type="button" onClick={() => toggleArray('driver', 'languages', o.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border ${
                      driverForm.languages.includes(o.value)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface border-outline-variant/30 text-on-surface-variant'
                    }`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                الموقع والتواصل
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">المحافظة *</label>
                  <select value={driverForm.governorate} onChange={(e) => setDriverForm({ ...driverForm, governorate: e.target.value })} className={inputClass}>
                    <option value="">اختر المحافظة</option>
                    {govs.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">المدينة</label>
                  <input type="text" value={driverForm.city} onChange={(e) => setDriverForm({ ...driverForm, city: e.target.value })} placeholder="المدينة" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
                  <input type="tel" value={driverForm.contactPhone} onChange={(e) => setDriverForm({ ...driverForm, contactPhone: e.target.value })} placeholder="+968..." className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">واتساب</label>
                  <input type="tel" value={driverForm.whatsapp} onChange={(e) => setDriverForm({ ...driverForm, whatsapp: e.target.value })} placeholder="+968..." className={inputClass} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={createDriver.isPending} className="w-full bg-primary text-on-primary py-4 rounded-xl font-extrabold text-base hover:brightness-110 transition disabled:opacity-50">
              {createDriver.isPending ? 'جاري الإنشاء...' : 'إنشاء بروفايل السائق'}
            </button>
          </form>
        )}

        {/* Step 2: Employer Form */}
        {profileType === 'employer' && (
          <form onSubmit={handleEmployerSubmit} className="space-y-6">
            <button type="button" onClick={() => setProfileType(null)} className="text-sm text-primary font-bold flex items-center gap-1 mb-4">
              <span className="material-symbols-outlined text-sm icon-flip">arrow_forward</span>
              رجوع
            </button>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">business</span>
                معلومات الشركة
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">اسم الشركة</label>
                  <input type="text" value={employerForm.companyName} onChange={(e) => setEmployerForm({ ...employerForm, companyName: e.target.value })} placeholder="اسم الشركة أو المؤسسة" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">حجم الشركة</label>
                  <select value={employerForm.companySize} onChange={(e) => setEmployerForm({ ...employerForm, companySize: e.target.value })} className={inputClass}>
                    <option value="">اختر</option>
                    <option value="SMALL">صغيرة (1-10)</option>
                    <option value="MEDIUM">متوسطة (11-50)</option>
                    <option value="LARGE">كبيرة (50+)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">المجال</label>
                <input type="text" value={employerForm.industry} onChange={(e) => setEmployerForm({ ...employerForm, industry: e.target.value })} placeholder="مثال: نقل، لوجستيات" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">نبذة</label>
                <textarea value={employerForm.bio} onChange={(e) => setEmployerForm({ ...employerForm, bio: e.target.value })} placeholder="نبذة عن شركتك..." className={`${inputClass} min-h-[100px] resize-none`} />
              </div>
            </div>

            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                الموقع والتواصل
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">المحافظة *</label>
                  <select value={employerForm.governorate} onChange={(e) => setEmployerForm({ ...employerForm, governorate: e.target.value })} className={inputClass}>
                    <option value="">اختر المحافظة</option>
                    {govs.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">المدينة</label>
                  <input type="text" value={employerForm.city} onChange={(e) => setEmployerForm({ ...employerForm, city: e.target.value })} placeholder="المدينة" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">رقم الهاتف</label>
                  <input type="tel" value={employerForm.contactPhone} onChange={(e) => setEmployerForm({ ...employerForm, contactPhone: e.target.value })} placeholder="+968..." className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">واتساب</label>
                  <input type="tel" value={employerForm.whatsapp} onChange={(e) => setEmployerForm({ ...employerForm, whatsapp: e.target.value })} placeholder="+968..." className={inputClass} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={createEmployer.isPending} className="w-full bg-brand-green text-white py-4 rounded-xl font-extrabold text-base hover:brightness-110 transition disabled:opacity-50">
              {createEmployer.isPending ? 'جاري الإنشاء...' : 'إنشاء بروفايل صاحب العمل'}
            </button>
          </form>
        )}
      </main>
      <Footer />
    </>
  );
}
