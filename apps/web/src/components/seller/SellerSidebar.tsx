interface SellerSidebarProps {
  onMessage: () => void
  onCall?: () => void
  onShare: () => void
  isMessagePending?: boolean
}

export function SellerSidebar({ onMessage, onCall, onShare, isMessagePending }: SellerSidebarProps) {
  return (
    <aside className="hidden md:block w-72 flex-shrink-0">
      <div className="sticky top-20 space-y-4">
        {/* CTA Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-on-surface text-sm">تواصل مع البائع</h3>

          <button
            onClick={onMessage}
            disabled={isMessagePending}
            className="w-full h-11 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            إرسال رسالة
          </button>

          {onCall && (
            <button
              onClick={onCall}
              className="w-full h-11 rounded-xl border-2 border-primary/30 text-primary text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors hover:bg-primary/5"
            >
              💬 التواصل واتساب
            </button>
          )}

          <button
            onClick={onShare}
            className="w-full h-11 rounded-xl bg-surface-container text-on-surface-variant text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-lg">share</span>
            مشاركة الصفحة
          </button>

          <div className="border-t border-outline-variant/15 pt-3">
            <p className="text-on-surface-variant text-xs text-center">
              🟢 متاح الآن — يرد خلال أقل من ساعة
            </p>
          </div>
        </div>

        {/* Report */}
        <button className="w-full text-error text-xs py-2 hover:underline flex items-center justify-center gap-1">
          <span className="material-symbols-outlined text-sm">flag</span>
          الإبلاغ عن هذا البائع
        </button>
      </div>
    </aside>
  )
}
