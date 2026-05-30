'use client';
import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Trap focus & handle Escape
  useEffect(() => {
    if (!open) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute top-4 end-4 p-1 rounded-lg text-on-surface-variant hover:bg-surface transition-colors"
          aria-label="إغلاق"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
            variant === 'danger' ? 'bg-red-100' : 'bg-amber-100',
          )}>
            <AlertTriangle
              size={20}
              className={variant === 'danger' ? 'text-error' : 'text-amber-600'}
            />
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              className="font-bold text-base text-on-surface leading-snug"
            >
              {title}
            </h3>
            {description && (
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-outline-variant text-sm font-bold text-on-surface hover:bg-surface transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              'flex-1 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 active:scale-95',
              variant === 'danger'
                ? 'bg-error text-white hover:bg-red-700'
                : 'bg-brand-amber text-white hover:bg-amber-600',
            )}
          >
            {loading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
