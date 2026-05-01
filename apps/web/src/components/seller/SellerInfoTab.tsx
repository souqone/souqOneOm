interface SellerInfoTabProps {
  seller: {
    memberSince: string
    governorate?: string | null
    phone?: string | null
    isVerified: boolean
    bio?: string | null
  }
}

export function SellerInfoTab({ seller }: SellerInfoTabProps) {
  const rows: { icon: string; label: string; value: string }[] = [
    { icon: 'calendar_month', label: 'تاريخ الانضمام', value: seller.memberSince },
    ...(seller.governorate ? [{ icon: 'location_on', label: 'الموقع', value: seller.governorate }] : []),
    ...(seller.phone
      ? [{ icon: 'check_circle', label: 'رقم الجوال', value: 'مفعل ✓' }]
      : []),
    ...(seller.isVerified
      ? [{ icon: 'verified', label: 'حالة التوثيق', value: 'حساب موثّق ✓' }]
      : []),
  ]

  return (
    <div className="space-y-6">
      {/* Info rows */}
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl divide-y divide-outline-variant/10">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3.5 px-5 py-4">
            <div className="w-9 h-9 rounded-xl bg-surface-container-high/50 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">{row.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-on-surface-variant">{row.label}</p>
              <p className="text-sm font-semibold text-on-surface">{row.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bio */}
      {seller.bio && (
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-on-surface mb-2">نبذة</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line">{seller.bio}</p>
        </div>
      )}
    </div>
  )
}
