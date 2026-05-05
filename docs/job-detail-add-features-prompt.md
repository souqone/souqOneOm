# Agent Prompt — Job Detail: Add Missing Features
# File: `apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx`

---

## Context

The Job Detail page already exists and is working well.
Do NOT refactor, restructure, or change any existing code.
Do NOT change the design, layout, or styling.

Your job is to **add 4 missing features** to the existing file only.
Read the file fully before making any changes.

---

## Read First

```
apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx  ← edit this
apps/web/src/lib/api/jobs.ts                               ← read hooks available
```

---

## Available Hooks (from jobs.ts)

```ts
useMyApplications()      // returns ALL user applications — filter by jobId
useMyInvites()           // returns ALL user invites — filter by jobId
useJobApplications(id)   // owner only — returns all applicants on a job
useWithdrawApplication() // withdraw mutation
useRespondToInvite()     // accept/decline invite mutation
useUpdateApplicationStatus() // owner: accept/reject applicant
```

---

## Derive Pattern to Use

Add these two derived values right after the existing hooks block:

```ts
// ── Existing hooks (already in file) ──
const { data: job, isLoading, isError } = useJob(id);
const applyMutation = useApplyToJob();
const deleteMutation = useDeleteJob();
const createConv = useCreateConversation();

// ── ADD BELOW — derive from existing hooks ──
const { data: myApplications } = useMyApplications();
const myApplication = myApplications?.find(a => a.jobId === id) ?? null;

const { data: myInvites } = useMyInvites();
const myInvite = myInvites?.find(i => i.jobId === id && i.status === 'PENDING') ?? null;

const withdrawMutation = useWithdrawApplication();
const respondMutation  = useRespondToInvite();

// Owner: fetch applicants only if owner
const { data: applications } = useJobApplications(isOwner ? id : '');
const updateStatusMutation = useUpdateApplicationStatus();
```

---

## Feature 1 — Application Status in CTA

**Where:** Inside the CTA buttons section — the block that currently shows:
```tsx
<button onClick={() => requireProfile('driver', () => setShowApplyModal(true))}>
  {tp('jobDetailApply')}
</button>
```

**What to add:** Before the apply button, check if user already applied.
Replace the apply button with the appropriate state:

```tsx
{/* ── Application Status Check ── */}
{myApplication ? (
  <div className="flex flex-col gap-3">

    {/* Status indicator */}
    <div className={`flex items-center justify-center gap-2 h-14 rounded-2xl border font-bold text-[15px] ${
      myApplication.status === 'ACCEPTED'
        ? 'bg-green-50 border-green-200 text-green-700'
        : myApplication.status === 'REJECTED'
        ? 'bg-error/10 border-error/20 text-error'
        : 'bg-yellow-50 border-yellow-200 text-yellow-700'
    }`}>
      <span className="material-symbols-outlined text-[20px]"
        style={{ fontVariationSettings: "'FILL' 1" }}>
        {myApplication.status === 'ACCEPTED' ? 'check_circle'
          : myApplication.status === 'REJECTED' ? 'cancel'
          : 'schedule'}
      </span>
      {myApplication.status === 'ACCEPTED' ? tp('jobDetailAppAccepted')
        : myApplication.status === 'REJECTED' ? tp('jobDetailAppRejected')
        : tp('jobDetailAppPending')}
    </div>

    {/* Withdraw — PENDING only */}
    {myApplication.status === 'PENDING' && (
      <button
        onClick={handleWithdraw}
        disabled={withdrawMutation.isPending}
        className="w-full h-12 rounded-xl border border-outline-variant/30 text-on-surface-variant
                   text-[14px] font-bold hover:border-error/30 hover:text-error hover:bg-error/5
                   transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {withdrawMutation.isPending
          ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          : <span className="material-symbols-outlined text-[18px]">undo</span>
        }
        {tp('jobDetailWithdraw')}
      </button>
    )}
  </div>

) : (
  /* ── Original apply button — keep exactly as is ── */
  <button
    onClick={() => requireProfile('driver', () => setShowApplyModal(true))}
    className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/90 text-white
               text-[15px] font-bold tracking-wide flex items-center justify-center gap-2
               shadow-[0_8px_20px_rgb(37,99,235,0.25)] hover:shadow-[0_8px_25px_rgb(37,99,235,0.35)]
               hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all"
  >
    <Send size={18} />
    {tp('jobDetailApply')}
  </button>
)}
```

---

## Feature 2 — Withdraw Handler

**Where:** Add in the handlers block — after `handleShare`:

```ts
const handleWithdraw = useCallback(async () => {
  if (!myApplication) return;
  try {
    await withdrawMutation.mutateAsync(myApplication.id);
    addToast('success', tp('jobDetailWithdrawSuccess'));
  } catch (err: any) {
    addToast('error', err?.message || tp('jobDetailWithdrawFail'));
  }
}, [myApplication, withdrawMutation, addToast, tp]);
```

---

## Feature 3 — Invite Banner

**Where:** Add ABOVE the status banner — before:
```tsx
{job.status && !['ACTIVE'].includes(job.status) && (...)}
```

**What to add:**

```tsx
{/* ══ INVITE BANNER ══ */}
{myInvite && (
  <div className="mb-6 animate-in fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-2xl
                   bg-violet-50/80 backdrop-blur-md border border-violet-200/60 shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-violet-600 text-[20px]"
            style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
        </div>
        <div>
          <p className="text-[14px] font-bold text-violet-900">{tp('jobDetailInvited')}</p>
          {myInvite.message && (
            <p className="text-[12px] text-violet-600 mt-0.5 leading-relaxed">"{myInvite.message}"</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 sm:flex-shrink-0">
        <button
          onClick={() => handleInviteRespond('ACCEPTED')}
          disabled={respondMutation.isPending}
          className="flex-1 sm:flex-none h-10 px-5 rounded-xl bg-violet-600 text-white text-[13px]
                     font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-violet-200
                     hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">check</span>
          {tp('jobDetailAcceptInvite')}
        </button>
        <button
          onClick={() => handleInviteRespond('DECLINED')}
          disabled={respondMutation.isPending}
          className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-violet-300 text-violet-700
                     text-[13px] font-bold hover:bg-violet-100 active:scale-95 transition-all
                     disabled:opacity-50"
        >
          {tp('jobDetailDeclineInvite')}
        </button>
      </div>
    </div>
  </div>
)}
```

**Add the invite handler** in the handlers block:

```ts
const handleInviteRespond = useCallback(async (status: 'ACCEPTED' | 'DECLINED') => {
  if (!myInvite) return;
  try {
    await respondMutation.mutateAsync({ inviteId: myInvite.id, status });
    addToast('success',
      status === 'ACCEPTED' ? tp('jobDetailInviteAccepted') : tp('jobDetailInviteDeclined')
    );
  } catch (err: any) {
    addToast('error', err?.message || tp('jobDetailInviteFail'));
  }
}, [myInvite, respondMutation, addToast, tp]);
```

---

## Feature 4 — Applications List (Owner Only)

**Where:** Add at the BOTTOM of the left column — after the contact info card:

```tsx
{/* ══ APPLICATIONS — Owner Only ══ */}
{isOwner && applications && applications.length > 0 && (
  <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8
                 border border-outline-variant/20 shadow-sm">
    <SectionTitle icon={<span className="material-symbols-outlined">people</span>}>
      {tp('jobDetailApplications')} ({applications.length})
    </SectionTitle>

    <div className="flex flex-col divide-y divide-outline-variant/[0.08]">
      {applications.map(app => {
        const applicant = app.applicant;
        const firstName = (applicant.displayName || applicant.username || '?')[0].toUpperCase();

        return (
          <div key={app.id} className="flex items-center gap-3 py-3.5">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0">
                {applicant.avatarUrl
                  ? <Image src={applicant.avatarUrl} alt={applicant.displayName} width={40} height={40} className="object-cover w-full h-full" />
                  : <span className="text-white font-bold text-sm">{firstName}</span>
                }
              </div>
              {applicant.isVerified && (
                <div className="absolute -bottom-0.5 -left-0.5 w-4 h-4 bg-primary rounded-full border-2 border-surface-container-lowest flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[8px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-on-surface truncate">
                {applicant.displayName || applicant.username}
              </p>
              {app.message && (
                <p className="text-[11px] text-on-surface-variant/60 truncate mt-0.5">
                  "{app.message}"
                </p>
              )}
            </div>

            {/* Status badge */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${
              app.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 border-green-200'
              : app.status === 'REJECTED' ? 'bg-error/10 text-error border-error/20'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              {app.status === 'ACCEPTED' ? tp('jobDetailAppAccepted')
                : app.status === 'REJECTED' ? tp('jobDetailAppRejected')
                : tp('jobDetailAppPending')}
            </span>

            {/* Actions — PENDING only */}
            {app.status === 'PENDING' && (
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => updateStatusMutation.mutate({ applicationId: app.id, status: 'ACCEPTED' })}
                  disabled={updateStatusMutation.isPending}
                  className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[11px] font-bold
                             hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {tp('jobDetailAccept')}
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ applicationId: app.id, status: 'REJECTED' })}
                  disabled={updateStatusMutation.isPending}
                  className="h-8 px-3 rounded-lg border border-outline-variant/30 text-on-surface-variant
                             text-[11px] font-bold hover:text-error hover:border-error/20 hover:bg-error/5
                             active:scale-95 transition-all disabled:opacity-50"
                >
                  {tp('jobDetailReject')}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
)}

{/* Empty state — owner with no applications yet */}
{isOwner && applications && applications.length === 0 && (
  <div className="bg-surface-container-lowest/80 backdrop-blur-xl rounded-3xl p-6 md:p-8
                 border border-outline-variant/20 shadow-sm text-center">
    <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center mx-auto mb-3">
      <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">people</span>
    </div>
    <p className="text-on-surface font-bold text-[14px]">{tp('jobDetailNoApps')}</p>
    <p className="text-on-surface-variant text-[12px] mt-1">{tp('jobDetailNoAppsDesc')}</p>
  </div>
)}
```

---

## i18n Keys to Add

Add to **both** `ar.json` and `en.json` under `"pages"`:

```json
// ar.json
"jobDetailAppPending":      "قيد المراجعة",
"jobDetailAppAccepted":     "مقبول ✓",
"jobDetailAppRejected":     "مرفوض",
"jobDetailWithdraw":        "سحب الطلب",
"jobDetailWithdrawSuccess": "تم سحب الطلب",
"jobDetailWithdrawFail":    "حدث خطأ أثناء سحب الطلب",
"jobDetailInvited":         "تمت دعوتك لهذه الوظيفة",
"jobDetailAcceptInvite":    "قبول الدعوة",
"jobDetailDeclineInvite":   "رفض",
"jobDetailInviteAccepted":  "تم قبول الدعوة",
"jobDetailInviteDeclined":  "تم رفض الدعوة",
"jobDetailInviteFail":      "حدث خطأ",
"jobDetailApplications":    "الطلبات الواردة",
"jobDetailAccept":          "قبول",
"jobDetailReject":          "رفض",
"jobDetailNoApps":          "لا توجد طلبات بعد",
"jobDetailNoAppsDesc":      "سيظهر هنا المتقدمون على وظيفتك",

// en.json
"jobDetailAppPending":      "Pending",
"jobDetailAppAccepted":     "Accepted ✓",
"jobDetailAppRejected":     "Rejected",
"jobDetailWithdraw":        "Withdraw Application",
"jobDetailWithdrawSuccess": "Application withdrawn",
"jobDetailWithdrawFail":    "Failed to withdraw",
"jobDetailInvited":         "You have been invited to this job",
"jobDetailAcceptInvite":    "Accept Invite",
"jobDetailDeclineInvite":   "Decline",
"jobDetailInviteAccepted":  "Invite accepted",
"jobDetailInviteDeclined":  "Invite declined",
"jobDetailInviteFail":      "An error occurred",
"jobDetailApplications":    "Applications",
"jobDetailAccept":          "Accept",
"jobDetailReject":          "Reject",
"jobDetailNoApps":          "No applications yet",
"jobDetailNoAppsDesc":      "Applicants will appear here"
```

---

## Validation

```bash
cd apps/web
npx tsc --noEmit
```

---

## Hard Rules

- ❌ Do NOT refactor, restructure, or rename anything existing
- ❌ Do NOT change any existing className or styling
- ❌ Do NOT change the layout or column structure
- ❌ Do NOT create new files — all changes in job-detail-client.tsx only
- ❌ Do NOT add new API endpoints — use derive pattern only
- ✅ Keep ALL existing handlers exactly as they are
- ✅ Match existing code style (useCallback, clsx, addToast pattern)
- ✅ Use `tp()` for all text — no hardcoded Arabic
- ✅ Run `npx tsc --noEmit` after changes
