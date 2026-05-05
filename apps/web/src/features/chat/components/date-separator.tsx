'use client';

interface DateSeparatorProps {
  date: Date;
}

export function DateSeparator({ date }: DateSeparatorProps) {
  const label = date.toLocaleDateString('ar-OM-u-nu-latn', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex flex-col items-center my-4">
      <span className="text-[10px] font-semibold text-on-surface-variant/50 bg-surface-container-lowest/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.04)] ring-1 ring-outline-variant/[0.04]">
        {label}
      </span>
    </div>
  );
}
