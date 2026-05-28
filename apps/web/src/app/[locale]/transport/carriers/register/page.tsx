'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import {
  Truck,
  CheckCircle,
  Loader2,
  AlertCircle,
  Phone,
  MessageCircle,
  MapPin,
  User,
  FileText,
  Package,
} from 'lucide-react';
import type { VehicleType, TransportServiceType } from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import { AuthGuard } from '@/components/auth-guard';
import {
  VEHICLE_TYPE_LABELS,
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
  OMAN_GOVERNORATES,
} from '@/features/transport/constants';

const VEHICLE_TYPES: VehicleType[] = [
  'PICKUP', 'VAN', 'TRUCK_SMALL', 'TRUCK_LARGE', 'TRAILER', 'EXCAVATOR', 'TIPPER', 'CRANE', 'OTHER',
];

const SERVICE_TYPES: TransportServiceType[] = [
  'GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT',
];

export default function CarrierRegistrationPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [bio, setBio] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [serviceTypes, setServiceTypes] = useState<TransportServiceType[]>([]);
  const [governorate, setGovernorate] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── FIX 1: Pre-check — redirect if profile already exists ──────────────
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    let cancelled = false;
    transportApi.getMyCarrierProfile()
      .then(() => {
        if (!cancelled) router.replace('/transport/carriers/dashboard');
      })
      .catch(() => {
        // 404 / any error → no profile → show the form
        if (!cancelled) setCheckingProfile(false);
      });
    return () => { cancelled = true; };
  }, [router]);

  if (checkingProfile) {
    return (
      <div className="flex-1 min-h-[60vh] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-brand-navy)]" />
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  const toggleVehicle = (v: VehicleType) => {
    setVehicleTypes((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  const toggleService = (s: TransportServiceType) => {
    setServiceTypes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicleTypes.length === 0) {
      setError('يرجى اختيار نوع مركبة واحد على الأقل');
      return;
    }
    if (serviceTypes.length === 0) {
      setError('يرجى اختيار نوع خدمة واحد على الأقل');
      return;
    }
    if (!governorate) {
      setError('يرجى اختيار المحافظة');
      return;
    }
    setSubmitting(true);
    setError('');

    // FIX 3 flag: keep button disabled on 409 (no retry allowed)
    let isConflict = false;

    try {
      await transportApi.createCarrierProfile({
        companyName: companyName || undefined,
        bio: bio || undefined,
        vehicleTypes,
        serviceTypes,
        governorate,
        contactPhone: phone || undefined,
        whatsapp: whatsapp || undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push('/transport/carriers/dashboard'), 2000);
    } catch (err) {
      // ── FIX 2: Distinguish 409 from generic errors ──────────────────────
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        isConflict = true;
        setError('لديك ملف ناقل مسجّل بالفعل. جارٍ تحويلك للوحة التحكم...');
        setTimeout(() => router.replace('/transport/carriers/dashboard'), 2000);
      } else {
        setError('حدث خطأ أثناء التسجيل. يرجى التحقق من اتصالك والمحاولة لاحقاً.');
      }
      // ────────────────────────────────────────────────────────────────────
    } finally {
      // FIX 3: On 409, button stays disabled — user should follow the redirect
      if (!isConflict) setSubmitting(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)]" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-20 h-20 rounded-full bg-[var(--color-success-light)] flex items-center justify-center">
            <CheckCircle size={40} className="text-[var(--color-success)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-on-surface)]">تم التسجيل بنجاح!</h2>
          <p className="text-sm text-[var(--color-on-surface-muted)]">جارٍ تحويلك إلى لوحة التحكم...</p>
          <Loader2 size={20} className="animate-spin text-[var(--color-brand-navy)]" />
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-navy)] flex items-center justify-center mx-auto mb-4">
            <Truck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-on-surface)] mb-2">
            سجّل كناقل
          </h1>
          <p className="text-sm text-[var(--color-on-surface-muted)]">
            أنشئ ملفك الشخصي وابدأ في تلقي طلبات النقل
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {error && (
            <div className="flex items-center gap-2 bg-[var(--color-error-light)] text-[var(--color-error)] text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Company Info */}
          <div className="card-base p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <User size={16} className="text-[var(--color-brand-navy)]" />
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">معلومات الشركة</h2>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                اسم الشركة (اختياري)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="مثال: شركة الحارثي للنقل"
                className="input-base"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                نبذة تعريفية (اختياري)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="اكتب نبذة عن خدماتك وخبرتك..."
                rows={3}
                className="input-base resize-none"
              />
            </div>
          </div>

          {/* Vehicle Types */}
          <div className="card-base p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Truck size={16} className="text-[var(--color-brand-navy)]" />
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                أنواع المركبات *
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VEHICLE_TYPES.map((v) => {
                const selected = vehicleTypes.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      selected
                        ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)] text-white'
                        : 'bg-white border-[var(--color-outline)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-brand-navy)] hover:text-[var(--color-brand-navy)]'
                    }`}
                  >
                    {selected && <CheckCircle size={13} />}
                    {VEHICLE_TYPE_LABELS[v]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Types */}
          <div className="card-base p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-[var(--color-brand-navy)]" />
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                أنواع الخدمات *
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SERVICE_TYPES.map((s) => {
                const selected = serviceTypes.includes(s);
                const color = SERVICE_TYPE_COLORS[s];
                const bg = SERVICE_TYPE_BG_COLORS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      selected
                        ? 'border-2' :'bg-white border-[var(--color-outline)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]'
                    }`}
                    style={
                      selected
                        ? { backgroundColor: bg, borderColor: color, color }
                        : {}
                    }
                  >
                    {selected && <CheckCircle size={13} />}
                    {SERVICE_TYPE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Contact */}
          <div className="card-base p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin size={16} className="text-[var(--color-brand-navy)]" />
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">الموقع والتواصل</h2>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                المحافظة *
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="input-base"
                required
              >
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                  رقم الهاتف
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-on-surface-muted)]" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+968 9xxx xxxx"
                    className="input-base pr-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                  رقم واتساب
                </label>
                <div className="relative">
                  <MessageCircle size={14} className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-on-surface-muted)]" />
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+968 9xxx xxxx"
                    className="input-base pr-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full justify-center py-3 text-base"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            إنشاء الملف الشخصي
          </button>
        </form>
      </div>
    </div>
    </AuthGuard>
  );
}
