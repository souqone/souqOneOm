# Jobs Merge — Complete Remaining Pages

## ⚠️ DO NOT STOP UNTIL ALL 14 ITEMS ARE CHECKED OFF

```
[ ] 1.  jobs/drivers/[id]/page.tsx       ← FULL REPLACE from drivershub
[ ] 2.  jobs/employers/[id]/page.tsx     ← FULL REPLACE from drivershub
[ ] 3.  jobs/my-proposals/page.tsx       ← FULL REPLACE from drivershub
[ ] 4.  jobs/dashboard/page.tsx          ← FULL REPLACE from drivershub
[ ] 5.  jobs/onboarding/page.tsx         ← FULL REPLACE from drivershub
[ ] 6.  jobs/verification/page.tsx       ← FULL REPLACE from drivershub

VERIFY EACH PAGE AFTER REPLACING:
[ ] 7.  No Navbar / Footer import remaining in any of the 6 pages
[ ] 8.  No AppLayout import remaining
[ ] 9.  No jobsApi.* calls remaining — all replaced with real hooks
[ ] 10. No delay() calls remaining
[ ] 11. AppIcon replaced with lucide-react
[ ] 12. AppImage replaced with next/image <Image>

FINAL:
[ ] 13. npx tsc --noEmit -p apps/web/tsconfig.json — 0 errors
[ ] 14. All 6 pages open in browser without errors
```

---

## ⚠️ CRITICAL RULES

```
FULL REPLACE means: delete the entire current content, paste drivershub source,
then ONLY do these changes:
  1. Remove AppLayout / Navbar / Footer / BottomNav wrappers
  2. Replace jobsApi.* with real hooks from @/lib/api/jobs
  3. Fix import paths
  4. Replace AppIcon → lucide-react, AppImage → next/image
  5. Keep ALL Arabic hardcoded strings as-is
  6. Keep ALL classNames, styles, JSX structure exactly as-is

DO NOT rewrite. DO NOT improve. DO NOT restructure.
```

---

## API REFERENCE — read lib/api/jobs.ts before starting

```ts
useDriver(id)                    ← getDriver
useEmployer(id)                  ← getEmployer
useMyApplications()              ← myApplications
useWithdrawApplication()         ← withdrawApplication
useMyJobs()                      ← myJobs
useJobApplications(id)           ← getJobApplications
useUpdateApplicationStatus()     ← updateApplicationStatus
useDeleteJob()                   ← deleteJob
useUpdateJob()                   ← updateJob (add if missing — see below)
useMyDriverProfile()             ← myDriverProfile
useMyEmployerProfile()           ← myEmployerProfile
useCreateDriverProfile()         ← createDriverProfile
useCreateEmployerProfile()       ← createEmployerProfile
useMyVerificationStatus()        ← myVerificationStatus
useSubmitVerification()          ← submitVerification
```

If `useUpdateJob` is missing from lib/api/jobs.ts, add it before touching any page:
```ts
export function useUpdateJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest<JobItem>(`/jobs/${id}`, { method: 'PATCH', body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      queryClient.invalidateQueries({ queryKey: ['job', id] })
      queryClient.invalidateQueries({ queryKey: ['my-jobs'] })
    },
  })
}
```

---

## PAGE 1 — drivers/[id]

**Source:** `_merge_src/drivershub/app/drivers/[id]/page.tsx`
**Target:** `apps/web/src/app/[locale]/jobs/drivers/[id]/page.tsx`
**Action:** Read source fully → delete target content → paste source → apply rules above

drivershub reads id from `useParams().id` — keep as-is (same in SouqOne).

Wire API:
```ts
jobsApi.getDriver(id)  →  const { data: driver, isLoading } = useDriver(id)
```

Fix hrefs:
```
"/drivers"   →  "/jobs/drivers"
"/jobs"      →  "/jobs"
"/jobs/new"  →  "/jobs/new"
```

---

## PAGE 2 — employers/[id]

**Source:** `_merge_src/drivershub/app/employers/[id]/page.tsx`
**Target:** `apps/web/src/app/[locale]/jobs/employers/[id]/page.tsx`
**Action:** Read source fully → delete target content → paste source → apply rules above

Wire API:
```ts
jobsApi.getEmployer(id)  →  const { data: employer, isLoading } = useEmployer(id)
```

Fix hrefs:
```
"/jobs"      →  "/jobs"
"/drivers"   →  "/jobs/drivers"
"/browse-jobs" → "/jobs/browse"
```

---

## PAGE 3 — my-proposals

**Source:** `_merge_src/drivershub/app/my-proposals/page.tsx`
**Target:** `apps/web/src/app/[locale]/jobs/my-proposals/page.tsx`
**Action:** Read source fully → delete target content → paste source → apply rules above

Wire API:
```ts
jobsApi.myApplications()          →  const { data, isLoading } = useMyApplications()
jobsApi.withdrawApplication(id)   →  useWithdrawApplication() then mutate(id)
```

Fix hrefs:
```
"/browse-jobs"  →  "/jobs/browse"
"/job-detail"   →  "/jobs/"
"/my-posts"     →  "/jobs/my"
```

---

## PAGE 4 — dashboard

**Source:** `_merge_src/drivershub/app/dashboard/page.tsx`
**Target:** `apps/web/src/app/[locale]/jobs/dashboard/page.tsx`
**Action:** Read source fully → delete target content → paste source → apply rules above

Fix component imports:
```ts
'../components/MyPostsList'     →  '@/features/jobs/components/MyPostsList'
'../components/MyProposalsList' →  '@/features/jobs/components/MyProposalsList'
'../components/StatsRow'        →  '@/features/jobs/components/DashboardStatsRow'
```

Wire API:
```ts
jobsApi.myJobs()          →  useMyJobs()
jobsApi.myApplications()  →  useMyApplications()
```

Fix hrefs:
```
"/my-posts"      →  "/jobs/my"
"/my-proposals"  →  "/jobs/my-proposals"
"/browse-jobs"   →  "/jobs/browse"
"/jobs/new"      →  "/jobs/new"
```

---

## PAGE 5 — onboarding

**Source:** `_merge_src/drivershub/app/onboarding/page.tsx`
**Target:** `apps/web/src/app/[locale]/jobs/onboarding/page.tsx`
**Action:** Read source fully → delete target content → paste source → apply rules above

Wire API:
```ts
jobsApi.createDriverProfile(data)   →  useCreateDriverProfile() then mutate(data)
jobsApi.createEmployerProfile(data) →  useCreateEmployerProfile() then mutate(data)
jobsApi.myDriverProfile()           →  useMyDriverProfile()
jobsApi.myEmployerProfile()         →  useMyEmployerProfile()
```

After success redirect to `/jobs`.

---

## PAGE 6 — verification

**Source:** `_merge_src/drivershub/app/verification/page.tsx`
**Target:** `apps/web/src/app/[locale]/jobs/verification/page.tsx`
**Action:** Read source fully → delete target content → paste source → apply rules above

Wire API:
```ts
jobsApi.myVerificationStatus()    →  useMyVerificationStatus()
jobsApi.submitVerification(data)  →  useSubmitVerification() then mutate(data)
```

For file uploads — drivershub uses `<input type="file">` directly.
SouqOne has `useUploadImage()` in lib/api. Keep drivershub's upload UI exactly,
but on file select call `useUploadImage()` to get the URL, then store it in form state.

---

## FINAL VERIFY

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

Then open each page in browser:
1. `/jobs/drivers/[any-id]` — driver profile card, licenses, contact button ✓
2. `/jobs/employers/[any-id]` — employer profile, recent jobs ✓
3. `/jobs/my-proposals` — proposals list, withdraw button ✓
4. `/jobs/dashboard` — stats row, posts list or proposals list ✓
5. `/jobs/onboarding` — role selector, profile form ✓
6. `/jobs/verification` — upload zones, status display ✓
