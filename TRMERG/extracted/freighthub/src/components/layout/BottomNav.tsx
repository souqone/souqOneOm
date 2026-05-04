'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, Package, User } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'الرئيسية', Icon: Home },
  { href: '/browse-transport-requests', label: 'تصفح', Icon: Search },
  { href: '/create-transport-request', label: 'طلب جديد', Icon: Plus, featured: true },
  { href: '/my-requests', label: 'طلباتي', Icon: Package },
  { href: '/my-quotes', label: 'عروضي', Icon: User },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-[var(--color-outline-variant)] safe-area-pb"
      dir="rtl"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {BOTTOM_NAV_ITEMS.map(({ href, label, Icon, featured }) => {
          const isActive = pathname === href;

          if (featured) {
            return (
              <Link
                key={`bottom-nav-${href}`}
                href={href}
                className="flex flex-col items-center gap-0.5 -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-brand-amber)] to-[var(--color-brand-amber-light)] flex items-center justify-center shadow-lg shadow-[var(--color-brand-amber)]/30">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-[10px] font-bold text-[var(--color-brand-amber)]">
                  {label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={`bottom-nav-${href}`}
              href={href}
              className="flex flex-col items-center gap-1 py-1 px-3 min-w-[56px]"
            >
              <Icon
                size={20}
                className={
                  isActive
                    ? 'text-[var(--color-brand-navy)]'
                    : 'text-[var(--color-on-surface-muted)]'
                }
              />
              <span
                className={`text-[10px] font-semibold ${
                  isActive
                    ? 'text-[var(--color-brand-navy)]'
                    : 'text-[var(--color-on-surface-muted)]'
                }`}
              >
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-brand-navy)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}