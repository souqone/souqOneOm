'use client';

import { Loader2, AlertCircle } from 'lucide-react';

export function TransportPageLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-[var(--color-brand-navy)]" />
        <p className="text-sm text-[var(--color-on-surface-muted)]">جارٍ التحميل...</p>
      </div>
    </div>
  );
}

interface TransportPageErrorProps {
  message: string;
  onRetry?: () => void;
}

export function TransportPageError({ message, onRetry }: TransportPageErrorProps) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center" dir="rtl">
      <div className="flex flex-col items-center gap-4 text-center px-4">
        <AlertCircle size={36} className="text-[var(--color-error)]" />
        <p className="text-sm font-semibold text-[var(--color-on-surface)]">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-primary text-sm">
            إعادة المحاولة
          </button>
        )}
      </div>
    </div>
  );
}
