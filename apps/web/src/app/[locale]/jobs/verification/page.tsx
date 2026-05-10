'use client';
import React, { useState, useRef } from 'react';
import { AuthGuard } from '@/components/auth-guard';
import { CheckCircle, Clock, X, AlertCircle } from 'lucide-react';
import { useMyVerificationStatus, useSubmitVerification, useMyDriverProfile } from '@/lib/api';
import { useUploadImage } from '@/lib/api/uploads';
import { useToast } from '@/components/toast';
import { Link } from '@/i18n/navigation';
import { STRINGS } from '@/features/jobs/constants';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  label: string
  icon: string
  file: File | null
  onFileChange: (file: File | null) => void
}

function UploadZone({ label, icon, file, onFileChange }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f: File) => {
    onFileChange(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
        dragging ? 'border-brand-amber bg-amber-50': file ?'border-green-400 bg-green-50': 'border-outline-variant hover:border-outline hover:bg-surface'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      {file ? (
        <div className="flex flex-col items-center gap-2">
          <CheckCircle size={32} className="text-green-500" />
          <p className="text-sm font-bold text-green-700">تم رفع الملف بنجاح</p>
          <p className="text-xs text-green-600">{file.name}</p>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onFileChange(null) }}
            className="flex items-center gap-1 text-xs text-error hover:underline"
          >
            <X size={12} />
            إزالة
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl">{icon}</div>
          <p className="font-bold text-sm text-on-surface">{label}</p>
          <p className="text-xs text-on-surface-variant">اختر ملف أو اسحب هنا</p>
          <p className="text-xs text-outline">JPG, PNG — حد أقصى 5MB</p>
        </div>
      )}
    </div>
  )
}

function VerificationContent() {
  const { addToast } = useToast()
  const { data: profile, isLoading: profileLoading } = useMyDriverProfile()
  const { data: verifications, isLoading: verLoading } = useMyVerificationStatus()
  const submitVerification = useSubmitVerification()
  const uploadImage = useUploadImage()

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [idFile, setIdFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')

  const loading = profileLoading || verLoading
  const existingStatus = verifications?.[0] ?? null

  const handleSubmit = async () => {
    if (!licenseFile || !idFile) {
      addToast('error', 'يرجى رفع صورة الرخصة وصورة الهوية')
      return
    }
    setSubmitting(true)
    try {
      const [licenseResult, idResult] = await Promise.all([
        uploadImage.mutateAsync(licenseFile),
        uploadImage.mutateAsync(idFile),
      ])
      await submitVerification.mutateAsync({
        licenseImageUrl: licenseResult.url,
        idImageUrl: idResult.url,
        notes: notes || undefined,
      })
      addToast('success', 'تم إرسال طلب التوثيق بنجاح')
      setSubmitted(true)
    } catch {
      addToast('error', STRINGS.ERROR_GENERIC)
    } finally {
      setSubmitting(false)
    }
  }

  const statusConfig = {
    PENDING: { icon: <Clock size={20} className="text-amber-500" />, label: 'طلبك قيد المراجعة', desc: 'سيتم الرد خلال 24 ساعة', color: 'bg-amber-50 border-amber-200 text-amber-700' },
    APPROVED: { icon: <CheckCircle size={20} className="text-green-500" />, label: 'تم توثيق حسابك', desc: 'حسابك موثّق الآن', color: 'bg-green-50 border-green-200 text-green-700' },
    REJECTED: { icon: <AlertCircle size={20} className="text-error" />, label: 'تم رفض الطلب', desc: existingStatus?.rejectionReason ?? 'يرجى إعادة المحاولة', color: 'bg-red-50 border-red-200 text-error' },
  }

  if (!loading && !profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} className="text-error" />
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface mb-2">لا يوجد بروفايل سائق</h1>
        <p className="text-sm text-on-surface-variant mb-6">يجب إنشاء بروفايل سائق أولاً لطلب التوثيق</p>
        <Link href="/jobs/onboarding" className="btn-amber inline-flex px-6 py-3 text-sm font-bold">
          إنشاء بروفايل
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-brand-amber" />
        </div>
        <h1 className="text-2xl font-extrabold text-on-surface mb-2">توثيق حسابك كسائق</h1>
        <p className="text-sm text-on-surface-variant">ارفع مستنداتك للحصول على شارة الموثّق</p>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-surface-dim rounded-2xl" />
          <div className="h-32 bg-surface-dim rounded-2xl" />
        </div>
      ) : existingStatus && existingStatus.status !== 'REJECTED' ? (
        /* Status Display */
        <div className={cn(
          'rounded-2xl border p-5 flex items-start gap-3',
          statusConfig[existingStatus.status]?.color
        )}>
          {statusConfig[existingStatus.status]?.icon}
          <div>
            <p className="font-bold text-sm">{statusConfig[existingStatus.status]?.label}</p>
            <p className="text-xs mt-0.5 opacity-80">{statusConfig[existingStatus.status]?.desc}</p>
          </div>
        </div>
      ) : (
        /* Upload Form */
        <div className="space-y-4">
          {submitted && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
              <Clock size={18} className="text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-700">تم إرسال طلبك بنجاح — سيتم الرد خلال 24 ساعة</p>
            </div>
          )}

          <UploadZone
            label="صورة الرخصة"
            icon="📄"
            file={licenseFile}
            onFileChange={setLicenseFile}
          />

          <UploadZone
            label="صورة الهوية الوطنية"
            icon="🪪"
            file={idFile}
            onFileChange={setIdFile}
          />

          <div>
            <label className="block text-sm font-bold text-on-surface mb-1.5">
              ملاحظات إضافية — اختياري
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="input-base text-sm w-full resize-none"
              placeholder="أي معلومات إضافية تريد إضافتها..."
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || submitted}
            className="btn-amber w-full py-3 text-base font-bold disabled:opacity-60"
          >
            {submitting ? STRINGS.LOADING : 'إرسال طلب التوثيق'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function VerificationPage() {
  return (
    <AuthGuard>
      <VerificationContent />
    </AuthGuard>
  )
}
