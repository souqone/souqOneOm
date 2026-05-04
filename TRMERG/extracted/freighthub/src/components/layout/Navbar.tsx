'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Plus, Truck, ChevronDown, LayoutDashboard, FileText, MessageSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Icon from '@/components/ui/AppIcon';


const PRIMARY_NAV = [
  { href: '/', label: 'الرئيسية' },
  { href: '/browse-transport-requests', label: 'تصفح الطلبات' },
  { href: '/create-transport-request', label: 'أنشئ طلباً' },
] as const;

const USER_MENU = [
  { href: '/my-requests', label: 'طلباتي', icon: FileText },
  { href: '/my-quotes', label: 'عروضي', icon: MessageSquare },
  { href: '/carriers/dashboard', label: 'لوحة الناقل', icon: LayoutDashboard },
  { href: '/carriers/register', label: 'سجّل كناقل', icon: Truck },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[var(--color-outline-variant)] shadow-sm"
      dir="rtl"
    >
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-navy)] flex items-center justify-center">
              <Truck size={18} className="text-white" />
            </div>
            <span
              className="font-bold text-lg text-[var(--color-brand-navy)] hidden sm:block"
              style={{ fontWeight: 800 }}
            >
              فريت هب
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {PRIMARY_NAV.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={`nav-${link.href}`}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]'
                      : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/create-transport-request"
              className="btn-primary text-sm py-2 px-4"
            >
              <Plus size={16} />
              أنشئ طلباً
            </Link>

            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[var(--color-surface-container)] transition-all duration-150"
                >
                  <img
                    src={user?.avatarUrl}
                    alt={`صورة ${user?.displayName}`}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm font-semibold text-[var(--color-on-surface)]">
                    {user?.displayName}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--color-on-surface-muted)] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-[var(--shadow-modal)] border border-[var(--color-outline-variant)] z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-[var(--color-outline-variant)]">
                        <p className="text-xs text-[var(--color-on-surface-muted)]">مرحباً،</p>
                        <p className="text-sm font-bold text-[var(--color-on-surface)]">{user?.displayName}</p>
                      </div>
                      <div className="py-1">
                        {USER_MENU.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setUserMenuOpen(false)}
                              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all ${
                                isActive
                                  ? 'bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]'
                                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] hover:text-[var(--color-on-surface)]'
                              }`}
                            >
                              <Icon size={15} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-[var(--color-surface-container)] transition-all duration-150"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {mobileOpen ? (
              <X size={22} className="text-[var(--color-on-surface)]" />
            ) : (
              <Menu size={22} className="text-[var(--color-on-surface)]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-[var(--color-outline-variant)] bg-white"
          dir="rtl"
        >
          <div className="px-4 py-3 space-y-1">
            {PRIMARY_NAV.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={`mobile-nav-${link.href}`}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]'
                      : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-1 border-t border-[var(--color-outline-variant)]">
              <p className="text-xs text-[var(--color-on-surface-muted)] font-semibold px-4 py-2">
                حسابي
              </p>
              {USER_MENU.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={`mobile-user-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--color-brand-navy)]/10 text-[var(--color-brand-navy)]'
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[var(--color-outline-variant)]">
              <Link
                href="/create-transport-request"
                onClick={() => setMobileOpen(false)}
                className="btn-primary w-full justify-center text-sm py-3"
              >
                <Plus size={16} />
                أنشئ طلب نقل جديد
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}