'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'ما الفرق بين الشاحن والناقل؟',
    a: 'الشاحن هو من يحتاج لنقل بضاعة وينشئ طلباً. الناقل هو صاحب المركبة الذي يقدّم عروض أسعار على الطلبات.',
  },
  {
    q: 'كيف أصبح ناقلاً؟',
    a: 'اضغط على "سجّل كناقل" في القائمة أو في الصفحة الرئيسية، وأدخل بياناتك ونوع مركبتك. التسجيل مجاني.',
  },
  {
    q: 'هل يمكنني تعديل طلبي بعد نشره؟',
    a: 'نعم، يمكن تعديل الطلب طالما لم يُقبَل أي عرض بعد. اذهب لـ "طلباتي" واضغط تعديل.',
  },
  {
    q: 'متى يمكنني تقييم الناقل؟',
    a: 'بعد اكتمال الرحلة، تظهر لك خانة التقييم في صفحة الحجز.',
  },
  {
    q: 'ماذا يحدث إذا لم يصلني أي عرض؟',
    a: 'ينتهي الطلب تلقائياً بعد 30 يوماً وتصلك إشعاراً. يمكنك إعادة نشره بضغطة واحدة.',
  },
  {
    q: 'هل اتصال الشاحن بالناقل متاح قبل القبول؟',
    a: 'يمكن للناقل إرسال رسالة مع عرضه. بعد القبول يُفتح تشات مباشر بين الطرفين.',
  },
];

export default function TransportFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-12 px-4" dir="rtl">
      <h2 className="text-xl font-bold text-center text-[var(--color-on-surface)] mb-6">
        أسئلة شائعة
      </h2>
      <div className="max-w-2xl mx-auto flex flex-col gap-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="card-base overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 text-right"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-medium text-sm">{faq.q}</span>
              <ChevronDown
                size={16}
                className={`flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-[var(--color-on-surface-muted)]">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
