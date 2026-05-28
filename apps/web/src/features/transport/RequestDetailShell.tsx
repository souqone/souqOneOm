'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useAuth } from '@/providers/auth-provider'
import { transportApi } from './api'
import type { TransportRequest, TransportQuote } from './types'

const STATUS_FLOW = ['OPEN', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'] as const
const STATUS_ICONS: Record<string, string> = {
  OPEN: 'fiber_manual_record', QUOTED: 'local_shipping',
  ACCEPTED: 'handshake', IN_PROGRESS: 'sync', COMPLETED: 'task_alt',
}

function StatusTimeline({ status }: { status: string }) {
  const t = useTranslations('transport')
  const cur = STATUS_FLOW.indexOf(status as typeof STATUS_FLOW[number])
  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/50 mb-8 overflow-hidden">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-4 right-8 left-8 h-1 bg-surface-variant -z-10 rounded-full" />
        <div className="absolute top-4 right-8 h-1 bg-brand-amber -z-10 rounded-full transition-all duration-500"
          style={{ width: `${Math.max(0, (cur / (STATUS_FLOW.length - 1))) * (100 - 6)}%` }} />
        {STATUS_FLOW.map((s, i) => {
          const done    = i < cur
          const active  = i === cur
          return (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md text-white
                ${done || active ? 'bg-brand-amber' : 'bg-surface-container border-2 border-outline-variant text-secondary'}
                ${active ? 'ring-4 ring-brand-amber/20 shadow-[0_0_15px_rgba(232,120,30,0.5)]' : ''}`}>
                <span className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0" }}>
                  {done ? 'check' : STATUS_ICONS[s]}
                </span>
              </div>
              <span className={`text-label-md font-label-md ${active ? 'text-brand-amber font-bold' : done ? 'text-brand-navy' : 'text-secondary'}`}>
                {t(`status.${s}`)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function QuoteSubmitForm({ requestId, onSubmitted }: { requestId: string; onSubmitted: () => void }) {
  const t = useTranslations('transport')
  const [price, setPrice]     = useState('')
  const [hours, setHours]     = useState('')
  const [msg,   setMsg]       = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState<string | null>(null)
  const [priceError, setPriceError] = useState('')

  async function submit() {
    // Price validation
    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setPriceError('يرجى إدخال سعر صحيح أكبر من صفر');
      return;
    }
    setPriceError('');
    // Hours validation
    const hoursNum = hours ? parseFloat(hours) : undefined;
    if (hoursNum !== undefined && (hoursNum <= 0 || !Number.isFinite(hoursNum))) {
      setErr('عدد الساعات يجب أن يكون رقماً موجباً');
      return;
    }
    // Whitespace-only message
    const cleanMsg = msg.trim() || undefined;
    setLoading(true); setErr(null)
    try {
      await transportApi.submitQuote(requestId, {
        price: priceNum,
        estimatedHours: hoursNum,
        message: cleanMsg,
      })
      setPrice(''); setHours(''); setMsg('')
      onSubmitted()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'حدث خطأ')
    } finally { setLoading(false) }
  }

  return (
    <div className="bg-surface-container-lowest rounded-xl p-6 shadow-lg border border-brand-amber/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-brand-amber to-amber-300" />
      <h2 className="text-title-lg font-title-lg text-brand-navy font-bold mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-brand-amber">send</span>
        قدّم عرضك
      </h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-body-sm font-bold text-secondary mb-1">{t('fields.price')}</label>
          <input type="number" value={price} onChange={e => { setPrice(e.target.value); if (priceError) setPriceError(''); }}
            className={`w-full h-[40px] bg-[#fafafa] border rounded-lg px-4 text-body-md focus:ring-1 transition-all ${
              priceError ? 'border-error ring-error' : 'border-outline-variant/50 focus:border-primary focus:ring-primary'
            }`}
            placeholder="مثال: ٦٥٠" />
          {priceError && <p className="text-body-sm text-error mt-1">{priceError}</p>}
        </div>
        <div>
          <label className="block text-body-sm font-bold text-secondary mb-1">{t('fields.estimatedHours')}</label>
          <select value={hours} onChange={e => setHours(e.target.value)}
            className="form-select w-full h-[40px] bg-[#fafafa] border border-outline-variant/50 rounded-lg px-4 text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all">
            <option value="">اختر المدة</option>
            {[8, 16, 24, 48, 72].map(h => <option key={h} value={h}>{h} {t('fields.hours')}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-body-sm font-bold text-secondary mb-1">{t('fields.message')}</label>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
            className="w-full bg-[#fafafa] border border-outline-variant/50 rounded-lg p-3 text-body-md focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            placeholder="اكتب تفاصيل إضافية..." />
        </div>
        {err && <p className="text-body-sm text-error">{err}</p>}
        <button onClick={submit} disabled={loading}
          className="w-full h-[48px] rounded-xl bg-gradient-to-br from-brand-amber to-amber-600 text-white font-bold text-title-md shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60">
          {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span>
            : <><span className="material-symbols-outlined text-[20px]">arrow_back</span>إرسال العرض</>}
        </button>
      </div>
    </div>
  )
}


function QuoteCard({ quote, isOwner, onAccept, acceptLabel }: {
  quote: TransportQuote
  isOwner: boolean
  onAccept: (id: string) => void
  acceptLabel: string
}) {
  const initials = quote.carrier?.user?.displayName?.charAt(0) ?? 'م'
  return (
    <div className="bg-surface p-3 rounded-lg border border-outline-variant/30 hover:border-primary/30 transition-colors flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-title-md">
            {initials}
          </div>
          <div>
            <p className="text-body-sm font-bold text-on-surface leading-tight">
              {quote.carrier?.companyName ?? quote.carrier?.user?.displayName ?? 'مزود'}
            </p>
            <div className="flex items-center gap-1 text-brand-amber mt-0.5">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="text-[11px] font-bold">{(quote.carrier?.averageRating ?? 0).toFixed(1)}</span>
            </div>
          </div>
        </div>
        <p className="text-title-md font-bold text-brand-navy">{quote.price} ر.ع.</p>
      </div>
      {quote.message && <p className="text-body-sm text-on-surface-variant">{quote.message}</p>}
      {isOwner && quote.status === 'PENDING' && (
        <button onClick={() => onAccept(quote.id)}
          className="w-full py-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors text-body-sm font-bold border border-primary/20">
          {acceptLabel}
        </button>
      )}
    </div>
  )
}

export default function RequestDetailShell({ id }: { id: string }) {
  const t = useTranslations('transport')
  const { user } = useAuth()

  const [req,     setReq]     = useState<TransportRequest | null>(null)
  const [quotes,  setQuotes]  = useState<TransportQuote[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const [r, q] = await Promise.all([transportApi.getRequest(id), transportApi.getQuotes(id)])
      setReq(r); setQuotes(q)
    } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [id])

  async function acceptQuote(quoteId: string) {
    await transportApi.acceptQuote(quoteId)
    load()
  }

  if (loading) return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-8 pb-16">
      <div className="animate-pulse space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-surface-dim rounded-xl" />)}
      </div>
    </main>
  )

  if (!req) return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-16 text-center text-on-surface-variant">
      الطلب غير موجود
    </main>
  )

  const isOwner   = user?.id === req.userId
  const isOpen    = req.status === 'OPEN' || req.status === 'QUOTED'
  const budgetStr = req.budgetMin && req.budgetMax
    ? `${req.budgetMin} – ${req.budgetMax} ر.ع.`
    : req.budgetMin ? `من ${req.budgetMin} ر.ع.` : req.budgetMax ? `حتى ${req.budgetMax} ر.ع.` : t('fields.budgetNotSet')

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 pt-8 pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-body-sm text-secondary mb-6">
        <Link href="/transport" className="hover:text-primary transition-colors">{t('title')}</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        <Link href="/transport/browse" className="hover:text-primary transition-colors">{t('title')}</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
        <span className="text-on-surface font-bold">{t('browseTitle')}</span>
      </div>

      <StatusTimeline status={req.status} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left — main */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Route */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/50 hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-3 flex-1 bg-surface-container p-4 rounded-lg border border-outline-variant/30">
                <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div>
                  <p className="text-label-sm text-secondary mb-1">{t('fields.from')}</p>
                  <p className="text-title-md text-on-surface">{req.fromGovernorate}{req.fromCity ? `، ${req.fromCity}` : ''}</p>
                  {req.fromAddress && <p className="text-body-sm text-on-surface-variant">{req.fromAddress}</p>}
                </div>
              </div>
              <span className="material-symbols-outlined text-3xl text-secondary hidden md:block">arrow_right_alt</span>
              <div className="flex items-center gap-3 flex-1 bg-surface-container p-4 rounded-lg border border-outline-variant/30">
                <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                </div>
                <div>
                  <p className="text-label-sm text-secondary mb-1">{t('fields.to')}</p>
                  <p className="text-title-md text-on-surface">{req.toGovernorate}{req.toCity ? `، ${req.toCity}` : ''}</p>
                  {req.toAddress && <p className="text-body-sm text-on-surface-variant">{req.toAddress}</p>}
                </div>
              </div>
            </div>
            <div className="h-[200px] bg-surface-variant rounded-lg flex items-center justify-center border border-outline-variant/30">
              <span className="text-body-sm text-on-surface-variant">{t('mapUnavailable')}</span>
            </div>
          </div>

          {/* Cargo details */}
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/50 hover:shadow-md transition-all">
            <h2 className="text-title-lg text-brand-navy mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-amber">inventory_2</span>
              تفاصيل الحمولة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { icon: 'category',  label: 'نوع الخدمة', val: t(`serviceTypes.${req.serviceType}`) },
                { icon: 'scale',     label: t('fields.weight'), val: req.weightTons ? `${req.weightTons} ${t('fields.tons')}` : '—' },
                { icon: 'group',     label: t('fields.requiresHelper'), val: req.requiresHelper ? 'نعم' : 'لا' },
                { icon: 'schedule',  label: t('fields.scheduledAt'), val: req.isFlexible ? t('fields.flexible') : req.scheduledAt ? new Date(req.scheduledAt).toLocaleDateString('ar-OM-u-nu-latn') : t('fields.asap') },
              ].map(c => (
                <div key={c.label} className="bg-surface-container-low p-4 rounded-lg border border-outline-variant/30 flex flex-col items-center text-center">
                  <span className="material-symbols-outlined text-secondary mb-2">{c.icon}</span>
                  <span className="text-label-sm text-secondary">{c.label}</span>
                  <span className="text-body-md font-bold text-on-surface mt-1">{c.val}</span>
                </div>
              ))}
            </div>
            <div className="bg-surface p-5 rounded-lg border-r-4 border-brand-amber">
              <h3 className="text-body-md font-bold text-brand-navy mb-2">{t('fields.cargo')}:</h3>
              <p className="text-body-md text-secondary leading-relaxed">{req.cargoDescription}</p>
              {req.notes && <p className="text-body-sm text-on-surface-variant mt-2">{req.notes}</p>}
            </div>
          </div>

          {/* Budget + requester */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/50 flex flex-col justify-center items-center text-center">
              <h2 className="text-title-md text-secondary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">payments</span>
                {t('steps.timing')}
              </h2>
              <div className="text-hero-md text-brand-navy font-black mb-3">{budgetStr}</div>
              <span className="bg-primary-container/10 text-primary px-3 py-1 rounded-full text-label-sm font-bold">مرن في التفاوض</span>
            </div>
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/50 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
              </div>
              <h3 className="text-title-md text-brand-navy font-bold mb-1 truncate max-w-[120px]">
                {req.user?.displayName ?? req.user?.username}
              </h3>
              <p className="text-body-sm text-secondary flex items-center gap-1 justify-center">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {t('memberSince')} {new Date(req.createdAt).getFullYear()}
              </p>
            </div>
          </div>

          {/* Owner cancel */}
          {isOwner && (req.status === 'OPEN' || req.status === 'QUOTED') && (
            <button
              onClick={async () => { await transportApi.cancelRequest(req.id); load() }}
              className="text-error text-body-md hover:underline self-start"
            >
              {t('actions.cancelRequest')}
            </button>
          )}
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="sticky top-[120px] flex flex-col gap-6">
            {/* Quote form — only non-owner + open */}
            {!isOwner && isOpen && (
              <QuoteSubmitForm requestId={req.id} onSubmitted={load} />
            )}

            {/* Quotes received */}
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-title-md text-brand-navy font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">inbox</span>
                  {t('quotesReceived')}
                </h2>
                <span className="bg-surface-variant text-brand-navy w-6 h-6 rounded-full flex items-center justify-center text-label-sm font-bold">
                  {quotes.length}
                </span>
              </div>
              {quotes.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant text-center py-4">{t('empty.quotes')}</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {quotes.slice(0, 5).map(q => (
                    <QuoteCard key={q.id} quote={q} isOwner={isOwner} onAccept={acceptQuote} acceptLabel={t('actions.acceptQuote')} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
