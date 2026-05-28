'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import {
  ToggleLeft, ToggleRight, Star, CheckCircle, TrendingUp, MapPin, Package,
  MessageSquare, Loader2, Pencil, X, Phone, MessageCircle, AlertCircle,
} from 'lucide-react';
import type {
  CarrierProfile, TransportRequest, TransportQuote, VehicleType, TransportServiceType,
} from '@/features/transport/types';
import { transportApi } from '@/features/transport/api';
import {
  SERVICE_TYPE_LABELS,
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_BG_COLORS,
  VEHICLE_TYPE_LABELS,
  QUOTE_STATUS_LABELS,
  CURRENCY_LABEL,
  REQUEST_STATUS_LABELS,
  OMAN_GOVERNORATES,
} from '@/features/transport/constants';
import { formatRelativeDate, formatBudgetRange } from '@/lib/utils';
import { AuthGuard } from '@/components/auth-guard';
import { TransportPageLoader } from '@/features/transport/components/TransportPageState';

const ALL_VEHICLE_TYPES: VehicleType[] = [
  'PICKUP', 'VAN', 'TRUCK_SMALL', 'TRUCK_LARGE', 'TRAILER', 'EXCAVATOR', 'TIPPER', 'CRANE', 'OTHER',
];

const ALL_SERVICE_TYPES: TransportServiceType[] = [
  'GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT',
];

// ── Edit Profile Modal ────────────────────────────────────────────────────────

interface EditProfileModalProps {
  profile: CarrierProfile;
  onClose: () => void;
  onSaved: (updated: CarrierProfile) => void;
}

function EditProfileModal({ profile, onClose, onSaved }: EditProfileModalProps) {
  const [companyName, setCompanyName] = useState(profile.companyName ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [contactPhone, setContactPhone] = useState(profile.contactPhone ?? '');
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? '');
  const [governorate, setGovernorate] = useState(profile.governorate);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(profile.vehicleTypes);
  const [serviceTypes, setServiceTypes] = useState<TransportServiceType[]>(profile.serviceTypes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleVehicle = (v: VehicleType) =>
    setVehicleTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);

  const toggleService = (s: TransportServiceType) =>
    setServiceTypes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicleTypes.length === 0) { setError('يرجى اختيار نوع مركبة واحد على الأقل'); return; }
    if (serviceTypes.length === 0) { setError('يرجى اختيار نوع خدمة واحد على الأقل'); return; }
    if (!governorate) { setError('يرجى اختيار المحافظة'); return; }

    setSaving(true);
    setError('');
    try {
      const updated = await transportApi.updateCarrierProfile({
        companyName: companyName || undefined,
        bio: bio || undefined,
        contactPhone: contactPhone || undefined,
        whatsapp: whatsapp || undefined,
        governorate,
        vehicleTypes,
        serviceTypes,
      });
      setSuccess(true);
      onSaved(updated);
      setTimeout(onClose, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'تعذّر حفظ التعديلات، حاول مجدداً');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-[var(--color-surface)] rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-surface)] border-b border-[var(--color-outline-variant)] px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-[var(--color-on-surface)]">تعديل الملف الشخصي</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface-container)] transition-all"
          >
            <X size={18} className="text-[var(--color-on-surface-muted)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {error && (
            <div className="text-sm px-4 py-3 rounded-xl bg-[var(--color-error-light)] text-[var(--color-error)]">
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-[var(--color-success-light)] text-[var(--color-success)]">
              <CheckCircle size={15} />
              تم حفظ التعديلات بنجاح
            </div>
          )}

          {/* Company Info */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
              معلومات الشركة
            </h3>
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
                وصف (اختياري)
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
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
              أنواع المركبات *
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_VEHICLE_TYPES.map((v) => {
                const selected = vehicleTypes.includes(v);
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => toggleVehicle(v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      selected
                        ? 'bg-[var(--color-brand-navy)] border-[var(--color-brand-navy)] text-white'
                        : 'bg-white border-[var(--color-outline)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-brand-navy)]'
                    }`}
                  >
                    {selected && <CheckCircle size={12} />}
                    {VEHICLE_TYPE_LABELS[v]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Types */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
              أنواع الخدمات *
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICE_TYPES.map((s) => {
                const selected = serviceTypes.includes(s);
                const color = SERVICE_TYPE_COLORS[s];
                const bg = SERVICE_TYPE_BG_COLORS[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleService(s)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                      selected
                        ? 'border-2'
                        : 'bg-white border-[var(--color-outline)] text-[var(--color-on-surface-variant)]'
                    }`}
                    style={selected ? { backgroundColor: bg, borderColor: color, color } : {}}
                  >
                    {selected && <CheckCircle size={12} />}
                    {SERVICE_TYPE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location & Contact */}
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wide">
              مناطق الخدمة والتواصل
            </h3>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                المحافظة *
              </label>
              <select
                value={governorate}
                onChange={(e) => setGovernorate(e.target.value)}
                className="input-base"
              >
                <option value="">اختر المحافظة</option>
                {OMAN_GOVERNORATES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                  رقم التواصل
                </label>
                <div className="relative">
                  <Phone size={13} className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-on-surface-muted)]" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+968 9xxx xxxx"
                    className="input-base pr-9"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-[var(--color-on-surface-variant)]">
                  واتساب
                </label>
                <div className="relative">
                  <MessageCircle size={13} className="absolute top-1/2 -translate-y-1/2 right-3 text-[var(--color-on-surface-muted)]" />
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
            disabled={saving || success}
            className="btn-primary w-full justify-center py-3"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            حفظ التعديلات
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

function CarrierDashboardContent() {
  const router = useRouter();
  const [profile, setProfile] = useState<CarrierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState('');
  const [nearbyRequests, setNearbyRequests] = useState<TransportRequest[]>([]);
  const [recentQuotes, setRecentQuotes] = useState<TransportQuote[]>([]);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, reqRes, quotesRes] = await Promise.allSettled([
          transportApi.getMyCarrierProfile(),
          transportApi.getRequests({ limit: 4 }),
          transportApi.myQuotes(),
        ]);
        
        if (profileRes.status === 'rejected') {
          throw profileRes.reason;
        } else {
          setProfile(profileRes.value);
        }

        if (reqRes.status === 'fulfilled') {
          setNearbyRequests(reqRes.value.items);
        }

        if (quotesRes.status === 'fulfilled') {
          setRecentQuotes(quotesRes.value.items.slice(0, 5));
        }
      } catch (err: any) {
        if (err?.status === 404) {
          // no carrier profile → redirect to registration
          router.replace('/transport/carriers/register');
        } else {
          setError('تعذّر تحميل البروفايل. حاول مرة أخرى.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [router]);

  const handleToggleAvailability = async () => {
    if (!profile) return;
    setToggling(true);
    setToggleError('');
    try {
      const updated = await transportApi.setAvailability(!profile.isAvailable);
      setProfile(updated);
    } catch {
      setToggleError('تعذّر تغيير حالة التوفر، حاول مجدداً');
    } finally {
      setToggling(false);
    }
  };

  useEffect(() => {
    if (!toggleError) return;
    const timer = setTimeout(() => setToggleError(''), 5000);
    return () => clearTimeout(timer);
  }, [toggleError]);

  if (loading) return <TransportPageLoader />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <AlertCircle size={40} className="text-[var(--color-error)]" />
          <p className="text-base font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!profile) return <TransportPageLoader />;

  const acceptedQuotes = recentQuotes.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
      <div className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">لوحة الناقل</h1>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              {profile.companyName ?? profile.user?.displayName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--color-outline)] text-sm font-semibold text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-brand-navy)] transition-all"
            >
              <Pencil size={14} />
              تعديل الملف
            </button>
            <Link
              href={`/transport/carriers/${profile.id}`}
              className="text-sm text-[var(--color-brand-navy)] font-semibold hover:underline"
            >
              عرض ملفي الشخصي
            </Link>
          </div>
        </div>

        {/* Availability Toggle */}
        <div
          className="rounded-2xl p-5 mb-6 flex items-center justify-between gap-4"
          style={{
            background: profile.isAvailable
              ? 'linear-gradient(135deg, var(--color-brand-navy), var(--color-brand-navy-light))'
              : 'linear-gradient(135deg, #374151, #4b5563)',
          }}
        >
          <div>
            <p className="text-white/70 text-xs font-semibold mb-1">حالة التوفر</p>
            <p className="text-white text-xl font-bold">
              {profile.isAvailable ? 'متاح للعمل' : 'غير متاح حالياً'}
            </p>
            <p className="text-white/60 text-xs mt-1">
              {profile.isAvailable
                ? 'يمكن للشاحنين رؤية ملفك وإرسال طلبات'
                : 'ملفك مخفي عن الشاحنين'}
            </p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={toggling}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 size={18} className="animate-spin" />
            ) : profile.isAvailable ? (
              <ToggleRight size={22} />
            ) : (
              <ToggleLeft size={22} />
            )}
            {profile.isAvailable ? 'إيقاف' : 'تفعيل'}
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'عروض مقدمة',
              value: recentQuotes.length,
              icon: MessageSquare,
              color: 'var(--color-info)',
              bg: 'var(--color-info-light)',
            },
            {
              label: 'عروض مقبولة',
              value: acceptedQuotes,
              icon: CheckCircle,
              color: 'var(--color-success)',
              bg: 'var(--color-success-light)',
            },
            {
              label: 'رحلات مكتملة',
              value: profile.completedTrips,
              icon: TrendingUp,
              color: 'var(--color-brand-navy)',
              bg: 'rgba(11,36,71,0.1)',
            },
            {
              label: 'التقييم',
              value: profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—',
              icon: Star,
              color: 'var(--color-brand-amber)',
              bg: 'rgba(232,120,30,0.1)',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card-base p-4 flex flex-col gap-2">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: bg }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <p className="text-2xl font-bold text-[var(--color-on-surface)]">{value}</p>
              <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Nearby Requests */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                طلبات قريبة منك
              </h2>
              <div className="flex items-center gap-1 text-xs text-[var(--color-on-surface-muted)]">
                <MapPin size={12} />
                {profile.governorate}
              </div>
            </div>
            {nearbyRequests.length === 0 ? (
              <div className="card-base p-8 flex flex-col items-center gap-3 text-center">
                <Package size={32} className="text-[var(--color-on-surface-muted)]" />
                <p className="text-sm text-[var(--color-on-surface-muted)]">
                  لا توجد طلبات قريبة حالياً
                </p>
                <Link href="/transport/browse" className="btn-primary text-sm">
                  تصفح جميع الطلبات
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {nearbyRequests.map((req) => (
                  <Link
                    key={req.id}
                    href={`/transport/requests/${req.id}`}
                    className="card-base card-hover p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">
                        {SERVICE_TYPE_LABELS[req.serviceType]}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-muted)] truncate">
                        {req.fromGovernorate} ← {req.toGovernorate}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-variant)] truncate">
                        {req.cargoDescription}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-sm font-bold text-[var(--color-brand-navy)]">
                        {formatBudgetRange(req.budgetMin, req.budgetMax)}
                      </p>
                      <p className="text-xs text-[var(--color-on-surface-muted)]">
                        {REQUEST_STATUS_LABELS[req.status]}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/transport/browse"
                  className="text-center text-sm text-[var(--color-brand-navy)] font-semibold hover:underline py-2"
                >
                  عرض جميع الطلبات
                </Link>
              </div>
            )}
          </div>

          {/* Recent Quotes */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">
                عروضي الأخيرة
              </h2>
              <Link
                href="/transport/my-quotes"
                className="text-xs text-[var(--color-brand-navy)] font-semibold hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            {recentQuotes.length === 0 ? (
              <div className="card-base p-8 flex flex-col items-center gap-3 text-center">
                <MessageSquare size={32} className="text-[var(--color-on-surface-muted)]" />
                <p className="text-sm text-[var(--color-on-surface-muted)]">لم تقدم أي عروض بعد</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentQuotes.map((q) => {
                  const statusColors: Record<string, { bg: string; text: string }> = {
                    PENDING:   { bg: 'var(--color-warning-light)',        text: 'var(--color-warning)'          },
                    ACCEPTED:  { bg: 'var(--color-success-light)',        text: 'var(--color-success)'          },
                    REJECTED:  { bg: 'var(--color-error-light)',          text: 'var(--color-error)'            },
                    WITHDRAWN: { bg: 'var(--color-surface-container)',    text: 'var(--color-on-surface-muted)' },
                  };
                  const sc = statusColors[q.status] ?? statusColors['PENDING'];
                  return (
                    <div key={q.id} className="card-base p-4 flex items-center justify-between gap-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-xs text-[var(--color-on-surface-muted)] font-mono">
                          #{q.requestId.slice(0, 8)}…
                        </p>
                        <p className="text-sm font-bold text-[var(--color-brand-navy)]">
                          {q.price} {CURRENCY_LABEL}
                        </p>
                        <p className="text-xs text-[var(--color-on-surface-muted)]">
                          {formatRelativeDate(q.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {QUOTE_STATUS_LABELS[q.status]}
                        </span>
                        {q.status === 'ACCEPTED' && q.booking?.id && (
                          <Link
                            href={`/transport/bookings/${q.booking.id}`}
                            className="text-xs text-[var(--color-brand-navy)] font-semibold hover:underline"
                          >
                            عرض الحجز
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Profile Summary */}
            <div className="card-base p-4 flex flex-col gap-3 mt-2">
              <h3 className="text-sm font-bold text-[var(--color-on-surface-variant)]">ملخص الملف</h3>
              <div className="flex flex-wrap gap-1.5">
                {profile.vehicleTypes.map((v) => (
                  <span
                    key={v}
                    className="text-xs bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] px-2.5 py-1 rounded-full font-semibold"
                  >
                    {VEHICLE_TYPE_LABELS[v]}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {profile.serviceTypes.map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)] px-2.5 py-1 rounded-full font-semibold"
                  >
                    {SERVICE_TYPE_LABELS[s]}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-on-surface-muted)]">
                <MapPin size={12} />
                {profile.governorate}
                {profile.city && ` — ${profile.city}`}
              </div>
            </div>
          </div>
        </div>

        {toggleError && (
          <div className="fixed bottom-20 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-80 bg-[var(--color-error)] text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 flex items-center justify-between gap-3">
            <span>{toggleError}</span>
            <button
              onClick={() => setToggleError('')}
              className="text-white/80 hover:text-white text-lg leading-none flex-shrink-0"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      {editOpen && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => setProfile(updated)}
        />
      )}
    </div>
  );
}

export default function CarrierDashboardPage() {
  return (
    <AuthGuard>
      <CarrierDashboardContent />
    </AuthGuard>
  );
}
