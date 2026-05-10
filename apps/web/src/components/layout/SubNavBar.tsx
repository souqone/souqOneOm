'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  MessageSquare,
  LayoutDashboard,
  Truck,
  Search,
  Briefcase,
  Users,
  Hammer,
  ClipboardList,
  HardHat,
  PlusCircle,
} from 'lucide-react'

// ── Transport links ──────────────────────────────────────────────
const TRANSPORT_LINKS = [
  { href: '/transport/browse',             label: 'تصفح الطلبات',  icon: Search },
  { href: '/transport/my-requests',        label: 'طلباتي',         icon: FileText },
  { href: '/transport/my-quotes',          label: 'عروضي',          icon: MessageSquare },
  { href: '/transport/carriers/dashboard', label: 'لوحة الناقل',   icon: LayoutDashboard },
  { href: '/transport/carriers/register',  label: 'سجّل كناقل',    icon: Truck },
]

// ── Equipment links ──────────────────────────────────────────────
const EQUIPMENT_LINKS = [
  { href: '/equipment',             label: 'الرئيسية',       icon: Hammer },
  { href: '/browse/equipment',      label: 'تصفح المعدات',  icon: Search },
  { href: '/equipment/requests',    label: 'الطلبات',       icon: ClipboardList },
  { href: '/equipment/operators',   label: 'المشغّلون',      icon: HardHat },
  { href: '/add-listing/equipment', label: 'أضف معدة',     icon: PlusCircle },
]

// ── Jobs links ────────────────────────────────────────────────────
const JOBS_LINKS = [
  { href: '/jobs',              label: 'الوظائف',       icon: Briefcase },
  { href: '/jobs/browse',       label: 'تصفح الوظائف',  icon: Search },
  { href: '/jobs/drivers',      label: 'السائقون',       icon: Users },
  { href: '/jobs/my',           label: 'إعلاناتي',      icon: FileText },
  { href: '/jobs/my-proposals', label: 'عروضي',          icon: MessageSquare },
  { href: '/jobs/dashboard',    label: 'لوحة التحكم',   icon: LayoutDashboard },
]

// ── Active link helper ───────────────────────────────────────────
function isLinkActive(href: string, pathname: string): boolean {
  if (href === '/equipment' || href === '/jobs' || href === '/transport') {
    return pathname === href
  }
  return pathname === href || pathname.startsWith(href + '/')
}

// ── Route → links mapping ────────────────────────────────────────
function getLinksForPath(pathname: string) {
  if (/\/equipment(\/|$)/.test(pathname)) return EQUIPMENT_LINKS
  if (pathname.includes('/transport')) return TRANSPORT_LINKS
  if (pathname.includes('/jobs')) return JOBS_LINKS
  return null
}

export default function SubNavBar() {
  const pathname = usePathname()
  const links = getLinksForPath(pathname)
  const topOffset = pathname.includes('/transport') ? 70 : 70

  if (!links) return null

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 px-3 w-full max-w-fit" style={{ top: topOffset }}>
      <nav
        dir="rtl"
        className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-3 md:px-6 py-2 md:py-3 flex items-center gap-1.5 md:gap-4 border border-gray-200 overflow-x-auto scrollbar-hide"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = isLinkActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full
                text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-150 flex-shrink-0
                ${isActive
                  ? 'bg-[var(--color-brand-navy)] text-white'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-brand-navy)]/10 hover:text-[var(--color-brand-navy)]'
                }
              `}
            >
              <Icon size={12} className="md:hidden" aria-hidden="true" />
              <Icon size={14} className="hidden md:block" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
