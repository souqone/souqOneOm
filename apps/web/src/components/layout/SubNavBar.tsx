'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  FileText,
  MessageSquare,
  LayoutDashboard,
  Truck,
  Search,
  Menu,
  X,
} from 'lucide-react'

// ── Transport links ──────────────────────────────────────────────
const TRANSPORT_LINKS = [
  { href: '/transport/browse',             label: 'تصفح الطلبات',  icon: Search },
  { href: '/transport/my-requests',        label: 'طلباتي',         icon: FileText },
  { href: '/transport/my-quotes',          label: 'عروضي',          icon: MessageSquare },
  { href: '/transport/carriers/dashboard', label: 'لوحة الناقل',   icon: LayoutDashboard },
  { href: '/transport/carriers/register',  label: 'سجّل كناقل',    icon: Truck },
]

// ── Future sub-sites (add later) ────────────────────────────────
// const CARS_LINKS = [...]
// const EQUIPMENT_LINKS = [...]
// const JOBS_LINKS = [...]
// const BUSES_LINKS = [...]

// ── Route → links mapping ────────────────────────────────────────
function getLinksForPath(pathname: string) {
  if (pathname.includes('/transport')) return TRANSPORT_LINKS
  // future:
  // if (pathname.includes('/equipment')) return EQUIPMENT_LINKS
  // if (pathname.includes('/jobs')) return JOBS_LINKS
  // if (pathname.includes('/buses')) return BUSES_LINKS
  return null
}

export default function SubNavBar() {
  const pathname = usePathname()
  const links = getLinksForPath(pathname)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Don't render if no matching sub-site
  if (!links) return null

  return (
    <>
      {/* ── Desktop: floating centered pill ───────────────────── */}
      <div className="hidden md:block fixed top-[84px] left-1/2 -translate-x-1/2 z-50">
        <nav
          dir="rtl"
          className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center gap-4 border border-gray-200"
        >
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                  whitespace-nowrap transition-all duration-150
                  ${isActive
                    ? 'bg-[var(--color-brand-navy)] text-white'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-brand-navy)]/10 hover:text-[var(--color-brand-navy)]'
                  }
                `}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* ── Mobile: floating pill above bottom bar ─────────────── */}
      <div className="flex md:hidden fixed bottom-[79px] left-1/2 -translate-x-1/2 z-50">
        <div
          dir="rtl"
          className="bg-white/90 backdrop-blur-md shadow-lg rounded-full border border-gray-200 flex items-center"
        >
          {mobileOpen && (
            <div className="flex items-center gap-2 pl-4 pr-2 py-2 overflow-x-auto scrollbar-hide max-w-[80vw]">
              {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold
                      whitespace-nowrap transition-all duration-150 flex-shrink-0
                      ${isActive
                        ? 'bg-[var(--color-brand-navy)] text-white'
                        : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-brand-navy)]/10 hover:text-[var(--color-brand-navy)]'
                      }
                    `}
                  >
                    <Icon size={12} />
                    {label}
                  </Link>
                )
              })}
            </div>
          )}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="px-3.5 py-2.5 rounded-full text-[var(--color-brand-navy)] hover:bg-[var(--color-brand-navy)]/10 transition-all duration-150 flex-shrink-0"
            aria-label={mobileOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
    </>
  )
}
