'use client';

import React, { useState, useMemo } from 'react';

// ══════════════════════════════════════════════════════════════════════════════
// DATA: All routes in the application
// ══════════════════════════════════════════════════════════════════════════════

interface RouteInfo {
  path: string;
  label: string;
  group: string;
  auth: boolean;
  type: 'page' | 'landing' | 'detail' | 'form' | 'auth' | 'admin' | 'utility';
  cards: string[];
}

const ROUTES: RouteInfo[] = [
  // ── Public Pages ──
  { path: '/', label: 'الرئيسية (Home)', group: 'Public', auth: false, type: 'landing', cards: ['UnifiedCard', 'JobCard (inline)', 'BusCard (inline)', 'EquipmentCard (inline)', 'PartsCard (inline)'] },
  { path: '/motors', label: 'لاندنج السيارات', group: 'Public', auth: false, type: 'landing', cards: ['UnifiedCard', 'ServiceCard (inline)'] },
  { path: '/equipment', label: 'لاندنج المعدات', group: 'Public', auth: false, type: 'landing', cards: ['EquipmentCard (inline)', 'RequestCard (inline)', 'OperatorCard (inline)'] },
  { path: '/coming-soon', label: 'قريباً', group: 'Public', auth: false, type: 'page', cards: [] },
  { path: '/pricing', label: 'الأسعار', group: 'Public', auth: false, type: 'page', cards: ['PriceCard'] },

  // ── Browse / Listings ──
  { path: '/browse', label: 'التصفح العام', group: 'Browse', auth: false, type: 'page', cards: ['UnifiedCard'] },
  { path: '/browse/cars', label: 'سيارات للبيع/إيجار', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/parts', label: 'قطع غيار', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/services', label: 'خدمات السيارات', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/buses', label: 'الحافلات', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/equipment', label: 'المعدات (Browse)', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/transport', label: 'النقل', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/trips', label: 'الرحلات', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/browse/insurance', label: 'التأمين', group: 'Browse', auth: false, type: 'page', cards: ['ListingCard'] },

  // ── Detail Pages ──
  { path: '/sale/[type]/[id]', label: 'تفاصيل (بيع/خدمة/معدة/...)', group: 'Detail', auth: false, type: 'detail', cards: ['PriceCard', 'SellerCard', 'UnifiedCard (similar)'] },
  { path: '/rental/[type]/[id]', label: 'تفاصيل إيجار', group: 'Detail', auth: false, type: 'detail', cards: ['RentalBookingCard', 'UnifiedCard (similar)'] },
  { path: '/jobs/[id]', label: 'تفاصيل وظيفة', group: 'Detail', auth: false, type: 'detail', cards: ['SellerCard'] },
  { path: '/jobs/drivers/[id]', label: 'بروفايل سائق', group: 'Detail', auth: false, type: 'detail', cards: [] },
  { path: '/equipment/operators/[id]', label: 'تفاصيل مشغل', group: 'Detail', auth: false, type: 'detail', cards: [] },
  { path: '/equipment/requests/[id]', label: 'تفاصيل طلب معدة', group: 'Detail', auth: false, type: 'detail', cards: [] },
  { path: '/bookings/[id]', label: 'تفاصيل حجز', group: 'Detail', auth: true, type: 'detail', cards: ['BookingCard', 'SellerCard', 'ReviewCard'] },
  { path: '/seller/[id]', label: 'بروفايل بائع', group: 'Detail', auth: false, type: 'detail', cards: ['UnifiedCard', 'GenericListingCard', 'ReviewCard'] },

  // ── Jobs ──
  { path: '/jobs', label: 'وظائف السائقين', group: 'Jobs', auth: false, type: 'page', cards: ['ListingCard'] },
  { path: '/jobs/drivers', label: 'ملفات السائقين', group: 'Jobs', auth: false, type: 'page', cards: [] },
  { path: '/jobs/new', label: 'إضافة وظيفة', group: 'Jobs', auth: true, type: 'form', cards: [] },
  { path: '/jobs/my', label: 'وظائفي', group: 'Jobs', auth: true, type: 'page', cards: [] },
  { path: '/jobs/invites', label: 'الدعوات', group: 'Jobs', auth: true, type: 'page', cards: [] },
  { path: '/jobs/onboarding', label: 'بيانات السائق', group: 'Jobs', auth: true, type: 'form', cards: [] },
  { path: '/jobs/verification', label: 'التحقق', group: 'Jobs', auth: true, type: 'page', cards: [] },

  // ── Add Listing ──
  { path: '/add-listing', label: 'اختيار نوع الإعلان', group: 'Add Listing', auth: true, type: 'page', cards: [] },
  { path: '/add-listing/car', label: 'إضافة سيارة', group: 'Add Listing', auth: true, type: 'form', cards: [] },
  { path: '/add-listing/bus', label: 'إضافة حافلة', group: 'Add Listing', auth: true, type: 'form', cards: [] },
  { path: '/add-listing/equipment', label: 'إضافة معدة', group: 'Add Listing', auth: true, type: 'form', cards: [] },
  { path: '/add-listing/operator', label: 'تسجيل مشغل', group: 'Add Listing', auth: true, type: 'form', cards: [] },
  { path: '/add-listing/parts', label: 'إضافة قطعة غيار', group: 'Add Listing', auth: true, type: 'form', cards: [] },
  { path: '/add-listing/service', label: 'إضافة خدمة', group: 'Add Listing', auth: true, type: 'form', cards: [] },

  // ── Edit Listing ──
  { path: '/edit-listing/car/[id]', label: 'تعديل سيارة', group: 'Edit Listing', auth: true, type: 'form', cards: [] },
  { path: '/edit-listing/bus/[id]', label: 'تعديل حافلة', group: 'Edit Listing', auth: true, type: 'form', cards: [] },
  { path: '/edit-listing/equipment/[id]', label: 'تعديل معدة', group: 'Edit Listing', auth: true, type: 'form', cards: [] },
  { path: '/edit-listing/operator/[id]', label: 'تعديل مشغل', group: 'Edit Listing', auth: true, type: 'form', cards: [] },
  { path: '/edit-listing/parts/[id]', label: 'تعديل قطعة غيار', group: 'Edit Listing', auth: true, type: 'form', cards: [] },
  { path: '/edit-listing/service/[id]', label: 'تعديل خدمة', group: 'Edit Listing', auth: true, type: 'form', cards: [] },
  { path: '/edit-listing/job/[id]', label: 'تعديل وظيفة', group: 'Edit Listing', auth: true, type: 'form', cards: [] },

  // ── User ──
  { path: '/profile', label: 'البروفايل', group: 'User', auth: true, type: 'page', cards: [] },
  { path: '/my-listings', label: 'إعلاناتي', group: 'User', auth: true, type: 'page', cards: [] },
  { path: '/favorites', label: 'المفضلة', group: 'User', auth: true, type: 'page', cards: ['UnifiedCard'] },
  { path: '/bookings', label: 'حجوزاتي', group: 'User', auth: true, type: 'page', cards: ['BookingCard'] },
  { path: '/notifications', label: 'الإشعارات', group: 'User', auth: true, type: 'page', cards: [] },
  { path: '/messages', label: 'المحادثات', group: 'User', auth: true, type: 'page', cards: [] },
  { path: '/messages/[id]', label: 'محادثة', group: 'User', auth: true, type: 'page', cards: ['AttachmentCard'] },

  // ── Auth ──
  { path: '/login', label: 'تسجيل الدخول', group: 'Auth', auth: false, type: 'auth', cards: [] },
  { path: '/register', label: 'إنشاء حساب', group: 'Auth', auth: false, type: 'auth', cards: [] },
  { path: '/forgot-password', label: 'نسيت كلمة السر', group: 'Auth', auth: false, type: 'auth', cards: [] },
  { path: '/reset-password', label: 'إعادة تعيين', group: 'Auth', auth: false, type: 'auth', cards: [] },

  // ── Payment ──
  { path: '/payment/success', label: 'نجاح الدفع', group: 'Payment', auth: true, type: 'utility', cards: [] },
  { path: '/payment/cancel', label: 'إلغاء الدفع', group: 'Payment', auth: true, type: 'utility', cards: [] },

  // ── Admin ──
  { path: '/admin/jobs', label: 'إدارة الوظائف', group: 'Admin', auth: true, type: 'admin', cards: [] },

  // ── Equipment Requests ──
  { path: '/equipment/requests/new', label: 'طلب معدة جديد', group: 'Equipment', auth: true, type: 'form', cards: [] },
];

// ══════════════════════════════════════════════════════════════════════════════
// DATA: Card components
// ══════════════════════════════════════════════════════════════════════════════

interface CardInfo {
  name: string;
  file: string;
  type: 'reusable' | 'inline';
  status: 'active' | 'duplicate' | 'unused' | 'deprecated';
  usedInPages: string[];
  purpose: string;
  color: string;
}

const CARDS: CardInfo[] = [
  {
    name: 'VehicleCard',
    file: 'features/ads/components/vehicle-card.tsx',
    type: 'reusable',
    status: 'deprecated',
    purpose: 'عرض السيارات (بيع + إيجار)',
    color: '#3b82f6',
    usedInPages: ['/', '/motors', '/favorites', '/seller/[id]', '/sale/[type]/[id]', '/rental/[type]/[id]'],
  },
  {
    name: 'ListingCard',
    file: 'features/listings/components/ListingCard.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'عرض الإعلانات في صفحات Browse (سيارات، قطع، خدمات، حافلات...)',
    color: '#8b5cf6',
    usedInPages: ['/browse/cars', '/browse/parts', '/browse/services', '/browse/buses', '/browse/equipment', '/browse/transport', '/browse/trips', '/browse/insurance', '/jobs'],
  },
  {
    name: 'UnifiedCard',
    file: 'features/listings/components/UnifiedCard.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'كارت موحد متعدد الأنواع (بحث عام + مفضلة + بائع)',
    color: '#06b6d4',
    usedInPages: ['/browse', '/favorites', '/seller/[id]'],
  },
  {
    name: 'GenericListingCard',
    file: 'components/generic-listing-card.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'كارت عام للنقل والرحلات',
    color: '#f59e0b',
    usedInPages: ['/seller/[id]', '/transport', '/trips'],
  },
  {
    name: 'EquipmentCard (inline)',
    file: 'equipment/equipment-shell.tsx (local)',
    type: 'inline',
    status: 'duplicate',
    purpose: 'كارت معدات في اللاندنج بيج فقط (مكرر)',
    color: '#ef4444',
    usedInPages: ['/equipment'],
  },
  {
    name: 'JobCard (inline)',
    file: 'features/home/components/jobs-section.tsx (local)',
    type: 'inline',
    status: 'duplicate',
    purpose: 'كارت وظيفة في الهوم بيج فقط (مكرر)',
    color: '#ef4444',
    usedInPages: ['/'],
  },
  {
    name: 'ServiceCard (inline)',
    file: 'motors/motors-shell.tsx (local)',
    type: 'inline',
    status: 'duplicate',
    purpose: 'كارت خدمة في لاندنج السيارات فقط (مكرر)',
    color: '#ef4444',
    usedInPages: ['/motors'],
  },
  {
    name: 'BookingCard',
    file: 'components/booking-card.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'عرض تفاصيل الحجز',
    color: '#10b981',
    usedInPages: ['/bookings', '/bookings/[id]'],
  },
  {
    name: 'SellerCard',
    file: 'components/seller-card.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'بيانات البائع/المعلن',
    color: '#ec4899',
    usedInPages: ['/sale/[type]/[id]', '/rental/[type]/[id]', '/jobs/[id]', '/bookings/[id]'],
  },
  {
    name: 'ReviewCard',
    file: 'components/reviews/review-card.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'عرض التقييم',
    color: '#f97316',
    usedInPages: ['/seller/[id]', '/bookings/[id]'],
  },
  {
    name: 'PriceCard',
    file: 'features/sale/components/PriceCard.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'بطاقة السعر + CTA في صفحة التفاصيل',
    color: '#14b8a6',
    usedInPages: ['/sale/[type]/[id]', '/pricing'],
  },
  {
    name: 'RentalBookingCard',
    file: 'features/rental/components/RentalBookingCard.tsx',
    type: 'reusable',
    status: 'active',
    purpose: 'كارت حجز الإيجار (تاريخ + سعر)',
    color: '#a855f7',
    usedInPages: ['/rental/[type]/[id]'],
  },
  {
    name: 'AttachmentCard',
    file: 'features/chat/components/attachment-card.tsx',
    type: 'reusable',
    status: 'unused',
    purpose: 'عرض مرفقات الشات',
    color: '#6b7280',
    usedInPages: [],
  },
  {
    name: 'AuthCard',
    file: 'components/auth/auth-card.tsx',
    type: 'reusable',
    status: 'unused',
    purpose: 'كارت تسجيل دخول (غير مستخدم)',
    color: '#6b7280',
    usedInPages: [],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// GROUPS
// ══════════════════════════════════════════════════════════════════════════════

const GROUPS = ['Public', 'Browse', 'Detail', 'Jobs', 'Add Listing', 'Edit Listing', 'User', 'Auth', 'Payment', 'Admin', 'Equipment'] as const;

const GROUP_COLORS: Record<string, string> = {
  'Public': '#3b82f6',
  'Browse': '#8b5cf6',
  'Detail': '#06b6d4',
  'Jobs': '#f59e0b',
  'Add Listing': '#10b981',
  'Edit Listing': '#14b8a6',
  'User': '#ec4899',
  'Auth': '#6b7280',
  'Payment': '#ef4444',
  'Admin': '#dc2626',
  'Equipment': '#f97316',
};

const GROUP_ICONS: Record<string, string> = {
  'Public': 'home',
  'Browse': 'search',
  'Detail': 'info',
  'Jobs': 'work',
  'Add Listing': 'add_circle',
  'Edit Listing': 'edit',
  'User': 'person',
  'Auth': 'lock',
  'Payment': 'payment',
  'Admin': 'admin_panel_settings',
  'Equipment': 'construction',
};

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

type ViewMode = 'routes' | 'cards' | 'diagram' | 'gallery';

export default function SitemapPage() {
  const [view, setView] = useState<ViewMode>('gallery');
  const [search, setSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const stats = useMemo(() => ({
    totalRoutes: ROUTES.length,
    totalCards: CARDS.length,
    reusableCards: CARDS.filter(c => c.type === 'reusable' && c.status === 'active').length,
    inlineCards: CARDS.filter(c => c.type === 'inline').length,
    unusedCards: CARDS.filter(c => c.status === 'unused').length,
    duplicateCards: CARDS.filter(c => c.status === 'duplicate').length,
    authRoutes: ROUTES.filter(r => r.auth).length,
    publicRoutes: ROUTES.filter(r => !r.auth).length,
  }), []);

  const filteredRoutes = useMemo(() => {
    if (!search) return ROUTES;
    const q = search.toLowerCase();
    return ROUTES.filter(r => r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q));
  }, [search]);

  const highlightedPages = selectedCard ? CARDS.find(c => c.name === selectedCard)?.usedInPages ?? [] : [];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-gray-100 font-sans" dir="ltr">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0f1e]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">hub</span>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">SouqOne Architecture Map</h1>
              <p className="text-[11px] text-gray-500">{stats.totalRoutes} Routes &middot; {stats.totalCards} Card Components</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-500 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search routes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-white/5 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
              {(['gallery', 'diagram', 'routes', 'cards'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  {v === 'gallery' ? 'Card Gallery' : v === 'diagram' ? 'Card Map' : v === 'routes' ? 'All Routes' : 'All Cards'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6">

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { label: 'Total Routes', value: stats.totalRoutes, icon: 'route', color: 'blue' },
            { label: 'Public', value: stats.publicRoutes, icon: 'public', color: 'emerald' },
            { label: 'Auth Required', value: stats.authRoutes, icon: 'lock', color: 'amber' },
            { label: 'Total Cards', value: stats.totalCards, icon: 'dashboard', color: 'purple' },
            { label: 'Reusable', value: stats.reusableCards, icon: 'check_circle', color: 'green' },
            { label: 'Inline (dup)', value: stats.inlineCards, icon: 'warning', color: 'red' },
            { label: 'Unused', value: stats.unusedCards, icon: 'block', color: 'gray' },
            { label: 'Duplicates', value: stats.duplicateCards, icon: 'content_copy', color: 'orange' },
          ].map(s => (
            <div key={s.label} className={`p-3 rounded-xl bg-${s.color}-500/10 border border-${s.color}-500/20`}>
              <span className="material-symbols-outlined text-[16px] opacity-60">{s.icon}</span>
              <p className="text-2xl font-black mt-1">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            VIEW: Card ↔ Page Diagram
        ════════════════════════════════════════════════════════════════════ */}
        {view === 'diagram' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-blue-400">schema</span>
              Card → Page Usage Diagram
            </h2>
            <p className="text-sm text-gray-400 mb-6">Click on a card to highlight which pages use it</p>

            {/* Card selector */}
            <div className="flex flex-wrap gap-2 mb-8">
              {CARDS.map(card => (
                <button
                  key={card.name}
                  onClick={() => setSelectedCard(selectedCard === card.name ? null : card.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selectedCard === card.name
                      ? 'bg-white/10 border-white/30 text-white shadow-lg scale-105'
                      : card.status === 'unused' ? 'border-white/5 text-gray-600 bg-white/[0.02]'
                      : card.status === 'duplicate' ? 'border-red-500/30 text-red-400 bg-red-500/5'
                      : 'border-white/10 text-gray-300 bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                  style={selectedCard === card.name ? { borderColor: card.color, boxShadow: `0 0 20px ${card.color}30` } : {}}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: card.color }} />
                  {card.name}
                  {card.status === 'duplicate' && <span className="ml-1 text-[9px] text-red-400">(dup)</span>}
                  {card.status === 'unused' && <span className="ml-1 text-[9px] text-gray-500">(dead)</span>}
                </button>
              ))}
            </div>

            {/* Diagram Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {GROUPS.map(group => {
                const groupRoutes = filteredRoutes.filter(r => r.group === group);
                if (groupRoutes.length === 0) return null;
                return (
                  <div key={group} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2" style={{ backgroundColor: `${GROUP_COLORS[group]}10` }}>
                      <span className="material-symbols-outlined text-[18px]" style={{ color: GROUP_COLORS[group] }}>{GROUP_ICONS[group]}</span>
                      <h3 className="text-sm font-bold" style={{ color: GROUP_COLORS[group] }}>{group}</h3>
                      <span className="text-[10px] text-gray-500 ml-auto">{groupRoutes.length} routes</span>
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {groupRoutes.map(route => {
                        const isHighlighted = highlightedPages.includes(route.path);
                        return (
                          <div
                            key={route.path}
                            className={`px-4 py-3 flex items-start gap-3 transition-all ${
                              isHighlighted ? 'bg-blue-500/10' : selectedCard ? 'opacity-30' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <code className="text-[12px] font-mono text-gray-300">{route.path}</code>
                                {route.auth && (
                                  <span className="material-symbols-outlined text-amber-500 text-[12px]">lock</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 mt-0.5">{route.label}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 shrink-0 max-w-[200px] justify-end">
                              {route.cards.length > 0 ? route.cards.map(c => {
                                const cardInfo = CARDS.find(ci => ci.name === c);
                                return (
                                  <span
                                    key={c}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                                    style={{
                                      backgroundColor: `${cardInfo?.color || '#6b7280'}15`,
                                      color: cardInfo?.color || '#6b7280',
                                      border: `1px solid ${cardInfo?.color || '#6b7280'}30`,
                                    }}
                                  >
                                    {c.replace(' (inline)', '').replace(' (similar)', '')}
                                  </span>
                                );
                              }) : (
                                <span className="text-[9px] text-gray-600">no cards</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VIEW: All Routes
        ════════════════════════════════════════════════════════════════════ */}
        {view === 'routes' && (
          <div>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-400">route</span>
              All Routes ({filteredRoutes.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="px-4 py-3 text-[11px] text-gray-400 font-bold uppercase">Route</th>
                    <th className="px-4 py-3 text-[11px] text-gray-400 font-bold uppercase">Label</th>
                    <th className="px-4 py-3 text-[11px] text-gray-400 font-bold uppercase">Group</th>
                    <th className="px-4 py-3 text-[11px] text-gray-400 font-bold uppercase">Type</th>
                    <th className="px-4 py-3 text-[11px] text-gray-400 font-bold uppercase">Auth</th>
                    <th className="px-4 py-3 text-[11px] text-gray-400 font-bold uppercase">Cards Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredRoutes.map(r => (
                    <tr key={r.path} className="hover:bg-white/[0.03] transition-colors">
                      <td className="px-4 py-3">
                        <code className="text-[12px] font-mono text-blue-300">{r.path}</code>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-gray-300">{r.label}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ backgroundColor: `${GROUP_COLORS[r.group]}20`, color: GROUP_COLORS[r.group] }}>{r.group}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-400">{r.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        {r.auth ? <span className="material-symbols-outlined text-amber-500 text-[14px]">lock</span> : <span className="material-symbols-outlined text-emerald-500 text-[14px]">public</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {r.cards.length > 0 ? r.cards.map(c => (
                            <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-gray-300">{c}</span>
                          )) : <span className="text-[10px] text-gray-600">-</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VIEW: All Cards
        ════════════════════════════════════════════════════════════════════ */}
        {view === 'cards' && (
          <div>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-cyan-400">dashboard</span>
              All Card Components ({CARDS.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CARDS.map(card => (
                <div
                  key={card.name}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    card.status === 'unused' ? 'border-white/5 opacity-50' :
                    card.status === 'duplicate' ? 'border-red-500/20' :
                    'border-white/10'
                  }`}
                  style={{ backgroundColor: `${card.color}05` }}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
                        <h3 className="text-[15px] font-black">{card.name}</h3>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${
                        card.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                        card.status === 'duplicate' ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {card.status === 'active' ? 'ACTIVE' : card.status === 'duplicate' ? 'DUPLICATE' : 'UNUSED'}
                      </span>
                    </div>

                    <code className="text-[10px] text-gray-500 font-mono block mb-3">{card.file}</code>
                    <p className="text-[12px] text-gray-400 mb-4">{card.purpose}</p>

                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Used in {card.usedInPages.length} pages:
                      </p>
                      {card.usedInPages.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {card.usedInPages.map(p => (
                            <code key={p} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5">{p}</code>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-red-400 font-bold">Not used anywhere</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            VIEW: Card Gallery — Pixel-perfect static mockups
        ════════════════════════════════════════════════════════════════════ */}
        {view === 'gallery' && (
          <div>
            <h2 className="text-xl font-black mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-pink-400">palette</span>
              Card Gallery — Visual Comparison
            </h2>
            <p className="text-sm text-gray-400 mb-8">Static replicas of every card design in the codebase. Compare shapes, sizes, and layouts side by side.</p>

            {/* ── 1. VehicleCard ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="text-lg font-black">VehicleCard</h3>
                <code className="text-[10px] text-gray-500 font-mono">features/ads/components/vehicle-card.tsx</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">Vertical card — صورة 16:10 مع gradient overlay، badge شرط أعلى-يمين، سعر أسفل-يمين، عنوان + metadata أسفل. مستخدم في الهوم + لاندنج السيارات + المفضلة + البائع.</p>

              {/* Badge inventory */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-blue-400">sell</span>
                  Badges Used in VehicleCard
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> جديدة / مستعملة / مجددة
                    <span className="text-[9px] text-gray-400 ml-1">(condition — top-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-orange-500" /> مطلوب
                    <span className="text-[9px] text-gray-400 ml-1">(wanted — top-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> مطلوب موظف / باحث عن عمل
                    <span className="text-[9px] text-gray-400 ml-1">(jobs — top-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> أصلي
                    <span className="text-[9px] text-gray-400 ml-1">(parts OEM — top-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> خدمة منزلية
                    <span className="text-[9px] text-gray-400 ml-1">(services — top-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="material-symbols-outlined text-[12px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> موثق
                    <span className="text-[9px] text-gray-400 ml-1">(verified — bottom-left)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 12,500 ر.ع
                    <span className="text-[9px] text-gray-400 ml-1">(price — bottom-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="material-symbols-outlined text-[12px] text-white">favorite</span> مفضلة
                    <span className="text-[9px] text-gray-400 ml-1">(Material icon — top-left)</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold border border-blue-500/20">للبيع</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 font-bold border border-teal-500/20">إيجار</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold border border-orange-500/20">مطلوب</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 font-bold border border-rose-500/20">وظيفة</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 font-bold border border-purple-500/20">خدمة</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-bold border border-orange-500/20">قطعة</span>
                  <span className="text-[9px] text-gray-500 self-center">(listing type labels — body text)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" dir="rtl">
                {/* Sale car */}
                <div className="rounded-xl overflow-hidden bg-white border border-gray-200 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                  <div className="relative" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-blue-400/50">directions_car</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                    <button className="absolute top-1.5 left-1.5 w-7 h-7 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px] text-white drop-shadow">favorite</span>
                    </button>
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black/55 backdrop-blur-sm text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      جديدة
                    </span>
                    <span className="absolute bottom-1.5 left-1.5 text-blue-500 drop-shadow">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </span>
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-black/55 backdrop-blur-sm text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        12,500 ر.ع
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <h3 className="text-[13px] font-black leading-snug text-gray-900 line-clamp-1">تويوتا كامري 2024 GL</h3>
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-gray-500">
                      <span className="font-bold text-blue-600">للبيع</span>
                      <span className="text-gray-300">·</span>
                      <span>منذ 3 ساعات</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-px"><span className="material-symbols-outlined text-[11px]">location_on</span>مسقط</span>
                    </div>
                  </div>
                </div>

                {/* Rental car */}
                <div className="rounded-xl overflow-hidden bg-white border border-gray-200 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                  <div className="relative" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-teal-400/50">car_rental</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black/55 backdrop-blur-sm text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                      مستعملة
                    </span>
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-black/55 backdrop-blur-sm text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        15 ر.ع/يوم
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <h3 className="text-[13px] font-black leading-snug text-gray-900 line-clamp-1">هيونداي أكسنت 2023 إيجار يومي</h3>
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-gray-500">
                      <span className="font-bold text-teal-500">إيجار</span>
                      <span className="text-gray-300">·</span>
                      <span>منذ يوم</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-px"><span className="material-symbols-outlined text-[11px]">location_on</span>صلالة</span>
                    </div>
                  </div>
                </div>

                {/* Parts */}
                <div className="rounded-xl overflow-hidden bg-white border border-gray-200 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                  <div className="relative" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-orange-400/50">settings</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black/55 backdrop-blur-sm text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      أصلي
                    </span>
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-black/55 backdrop-blur-sm text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        45 ر.ع
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <h3 className="text-[13px] font-black leading-snug text-gray-900 line-clamp-1">فلتر زيت تويوتا أصلي</h3>
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-gray-500">
                      <span className="font-bold text-orange-500">قطعة</span>
                      <span className="text-gray-300">·</span>
                      <span>منذ 5 أيام</span>
                    </div>
                  </div>
                </div>

                {/* Job */}
                <div className="rounded-xl overflow-hidden bg-white border border-gray-200 group hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
                  <div className="relative" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-100 to-pink-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-rose-400/50">work</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-black/55 backdrop-blur-sm text-white">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      مطلوب موظف
                    </span>
                    <div className="absolute bottom-1.5 right-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-black bg-black/55 backdrop-blur-sm text-white">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        350 ر.ع/شهر
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex flex-col gap-1.5">
                    <h3 className="text-[13px] font-black leading-snug text-gray-900 line-clamp-1">مطلوب سائق نقل ثقيل</h3>
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-gray-500">
                      <span className="font-bold text-rose-500">وظيفة</span>
                      <span className="text-gray-300">·</span>
                      <span>منذ ساعة</span>
                      <span className="text-gray-300">·</span>
                      <span className="flex items-center gap-px"><span className="material-symbols-outlined text-[11px]">location_on</span>صحار</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── 2. ListingCard ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <h3 className="text-lg font-black">ListingCard</h3>
                <code className="text-[10px] text-gray-500 font-mono">features/listings/components/ListingCard.tsx</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">Horizontal card — صورة يمين 280px مع thumbnail strip + content يسار فيه سعر أحمر كبير + detail chips + أزرار (اتصال/شات/واتساب). مستخدم في كل صفحات Browse.</p>

              {/* Badge inventory */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-purple-400">sell</span>
                  Badges Used in ListingCard
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-white font-bold bg-red-500 border border-red-400/30">
                    ★ للبيع
                    <span className="text-[9px] text-red-200 ml-1">(primaryBadge — red ribbon top-start)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] text-white font-bold bg-emerald-500">
                    مستعملة / جديدة
                    <span className="text-[9px] text-emerald-200 ml-1">(secondaryBadge — pill top-end)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    ✓ موثق
                    <span className="text-[9px] text-sky-400 ml-1">(trust capsule)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    قابل للتفاوض
                    <span className="text-[9px] text-amber-400 ml-1">(trust capsule)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-red-400 font-bold border border-white/10 bg-white/5">
                    ♡ Lucide Heart
                    <span className="text-[9px] text-gray-400 ml-1">(fav — white circle top-end)</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-700 text-[11px] font-semibold text-gray-200">2022</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-700 text-[11px] font-semibold text-gray-200">45,000 كم</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-700 text-[11px] font-semibold text-gray-200">بنزين</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-700 text-[11px] font-semibold text-gray-200">أوتوماتيك</span>
                  <span className="text-[9px] text-gray-500 self-center">(detail chips — pill style)</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-sky-900/30 border border-sky-700/30 text-[11px] font-semibold text-sky-400">📞 اتصال</span>
                  <span className="px-3 py-1.5 rounded-lg bg-orange-900/30 border border-orange-700/30 text-[11px] font-semibold text-orange-400">💬 محادثة</span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-700/30 text-[11px] font-semibold text-emerald-400">واتساب</span>
                  <span className="text-[9px] text-gray-500 self-center">(action buttons — bottom)</span>
                </div>
              </div>

              <div className="flex flex-col gap-4" dir="rtl">
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all group max-w-[700px]">
                  {/* Image */}
                  <div className="relative flex-shrink-0 w-[280px] flex flex-col bg-gray-100">
                    <div className="relative flex-1 min-h-[165px] overflow-hidden bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-white shadow-sm flex items-center justify-center border border-gray-200">
                        <span className="material-symbols-outlined text-[32px] text-blue-400/60">directions_car</span>
                      </div>
                      <span className="absolute top-0 start-0 flex items-center gap-1 px-2.5 py-1 bg-red-500 text-white text-[11px] font-bold rounded-ee-xl">
                        ★ للبيع
                      </span>
                      <button className="absolute top-2 end-2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center">
                        <span className="text-gray-400 text-xs">♡</span>
                      </button>
                    </div>
                    {/* Thumbnails */}
                    <div className="flex h-[50px] border-t border-gray-200">
                      <div className="w-1/3 bg-gray-200 border-s border-gray-200" />
                      <div className="w-1/3 bg-gray-300 border-s border-gray-200" />
                      <div className="w-1/3 bg-gray-200 border-s border-gray-200 flex items-center justify-center">
                        <span className="text-[11px] font-bold text-gray-500">+5</span>
                      </div>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col p-3.5 gap-2 overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[20px] font-black text-red-500 leading-none">
                        8,500
                        <span className="text-[11px] font-normal text-gray-400 mr-1.5">ر.ع</span>
                      </p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-500">مستعملة</span>
                    </div>
                    <h2 className="text-[13px] font-semibold text-gray-900 line-clamp-1">نيسان باترول 2022 V6 فل كامل</h2>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['2022', '45,000 كم', 'بنزين', 'أوتوماتيك'].map(d => (
                        <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-[11px] font-semibold text-gray-700">{d}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[10px] font-semibold text-sky-700">✓ موثق</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-semibold text-amber-700">قابل للتفاوض</span>
                    </div>
                    <div className="flex-1" />
                    <hr className="border-gray-200" />
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <span>📍</span>
                      <span>مسقط</span>
                      <span className="mx-1 text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">منذ 3 ساعات</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200 text-[12px] font-semibold text-sky-700">📞 اتصال</span>
                      <span className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-[12px] font-semibold text-orange-700">💬 محادثة</span>
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[12px] font-semibold text-emerald-700">واتساب</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── 3. UnifiedCard ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                <h3 className="text-lg font-black">UnifiedCard</h3>
                <code className="text-[10px] text-gray-500 font-mono">features/listings/components/UnifiedCard.tsx</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">Vertical card — شبيه بـ VehicleCard لكن ببنية مختلفة: badges مختلفة + details chips + location + سعر أسفل. مستخدم في البحث العام + مفضلة + بائع.</p>

              {/* Badge inventory */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-cyan-400">sell</span>
                  Badges Used in UnifiedCard
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> للبيع / إيجار / مطلوب
                    <span className="text-[9px] text-gray-400 ml-1">(primaryBadge — dot+blur top-right)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur text-[11px] text-white font-bold border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> جديدة / مستعملة
                    <span className="text-[9px] text-gray-400 ml-1">(secondaryBadge — dot+blur top-left)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-red-400 font-bold border border-white/10 bg-white/5">
                    ♡ Lucide Heart
                    <span className="text-[9px] text-gray-400 ml-1">(fav — on-hover circle top-left)</span>
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-300">🔧 حفار</span>
                  <span className="text-gray-500">·</span>
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-300">⏱ 3,200 ساعة</span>
                  <span className="text-gray-500">·</span>
                  <span className="flex items-center gap-0.5 text-[11px] text-gray-300">👷 مع مشغل</span>
                  <span className="text-[9px] text-gray-500 self-center ml-2">(detail chips — icon+text inline)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" dir="rtl">
                <div className="rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-md hover:-translate-y-px transition-all cursor-pointer group">
                  <div className="relative bg-gray-100" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-purple-400/50">directions_car</span>
                    </div>
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      للبيع
                    </span>
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      جديدة
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-medium text-gray-900 line-clamp-1 mb-1.5">تويوتا لاندكروزر 2024</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5">
                      <span>2024</span>
                      <span className="text-gray-300">·</span>
                      <span>0 كم</span>
                      <span className="text-gray-300">·</span>
                      <span>بنزين</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-gray-400 text-[10px]">📍</span>
                      <span className="text-[11px] text-gray-400">مسقط</span>
                    </div>
                    <hr className="border-gray-200 mb-2" />
                    <span className="text-[14px] font-semibold text-gray-900">
                      28,000 <span className="text-[11px] font-normal text-gray-400">ر.ع</span>
                    </span>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden bg-white border border-gray-200 hover:shadow-md hover:-translate-y-px transition-all cursor-pointer group">
                  <div className="relative bg-gray-100" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-cyan-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-3xl text-teal-400/50">construction</span>
                    </div>
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      إيجار
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-medium text-gray-900 line-clamp-1 mb-1.5">حفارة كاتربيلر 320</h3>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5">
                      <span>2020</span>
                      <span className="text-gray-300">·</span>
                      <span>3,200 ساعة</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-gray-400 text-[10px]">📍</span>
                      <span className="text-[11px] text-gray-400">صحار</span>
                    </div>
                    <hr className="border-gray-200 mb-2" />
                    <span className="text-[14px] font-semibold text-gray-900">
                      85 <span className="text-[11px] font-normal text-gray-400">ر.ع / يوم</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── 4. EquipmentCard (inline) — DELETED ── */}
            <section className="mb-12 opacity-50">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <h3 className="text-lg font-black line-through">EquipmentCard (inline)</h3>
                <code className="text-[10px] text-gray-500 font-mono line-through">equipment/equipment-shell.tsx (local fn)</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">DELETED</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">→ Replaced by UnifiedCard</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">Vertical card — تم حذفه واستبداله بـ UnifiedCard + normalizeEquipment. كان مكرر ومختلف في التصميم (amber price، أيقونات Material مختلفة).</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4" dir="rtl">
                <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                  <div className="relative" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-yellow-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-amber-400/40">construction</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">للبيع</span>
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-600 text-white shadow-sm">25,000 OMR</span>
                    </div>
                    <span className="absolute bottom-2 left-2 text-blue-500 drop-shadow">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-bold text-gray-900 line-clamp-1 mb-1">رافعة تادانو 50 طن 2021</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5">📍 مسقط</span>
                      <span className="flex items-center gap-0.5">👁 245</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 group">
                  <div className="relative" style={{ aspectRatio: '16/10' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-200 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-emerald-400/40">front_loader</span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/60 backdrop-blur-sm text-white">إيجار</span>
                    <div className="absolute bottom-2 right-2">
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-600 text-white shadow-sm">120 OMR/يوم</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="text-[13px] font-bold text-gray-900 line-clamp-1 mb-1">لودر كاتربيلر 950H</h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5">📍 صلالة</span>
                      <span className="flex items-center gap-0.5">👁 89</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── 5. SellerCard ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-pink-500" />
                <h3 className="text-lg font-black">SellerCard</h3>
                <code className="text-[10px] text-gray-500 font-mono">components/seller-card.tsx</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">بطاقة معلومات البائع — أفاتار + اسم + نجوم + تاريخ انضمام + أزرار تواصل. مستخدم في صفحات التفاصيل والحجوزات.</p>

              {/* Badge inventory */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-pink-400">sell</span>
                  Badges Used in SellerCard
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-white font-bold border border-white/10 bg-white/5">
                    <span className="material-symbols-outlined text-[12px] text-blue-500" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span> موثق
                    <span className="text-[9px] text-gray-400 ml-1">(next to name)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-amber-400 font-bold border border-white/10 bg-white/5">
                    ⭐ 4.8 (23 تقييم)
                    <span className="text-[9px] text-gray-400 ml-1">(rating)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-gray-300 font-bold border border-white/10 bg-white/5">
                    عضو منذ 2023
                    <span className="text-[9px] text-gray-400 ml-1">(join date)</span>
                  </span>
                </div>
              </div>

              <div className="max-w-sm" dir="rtl">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">م</div>
                    <div>
                      <div className="flex items-center gap-1">
                        <h4 className="text-[14px] font-bold text-gray-900">محمد الهاشمي</h4>
                        <span className="material-symbols-outlined text-blue-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <span>⭐ 4.8</span>
                        <span>(23 تقييم)</span>
                        <span>·</span>
                        <span>عضو منذ 2023</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 text-center px-3 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-bold">محادثة</span>
                    <span className="flex-1 text-center px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-bold">اتصال</span>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── 6. BookingCard ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <h3 className="text-lg font-black">BookingCard</h3>
                <code className="text-[10px] text-gray-500 font-mono">components/booking-card.tsx</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
              </div>
              <p className="text-[12px] text-gray-400 mb-4">كارت الحجز — يعرض نوع المركبة + التواريخ + الحالة + السعر. مستخدم في صفحات الحجوزات.</p>

              {/* Badge inventory */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-400">sell</span>
                  Badges Used in BookingCard
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">مؤكد</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700">قيد الانتظار</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700">ملغي</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">مكتمل</span>
                  <span className="text-[9px] text-gray-500 self-center">(status badge — top-end)</span>
                </div>
              </div>

              <div className="max-w-md" dir="rtl">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-600 text-lg">directions_car</span>
                      </div>
                      <div>
                        <h4 className="text-[13px] font-bold text-gray-900">تويوتا كامري 2024</h4>
                        <p className="text-[11px] text-gray-400">حجز #BK-2847</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">مؤكد</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-gray-500 mb-3">
                    <span>📅 15 أبريل → 20 أبريل</span>
                    <span>5 أيام</span>
                  </div>
                  <hr className="border-gray-200 mb-3" />
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-bold text-gray-900">75 ر.ع</span>
                    <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold">عرض التفاصيل</span>
                  </div>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── 7. ReviewCard ── */}
            <section className="mb-12">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-3 h-3 rounded-full bg-orange-500" />
                <h3 className="text-lg font-black">ReviewCard</h3>
                <code className="text-[10px] text-gray-500 font-mono">components/reviews/review-card.tsx</code>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">ACTIVE</span>
              </div>

              {/* Badge inventory */}
              <div className="mb-5 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-orange-400">sell</span>
                  Badges Used in ReviewCard
                </h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-amber-400 font-bold border border-white/10 bg-white/5">
                    ⭐⭐⭐⭐⭐
                    <span className="text-[9px] text-gray-400 ml-1">(star rating — 1-5)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-gray-300 font-bold border border-white/10 bg-white/5">
                    منذ أسبوع
                    <span className="text-[9px] text-gray-400 ml-1">(relative time)</span>
                  </span>
                </div>
              </div>

              <div className="max-w-md" dir="rtl">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-bold">أ</div>
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-900">أحمد السعيدي</h4>
                      <div className="flex items-center gap-1 text-[11px]">
                        {'⭐'.repeat(5)}
                        <span className="text-gray-400 mr-1">منذ أسبوع</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-600 leading-relaxed">تجربة ممتازة مع البائع، السيارة كانت بالضبط كما في الوصف والصور. التسليم كان سريع والتعامل راقي جداً. أنصح بالتعامل معه.</p>
                </div>
              </div>
            </section>

            <hr className="border-white/5 mb-12" />

            {/* ── Summary comparison ── */}
            <section className="mb-12">
              <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">compare</span>
                Visual Comparison — Listing Cards
              </h3>
              <p className="text-sm text-gray-400 mb-6">The 3 main listing cards side by side. Notice the inconsistencies in layout, badges, pricing, and typography.</p>

              <div className="overflow-x-auto pb-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-[11px] text-gray-400 font-bold uppercase w-[180px]">Property</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase" style={{ color: '#3b82f6' }}>VehicleCard</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase" style={{ color: '#8b5cf6' }}>ListingCard</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase" style={{ color: '#06b6d4' }}>UnifiedCard</th>
                      <th className="px-4 py-3 text-center text-[11px] font-bold uppercase" style={{ color: '#ef4444' }}>EquipmentCard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      ['Layout', 'Vertical', 'Horizontal', 'Vertical', 'Vertical'],
                      ['Image Ratio', '16:10', '280px fixed', '16:10', '16:10'],
                      ['Corner Radius', 'rounded-xl', 'rounded-xl', 'rounded-xl', 'rounded-2xl'],
                      ['Price Position', 'Image overlay', 'Content area (red)', 'Below divider', 'Image overlay (amber)'],
                      ['Badge System', 'Material dot + blur', 'Red ribbon + pills', 'Dual blur badges', 'Black blur badge'],
                      ['Favorite', 'Material icon', 'Lucide Heart', 'Lucide Heart (hover)', 'None'],
                      ['Thumbnails', 'None', '3 + overlay count', 'None', 'None'],
                      ['Action Buttons', 'None', 'Call + Chat + WA', 'None', 'None'],
                      ['Mobile Scaling', 'None', 'Transform scale', 'None', 'None'],
                      ['Icons', 'Material Symbols', 'Lucide', 'Lucide', 'Material Symbols'],
                    ].map(([prop, ...vals]) => (
                      <tr key={prop} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2 text-[12px] text-gray-400 font-semibold">{prop}</td>
                        {vals.map((v, i) => (
                          <td key={i} className="px-4 py-2 text-center text-[11px] text-gray-300">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <h4 className="text-[13px] font-bold text-amber-400 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">warning</span>
                  Key Inconsistencies
                </h4>
                <ul className="text-[12px] text-amber-300/80 space-y-1 list-disc list-inside">
                  <li><strong>Icon system:</strong> VehicleCard + EquipmentCard use Material Symbols, while ListingCard + UnifiedCard use Lucide</li>
                  <li><strong>Price styling:</strong> 4 different approaches — overlay badge, red text, below divider, amber badge</li>
                  <li><strong>Favorite button:</strong> 3 different implementations — Material icon, Lucide filled, Lucide on-hover</li>
                  <li><strong>Border radius:</strong> Mostly rounded-xl but EquipmentCard uses rounded-2xl</li>
                  <li><strong>Layout:</strong> ListingCard is horizontal while all others are vertical</li>
                </ul>
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
}
