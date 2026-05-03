'use client';

import { useRef, useCallback } from 'react';

interface OtpInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  length?: number;
  disabled?: boolean;
}

export function OtpInput({ value, onChange, length = 6, disabled }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d*$/.test(char)) return;
      const next = [...value];
      next[index] = char.slice(-1);
      onChange(next);
      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [value, onChange, length],
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [value],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (pasted.length > 0) {
        const next = [...value];
        for (let i = 0; i < pasted.length; i++) {
          next[i] = pasted[i];
        }
        onChange(next);
        const focusIdx = Math.min(pasted.length, length - 1);
        inputRefs.current[focusIdx]?.focus();
      }
    },
    [value, onChange, length],
  );

  return (
    <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-surface-container-lowest dark:bg-surface-container rounded-xl border-2 border-outline-variant/40 dark:border-outline-variant/30 text-on-surface focus:border-primary focus:ring-0 focus:outline-none transition-all disabled:opacity-50"
        />
      ))}
    </div>
  );
}
