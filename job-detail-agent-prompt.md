# Agent Prompt — Job Detail Page
# `/jobs/[id]` — Next.js 15 App Router + Tailwind v4 + shadcn/ui

---

## Context

SouqOne — Omani vehicle marketplace with a driver jobs board.
The Job Detail page is the **conversion core** of the entire jobs system.
Three different users view the same URL with completely different needs:

| User | Sees |
|------|------|
| 🚗 Driver (not applied) | Apply button + contact + requirements |
| 🚗 Driver (applied) | Application status + escrow info |
| 🚗 Driver (invited) | Invitation banner + accept/decline |
| 💼 Employer (job owner) | Edit + applications table + close job |
| 👥 Visitor (not logged in) | Apply button → triggers auth modal |

---

## 1. File Structure

```
app/[locale]/jobs/[id]/
  └── page.tsx                         ← Server Component + generateMetadata

components/jobs/detail/
  ├── JobDetailClient.tsx              ← "use client" shell — detects user role
  ├── JobHeroCard.tsx                  ← Title + badges + salary + meta
  ├── JobHeroCardSkeleton.tsx
  ├── JobRequirementsSection.tsx       ← Chips: license / exp / age / language
  ├── JobDescriptionSection.tsx        ← Description text
  ├── JobEmployerCard.tsx              ← Employer avatar + verified + link
  ├── JobContactSection.tsx            ← Phone + WhatsApp buttons
  ├── JobStatsSidebar.tsx              ← Views + applications + posted date
  ├── JobCTABar.tsx                    ← Sticky bottom (mobile) / sidebar card (desktop)
  ├── JobApplicationsTable.tsx         ← Owner only: list of applicants
  ├── JobApplicationsTableSkeleton.tsx
  ├── JobInvitedBanner.tsx             ← Driver invited state banner
  ├── JobAppliedStatus.tsx             ← Driver applied state card
  ├── JobEscrowCard.tsx                ← Escrow section inside accepted application
  └── JobPayModal.tsx                  ← Employer: pay escrow modal
```

---

## 2. Color System (Tailwind v4 — semantic tokens only)

```
NEVER hardcode hex. NEVER use gray-* directly.

bg-background                  ← page
bg-surface-container-lowest    ← cards
bg-surface-container-low       ← hover / input bg
bg-surface-container-high      ← skeleton / chip bg
bg-primary                     ← filled CTA
bg-primary/8                   ← brand tint
bg-primary/10                  ← chip highlight bg

text-on-surface                ← primary text
text-on-surface-variant        ← secondary text
text-primary                   ← brand color (salary, links, active)
text-on-primary                ← text on filled button
text-error                     ← danger / reject

border-outline-variant/15      ← card border
border-outline-variant/30      ← hover
border-primary/20              ← active / selected

Semantic status colors:
  ACTIVE  → text-green-600  bg-green-50  border-green-200
  CLOSED  → text-on-surface-variant  bg-surface-container-high
  EXPIRED → text-error  bg-error/10  border-error/20
  PENDING → text-yellow-600  bg-yellow-50  border-yellow-200
  ACCEPTED → text-green-600  bg-green-50  border-green-200
  REJECTED → text-error  bg-error/10  border-error/20
```

---

## 3. Constants File (create once, import everywhere)

```ts
// lib/constants/jobs.ts

export const JOB_TYPE_CONFIG = {
  HIRING:  { labelKey: 'jobTypeHiring',  color: 'bg-primary/10 text-primary border-primary/20' },
  LOOKING: { labelKey: 'jobTypeLooking', color: 'bg-violet-500/10 text-violet-600 border-violet-200' },
} as const

export const EMPLOYMENT_TYPE_CONFIG = {
  FULL_TIME:  { labelKey: 'empFullTime' },
  PART_TIME:  { labelKey: 'empPartTime' },
  CONTRACT:   { labelKey: 'empContract' },
  TEMPORARY:  { labelKey: 'empTemporary' },
  FREELANCE:  { labelKey: 'empFreelance' },
} as const

export const SALARY_PERIOD_CONFIG = {
  MONTHLY: { labelKey: 'salaryMonthly' },
  DAILY:   { labelKey: 'salaryDaily' },
  WEEKLY:  { labelKey: 'salaryWeekly' },
  YEARLY:  { labelKey: 'salaryYearly' },
  FIXED:   { labelKey: 'salaryFixed' },
} as const

export const LICENSE_TYPE_CONFIG = {
  LIGHT:      { labelKey: 'licenseLight',      icon: 'directions_car' },
  HEAVY:      { labelKey: 'licenseHeavy',      icon: 'local_shipping' },
  BUS:        { labelKey: 'licenseBus',        icon: 'directions_bus' },
  MOTORCYCLE: { labelKey: 'licenseMotorcycle', icon: 'two_wheeler' },
  FORKLIFT:   { labelKey: 'licenseForklift',   icon: 'forklift' },
} as const

export const ESCROW_STATUS_CONFIG = {
  HELD:     { labelKey: 'escrowHeld',     icon: 'lock',         color: 'bg-primary/10 text-primary border-primary/20' },
  RELEASED: { labelKey: 'escrowReleased', icon: 'check_circle', color: 'bg-green-50 text-green-600 border-green-200' },
  DISPUTED: { labelKey: 'escrowDisputed', icon: 'warning',      color: 'bg-error/10 text-error border-error/20' },
} as const
```

---

## 4. Role Detection

```ts
// Inside JobDetailClient.tsx
type JobViewMode = 'owner' | 'applied' | 'invited' | 'visitor' | 'default'

function resolveViewMode(
  job: DriverJob,
  me: User | null,
  myApplication: JobApplication | null,
  myInvite: JobInvite | null,
): JobViewMode {
  if (!me) return 'visitor'
  if (job.userId === me.id) return 'owner'
  if (myApplication) return 'applied'
  if (myInvite?.status === 'PENDING') return 'invited'
  return 'default'
}
```

---

## 5. JobHeroCard — Full Spec

```tsx
// Mobile layout — single column
// Desktop layout — flex-row with salary block floating right

<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 md:p-6">

  {/* Badges row */}
  <div className="flex items-center gap-2 mb-3 flex-wrap">
    <Badge variant="outline" className={JOB_TYPE_CONFIG[job.jobType].color}>
      {tp(JOB_TYPE_CONFIG[job.jobType].labelKey)}
    </Badge>
    <Badge variant="outline" className="bg-surface-container-high text-on-surface-variant border-outline-variant/20">
      {tp(EMPLOYMENT_TYPE_CONFIG[job.employmentType].labelKey)}
    </Badge>
    {job.status !== 'ACTIVE' && (
      <Badge variant="outline" className={job.status === 'EXPIRED' ? 'bg-error/10 text-error border-error/20' : 'bg-surface-container-high text-on-surface-variant'}>
        {tp(`jobStatus${job.status}`)}
      </Badge>
    )}
    <span className="text-[10px] text-on-surface-variant/50 mr-auto">{timeAgo(job.createdAt)}</span>
  </div>

  <div className="md:flex md:items-start md:justify-between md:gap-4">
    <div className="flex-1 min-w-0">
      <h1 className="font-semibold text-on-surface text-xl md:text-2xl leading-tight mb-3">
        {job.title}
      </h1>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-on-surface-variant/60">
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">location_on</span>
          {resolveLocationLabel(job.governorate, locale)}{job.city ? `، ${job.city}` : ''}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">visibility</span>
          {job.viewCount.toLocaleString('ar-OM')} {tp('jobViews')}
        </span>
        <span className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">group</span>
          {job._count.applications} {tp('jobApplicants')}
        </span>
      </div>
    </div>

    {/* Salary block — desktop: floating card, mobile: inline */}
    {job.salary && (
      <div className="mt-4 md:mt-0 md:flex-shrink-0 bg-primary/[0.04] border border-primary/10 rounded-2xl px-5 py-4 text-center md:min-w-[140px]">
        <p className="text-[11px] text-primary/60 font-medium mb-1">{tp('jobSalary')}</p>
        <p className="text-3xl font-black text-primary">{Number(job.salary).toLocaleString('ar-OM')}</p>
        <p className="text-[11px] text-primary/50 mt-0.5">
          {tp('currencyOMR')} {tp(SALARY_PERIOD_CONFIG[job.salaryPeriod]?.labelKey ?? 'salaryMonthly')}
        </p>
      </div>
    )}
  </div>
</div>
```

---

## 6. JobRequirementsSection — Chips

```tsx
// Requirement chip — reusable
function RequirementChip({ icon, label, highlight = false }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-medium transition-colors
      ${highlight
        ? 'bg-primary/8 border-primary/20 text-primary'
        : 'bg-surface-container-low border-outline-variant/15 text-on-surface-variant'
      }`}>
      <span className="material-symbols-outlined text-base leading-none">{icon}</span>
      {label}
    </div>
  )
}

// Section renders all available fields:
<div className="flex flex-wrap gap-2">
  {job.licenseTypes.map(l => (
    <RequirementChip key={l}
      icon={LICENSE_TYPE_CONFIG[l].icon}
      label={tp(LICENSE_TYPE_CONFIG[l].labelKey)}
      highlight  // license types always highlighted
    />
  ))}
  {job.experienceYears > 0 && (
    <RequirementChip icon="schedule" label={`${job.experienceYears}+ ${tp('yearsExp')}`} />
  )}
  {job.minAge && job.maxAge && (
    <RequirementChip icon="person" label={`${job.minAge}–${job.maxAge} ${tp('years')}`} />
  )}
  {job.hasOwnVehicle && (
    <RequirementChip icon="directions_car" label={tp('hasOwnVehicle')} highlight />
  )}
  {job.languages?.map(l => (
    <RequirementChip key={l} icon="translate" label={l} />
  ))}
  {job.nationality && (
    <RequirementChip icon="flag" label={job.nationality} />
  )}
  {job.vehicleTypes?.map(v => (
    <RequirementChip key={v} icon="local_shipping" label={v} />
  ))}
</div>
```

---

## 7. JobCTABar — All 5 States

### State: default (not applied, not owner)
```tsx
<div className="space-y-2">
  <Button
    onClick={handleApply}
    disabled={isPending || job.status !== 'ACTIVE'}
    className="w-full h-11 rounded-xl bg-primary text-on-primary font-semibold text-[13px]
               shadow-sm shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all
               disabled:opacity-50"
  >
    {isPending
      ? <Loader2 size={16} className="animate-spin" />
      : <span className="material-symbols-outlined text-base">assignment</span>
    }
    {tp('jobApplyNow')}
  </Button>
  <div className="flex gap-2">
    <Button variant="outline" onClick={handleChat}
      className="flex-1 h-10 rounded-xl border-outline-variant/25 text-on-surface-variant text-[12px]">
      <span className="material-symbols-outlined text-base">chat</span>
      {tp('jobContactEmployer')}
    </Button>
    <Button variant="outline" onClick={handleShare} size="icon"
      className="w-10 h-10 rounded-xl border-outline-variant/25">
      <span className="material-symbols-outlined text-base">share</span>
    </Button>
  </div>
</div>
```

### State: applied
```tsx
<div className="space-y-2">
  <div className="flex items-center justify-center gap-2 bg-green-50 border border-green-200 rounded-xl py-3">
    <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: "'FILL' 1" }}>
      check_circle
    </span>
    <span className="text-green-700 font-semibold text-sm">{tp('jobApplied')}</span>
    <Badge variant="outline" className={APP_STATUS_CONFIG[application.status].color}>
      {tp(APP_STATUS_CONFIG[application.status].labelKey)}
    </Badge>
  </div>
  {application.status === 'PENDING' && (
    <Button variant="outline" onClick={handleWithdraw}
      className="w-full h-10 rounded-xl border-outline-variant/20 text-on-surface-variant text-[12px]
                 hover:text-error hover:border-error/20 hover:bg-error/5 transition-all">
      {tp('jobWithdraw')}
    </Button>
  )}
</div>
```

### State: invited
```tsx
<div className="space-y-2">
  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center">
    <p className="text-violet-700 font-semibold text-sm flex items-center justify-center gap-2">
      <span className="material-symbols-outlined text-base">mail</span>
      {tp('jobInvited')}
    </p>
    {invite.message && (
      <p className="text-violet-500 text-[11px] mt-1 leading-relaxed">"{invite.message}"</p>
    )}
  </div>
  <div className="flex gap-2">
    <Button onClick={() => handleInviteResponse('ACCEPTED')} disabled={inviteIsPending}
      className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-semibold text-[13px] shadow-sm shadow-primary/20">
      <span className="material-symbols-outlined text-base">check</span>
      {tp('jobAcceptInvite')}
    </Button>
    <Button variant="outline" onClick={() => handleInviteResponse('DECLINED')}
      className="flex-1 h-11 rounded-xl border-outline-variant/25 text-on-surface-variant text-[13px]">
      {tp('jobDeclineInvite')}
    </Button>
  </div>
</div>
```

### State: owner
```tsx
<div className="flex gap-2">
  <Button asChild className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-semibold text-[13px]">
    <Link href={`/edit-listing/job/${job.id}`}>
      <span className="material-symbols-outlined text-base">edit</span>
      {tp('jobEdit')}
    </Link>
  </Button>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="icon" className="w-11 h-11 rounded-xl border-outline-variant/25">
        <span className="material-symbols-outlined text-base">more_vert</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      <DropdownMenuItem onClick={handleToggleStatus}>
        {job.status === 'ACTIVE' ? tp('jobClose') : tp('jobReopen')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleInviteDriver}>
        {tp('jobInviteDriver')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-error" onClick={handleDelete}>
        {tp('jobDelete')}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

### State: closed / expired
```tsx
<div className="flex items-center justify-center gap-2 bg-surface-container-high
               border border-outline-variant/15 rounded-xl py-3">
  <span className="material-symbols-outlined text-on-surface-variant/40 text-base">lock</span>
  <span className="text-on-surface-variant/60 font-medium text-sm">{tp('jobClosed')}</span>
</div>
```

---

## 8. JobApplicationsTable (Owner only)

```tsx
// Shows inside main content area — NOT in sidebar
// Desktop: full table with filter chips
// Mobile: card list

// Filter chips:
const FILTERS = ['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const

// Applicant row:
<div className="flex items-center gap-3 py-3 border-b border-outline-variant/[0.06] last:border-0">
  {/* Avatar */}
  <div className="relative flex-shrink-0">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#0B2447]
                   flex items-center justify-center text-on-primary font-semibold text-sm">
      {firstLetter}
    </div>
    {applicant.isVerified && (
      <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-primary rounded-full
                     border-2 border-background flex items-center justify-center">
        <span className="material-symbols-outlined text-on-primary text-[8px]">check</span>
      </div>
    )}
  </div>

  {/* Info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="font-semibold text-on-surface text-[13px]">{applicant.displayName}</span>
      {applicant.averageRating >= 4.5 && (
        <span className="text-yellow-500 text-[11px]">⭐ {applicant.averageRating}</span>
      )}
    </div>
    <div className="flex flex-wrap gap-1.5 mt-0.5">
      {/* License chips */}
      {driverProfile?.licenseTypes.map(l => (
        <span key={l} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                                bg-primary/8 text-primary border border-primary/15">
          {tp(LICENSE_TYPE_CONFIG[l].labelKey)}
        </span>
      ))}
      <span className="text-[10px] text-on-surface-variant/50">
        {driverProfile?.experienceYears}+ {tp('yearsExp')} · {applicant.governorate}
      </span>
    </div>
  </div>

  {/* Status */}
  <Badge variant="outline" className={APP_STATUS_CONFIG[app.status].color}>
    {tp(APP_STATUS_CONFIG[app.status].labelKey)}
  </Badge>

  {/* Actions */}
  <div className="flex gap-1.5 flex-shrink-0">
    {app.status === 'PENDING' && (
      <>
        <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
          className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[11px] font-bold">
          {tp('accept')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
          className="h-8 px-3 rounded-lg border-outline-variant/25 text-on-surface-variant text-[11px]">
          {tp('reject')}
        </Button>
      </>
    )}
    {app.status === 'ACCEPTED' && !app.escrow && (
      <Button size="sm" onClick={() => openPayModal(app)}
        className="h-8 px-3 rounded-lg bg-green-600 text-white text-[11px] font-bold shadow-sm shadow-green-200">
        {tp('payEscrow')}
      </Button>
    )}
    {app.status === 'ACCEPTED' && app.escrow?.status === 'HELD' && (
      <Button size="sm" onClick={() => handleRelease(app.escrow.id)}
        className="h-8 px-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-[11px]">
        {tp('releaseEscrow')}
      </Button>
    )}
    <Button size="icon" variant="ghost" asChild className="h-8 w-8 rounded-lg">
      <Link href={`/drivers/${driverProfile?.id}`}>
        <span className="material-symbols-outlined text-base text-on-surface-variant/50">person</span>
      </Link>
    </Button>
  </div>
</div>
```

---

## 9. JobPayModal — Escrow Payment

```tsx
// shadcn Dialog — centered, max-w-sm
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="rounded-3xl border-outline-variant/15 p-6 max-w-sm" dir="rtl">
    <DialogHeader>
      <DialogTitle className="font-semibold text-on-surface text-lg text-right">
        {tp('payEscrowTitle')}
      </DialogTitle>
      <DialogDescription className="text-on-surface-variant text-sm text-right mt-1">
        {tp('payEscrowDesc', { name: applicant.displayName })}
      </DialogDescription>
    </DialogHeader>

    {/* Amount input */}
    <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-4 text-center my-4">
      <p className="text-[11px] text-primary/60 mb-1">{tp('amountOMR')}</p>
      <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))}
        className="w-full text-center text-3xl font-black text-primary bg-transparent
                   focus:outline-none [appearance:textfield]"
      />
      <p className="text-[10px] text-primary/40 mt-1">{tp('escrowExplainer')}</p>
    </div>

    <DialogFooter className="flex-col gap-2">
      <Button onClick={handlePay} disabled={isPaying || amount <= 0}
        className="w-full h-12 rounded-2xl bg-primary text-on-primary font-semibold
                   shadow-md shadow-primary/20">
        {isPaying ? <Loader2 size={16} className="animate-spin" /> : null}
        {tp('confirmPayment')}
      </Button>
      <DialogClose asChild>
        <Button variant="ghost" className="w-full h-10 rounded-2xl text-on-surface-variant text-sm">
          {tp('cancel')}
        </Button>
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 10. Responsive Layout Shell

```tsx
// JobDetailClient.tsx
<div className="min-h-screen bg-background" dir="rtl">
  <Navbar />

  <main className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6 pb-28 md:pb-8
                  md:grid md:grid-cols-[1fr_288px] md:gap-6 md:items-start"
        id="main-content">

    {/* Left — main content */}
    <div className="space-y-3 md:space-y-4">
      {isLoading ? <JobHeroCardSkeleton /> : <JobHeroCard job={job} />}
      <JobRequirementsSection job={job} />
      <JobDescriptionSection description={job?.description} />
      <JobEmployerCard employer={job?.user} />
      {viewMode !== 'owner' && <JobContactSection job={job} />}
      {viewMode === 'owner' && (
        <JobApplicationsTable
          jobId={id}
          userId={me?.id}
        />
      )}
    </div>

    {/* Right — sticky sidebar (desktop only) */}
    <aside className="hidden md:flex flex-col gap-4 sticky top-20">
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">
        <JobCTABar viewMode={viewMode} job={job} application={myApplication} invite={myInvite} />
      </div>
      <JobStatsSidebar job={job} />
    </aside>
  </main>

  {/* Mobile sticky CTA — fixed bottom, above bottom nav */}
  <div className="md:hidden fixed bottom-0 inset-x-0 z-30
                 bg-background/95 backdrop-blur-xl border-t border-outline-variant/10
                 px-4 pt-3 pb-7 shadow-lg">
    <JobCTABar viewMode={viewMode} job={job} application={myApplication} invite={myInvite} />
  </div>

  <Footer className="hidden md:block" />
</div>
```

---

## 11. Server Component + Metadata

```tsx
// app/[locale]/jobs/[id]/page.tsx
export default async function JobDetailPage({ params }: { params: { id: string; locale: string } }) {
  // Minimal prefetch — just for metadata
  // All data fetched client-side via React Query
  const job = await getJobById(params.id).catch(() => null)
  if (!job) notFound()

  return <JobDetailClient id={params.id} />
}

export async function generateMetadata({ params }: { params: { id: string; locale: string } }) {
  const job = await getJobById(params.id).catch(() => null)
  if (!job) return { title: 'وظيفة غير موجودة' }

  return {
    title: `${job.title} — ${job.governorate} | سوق وان`,
    description: job.description?.slice(0, 160),
    openGraph: {
      title: job.title,
      description: job.description?.slice(0, 160),
    },
  }
}
```

---

## 12. All States to Handle

| State | Component | Trigger |
|-------|-----------|---------|
| Loading | `JobHeroCardSkeleton` | `isLoading` |
| Not Found | `notFound()` in Server Component | job === null |
| Error | Inline error + retry | `isError` |
| Job CLOSED/EXPIRED | Badge + disabled CTA | `job.status !== 'ACTIVE'` |
| Not logged in | CTA → opens AuthModal | `!me` |
| Already applied | `JobAppliedStatus` | `myApplication !== null` |
| Invited | `JobInvitedBanner` | `myInvite?.status === 'PENDING'` |
| Owner | Applications table + owner CTA | `job.userId === me.id` |

---

## 13. i18n Keys

```
jobTypeHiring / jobTypeLooking
empFullTime / empPartTime / empContract / empTemporary / empFreelance
salaryMonthly / salaryDaily / salaryWeekly / salaryYearly / salaryFixed
licenseLight / licenseHeavy / licenseBus / licenseMotorcycle / licenseForklift
escrowHeld / escrowReleased / escrowDisputed
jobApplyNow / jobApplied / jobWithdraw
jobContactEmployer / jobInvited / jobAcceptInvite / jobDeclineInvite
jobClose / jobReopen / jobEdit / jobDelete / jobInviteDriver / jobClosed
jobViews / jobApplicants / jobSalary
yearsExp / years / hasOwnVehicle
payEscrow / payEscrowTitle / payEscrowDesc / confirmPayment
releaseEscrow / escrowExplainer / amountOMR
accept / reject / cancel / currencyOMR
```

---

## 14. Spacing & Touch Targets

```
Page max-width:        max-w-5xl
Horizontal padding:    px-4 (mobile) / px-6 (desktop)
Bottom clearance:      pb-28 mobile / pb-8 desktop
Sticky CTA height:     pt-3 pb-7 (safe area aware)
Desktop sidebar width: 288px (w-72)
Chip padding:          px-3 py-1.5
All buttons:           min-h-11 min-w-11 (touch target)
Card radius:           rounded-2xl
Chip radius:           rounded-xl
```

---

## 15. Hard Rules

- ❌ No `gray-*` colors — semantic tokens only
- ❌ No hardcoded salary formatting — always `Number(job.salary).toLocaleString('ar-OM')`
- ❌ No Arabic strings in component files — i18n keys only
- ❌ No role detection outside `resolveViewMode()` — single source of truth
- ❌ Never show employer-only UI to non-owners
- ❌ Never show Apply button when `job.status !== 'ACTIVE'`
- ❌ No inline constants — import from `lib/constants/jobs.ts`
- ❌ No `useEffect` for initial data — React Query + Server Component
- ❌ Footer hidden on mobile — `className="hidden md:block"`
- ❌ CTA must be `fixed bottom-0` on mobile — never in document flow
- ✅ Run `npx tsc --noEmit` after completion
- ✅ All clickable elements: `min-h-11 min-w-11`
- ✅ `dir="rtl"` on root wrapper
