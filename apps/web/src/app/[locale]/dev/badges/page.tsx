'use client'

import { OverlayBadge } from '@/components/ui/badges/OverlayBadge'
import { RibbonBadge } from '@/components/ui/badges/RibbonBadge'
import { StatusBadge } from '@/components/ui/badges/StatusBadge'
import { TrustBadge } from '@/components/ui/badges/TrustBadge'
import { DetailChip } from '@/components/ui/badges/DetailChip'
import { ListingTypeBadge } from '@/components/ui/badges/ListingTypeBadge'
import type { BadgeIntent } from '@/components/ui/badges/badge.config'

const ALL_INTENTS: BadgeIntent[] = [
  'primary', 'success', 'danger', 'orange', 'neutral', 'gold',
]

const INTENT_LABEL: Record<BadgeIntent, string> = {
  primary: 'أزرق (blue)',
  success: 'أخضر (green)',
  danger:  'أحمر (red)',
  orange:  'برتقالي (orange)',
  neutral: 'رمادي (gray)',
  gold:    'ذهبي (gold)',
}

export default function BadgesPreviewPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-3xl text-amber-400">sell</span>
            <h1 className="text-3xl font-black">Badge Library</h1>
          </div>
          <p className="text-gray-400 text-sm">
            مكتبة البادجات الموحدة — 7 أنواع تغطي كل استخدامات الموقع. 6 ألوان: أزرق · أخضر · أحمر · برتقالي · رمادي · ذهبي.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400 font-mono">components/ui/badges/</span>
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 font-bold">7 Components</span>
            <span className="text-[10px] px-2 py-1 rounded bg-blue-500/15 text-blue-400 font-bold">6 Intents</span>
            <span className="text-[10px] px-2 py-1 rounded bg-orange-500/15 text-orange-400 font-bold">3 Sizes</span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            1. OverlayBadge
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeader
            number={1}
            title="OverlayBadge"
            file="OverlayBadge.tsx"
            desc="للاستخدام فوق الصور — خلفية blur سوداء مع نقطة ملونة + نص. يستبدل كل الـ inline overlay badges في الكروت والـ showcases."
            color="text-blue-400"
          />

          {/* All intents */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">All Intents (with dot)</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_INTENTS.map((intent) => (
                <OverlayBadge key={intent} label={INTENT_LABEL[intent]} intent={intent} size="sm" />
              ))}
            </div>
          </div>

          {/* Without dot */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Without Dot</h4>
            <div className="flex flex-wrap gap-2">
              <OverlayBadge label="للبيع" intent="primary" dot={false} size="sm" />
              <OverlayBadge label="إيجار" intent="success" dot={false} size="sm" />
              <OverlayBadge label="25,000 ر.ع" intent="primary" dot={false} size="sm" />
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Sizes</h4>
            <div className="flex items-end gap-3">
              <div className="text-center">
                <OverlayBadge label="xs" intent="primary" size="xs" />
                <p className="text-[9px] text-gray-500 mt-1">xs</p>
              </div>
              <div className="text-center">
                <OverlayBadge label="sm" intent="success" size="sm" />
                <p className="text-[9px] text-gray-500 mt-1">sm</p>
              </div>
              <div className="text-center">
                <OverlayBadge label="md" intent="orange" size="md" />
                <p className="text-[9px] text-gray-500 mt-1">md</p>
              </div>
              <div className="text-center">
                <OverlayBadge label="responsive" intent="danger" size="responsive" />
                <p className="text-[9px] text-gray-500 mt-1">responsive (default)</p>
              </div>
            </div>
          </div>

          {/* On image preview */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">On Image (Realistic Preview)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* Car sale */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-blue-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-blue-400/50">directions_car</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 right-2">
                  <OverlayBadge label="جديدة" intent="success" size="sm" />
                </div>
                <div className="absolute bottom-2 right-2">
                  <OverlayBadge label="12,500 ر.ع" intent="primary" size="sm" />
                </div>
              </div>

              {/* Equipment rent */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-yellow-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-amber-400/50">construction</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 right-2">
                  <OverlayBadge label="إيجار" intent="success" size="sm" />
                </div>
                <div className="absolute top-2 left-2">
                  <OverlayBadge label="مستعملة" intent="neutral" size="sm" />
                </div>
                <div className="absolute bottom-2 right-2">
                  <OverlayBadge label="85 ر.ع / يوم" intent="primary" size="sm" />
                </div>
              </div>

              {/* Job */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-pink-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-rose-400/50">work</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 right-2">
                  <OverlayBadge label="مطلوب موظف" intent="success" size="sm" />
                </div>
                <div className="absolute bottom-2 right-2">
                  <OverlayBadge label="350 ر.ع / شهر" intent="primary" size="sm" />
                </div>
              </div>
            </div>
          </div>

          <CodeBlock>{`<OverlayBadge label="للبيع" intent="primary" />
<OverlayBadge label="جديدة" intent="success" />
<OverlayBadge label="12,500 ر.ع" intent="primary" dot={false} size="md" />`}</CodeBlock>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            2. RibbonBadge
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeader
            number={2}
            title="RibbonBadge"
            file="RibbonBadge.tsx"
            desc="شريط ملتصق بزاوية الصورة — بدون margin، زاوية واحدة مدورة. يستبدل ListingCard red ribbon primaryBadge."
            color="text-red-400"
          />

          {/* All intents */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">All Intents</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_INTENTS.map((intent) => (
                <RibbonBadge key={intent} label={INTENT_LABEL[intent]} intent={intent} icon="none" />
              ))}
            </div>
          </div>

          {/* Icons */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">With Icons</h4>
            <div className="flex flex-wrap gap-2">
              <RibbonBadge label="للبيع" intent="danger" icon="star" />
              <RibbonBadge label="عرض خاص" intent="orange" icon="zap" />
              <RibbonBadge label="مميز" intent="gold" icon="crown" />
              <RibbonBadge label="الأكثر طلباً" intent="orange" icon="flame" />
              <RibbonBadge label="بدون أيقونة" intent="primary" icon="none" />
            </div>
          </div>

          {/* Position */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Position: top-start vs top-end</h4>
            <div className="flex gap-2">
              <RibbonBadge label="top-start" intent="danger" position="top-start" />
              <RibbonBadge label="top-end" intent="primary" position="top-end" />
            </div>
          </div>

          {/* On image preview */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">On Image (Realistic Preview)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {/* ListingCard style */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-violet-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-indigo-400/50">directions_car</span>
                </div>
                <div className="absolute top-0 start-0">
                  <RibbonBadge label="للبيع" intent="danger" icon="star" />
                </div>
              </div>

              {/* Premium */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-yellow-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-amber-400/50">construction</span>
                </div>
                <div className="absolute top-0 start-0">
                  <RibbonBadge label="مميز" intent="gold" icon="crown" />
                </div>
              </div>

              {/* Hot */}
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-red-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-red-400/50">local_fire_department</span>
                </div>
                <div className="absolute top-0 start-0">
                  <RibbonBadge label="الأكثر طلباً" intent="orange" icon="flame" />
                </div>
              </div>
            </div>
          </div>

          <CodeBlock>{`<RibbonBadge label="للبيع" intent="danger" icon="star" />
<RibbonBadge label="مميز" intent="gold" icon="crown" />
<RibbonBadge label="عرض" intent="orange" icon="zap" position="top-end" />`}</CodeBlock>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            3. StatusBadge
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeader
            number={3}
            title="StatusBadge"
            file="StatusBadge.tsx"
            desc="بادجات الحالة — pills ملونة للحجوزات وإعلاناتي وحالات الطلبات. يستبدل كل الـ STATUS_BADGE objects المنتشرة."
            color="text-emerald-400"
          />

          {/* All intents */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">All Intents</h4>
            <div className="flex flex-wrap gap-2">
              {ALL_INTENTS.map((intent) => (
                <StatusBadge key={intent} label={INTENT_LABEL[intent]} intent={intent} />
              ))}
            </div>
          </div>

          {/* Sizes */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Sizes</h4>
            <div className="flex items-end gap-3">
              <StatusBadge label="xs" intent="success" size="xs" />
              <StatusBadge label="sm (default)" intent="success" size="sm" />
              <StatusBadge label="md" intent="success" size="md" />
            </div>
          </div>

          {/* With Material icon */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">With Material Icon</h4>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="مؤكد" intent="success" icon="check_circle" />
              <StatusBadge label="قيد الانتظار" intent="orange" icon="hourglass_top" />
              <StatusBadge label="ملغي" intent="danger" icon="cancel" />
              <StatusBadge label="نشط" intent="primary" icon="play_circle" />
              <StatusBadge label="مكتمل" intent="success" icon="task_alt" />
              <StatusBadge label="مرفوض" intent="danger" icon="block" />
            </div>
          </div>

          {/* Booking statuses */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Real World: Booking Statuses</h4>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="قيد الانتظار" intent="orange" />
                <StatusBadge label="مؤكد" intent="success" />
                <StatusBadge label="نشط" intent="primary" />
                <StatusBadge label="مكتمل" intent="success" />
                <StatusBadge label="ملغي" intent="danger" />
                <StatusBadge label="مرفوض" intent="danger" />
              </div>
            </div>
          </div>

          {/* My Listings statuses */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Real World: My Listings Statuses</h4>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex flex-wrap gap-2">
                <StatusBadge label="نشط" intent="success" />
                <StatusBadge label="قيد المراجعة" intent="orange" />
                <StatusBadge label="منتهي" intent="neutral" />
                <StatusBadge label="مسودة" intent="neutral" />
              </div>
            </div>
          </div>

          <CodeBlock>{`<StatusBadge label="مؤكد" intent="success" />
<StatusBadge label="ملغي" intent="danger" icon="cancel" />
<StatusBadge label="نشط" intent="primary" size="md" />`}</CodeBlock>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            3. TrustBadge
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeader
            number={4}
            title="TrustBadge"
            file="TrustBadge.tsx"
            desc='بادجات الثقة — variant="badge" (أيقونة + نص + خلفية) أو variant="icon" (أيقونة فقط للكروت). الموثق يستخدم Material verified الدائرية الزرقاء زي فيسبوك.'
            color="text-sky-400"
          />

          {/* Badge variant — All types */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">variant=&quot;badge&quot; — All Types</h4>
            <div className="flex flex-wrap gap-3">
              <TrustBadge type="verified" />
              <TrustBadge type="negotiable" />
              <TrustBadge type="insured" />
              <TrustBadge type="premium" />
            </div>
          </div>

          {/* Custom labels */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Custom Labels</h4>
            <div className="flex flex-wrap gap-3">
              <TrustBadge type="verified" label="بائع موثق" />
              <TrustBadge type="negotiable" label="السعر قابل للتفاوض" />
              <TrustBadge type="insured" label="تأمين شامل" />
            </div>
          </div>

          {/* Icon variant — for card overlays */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">variant=&quot;icon&quot; — Icon Only (for Card Overlays)</h4>
            <div className="flex items-end gap-6">
              <div className="text-center">
                <TrustBadge type="verified" variant="icon" size="sm" />
                <p className="text-[9px] text-gray-500 mt-1">sm (13px)</p>
              </div>
              <div className="text-center">
                <TrustBadge type="verified" variant="icon" size="md" />
                <p className="text-[9px] text-gray-500 mt-1">md (16px)</p>
              </div>
              <div className="text-center">
                <TrustBadge type="verified" variant="icon" size="lg" />
                <p className="text-[9px] text-gray-500 mt-1">lg (20px)</p>
              </div>
            </div>
          </div>

          {/* Icon on image preview */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">On Image: icon variant (bottom-left)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-sky-200 to-blue-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-blue-400/50">directions_car</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 right-2">
                  <OverlayBadge label="جديدة" intent="success" size="sm" />
                </div>
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
                  <TrustBadge type="verified" variant="icon" size="sm" />
                </div>
                <div className="absolute bottom-2 right-2">
                  <OverlayBadge label="12,500 ر.ع" intent="primary" size="sm" />
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/10' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-teal-300" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-teal-400/50">directions_bus</span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2">
                  <TrustBadge type="verified" variant="icon" size="md" />
                </div>
              </div>
            </div>
          </div>

          {/* In context — badge variant inside ListingCard body */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Real World: Badge Variant inside ListingCard Body</h4>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                <TrustBadge type="verified" />
                <TrustBadge type="negotiable" />
              </div>
            </div>
          </div>

          <CodeBlock>{`{/* Badge variant — in body / detail pages */}
<TrustBadge type="verified" />
<TrustBadge type="negotiable" />

{/* Icon variant — on card image overlays */}
<TrustBadge type="verified" variant="icon" size="sm" />
<TrustBadge type="verified" variant="icon" size="md" />`}</CodeBlock>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            4. DetailChip
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeader
            number={5}
            title="DetailChip"
            file="DetailChip.tsx"
            desc="chips التفاصيل السريعة — أيقونة + نص في pill. يستبدل الـ detail chips في ListingCard و UnifiedCard."
            color="text-amber-400"
          />

          {/* Example chips */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Cars</h4>
            <div className="flex flex-wrap gap-2">
              <DetailChip icon="Calendar" value="2024" />
              <DetailChip icon="Gauge" value="45,000 كم" />
              <DetailChip icon="Fuel" value="بنزين" />
              <DetailChip icon="Settings2" value="أوتوماتيك" />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Equipment</h4>
            <div className="flex flex-wrap gap-2">
              <DetailChip icon="Wrench" value="حفار" />
              <DetailChip icon="Clock" value="3,200 ساعة" />
              <DetailChip icon="HardHat" value="مع مشغّل" />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Buses</h4>
            <div className="flex flex-wrap gap-2">
              <DetailChip icon="Users" value="50 راكب" />
              <DetailChip icon="Bus" value="نقل عام" />
              <DetailChip icon="Calendar" value="2022" />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Jobs</h4>
            <div className="flex flex-wrap gap-2">
              <DetailChip icon="Briefcase" value="دوام كامل" />
              <DetailChip icon="Building2" value="شركة" />
              <DetailChip icon="Calendar" value="3 سنوات خبرة" />
            </div>
          </div>

          <CodeBlock>{`<DetailChip icon="Calendar" value="2024" />
<DetailChip icon="Gauge" value="45,000 كم" />
<DetailChip icon="Fuel" value="بنزين" />`}</CodeBlock>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            5. ListingTypeBadge
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <SectionHeader
            number={6}
            title="ListingTypeBadge"
            file="ListingTypeBadge.tsx"
            desc="نوع الإعلان — نص ملون فقط (بدون خلفية). يستبدل ListingBadge و HomepageBadge و VehicleCard listingTypeLabel."
            color="text-purple-400"
          />

          {/* All listing types */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Listing Types</h4>
            <div className="flex flex-wrap gap-4">
              <ListingTypeBadge type="SALE" />
              <ListingTypeBadge type="RENTAL" />
              <ListingTypeBadge type="WANTED" />
              <ListingTypeBadge type="BUS_SALE" />
              <ListingTypeBadge type="BUS_RENT" />
              <ListingTypeBadge type="EQUIPMENT_SALE" />
              <ListingTypeBadge type="EQUIPMENT_RENT" />
            </div>
          </div>

          {/* Category labels */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Category Labels</h4>
            <div className="flex flex-wrap gap-4">
              <ListingTypeBadge type="jobs" />
              <ListingTypeBadge type="services" />
              <ListingTypeBadge type="parts" />
            </div>
          </div>

          {/* In context */}
          <div className="mb-6">
            <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Real World: Inside VehicleCard Body</h4>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ListingTypeBadge type="SALE" />
                <span className="text-gray-600">·</span>
                <span>منذ 3 ساعات</span>
                <span className="text-gray-600">·</span>
                <span>📍 مسقط</span>
              </div>
              <hr className="border-white/5 my-2" />
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ListingTypeBadge type="RENTAL" />
                <span className="text-gray-600">·</span>
                <span>منذ يوم</span>
                <span className="text-gray-600">·</span>
                <span>📍 صلالة</span>
              </div>
              <hr className="border-white/5 my-2" />
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                <ListingTypeBadge type="jobs" />
                <span className="text-gray-600">·</span>
                <span>منذ ساعة</span>
                <span className="text-gray-600">·</span>
                <span>📍 صحار</span>
              </div>
            </div>
          </div>

          <CodeBlock>{`<ListingTypeBadge type="SALE" />
<ListingTypeBadge type="RENTAL" />
<ListingTypeBadge type="jobs" />
<ListingTypeBadge type="WANTED" label="مطلوب عاجل" />`}</CodeBlock>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            Color Reference
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400">palette</span>
            Color Reference — 6 Intents
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-bold">Intent</th>
                  <th className="px-3 py-2 text-center text-[11px] text-gray-400 font-bold">Overlay</th>
                  <th className="px-3 py-2 text-center text-[11px] text-gray-400 font-bold">Ribbon</th>
                  <th className="px-3 py-2 text-center text-[11px] text-gray-400 font-bold">Status</th>
                  <th className="px-3 py-2 text-center text-[11px] text-gray-400 font-bold">Type Text</th>
                  <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-bold">Use Cases</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { intent: 'primary' as const, use: 'بيع، سعر، موثق، خدمات، افتراضي' },
                  { intent: 'success' as const, use: 'جديدة، مؤكد، إيجار، نشط' },
                  { intent: 'danger' as const,  use: 'ملغي، مرفوض، وظائف، حالة سيئة' },
                  { intent: 'orange' as const,  use: 'مطلوب، قيد الانتظار، قابل للتفاوض، قطع غيار' },
                  { intent: 'neutral' as const, use: 'مستعملة، منتهي، مسودة' },
                  { intent: 'gold' as const,    use: 'مميز، معلن مدفوع' },
                ].map(({ intent, use }) => (
                  <tr key={intent} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 text-[12px] text-gray-300 font-mono font-bold">{intent}</td>
                    <td className="px-3 py-2.5 text-center"><OverlayBadge label={intent} intent={intent} size="sm" /></td>
                    <td className="px-3 py-2.5 text-center"><RibbonBadge label={intent} intent={intent} icon="none" /></td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge label={intent} intent={intent} /></td>
                    <td className="px-3 py-2.5 text-center"><ListingTypeBadge type="SALE" intent={intent} label={intent} /></td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-500">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            Migration Map
           ════════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <h2 className="text-xl font-black mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-400">swap_horiz</span>
            Migration Map — Old → New
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-bold">Old Component / Pattern</th>
                  <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-bold">Status</th>
                  <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-bold">New Replacement</th>
                  <th className="px-3 py-2 text-right text-[11px] text-gray-400 font-bold">Files Affected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { old: 'components/ui/badge.tsx', status: 'UNUSED', newComp: 'StatusBadge', files: '0' },
                  { old: 'components/listing-badge.tsx', status: '1 file', newComp: 'ListingTypeBadge', files: '1' },
                  { old: 'components/homepage-badge.tsx', status: 'UNUSED', newComp: 'ListingTypeBadge', files: '0' },
                  { old: 'components/verified-badge.tsx', status: '1 file', newComp: 'TrustBadge', files: '1' },
                  { old: 'ListingCard ribbon badge', status: '1 file', newComp: 'RibbonBadge', files: '1' },
                  { old: 'VehicleCard inline badges', status: '13 files', newComp: 'OverlayBadge', files: '~6' },
                  { old: 'UnifiedCard inline badges', status: '1 file', newComp: 'OverlayBadge', files: '1' },
                  { old: 'ListingCard inline badges', status: '1 file', newComp: 'StatusBadge + TrustBadge', files: '1' },
                  { old: 'bookings STATUS_BADGE_CLS', status: '2 files', newComp: 'StatusBadge', files: '2' },
                  { old: 'my-listings STATUS_BADGE', status: '1 file', newComp: 'StatusBadge', files: '1' },
                  { old: 'showcase inline overlays', status: '3 files', newComp: 'OverlayBadge', files: '3' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 text-[11px] font-mono text-gray-300">{row.old}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        row.status === 'UNUSED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{row.status}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-mono text-emerald-400 font-bold">{row.newComp}</td>
                    <td className="px-3 py-2.5 text-[11px] text-gray-500">{row.files}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  )
}

// ── Helper Components ────────────────────────────────────────────────────────

function SectionHeader({ number, title, file, desc, color }: {
  number: number; title: string; file: string; desc: string; color: string
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className={`text-[20px] font-black ${color}`}>{number}.</span>
        <h3 className="text-lg font-black">{title}</h3>
        <code className="text-[10px] text-gray-500 font-mono">{file}</code>
      </div>
      <p className="text-[12px] text-gray-400">{desc}</p>
      <hr className="border-white/5 mt-4" />
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/10">
      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Usage</h4>
      <pre className="text-[11px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed" dir="ltr">
        {children}
      </pre>
    </div>
  )
}
