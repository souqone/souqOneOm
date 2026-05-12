'use client';

import { inputCls, labelCls } from '@/lib/constants/form-styles';

interface ContactSectionProps {
  phoneLabel: string;
  whatsappLabel: string;
  contactPhone: string;
  whatsapp: string;
  onPhoneChange: (v: string) => void;
  onWhatsappChange: (v: string) => void;
}

export function ContactSection({
  phoneLabel,
  whatsappLabel,
  contactPhone,
  whatsapp,
  onPhoneChange,
  onWhatsappChange,
}: ContactSectionProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>{phoneLabel}</label>
        <div className="flex items-center gap-0">
          <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-sm font-semibold text-[var(--color-on-surface-variant)] select-none">
            🇴🇲 +968
          </span>
          <input
            type="tel"
            className={inputCls + ' rounded-s-none'}
            value={contactPhone}
            onChange={(e) => onPhoneChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="9XXXXXXX"
            dir="ltr"
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>{whatsappLabel}</label>
        <div className="flex items-center gap-0">
          <span className="shrink-0 flex items-center gap-1 px-3 h-[42px] rounded-s-xl border border-e-0 border-[var(--color-outline-variant)] bg-[var(--color-surface-container)] text-sm font-semibold text-[var(--color-on-surface-variant)] select-none">
            🇴🇲 +968
          </span>
          <input
            type="tel"
            className={inputCls + ' rounded-s-none'}
            value={whatsapp}
            onChange={(e) => onWhatsappChange(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="9XXXXXXX"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}
