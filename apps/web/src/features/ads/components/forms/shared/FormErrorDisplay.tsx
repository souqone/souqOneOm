'use client';

import { useEffect } from 'react';

interface FormErrorDisplayProps {
  errors: string[];
  onClose: () => void;
}

export function FormErrorDisplay({ errors, onClose }: FormErrorDisplayProps) {
  useEffect(() => {
    if (errors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-4 mb-6 animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">
          error
        </span>
        <div className="flex-1">
          {errors.length === 1 ? (
            <p className="text-error text-sm font-semibold">{errors[0]}</p>
          ) : (
            <ul className="space-y-1">
              {errors.map((msg, i) => (
                <li key={i} className="text-error text-sm font-semibold flex items-start gap-1.5">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-error shrink-0" />
                  {msg}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-error/60 hover:text-error transition-colors"
          aria-label="إغلاق"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
    </div>
  );
}
