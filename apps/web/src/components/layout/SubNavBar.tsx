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
  Car,
  Key,
  Settings,
  Wrench,
  Bus,
  KeyRound,
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

// ── Cars links ──────────────────────────────────────────────────
const CARS_LINKS = [
  { href: '/cars',                              label: 'الرئيسية',        icon: Car      },
  { href: '/cars/browse',                       label: 'سيارات للبيع',   icon: Search   },
  { href: '/cars/browse?listingType=RENTAL',    label: 'سيارات للإيجار', icon: Key      },
  { href: '/browse/parts',                      label: 'قطع الغيار',     icon: Settings },
  { href: '/browse/services',                   label: 'خدمات السيارات', icon: Wrench   },
  { href: '/cars/new',                          label: 'أضف إعلان',      icon: PlusCircle },
]

// ── Buses links ─────────────────────────────────────────────────
const BUS_LINKS = [
  { href: '/buses',                                          label: 'الرئيسية',        icon: Bus       },
  { href: '/browse/buses?busListingType=BUS_SALE',           label: 'حافلات للبيع',   icon: Search    },
  { href: '/browse/buses?busListingType=BUS_RENT',           label: 'حافلات للإيجار', icon: KeyRound  },
  { href: '/browse/buses?busListingType=BUS_SALE_WITH_CONTRACT', label: 'بيع مع عقد', icon: Truck },
  { href: '/add-listing/bus',                                label: 'أضف حافلتك',     icon: PlusCircle },
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
  const bare = pathname.replace(/^\/[a-z]{2,5}/, '') || '/'
  if (href === '/equipment' || href === '/jobs' || href === '/transport' || href === '/cars' || href === '/buses') {
    return bare === href
  }
  if (href.includes('?')) return false
  return bare === href || bare.startsWith(href + '/')
}

// ── Route → links mapping (landing pages only) ───────────────────
function getLinksForPath(pathname: string) {
  const bare = pathname.replace(/^\/[a-z]{2,5}/, '') || '/'
  if (bare === '/equipment') return EQUIPMENT_LINKS
  if (bare === '/transport') return TRANSPORT_LINKS
  if (bare === '/jobs')      return JOBS_LINKS
  if (bare === '/cars')      return CARS_LINKS
  if (bare === '/buses')     return BUS_LINKS
  return null
}

export default function SubNavBar() {
  const pathname = usePathname()
  const links = getLinksForPath(pathname)
  const topOffset = pathname.includes('/transport') ? 70 : 70

  if (!links) return null

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 px-3 w-full md:max-w-fit" style={{ top: topOffset }}>
      <nav
        dir="rtl"
        className="bg-white/90 backdrop-blur-md shadow-lg rounded-full px-2 md:px-6 py-2 md:py-3 flex items-center border border-gray-200"
      >
        {links.map(({ href, label }) => {
          const isActive = isLinkActive(href, pathname)
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 text-center px-1.5 md:px-3 py-1 md:py-1.5 rounded-full
                text-[10px] md:text-sm font-semibold whitespace-nowrap transition-all duration-150
                ${isActive
                  ? 'bg-[var(--color-brand-navy)] text-white'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-brand-navy)]/10 hover:text-[var(--color-brand-navy)]'
                }
              `}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
