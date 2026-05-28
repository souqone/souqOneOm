'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { Link } from '@/i18n/navigation';
import { adminTransportApi } from '@/features/transport/admin-api';
import { useToast } from '@/components/toast';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';
import { ArrowRight, Trash2, ShieldCheck, ShieldAlert, Loader2, Filter } from 'lucide-react';
import type { CarrierProfile } from '@/features/transport/types';

export default function AdminTransportCarriers() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
        <Navbar />
        <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 pt-24">
          <div className="flex flex-col gap-6">
            <div>
              <Link
                href="/admin/transport"
                className="inline-flex items-center gap-2 text-sm text-[var(--color-on-surface-variant)] hover:text-[var(--color-brand-navy)] font-semibold mb-4 transition-colors"
              >
                <ArrowRight size={16} />
                العودة للوحة تحكم النقل
              </Link>
              <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">إدارة الناقلين</h1>
            </div>

            <CarriersTable />
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}

function CarriersTable() {
  const { addToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<{ isAvailable?: boolean; isVerified?: boolean }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCarriers = () => {
    setLoading(true);
    adminTransportApi.getCarriers({ page, limit: 20, ...filter })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCarriers();
  }, [page, filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف حساب هذا الناقل؟ سيتم حذف جميع عروضه وحجوزاته المرتبطة.')) return;
    setActionLoading(id);
    try {
      await adminTransportApi.deleteCarrier(id);
      addToast('success', 'تم حذف الناقل بنجاح');
      fetchCarriers();
    } catch (e: any) {
      addToast('error', e.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerify = async (id: string, currentStatus: boolean) => {
    setActionLoading(id);
    try {
      await adminTransportApi.updateCarrier(id, { isVerified: !currentStatus });
      addToast('success', !currentStatus ? 'تم توثيق الناقل' : 'تم إلغاء توثيق الناقل');
      fetchCarriers();
    } catch (e: any) {
      addToast('error', e.message || 'حدث خطأ أثناء التحديث');
    } finally {
      setActionLoading(null);
    }
  };

  if (error) return <TransportPageError message={error} />;

  return (
    <div className="card-base p-6 overflow-hidden flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-outline-variant)] pb-4">
        <Filter size={18} className="text-[var(--color-on-surface-muted)]" />
        <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">فلترة حسب:</span>
        <select
          className="text-sm font-bold px-3 py-1.5 rounded-lg border border-[var(--color-outline)] focus:outline-none focus:border-[var(--color-brand-navy)]"
          value={filter.isVerified === undefined ? '' : filter.isVerified.toString()}
          onChange={(e) => {
            const val = e.target.value;
            setFilter(prev => ({ ...prev, isVerified: val === '' ? undefined : val === 'true' }));
            setPage(1);
          }}
        >
          <option value="">حالة التوثيق (الكل)</option>
          <option value="true">موثق</option>
          <option value="false">غير موثق</option>
        </select>
      </div>

      {loading ? (
        <div className="py-12"><TransportPageLoader /></div>
      ) : data?.items?.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-[var(--color-on-surface-muted)] uppercase bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">الناقل</th>
                  <th className="px-4 py-3">المحافظة</th>
                  <th className="px-4 py-3">رحلات مكتملة</th>
                  <th className="px-4 py-3">التقييم</th>
                  <th className="px-4 py-3 text-center">توثيق</th>
                  <th className="px-4 py-3 rounded-l-xl text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((carrier: CarrierProfile) => (
                  <tr key={carrier.id} className="border-b border-[var(--color-outline-variant)] hover:bg-surface-container-lowest transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold shrink-0">
                          {carrier.companyName?.[0] || carrier.user?.username?.[0] || '؟'}
                        </div>
                        <div>
                          <Link href={`/transport/carriers/${carrier.id}`} className="font-bold hover:underline">
                            {carrier.companyName || carrier.user?.displayName || carrier.user?.username || 'مجهول'}
                          </Link>
                          <p className="text-[10px] text-[var(--color-on-surface-muted)]">{carrier.user?.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-xs">
                      {carrier.governorate}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--color-brand-navy)]">
                      {carrier.completedTrips}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--color-brand-ochre)]">
                      {carrier.averageRating > 0 ? carrier.averageRating.toFixed(1) : '-'} <span className="text-[10px] text-[var(--color-on-surface-muted)]">({carrier.reviewCount})</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleVerify(carrier.id, carrier.isVerified)}
                        disabled={actionLoading === carrier.id}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50 ${
                          carrier.isVerified 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {actionLoading === carrier.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : carrier.isVerified ? (
                          <><ShieldCheck size={14} /> موثق</>
                        ) : (
                          <><ShieldAlert size={14} /> غير موثق</>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDelete(carrier.id)}
                        disabled={actionLoading === carrier.id}
                        className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors disabled:opacity-50"
                        title="حذف الناقل"
                      >
                        {actionLoading === carrier.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-sm font-semibold bg-surface-container-low rounded-xl disabled:opacity-50 hover:bg-[var(--color-outline-variant)] transition-colors"
              >
                السابق
              </button>
              <span className="text-sm font-bold text-[var(--color-on-surface-variant)]">
                {page} من {data.meta.totalPages}
              </span>
              <button
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-sm font-semibold bg-surface-container-low rounded-xl disabled:opacity-50 hover:bg-[var(--color-outline-variant)] transition-colors"
              >
                التالي
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[var(--color-on-surface-variant)] font-semibold">لا يوجد ناقلين مطابقين للفلتر.</p>
        </div>
      )}
    </div>
  );
}
