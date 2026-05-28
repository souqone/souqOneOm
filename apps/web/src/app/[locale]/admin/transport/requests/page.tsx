'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { Link } from '@/i18n/navigation';
import { adminTransportApi } from '@/features/transport/admin-api';
import { useToast } from '@/components/toast';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';
import { ArrowRight, Trash2, Loader2, Filter } from 'lucide-react';
import { BOOKING_STATUS_LABELS, SERVICE_TYPE_LABELS } from '@/features/transport/constants';
import type { TransportRequest } from '@/features/transport/types';

export default function AdminTransportRequests() {
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
              <h1 className="text-2xl font-bold text-[var(--color-on-surface)]">إدارة طلبات النقل</h1>
            </div>

            <RequestsTable />
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}

function RequestsTable() {
  const { addToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = () => {
    setLoading(true);
    adminTransportApi.getRequests({ page, limit: 20, status: statusFilter || undefined })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setActionLoading(id);
    try {
      await adminTransportApi.deleteRequest(id);
      addToast('success', 'تم حذف الطلب بنجاح');
      fetchRequests();
    } catch (e: any) {
      addToast('error', e.message || 'حدث خطأ أثناء الحذف');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      await adminTransportApi.updateRequestStatus(id, newStatus);
      addToast('success', 'تم تحديث حالة الطلب');
      fetchRequests();
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
        <span className="text-sm font-semibold text-[var(--color-on-surface-variant)]">الفلترة:</span>
        {['', 'OPEN', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'EXPIRED'].map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === s
                ? 'bg-[var(--color-brand-navy)] text-white'
                : 'bg-surface-container-low text-[var(--color-on-surface-variant)] hover:bg-[var(--color-outline-variant)]'
            }`}
          >
            {s ? BOOKING_STATUS_LABELS[s as keyof typeof BOOKING_STATUS_LABELS] || s : 'الكل'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12"><TransportPageLoader /></div>
      ) : data?.items?.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="text-xs text-[var(--color-on-surface-muted)] uppercase bg-surface-container-low">
                <tr>
                  <th className="px-4 py-3 rounded-r-xl">ID</th>
                  <th className="px-4 py-3">المستخدم</th>
                  <th className="px-4 py-3">الخدمة</th>
                  <th className="px-4 py-3">المسار</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">تاريخ الإنشاء</th>
                  <th className="px-4 py-3 rounded-l-xl text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((req: TransportRequest) => (
                  <tr key={req.id} className="border-b border-[var(--color-outline-variant)] hover:bg-surface-container-lowest transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-brand-navy)]">
                      <Link href={`/transport/requests/${req.id}`} className="hover:underline">
                        {req.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {req.user?.displayName || req.user?.username || 'مجهول'}
                    </td>
                    <td className="px-4 py-3">
                      {SERVICE_TYPE_LABELS[req.serviceType] || req.serviceType}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {req.fromGovernorate} <ArrowRight size={10} className="inline mx-1 text-[var(--color-on-surface-muted)]" /> {req.toGovernorate}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req.id, e.target.value)}
                        disabled={actionLoading === req.id}
                        className="text-xs font-bold px-2 py-1 rounded border border-[var(--color-outline)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-navy)] disabled:opacity-50"
                      >
                        <option value="OPEN">مفتوح</option>
                        <option value="QUOTED">عروض</option>
                        <option value="ACCEPTED">مقبول</option>
                        <option value="IN_PROGRESS">قيد التنفيذ</option>
                        <option value="COMPLETED">مكتمل</option>
                        <option value="CANCELLED">ملغي</option>
                        <option value="EXPIRED">منتهي</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-on-surface-muted)]">
                      {new Date(req.createdAt).toLocaleDateString('ar-OM')}
                    </td>
                    <td className="px-4 py-3 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDelete(req.id)}
                        disabled={actionLoading === req.id}
                        className="p-1.5 text-[var(--color-error)] hover:bg-[var(--color-error-light)] rounded-lg transition-colors disabled:opacity-50"
                        title="حذف الطلب"
                      >
                        {actionLoading === req.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
          <p className="text-[var(--color-on-surface-variant)] font-semibold">لا توجد طلبات مطابقة للفلتر المختار.</p>
        </div>
      )}
    </div>
  );
}
