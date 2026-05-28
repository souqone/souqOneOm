'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthGuard } from '@/components/auth-guard';
import { Link } from '@/i18n/navigation';
import { adminTransportApi } from '@/features/transport/admin-api';
import { TransportPageLoader, TransportPageError } from '@/features/transport/components/TransportPageState';
import { Truck, Package, Users, Activity, ExternalLink } from 'lucide-react';

export default function AdminTransportDashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[var(--color-surface)]" dir="rtl">
        <Navbar />
        <main className="max-w-screen-2xl mx-auto px-4 lg:px-8 xl:px-10 2xl:px-16 py-6 pt-24">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-on-surface)] flex items-center gap-2">
                  <Truck className="text-[var(--color-brand-navy)]" size={28} />
                  إدارة النقل
                </h1>
                <p className="text-sm text-[var(--color-on-surface-muted)] mt-1">
                  لوحة تحكم إحصائيات سوق النقل
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/admin/transport/requests" className="btn-outline text-sm font-bold">
                  إدارة الطلبات
                </Link>
                <Link href="/admin/transport/carriers" className="btn-outline text-sm font-bold">
                  إدارة الناقلين
                </Link>
              </div>
            </div>

            <DashboardContent />
          </div>
        </main>
        <Footer />
      </div>
    </AuthGuard>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminTransportApi.getStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <TransportPageLoader />;
  if (error) return <TransportPageError message={error} />;
  if (!stats) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={<Package size={24} />} 
          title="إجمالي الطلبات" 
          value={stats.requests.total}
          subtext={`${stats.requests.open} طلبات مفتوحة`}
          color="var(--color-brand-teal)"
        />
        <StatCard 
          icon={<Activity size={24} />} 
          title="الحجوزات" 
          value={stats.bookings.total}
          subtext={`${stats.bookings.completed} حجوزات مكتملة`}
          color="var(--color-brand-navy)"
        />
        <StatCard 
          icon={<Users size={24} />} 
          title="إجمالي الناقلين" 
          value={stats.carriers.total}
          subtext={`${stats.carriers.available} متاحين الآن`}
          color="var(--color-brand-ochre)"
        />
        <StatCard 
          icon={<Truck size={24} />} 
          title="العروض (Quotes)" 
          value={stats.quotes.total}
          subtext={`${stats.quotes.accepted} عروض مقبولة`}
          color="var(--color-brand-coral)"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base p-6">
          <h2 className="text-lg font-bold mb-4 text-[var(--color-on-surface)]">تفاصيل الطلبات</h2>
          <div className="space-y-4">
            <ProgressRow label="مفتوحة" value={stats.requests.open} total={stats.requests.total} color="var(--color-status-open)" />
            <ProgressRow label="بها عروض" value={stats.requests.quoted} total={stats.requests.total} color="var(--color-status-quoted)" />
            <ProgressRow label="قيد التنفيذ" value={stats.requests.inProgress} total={stats.requests.total} color="var(--color-status-in-progress)" />
            <ProgressRow label="مكتملة" value={stats.requests.completed} total={stats.requests.total} color="var(--color-status-completed)" />
            <ProgressRow label="ملغية" value={stats.requests.cancelled} total={stats.requests.total} color="var(--color-status-cancelled)" />
            <ProgressRow label="منتهية" value={stats.requests.expired} total={stats.requests.total} color="var(--color-status-expired)" />
          </div>
        </div>

        <div className="card-base p-6">
          <h2 className="text-lg font-bold mb-4 text-[var(--color-on-surface)]">الناقلين والحجوزات</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
             <div className="p-4 rounded-xl bg-surface-container-low text-center">
               <p className="text-3xl font-extrabold text-[var(--color-brand-navy)]">{stats.carriers.verified}</p>
               <p className="text-xs font-semibold text-[var(--color-on-surface-muted)] mt-1">ناقل موثوق</p>
             </div>
             <div className="p-4 rounded-xl bg-surface-container-low text-center">
               <p className="text-3xl font-extrabold text-[var(--color-error)]">{stats.bookings.cancelled}</p>
               <p className="text-xs font-semibold text-[var(--color-on-surface-muted)] mt-1">حجز ملغي</p>
             </div>
          </div>
          <Link 
            href="/admin/transport/requests" 
            className="flex items-center justify-between w-full p-4 rounded-xl border border-[var(--color-outline-variant)] hover:border-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)] hover:bg-opacity-5 transition-all group"
          >
            <span className="font-semibold text-sm text-[var(--color-on-surface)] group-hover:text-[var(--color-brand-navy)]">
              عرض أحدث الطلبات
            </span>
            <ExternalLink size={16} className="text-[var(--color-on-surface-muted)] group-hover:text-[var(--color-brand-navy)]" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtext, color }: { icon: React.ReactNode; title: string; value: number; subtext: string; color: string }) {
  return (
    <div className="card-base p-5 flex flex-col justify-between">
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-10"
          style={{ backgroundColor: `${color}15`, color }}
        >
          {icon}
        </div>
        <h3 className="text-sm font-bold text-[var(--color-on-surface-muted)]">{title}</h3>
      </div>
      <div>
        <p className="text-3xl font-black text-[var(--color-on-surface)]">{value}</p>
        <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm font-bold">
        <span className="text-[var(--color-on-surface-variant)]">{label}</span>
        <span className="text-[var(--color-on-surface)]">{value} <span className="text-[var(--color-on-surface-muted)] font-normal text-xs">({percentage.toFixed(0)}%)</span></span>
      </div>
      <div className="h-2 w-full bg-[var(--color-outline-variant)] rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
