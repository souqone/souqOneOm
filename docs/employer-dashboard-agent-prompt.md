# Agent Prompt — Employer Dashboard
# `/dashboard/employer` — Next.js 15 + Tailwind v4 + shadcn/ui

---

## Context

SouqOne — Employer Dashboard for the jobs system.
An employer manages: their posted jobs, incoming applications,
escrow payments, and driver invitations from a single dashboard.

Key UX principle: **urgent items surface to the top**.
Pending applications → alert at top.
Accepted without payment → warning on applicant card.

---

## 1. File Structure

```
components/dashboard/employer/
  ├── EmployerDashboardClient.tsx       ← "use client" shell
  ├── EmployerProfileStrip.tsx          ← Gradient header banner
  ├── EmployerProfileStripSkeleton.tsx
  ├── EmployerNavTabs.tsx               ← Mobile: scroll tabs / Desktop: sidebar
  ├── EmployerStatsGrid.tsx             ← 4-cell stats
  ├── EmployerNoProfileBanner.tsx       ← Onboarding when no employer profile
  ├── tabs/
  │   ├── EmployerOverviewTab.tsx       ← Stats + pending alert + active jobs + recent apps
  │   ├── EmployerJobsTab.tsx           ← All jobs with status filter
  │   ├── EmployerApplicationsTab.tsx   ← All applications with filter chips
  │   ├── EmployerEscrowTab.tsx         ← Escrow management
  │   └── EmployerInviteTab.tsx         ← Search + invite drivers
  ├── cards/
  │   ├── JobManagementCard.tsx         ← Job card with stats + actions
  │   ├── JobManagementCardSkeleton.tsx
  │   ├── ApplicantCard.tsx             ← Applicant with accept/reject/pay/release
  │   ├── ApplicantCardSkeleton.tsx
  │   └── EscrowManagementCard.tsx      ← Escrow with release/dispute
  ├── modals/
  │   └── PayEscrowModal.tsx            ← shadcn Dialog for escrow payment
  └── empty/
      ├── NoJobsState.tsx
      ├── NoApplicationsState.tsx
      └── NoEscrowState.tsx

⚠️ DO NOT CREATE: DriverSearchCard
   Use existing: components/drivers/DriverProfileCard.tsx
   with prop:    variant="invite"
```

---

## 2. Color Tokens (Tailwind v4 — same as Job Detail)

Import from shared token set. Same rules apply.

```
Urgency colors:
  Pending alert    → bg-yellow-50  border-yellow-200  text-yellow-900
  Pay needed       → bg-green-50   border-green-200   text-green-800
  Dispute          → bg-error/10   border-error/20    text-error
```

---

## 3. EmployerProfileStrip

Same gradient pattern as DriverProfileStrip.
Shows: company name + verified badge + industry + governorate.

```tsx
<div className="relative bg-gradient-to-bl from-primary via-[#1d4ed8] to-[#0B2447] overflow-hidden">
  <div className="absolute inset-0 opacity-[0.06]" {/* texture */} />
  <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background to-transparent" />

  <div className="relative z-10 px-4 pt-5 pb-8 flex items-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-on-primary/20 border border-on-primary/20
                   flex items-center justify-center text-on-primary font-semibold text-2xl backdrop-blur-sm overflow-hidden">
      {profile.avatarUrl
        ? <Image src={getImageUrl(profile.avatarUrl)} alt={employerProfile.companyName} fill className="object-cover" />
        : (employerProfile.companyName || profile.displayName || profile.username)[0]?.toUpperCase()
      }
    </div>
    <div>
      <div className="flex items-center gap-2">
        <p className="text-on-primary font-semibold text-[15px]">
          {employerProfile.companyName || profile.displayName}
        </p>
        {profile.isVerified && (
          <span className="bg-on-primary/20 text-on-primary/90 text-[9px] font-bold
                          px-2 py-0.5 rounded-full border border-on-primary/20">
            {tp('verified')} ✓
          </span>
        )}
      </div>
      <p className="text-on-primary/60 text-[11px] mt-0.5">
        {employerProfile.industry} · {profile.governorate}
      </p>
    </div>
  </div>
</div>
```

---

## 4. EmployerNavTabs

Same pattern as DriverNavTabs.

Tabs config:
```ts
const TABS = [
  { key: 'overview', label: tp('tabOverview'),  icon: 'grid_view',  count: 0 },
  { key: 'jobs',     label: tp('tabMyJobs'),    icon: 'work',       count: activeJobsCount },
  { key: 'apps',     label: tp('tabApps'),      icon: 'people',     count: pendingAppsCount },
  { key: 'escrow',   label: tp('tabPayments'),  icon: 'payments',   count: heldEscrowCount },
  { key: 'invite',   label: tp('tabInvite'),    icon: 'person_add', count: 0 },
]
```

---

## 5. PendingApplicationsAlert

Show in OverviewTab when `pendingAppsCount > 0`.

```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 flex items-center justify-between">
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-yellow-600 text-xl"
      style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
    <div>
      <p className="font-semibold text-yellow-900 text-[13px]">
        {tp('pendingAppsTitle', { count: pendingAppsCount })}
      </p>
      <p className="text-yellow-700 text-[11px]">{tp('pendingAppsDesc')}</p>
    </div>
  </div>
  <Button onClick={() => setTab('apps')}
    className="flex-shrink-0 h-8 px-3 rounded-xl bg-yellow-500 text-white text-[11px] font-bold
               shadow-sm shadow-yellow-200">
    {tp('review')}
  </Button>
</div>
```

---

## 6. JobManagementCard — Full Spec

```tsx
<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4
               hover:border-outline-variant/30 hover:shadow-md transition-all">

  {/* Header */}
  <div className="flex items-start justify-between gap-2 mb-2">
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-on-surface text-[13px] leading-tight">{job.title}</p>
      <p className="text-[11px] text-on-surface-variant/60 mt-0.5">{timeAgo(job.createdAt)}</p>
    </div>
    <Badge variant="outline" className={JOB_STATUS_CONFIG[job.status].color}>
      {tp(JOB_STATUS_CONFIG[job.status].labelKey)}
    </Badge>
  </div>

  {/* Salary */}
  {job.salary && (
    <div className="flex items-baseline gap-1 mb-3">
      <span className="font-black text-primary text-base">
        {Number(job.salary).toLocaleString('ar-OM')}
      </span>
      <span className="text-[11px] text-primary/60">{tp('currencyOMR')}</span>
    </div>
  )}

  {/* Stats grid */}
  <div className="grid grid-cols-3 gap-2 mb-3">
    {[
      { label: tp('jobApplicants'), value: job._count.applications, icon: 'group' },
      { label: tp('jobViews'),      value: job.viewCount,           icon: 'visibility' },
      { label: tp('jobInvites'),    value: job.inviteCount ?? 0,    icon: 'mail' },
    ].map(s => (
      <div key={s.label}
        className="bg-surface-container-low rounded-xl p-2 text-center border border-outline-variant/[0.06]">
        <p className="font-black text-on-surface text-sm leading-none">{s.value.toLocaleString('ar-OM')}</p>
        <p className="text-[9px] text-on-surface-variant/50 mt-0.5 flex items-center justify-center gap-0.5">
          <span className="material-symbols-outlined text-[10px]">{s.icon}</span>
          {s.label}
        </p>
      </div>
    ))}
  </div>

  {/* Actions — active jobs only */}
  {job.status === 'ACTIVE' && (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setAppsFilter(job.id)}
        className="flex-1 h-9 rounded-xl border-primary/20 text-primary text-[11px] font-semibold
                   bg-primary/5 hover:bg-primary/10 transition-all">
        <span className="material-symbols-outlined text-base">people</span>
        {tp('viewApps')} ({job._count.applications})
      </Button>
      <Button variant="outline" onClick={() => setTab('invite')}
        className="flex-1 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px]">
        <span className="material-symbols-outlined text-base">person_add</span>
        {tp('inviteDriver')}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon"
            className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant">
            <span className="material-symbols-outlined text-base">more_vert</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem asChild>
            <Link href={`/edit-listing/job/${job.id}`}>{tp('editJob')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleCloseJob(job.id)}>
            {tp('closeJob')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )}
</div>
```

---

## 7. ApplicantCard — Full Spec

```tsx
<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4">

  {/* Applicant header */}
  <div className="flex items-start gap-3 mb-3">
    {/* Avatar */}
    <div className="relative flex-shrink-0">
      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-[#0B2447]
                     flex items-center justify-center text-on-primary font-semibold text-base overflow-hidden">
        {applicant.avatarUrl
          ? <Image src={getImageUrl(applicant.avatarUrl)} alt={applicant.displayName} fill className="object-cover" />
          : (applicant.displayName || applicant.username)[0]?.toUpperCase()
        }
      </div>
      {applicant.isVerified && (
        <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-primary rounded-full
                       border-2 border-background flex items-center justify-center">
          <span className="material-symbols-outlined text-on-primary text-[8px]"
            style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
        </div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-on-surface text-[13px]">
          {applicant.displayName || applicant.username}
        </span>
        {applicant.averageRating >= 4.5 && (
          <span className="text-yellow-500 text-[11px] font-bold">⭐ {applicant.averageRating}</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-0.5">
        {driverProfile?.licenseTypes.map(l => (
          <span key={l}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15">
            {tp(LICENSE_TYPE_CONFIG[l].labelKey)}
          </span>
        ))}
        {driverProfile?.experienceYears > 0 && (
          <span className="text-[10px] text-on-surface-variant/50">
            {driverProfile.experienceYears}+ {tp('yearsExp')}
          </span>
        )}
        <span className="text-[10px] text-on-surface-variant/50">
          · {applicant.governorate}
        </span>
      </div>
    </div>

    {/* Status badge */}
    <Badge variant="outline" className={APP_STATUS_CONFIG[app.status].color}>
      {tp(APP_STATUS_CONFIG[app.status].labelKey)}
    </Badge>
  </div>

  {/* Escrow section — accepted with escrow */}
  {app.status === 'ACCEPTED' && app.escrow && (
    <div className="mb-3 bg-primary/[0.04] border border-primary/10 rounded-xl px-3 py-2
                   flex items-center justify-between">
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
  )}

  {/* Actions — context-aware */}
  <div className="flex gap-2">
    {/* PENDING → accept / reject / chat */}
    {app.status === 'PENDING' && (
      <>
        <Button onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')} disabled={isUpdating}
          className="flex-1 h-9 rounded-xl bg-primary text-on-primary text-[11px] font-bold
                     shadow-sm shadow-primary/20 active:scale-[0.98] transition-all">
          <span className="material-symbols-outlined text-base">check</span>
          {tp('accept')}
        </Button>
        <Button variant="outline" onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
          className="flex-1 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant text-[11px]
                     hover:text-error hover:border-error/20 hover:bg-error/5 transition-all">
          {tp('reject')}
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleChat(applicant.id)}
          className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant">
          <span className="material-symbols-outlined text-base">chat</span>
        </Button>
      </>
    )}

    {/* ACCEPTED + no escrow → pay */}
    {app.status === 'ACCEPTED' && !app.escrow && (
      <>
        <Button onClick={() => openPayModal(app)}
          className="flex-1 h-9 rounded-xl bg-green-600 text-white text-[11px] font-bold
                     shadow-sm shadow-green-200">
          <span className="material-symbols-outlined text-base">payments</span>
          {tp('payEscrow')}
        </Button>
        <Button variant="outline" size="icon" onClick={() => handleChat(applicant.id)}
          className="w-9 h-9 rounded-xl border-outline-variant/20 text-on-surface-variant">
          <span className="material-symbols-outlined text-base">chat</span>
        </Button>
      </>
    )}

    {/* ACCEPTED + escrow HELD → release / dispute */}
    {app.status === 'ACCEPTED' && app.escrow?.status === 'HELD' && (
      <>
        <Button onClick={() => handleRelease(app.escrow.id)}
          className="flex-1 h-9 rounded-xl bg-green-50 border border-green-200 text-green-700
                     text-[11px] font-semibold hover:bg-green-100 transition-all">
          <span className="material-symbols-outlined text-base">check_circle</span>
          {tp('releaseEscrow')}
        </Button>
        <Button variant="outline" onClick={() => handleDispute(app.escrow.id)}
          className="flex-1 h-9 rounded-xl border-error/20 text-error text-[11px]
                     hover:bg-error/5 transition-all">
          {tp('openDispute')}
        </Button>
      </>
    )}

    {/* Always: view driver profile */}
    <Button variant="ghost" size="icon" asChild
      className="w-9 h-9 rounded-xl text-on-surface-variant/40 hover:text-on-surface-variant">
      <Link href={`/drivers/${driverProfile?.id}`}>
        <span className="material-symbols-outlined text-base">person</span>
      </Link>
    </Button>
  </div>
</div>
```

---

## 8. PayEscrowModal

```tsx
// shadcn Dialog — same as Job Detail spec
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="rounded-3xl border-outline-variant/15 p-6 max-w-sm" dir="rtl">
    <DialogHeader>
      <DialogTitle className="font-semibold text-on-surface text-lg text-right">
        {tp('payEscrowTitle')}
      </DialogTitle>
      <DialogDescription className="text-on-surface-variant/70 text-sm text-right mt-1">
        {tp('payEscrowDesc', { name: applicant.displayName })}
      </DialogDescription>
    </DialogHeader>

    <div className="bg-primary/[0.04] border border-primary/10 rounded-2xl p-4 text-center my-4">
      <p className="text-[11px] text-primary/60 mb-1">{tp('amountOMR')}</p>
      <input
        type="number" value={amount}
        onChange={e => setAmount(Math.max(0, Number(e.target.value)))}
        className="w-full text-center text-3xl font-black text-primary bg-transparent
                   focus:outline-none [appearance:textfield]"
        min={0} step={0.001}
      />
      <p className="text-[10px] text-primary/40 mt-1">{tp('escrowExplainer')}</p>
    </div>

    {/* Safety reminder */}
    <div className="flex items-start gap-2 text-[11px] text-on-surface-variant/60 mb-4">
      <span className="material-symbols-outlined text-base flex-shrink-0"
        style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
      <p>{tp('escrowSafetyNote')}</p>
    </div>

    <DialogFooter className="flex-col gap-2">
      <Button onClick={handlePay} disabled={isPaying || amount <= 0}
        className="w-full h-12 rounded-2xl bg-primary text-on-primary font-semibold text-[13px]
                   shadow-md shadow-primary/20 disabled:opacity-50">
        {isPaying && <Loader2 size={16} className="animate-spin" />}
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

## 9. EmployerInviteTab — Driver Search

```tsx
// Search filters
<div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-4 mb-4">
  <h3 className="font-semibold text-on-surface text-[13px] mb-3">{tp('searchDrivers')}</h3>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
    {/* Governorate */}
    <div>
      <label className="text-[11px] text-on-surface-variant font-semibold mb-1 block">
        {tp('governorate')}
      </label>
      <Select value={filters.governorate} onValueChange={v => setFilters(f => ({ ...f, governorate: v }))}>
        <SelectTrigger className="h-9 rounded-xl bg-surface-container-low border-outline-variant/15 text-xs">
          <SelectValue placeholder={tp('selectGovernorate')} />
        </SelectTrigger>
        <SelectContent>
          {OMAN_GOVERNORATES.map(g => (
            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* License type */}
    <div>
      <label className="text-[11px] text-on-surface-variant font-semibold mb-1 block">
        {tp('licenseType')}
      </label>
      <Select value={filters.licenseType} onValueChange={v => setFilters(f => ({ ...f, licenseType: v }))}>
        <SelectTrigger className="h-9 rounded-xl bg-surface-container-low border-outline-variant/15 text-xs">
          <SelectValue placeholder={tp('selectLicense')} />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LICENSE_TYPE_CONFIG).map(([key, cfg]) => (
            <SelectItem key={key} value={key}>{tp(cfg.labelKey)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    {/* Min experience */}
    <div>
      <label className="text-[11px] text-on-surface-variant font-semibold mb-1 block">
        {tp('experience')}
      </label>
      <Select value={String(filters.minExp)} onValueChange={v => setFilters(f => ({ ...f, minExp: Number(v) }))}>
        <SelectTrigger className="h-9 rounded-xl bg-surface-container-low border-outline-variant/15 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[0, 1, 2, 3, 5, 8].map(n => (
            <SelectItem key={n} value={String(n)}>
              {n === 0 ? tp('anyExperience') : `${n}+ ${tp('yearsExp')}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>

  <Button onClick={handleSearch} disabled={isSearching}
    className="w-full h-10 rounded-xl bg-primary text-on-primary font-semibold text-[13px]
               shadow-md shadow-primary/20">
    {isSearching && <Loader2 size={16} className="animate-spin" />}
    <span className="material-symbols-outlined text-base">search</span>
    {tp('searchDrivers')}
  </Button>
</div>

{/* Results — reuse existing DriverProfileCard with variant="invite" */}
{/* Read components/drivers/DriverProfileCard.tsx BEFORE writing anything here */}
{/* The component already has: avatar, verified badge, license chips, exp, rating, governorate */}
{/* variant="invite" swaps the default "عرض الملف" button for "دعوة" + job selector */}
{drivers.map(driver => (
  <DriverProfileCard
    key={driver.id}
    profile={driver}
    variant="invite"
    selectedJobId={selectedJobId}
    onInvited={handleInvited}
  />
))}

{/* If DriverProfileCard doesn't yet support variant="invite": */}
{/* Add the prop to the existing component — DO NOT duplicate the card JSX */}
{/* Pattern to add inside DriverProfileCard.tsx: */}
{/*
  {variant === 'invite' ? (
    <div className="flex gap-2 mt-3">
      <Select value={selectedJobId} onValueChange={onJobSelect}>
        <SelectTrigger className="flex-1 h-9 rounded-xl text-xs ...">
          <SelectValue placeholder={tp('selectJob')} />
        </SelectTrigger>
        <SelectContent>
          {activeJobs.map(j => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button onClick={() => onInvited(profile.id)} disabled={!selectedJobId || isInviting}
        className="h-9 px-4 rounded-xl bg-primary text-on-primary text-[11px] font-semibold ...">
        {tp('invite')}
      </Button>
    </div>
  ) : (
    <Button asChild ...>
      <Link href={`/drivers/${profile.id}`}>{tp('viewProfile')}</Link>
    </Button>
  )}
*/}
```

---

## 10. Full Layout Shell

```tsx
// EmployerDashboardClient.tsx
<AuthGuard>
  <Navbar />
  <div className="min-h-screen bg-background">
    <EmployerProfileStrip profile={profile} employerProfile={employerProfile} />
    <EmployerNavTabs active={tab} onChange={setTab} counts={counts} className="md:hidden" />

    <div className="md:flex md:max-w-5xl md:mx-auto md:px-6 md:gap-6 md:pt-4">
      {/* Desktop sidebar */}
      <EmployerNavTabs
        active={tab} onChange={setTab} counts={counts}
        variant="sidebar"
        className="hidden md:flex md:flex-col"
        profile={profile}
        employerProfile={employerProfile}
      />

      {/* Main */}
      <main className="flex-1 min-w-0 px-3 md:px-0 pt-3 md:pt-0 pb-24 md:pb-8" id="main-content">
        {!employerProfile && <EmployerNoProfileBanner />}

        {tab === 'overview' && <EmployerOverviewTab onTabChange={setTab} />}
        {tab === 'jobs'     && <EmployerJobsTab />}
        {tab === 'apps'     && <EmployerApplicationsTab />}
        {tab === 'escrow'   && <EmployerEscrowTab />}
        {tab === 'invite'   && <EmployerInviteTab jobs={activeJobs} />}
      </main>
    </div>
  </div>

  {/* Post job FAB — mobile only */}
  <div className="md:hidden fixed bottom-20 left-4 z-30">
    <Button asChild
      className="h-12 px-5 rounded-2xl bg-primary text-on-primary font-bold shadow-lg shadow-primary/30">
      <Link href="/add-listing?type=job">
        <span className="material-symbols-outlined text-base">add</span>
        {tp('postNewJob')}
      </Link>
    </Button>
  </div>

  <Footer className="hidden md:block" />
</AuthGuard>
```

---

## 11. i18n Keys

```
tabOverview / tabMyJobs / tabApps / tabPayments / tabInvite
pendingAppsTitle / pendingAppsDesc / review
postNewJob / editJob / closeJob / viewApps / inviteDriver
accept / reject / payEscrow / releaseEscrow / openDispute
payEscrowTitle / payEscrowDesc / confirmPayment / escrowSafetyNote
searchDrivers / selectGovernorate / selectLicense
anyExperience / experience
noJobsTitle / noJobsDesc / createFirstJob
noAppsTitle / noAppsDesc
```

---

## 12. Hard Rules

- ❌ No constants inline — import from `lib/constants/jobs.ts`
- ❌ No `gray-*` colors — semantic tokens only
- ❌ No hardcoded Arabic — i18n keys
- ❌ Never show Release/Dispute before escrow exists
- ❌ Never allow paying zero or negative amount
- ❌ Tabs must not show stale counts — use `useQueryClient` invalidation after mutations
- ❌ `pb-24` on mobile main always
- ❌ Footer `hidden md:block`
- ❌ **DO NOT create DriverSearchCard** — read and reuse `DriverProfileCard` with `variant="invite"`
- ❌ **DO NOT duplicate** any JSX that already exists in the driver profile page
- ✅ **Read `components/drivers/DriverProfileCard.tsx` FIRST** before writing any invite tab code
- ✅ If `variant="invite"` doesn't exist yet — add it to the existing component, don't copy JSX
- ✅ PayEscrowModal: `amount` input must use `[appearance:textfield]` to hide arrows
- ✅ All action buttons: `min-h-11` (touch target)
- ✅ `dir="rtl"` on root
- ✅ Run `npx tsc --noEmit` after completion
