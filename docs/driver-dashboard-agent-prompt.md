# Agent Prompt — Driver Dashboard
# `/profile/jobs` or `/dashboard/driver` — Next.js 15 + Tailwind v4 + shadcn/ui

---

## Context

SouqOne — Driver Dashboard for the jobs system.
A driver sees: their applications, invitations, escrow payments, and job recommendations.
The dashboard is **auth-protected** and **driver-profile-aware** —
if no driver profile exists, show an onboarding prompt.

---

## 1. File Structure

```
components/dashboard/driver/
  ├── DriverDashboardClient.tsx        ← "use client" shell
  ├── DriverProfileStrip.tsx           ← Hero banner with profile info
  ├── DriverProfileStripSkeleton.tsx
  ├── DriverNavTabs.tsx                ← Mobile: horizontal scroll / Desktop: sidebar
  ├── DriverStatsGrid.tsx              ← 4-cell stats overview
  ├── DriverAvailabilityToggle.tsx     ← Toggle isAvailable
  ├── DriverVerificationBanner.tsx     ← Banner when not verified
  ├── DriverNoProfileBanner.tsx        ← Onboarding CTA when no driver profile
  ├── tabs/
  │   ├── DriverOverviewTab.tsx        ← Stats + alert + recent apps + recommendations
  │   ├── DriverApplicationsTab.tsx    ← All applications with filter
  │   ├── DriverInvitesTab.tsx         ← Received invitations
  │   ├── DriverEscrowTab.tsx          ← Escrow payments
  │   └── DriverRecommendationsTab.tsx ← Matched jobs
  ├── cards/
  │   ├── ApplicationCard.tsx          ← Single application with escrow section
  │   ├── ApplicationCardSkeleton.tsx
  │   ├── InviteCard.tsx               ← Single invitation with accept/decline
  │   ├── InviteCardSkeleton.tsx
  │   ├── EscrowCard.tsx               ← Escrow status + dispute button
  │   └── RecommendationCard.tsx       ← Job rec with match %
  └── empty/
      ├── NoApplicationsState.tsx
      ├── NoInvitesState.tsx
      ├── NoEscrowState.tsx
      └── NoRecommendationsState.tsx
```

---

## 2. Color System (Tailwind v4 — semantic tokens only)

Same as Job Detail page — import from shared token set.

```
Status colors:
  PENDING   → bg-yellow-50  text-yellow-600  border-yellow-200
  ACCEPTED  → bg-green-50   text-green-600   border-green-200
  REJECTED  → bg-error/10   text-error        border-error/20
  WITHDRAWN → bg-surface-container-high  text-on-surface-variant

Escrow colors:
  HELD      → bg-primary/10  text-primary     border-primary/20
  RELEASED  → bg-green-50    text-green-600   border-green-200
  DISPUTED  → bg-error/10    text-error        border-error/20

Invite colors:
  PENDING   → border-violet-200 (card has violet top bar)
  ACCEPTED  → bg-green-50
  DECLINED  → bg-surface-container-high (dimmed)
```

---

## 3. Constants (import from `lib/constants/jobs.ts`)

Do NOT redefine constants. Import:
```ts
import {
  LICENSE_TYPE_CONFIG,
  ESCROW_STATUS_CONFIG,
  APP_STATUS_CONFIG,
} from '@/lib/constants/jobs'
```

---

## 4. DriverProfileStrip

```tsx
// Gradient banner — matches app brand
<div className="relative bg-gradient-to-bl from-primary via-[#1d4ed8] to-[#0B2447] overflow-hidden">
  {/* Texture overlay */}
  <div className="absolute inset-0 opacity-[0.06]"
    style={{ backgroundImage: "url(checkerboard-svg)", backgroundSize: "20px 20px" }} />
  <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent" />

  <div className="relative z-10 px-4 pt-5 pb-8 flex items-center gap-3">

    {/* Avatar */}
    <div className="relative flex-shrink-0">
      <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/20
                     backdrop-blur-sm flex items-center justify-center
                     text-on-primary font-semibold text-2xl overflow-hidden">
        {profile.avatarUrl
          ? <Image src={getImageUrl(profile.avatarUrl)} alt={profile.displayName} fill className="object-cover" />
          : (profile.displayName || profile.username)[0]?.toUpperCase()
        }
      </div>
      {/* Online/availability dot */}
      <div className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 rounded-full border-2 border-[#0B2447]
                      ${driverProfile.isAvailable ? 'bg-green-400' : 'bg-on-surface-variant/40'}`} />
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="text-on-primary font-semibold text-[15px] leading-tight">
        {profile.displayName || profile.username}
      </p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {driverProfile.licenseTypes.map(l => (
          <span key={l} className="text-[9px] font-bold px-2 py-0.5 rounded-full
                                  bg-on-primary/15 text-on-primary/90 backdrop-blur-sm border border-on-primary/10">
            {tp(LICENSE_TYPE_CONFIG[l].labelKey)}
          </span>
        ))}
        <span className="text-on-primary/50 text-[10px]">
          ⭐ {profile.averageRating} ({profile.reviewCount})
        </span>
      </div>
    </div>
  </div>
</div>
```

---

## 5. DriverNavTabs

### Mobile — horizontal scroll (sticky below header):
```tsx
<div className="sticky top-14 z-10 bg-background border-b border-outline-variant/[0.08]
               -mt-4 rounded-t-2xl">
  <div className="flex overflow-x-auto scrollbar-none">
    {TABS.map(tab => (
      <button key={tab.key} onClick={() => setActive(tab.key)}
        className={`flex items-center gap-1 px-4 py-3 text-[11px] font-semibold
                   whitespace-nowrap border-b-2 flex-shrink-0 transition-all -mb-px
                   ${active === tab.key
                     ? 'border-primary text-primary'
                     : 'border-transparent text-on-surface-variant hover:text-on-surface'
                   }`}>
        {tab.label}
        {tab.count > 0 && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black
                           ${active === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
</div>
```

### Desktop — sidebar nav:
```tsx
<aside className="hidden md:block w-64 flex-shrink-0 space-y-4">
  {/* Profile card */}
  <DriverProfileStrip variant="card" />

  {/* Nav */}
  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm overflow-hidden">
    {TABS.map((tab, i) => (
      <button key={tab.key} onClick={() => setActive(tab.key)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                   ${i < TABS.length - 1 ? 'border-b border-outline-variant/[0.06]' : ''}
                   ${active === tab.key ? 'bg-primary/5 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
        <span className="material-symbols-outlined text-base">{tab.icon}</span>
        <span className="flex-1 text-right font-medium text-[13px]">{tab.label}</span>
        {tab.count > 0 && (
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black
                           ${active === tab.key ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>

  {/* Availability toggle */}
  <DriverAvailabilityToggle profile={driverProfile} />
</aside>
```

Tabs config:
```ts
const TABS = [
  { key: 'overview',  label: tp('tabOverview'),  icon: 'grid_view',   count: 0 },
  { key: 'apps',      label: tp('tabMyApps'),    icon: 'list_alt',    count: pendingAppsCount },
  { key: 'invites',   label: tp('tabInvites'),   icon: 'mail',        count: pendingInvitesCount },
  { key: 'escrow',    label: tp('tabPayments'),  icon: 'payments',    count: heldEscrowCount },
  { key: 'recs',      label: tp('tabRecs'),      icon: 'recommend',   count: recsCount },
]
```

---

## 6. ApplicationCard — Full Spec

```tsx
<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">

  {/* Header */}
  <div className="flex items-start justify-between gap-2 mb-2">
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-on-surface text-[13px] leading-tight">{app.job.title}</p>
      <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
        {employerName} · {timeAgo(app.createdAt)}
      </p>
    </div>
    <Badge variant="outline" className={APP_STATUS_CONFIG[app.status].color}>
      {tp(APP_STATUS_CONFIG[app.status].labelKey)}
    </Badge>
  </div>

  {/* Salary */}
  {app.job.salary && (
    <div className="flex items-baseline gap-1 mb-3">
      <span className="font-black text-primary text-lg">
        {Number(app.job.salary).toLocaleString('ar-OM')}
      </span>
      <span className="text-sm text-primary/60">{tp('currencyOMR')}</span>
      <span className="text-[11px] text-on-surface-variant/50">
        {tp(SALARY_PERIOD_CONFIG[app.job.salaryPeriod]?.labelKey)}
      </span>
    </div>
  )}

  {/* Escrow section — only when ACCEPTED and escrow exists */}
  {app.status === 'ACCEPTED' && app.escrow && (
    <div className="mb-3 border-t border-outline-variant/[0.06] pt-3">
      <div className="flex items-center justify-between bg-primary/[0.04] border border-primary/10 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-base"
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {ESCROW_STATUS_CONFIG[app.escrow.status].icon}
          </span>
          <div>
            <p className="text-[11px] font-semibold text-primary">
              {Number(app.escrow.amount).toLocaleString('ar-OM')} {tp('currencyOMR')}
            </p>
            <p className="text-[9px] text-primary/50">{tp('escrowHeld')}</p>
          </div>
        </div>
        <Badge variant="outline" className={ESCROW_STATUS_CONFIG[app.escrow.status].color}>
          {tp(ESCROW_STATUS_CONFIG[app.escrow.status].labelKey)}
        </Badge>
      </div>
      {app.escrow.status === 'HELD' && (
        <Button variant="outline" onClick={() => handleDispute(app.escrow.id)}
          className="w-full h-8 rounded-xl mt-2 border-error/20 text-error text-[11px] hover:bg-error/5">
          {tp('openDispute')}
        </Button>
      )}
    </div>
  )}

  {/* Actions */}
  {app.status === 'PENDING' && (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => handleWithdraw(app.id)}
        className="flex-1 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px]
                   hover:text-error hover:border-error/20 hover:bg-error/5 transition-all">
        {tp('withdrawApp')}
      </Button>
      <Button variant="outline" onClick={() => handleChat(app.job.userId)}
        className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant">
        <span className="material-symbols-outlined text-base">chat</span>
      </Button>
    </div>
  )}
</div>
```

---

## 7. InviteCard — Full Spec

```tsx
<div className={`bg-surface-container-lowest rounded-2xl border shadow-sm p-4 relative overflow-hidden
                ${inv.status === 'PENDING' ? 'border-violet-200' : 'border-outline-variant/15'}`}>

  {/* Top accent bar for pending invites */}
  {inv.status === 'PENDING' && (
    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-l from-violet-400 to-primary rounded-t-2xl" />
  )}

  <div className="flex items-start justify-between gap-2 mb-2">
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-on-surface text-[13px] leading-tight">{inv.job.title}</p>
      <p className="text-[11px] text-on-surface-variant/60 mt-0.5">
        {inv.job.user.displayName} · {timeAgo(inv.createdAt)}
      </p>
    </div>
    {inv.status !== 'PENDING' && (
      <Badge variant="outline" className={inv.status === 'ACCEPTED'
        ? 'bg-green-50 text-green-600 border-green-200'
        : 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}>
        {tp(`inviteStatus${inv.status}`)}
      </Badge>
    )}
  </div>

  {/* Employer message */}
  {inv.message && (
    <p className="text-[11px] text-on-surface-variant bg-surface-container-low
                 rounded-xl px-3 py-2 mb-3 leading-relaxed italic">
      "{inv.message}"
    </p>
  )}

  {/* Salary */}
  {inv.job.salary && (
    <div className="flex items-baseline gap-1 mb-3">
      <span className="font-black text-primary text-lg">
        {Number(inv.job.salary).toLocaleString('ar-OM')}
      </span>
      <span className="text-sm text-primary/60">{tp('currencyOMR')}</span>
      <span className="text-[11px] text-on-surface-variant/50">/ {inv.job.governorate}</span>
    </div>
  )}

  {/* Actions — pending only */}
  {inv.status === 'PENDING' && (
    <div className="flex gap-2">
      <Button onClick={() => handleRespond(inv.id, 'ACCEPTED')} disabled={isResponding}
        className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-semibold text-[13px]
                   shadow-sm shadow-primary/20 active:scale-[0.98] transition-all">
        <span className="material-symbols-outlined text-base">check</span>
        {tp('acceptInvite')}
      </Button>
      <Button variant="outline" onClick={() => handleRespond(inv.id, 'DECLINED')}
        className="flex-1 h-11 rounded-xl border-outline-variant/25 text-on-surface-variant text-[13px]">
        {tp('declineInvite')}
      </Button>
    </div>
  )}
</div>
```

---

## 8. RecommendationCard — Match % Display

```tsx
<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-3
               flex items-center gap-3 hover:border-outline-variant/30 hover:shadow-md
               transition-all cursor-pointer group"
  onClick={() => router.push(`/jobs/${rec.id}`)}>

  {/* Icon */}
  <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center flex-shrink-0
                 group-hover:bg-primary/12 transition-colors">
    <span className="material-symbols-outlined text-primary text-xl">local_shipping</span>
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-on-surface text-[13px] truncate">{rec.title}</p>
    <div className="flex items-center gap-2 mt-0.5">
      <span className="font-black text-primary text-[12px]">
        {Number(rec.salary).toLocaleString('ar-OM')} {tp('currencyOMR')}
      </span>
      <span className="text-on-surface-variant/30 text-[10px]">·</span>
      <span className="text-on-surface-variant/50 text-[10px]">{rec.governorate}</span>
    </div>
  </div>

  {/* Match % */}
  <div className="flex-shrink-0 text-center">
    <div className={`font-black text-[13px] ${rec.matchScore >= 90 ? 'text-green-600' : rec.matchScore >= 75 ? 'text-yellow-600' : 'text-on-surface-variant'}`}>
      {rec.matchScore}%
    </div>
    <div className="text-[9px] text-on-surface-variant/50">{tp('match')}</div>
  </div>
</div>
```

---

## 9. DriverAvailabilityToggle

```tsx
<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
  <div className="flex items-center justify-between">
    <div>
      <p className="font-semibold text-on-surface text-[13px]">{tp('availability')}</p>
      <p className={`text-[11px] mt-0.5 font-medium ${isAvailable ? 'text-green-600' : 'text-on-surface-variant/50'}`}>
        {isAvailable ? `🟢 ${tp('availableNow')}` : `⚫ ${tp('notAvailable')}`}
      </p>
    </div>
    {/* Toggle */}
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      aria-label={tp('toggleAvailability')}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0
                 focus:outline-none focus:ring-2 focus:ring-primary/30
                 ${isAvailable ? 'bg-green-400' : 'bg-surface-container-high'}
                 disabled:opacity-50`}>
      <span className={`absolute top-1 w-4 h-4 bg-background rounded-full shadow-sm transition-all duration-200
                       ${isAvailable ? 'right-1' : 'left-1'}`} />
    </button>
  </div>
</div>
```

---

## 10. DriverVerificationBanner

```tsx
<div className="bg-gradient-to-l from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4
               flex items-center gap-3">
  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
    <span className="material-symbols-outlined text-amber-600 text-xl"
      style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-amber-900 text-[13px]">{tp('notVerifiedTitle')}</p>
    <p className="text-amber-700 text-[11px] mt-0.5 leading-relaxed">{tp('notVerifiedDesc')}</p>
  </div>
  <Button asChild className="flex-shrink-0 h-9 px-4 rounded-xl bg-amber-500 text-white
                             text-[11px] font-bold shadow-sm shadow-amber-200">
    <Link href="/jobs/verify">{tp('verifyNow')}</Link>
  </Button>
</div>
```

---

## 11. DriverNoProfileBanner (Onboarding)

```tsx
// Shown when driverProfile === null
<div className="flex flex-col items-center justify-center py-20 gap-5 text-center px-6">
  <div className="w-20 h-20 rounded-3xl bg-primary/8 flex items-center justify-center">
    <span className="material-symbols-outlined text-primary text-4xl">badge</span>
  </div>
  <div>
    <h2 className="font-semibold text-on-surface text-lg mb-2">{tp('noProfileTitle')}</h2>
    <p className="text-on-surface-variant text-sm leading-relaxed max-w-xs">{tp('noProfileDesc')}</p>
  </div>
  <Button asChild className="h-11 px-6 rounded-xl bg-primary text-on-primary font-semibold
                            shadow-md shadow-primary/20">
    <Link href="/jobs/create-profile">{tp('createDriverProfile')}</Link>
  </Button>
</div>
```

---

## 12. Pending Invites Alert (OverviewTab)

```tsx
{pendingInvitesCount > 0 && (
  <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-violet-600 text-xl"
        style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
      <div>
        <p className="font-semibold text-violet-900 text-[13px]">
          {tp('pendingInvitesTitle', { count: pendingInvitesCount })}
        </p>
        <p className="text-violet-600 text-[11px]">{tp('pendingInvitesDesc')}</p>
      </div>
    </div>
    <Button onClick={() => setActive('invites')}
      className="flex-shrink-0 h-8 px-3 rounded-xl bg-violet-600 text-white text-[11px] font-bold">
      {tp('review')}
    </Button>
  </div>
)}
```

---

## 13. All Empty States

```tsx
// pattern — use for all empty states:
<div className="flex flex-col items-center justify-center py-16 gap-4 text-center" role="status">
  <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center">
    <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">{icon}</span>
  </div>
  <p className="text-on-surface font-semibold text-[14px]">{title}</p>
  <p className="text-on-surface-variant text-[12px] max-w-xs">{desc}</p>
  {action && <Button asChild className="..."><Link href={href}>{action}</Link></Button>}
</div>

// Icons per tab:
// apps    → list_alt
// invites → mail_off
// escrow  → payments
// recs    → search_off
```

---

## 14. Full Layout Shell

```tsx
// DriverDashboardClient.tsx
<AuthGuard>
  <Navbar />
  <div className="min-h-screen bg-background">
    <DriverProfileStrip profile={profile} driverProfile={driverProfile} />
    <DriverNavTabs active={tab} onChange={setTab} counts={counts} className="md:hidden" />

    <div className="md:flex md:max-w-5xl md:mx-auto md:px-6 md:gap-6 md:pt-4">
      {/* Desktop sidebar */}
      <DriverNavTabs
        active={tab} onChange={setTab} counts={counts}
        variant="sidebar"
        className="hidden md:flex md:flex-col"
        profile={profile}
        driverProfile={driverProfile}
      />

      {/* Main content */}
      <main className="flex-1 min-w-0 px-3 md:px-0 pt-3 md:pt-0 pb-24 md:pb-8" id="main-content">
        {!driverProfile && <DriverNoProfileBanner />}
        {driverProfile && !driverProfile.isVerified && <DriverVerificationBanner />}

        {tab === 'overview'  && <DriverOverviewTab />}
        {tab === 'apps'      && <DriverApplicationsTab />}
        {tab === 'invites'   && <DriverInvitesTab />}
        {tab === 'escrow'    && <DriverEscrowTab />}
        {tab === 'recs'      && <DriverRecommendationsTab />}
      </main>
    </div>
  </div>
  <Footer className="hidden md:block" />
</AuthGuard>
```

---

## 15. i18n Keys

```
tabOverview / tabMyApps / tabInvites / tabPayments / tabRecs
notVerifiedTitle / notVerifiedDesc / verifyNow
noProfileTitle / noProfileDesc / createDriverProfile
availableNow / notAvailable / availability / toggleAvailability
withdrawApp / openDispute / acceptInvite / declineInvite
pendingInvitesTitle / pendingInvitesDesc / review
match / escrowHeld / escrowExplainer
inviteStatusACCEPTED / inviteStatusDECLINED
```

---

## 16. Hard Rules

- ❌ No constants defined inline — import from `lib/constants/jobs.ts`
- ❌ No `gray-*` colors — semantic tokens only
- ❌ No hardcoded Arabic — i18n keys
- ❌ No data fetching in Server Component — all via React Query hooks
- ❌ `pb-24` on mobile main — content hidden behind bottom nav otherwise
- ❌ Footer `hidden md:block` only
- ❌ Never show escrow section unless `app.status === 'ACCEPTED' && app.escrow`
- ✅ `dir="rtl"` on root
- ✅ All buttons: `min-h-11 min-w-11`
- ✅ Skeleton for every async section
- ✅ Run `npx tsc --noEmit` after completion
