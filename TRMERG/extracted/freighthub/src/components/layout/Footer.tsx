import Link from 'next/link';
import { Truck, MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="bg-[var(--color-brand-navy)] text-white mt-16"
      dir="rtl"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-amber)] flex items-center justify-center">
                <Truck size={18} className="text-white" />
              </div>
              <span className="font-bold text-xl" style={{ fontWeight: 800 }}>
                فريت هب
              </span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">
              منصة نقل البضائع الرائدة في سلطنة عُمان. نربط أصحاب الشحنات بمزودي خدمات النقل الموثوقين.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white/90">الخدمات</h4>
            <ul className="space-y-2">
              {[
                { href: '/browse-transport-requests', label: 'تصفح الطلبات' },
                { href: '/create-transport-request', label: 'أنشئ طلب نقل' },
                { href: '/carriers/register', label: 'سجّل كمزود' },
                { href: '/carriers/dashboard', label: 'لوحة تحكم المزود' },
              ]?.map((item) => (
                <li key={`footer-service-${item?.href}`}>
                  <Link
                    href={item?.href}
                    className="text-sm text-white/60 hover:text-white transition-colors duration-150"
                  >
                    {item?.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-4 text-white/90">أنواع الشحن</h4>
            <ul className="space-y-2">
              {[
                'بضائع عامة',
                'أثاث ومنزليات',
                'مواد البناء',
                'شحن ثقيل',
                'عودة فارغة',
                'معدات وآليات',
              ]?.map((label) => (
                <li key={`footer-type-${label}`}>
                  <span className="text-sm text-white/60">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-sm mb-4 text-white/90">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/60">
                <MapPin size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
                مسقط، سلطنة عُمان
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Phone size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
                ‎+968 2400 0000
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail size={14} className="text-[var(--color-brand-amber)] flex-shrink-0" />
                info@freighthub.om
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © 2026 فريت هب. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              سياسة الخصوصية
            </Link>
            <Link href="#" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              شروط الاستخدام
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}