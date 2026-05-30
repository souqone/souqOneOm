# Jobs System — Full Production Audit

**Audit Date**: 2026-05-30  
**Auditor Roles**: Staff Software Architect · Senior Security Engineer · Senior QA Engineer · Senior Backend Engineer  
**Scope**: Complete jobs subsystem — API (NestJS/Prisma) + Web (Next.js 14) + Cron + Search + Notifications  
**Total Findings**: 28 (4 Critical · 10 High · 9 Medium · 5 Low)

---

## Summary Table

| ID | Severity | Category | Title |
|----|----------|----------|-------|
| C-1 | 🔴 Critical | Race Condition | Concurrent accept/reject — last writer wins, both notifications fire |
| C-2 | 🔴 Critical | Notifications | ACCEPTED applicants silently dropped on job deletion |
| C-3 | 🔴 Critical | Cron/Distributed | Expiry cron has no distributed lock — duplicate notifications at scale |
| C-4 | 🔴 Critical | Data Integrity | `apply()` creates application outside transaction — partial failure orphans record |
| H-1 | 🟠 High | Authorization | Any authenticated user can apply to any job regardless of profile type |
| H-2 | 🟠 High | State Machine | EXPIRED jobs can be reactivated to ACTIVE by the owner |
| H-3 | 🟠 High | Business Logic | Employer can accept/reject applications on CLOSED/EXPIRED jobs |
| H-4 | 🟠 High | Business Logic | No cap on ACCEPTED applicants — all 100 can be accepted |
| H-5 | 🟠 High | Authorization | Job owner can force-WITHDRAW an applicant's application via employer endpoint |
| H-6 | 🟠 High | Authorization | Admin frontend `/admin/jobs` guarded only by `AuthGuard`, not role guard |
| H-7 | 🟠 High | Data Integrity | Admin `updateJob` passes `data as any` to Prisma — any field is writable |
| H-8 | 🟠 High | Scalability | `getApplications()` has no pagination — memory bomb on popular jobs |
| H-9 | 🟠 High | Scalability | `myApplications()` returns unbounded result set |
| H-10 | 🟠 High | Frontend Cache | `useCloseJob` does not invalidate `['job', id]` — detail page shows stale status |
| M-1 | 🟡 Medium | Business Logic | PENDING applications not auto-closed when job closes or expires |
| M-2 | 🟡 Medium | Cache | Slug-based detail cache never invalidated on update or delete |
| M-3 | 🟡 Medium | Search | Cron expiry does not remove expired jobs from Meilisearch index |
| M-4 | 🟡 Medium | Cron | Cron expiry does not invalidate Redis list caches |
| M-5 | 🟡 Medium | Notifications | No notification when job expires or is closed (owner + pending applicants) |
| M-6 | 🟡 Medium | Business Logic | `UpdateJobDto` allows mutating `jobType` post-creation |
| M-7 | 🟡 Medium | Business Logic | No cross-field validation: `minAge > maxAge` accepted without error |
| M-8 | 🟡 Medium | Infrastructure | `req.ip` returns proxy IP behind load balancer — view deduplication broken |
| M-9 | 🟡 Medium | Observability | Meilisearch and notification errors silently swallowed |
| L-1 | 🔵 Low | Data Integrity | Non-atomic Redis GET→SET for view count |
| L-2 | 🔵 Low | Security | `resumeUrl` accepts arbitrary URLs — phishing vector |
| L-3 | 🔵 Low | Security | No rate limiting on `POST /:id/apply` |
| L-4 | 🔵 Low | Data Leakage | `user.phone` exposed in all public job and driver profile endpoints |
| L-5 | 🔵 Low | Data Integrity | `expiresAt` field in schema never populated or used |

---

## Critical

---

### C-1 — Race Condition: Concurrent Accept/Reject

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Race Condition / Data Integrity |

**Description**  
`updateApplicationStatus()` performs a read-then-write with no optimistic locking or row-level lock. Two concurrent requests — one ACCEPTED, one REJECTED — can both read `status: 'PENDING'`, both pass the state-machine check, and both write to the row. The last writer wins in the DB, but both branches have already dispatched their notifications, so the applicant receives contradictory messages.

**Reproduction Scenario**
```
1. Job has 1 PENDING application.
2. Employer opens application in two browser tabs simultaneously.
3. Tab A: PATCH /jobs/applications/:id  { status: 'ACCEPTED' }
4. Tab B: PATCH /jobs/applications/:id  { status: 'REJECTED' }  (50ms later)
5. Both requests read status='PENDING', both pass the PENDING→ACCEPTED/REJECTED guard.
6. DB final state: REJECTED (last write).
7. Applicant received ACCEPTED notification from step 3 — never gets the correction.
```

**Impact**  
Applicant believes they were hired for a role that was actually rejected. Trust-breaking UX and potential legal/contractual exposure on the platform.

**Root Cause**  
No `WHERE status = 'PENDING'` predicate on the Prisma `update` call. `update` does not provide CAS semantics without an explicit version field or conditional where clause.

**Suggested Fix**
```typescript
// jobs.service.ts — updateApplicationStatus()
const result = await this.prisma.jobApplication.updateMany({
  where: { id: applicationId, status: 'PENDING' },  // CAS guard
  data: { status },
});
if (result.count === 0) {
  throw new ConflictException('Application status has already been changed');
}
// Fetch updated record for response + fire notification only after confirmed write
const updated = await this.prisma.jobApplication.findUnique({ where: { id: applicationId } });
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `updateApplicationStatus()`

---

### C-2 — ACCEPTED Applicants Not Notified on Job Deletion

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Notifications / Business Logic |

**Description**  
`JobsService.remove()` and `AdminJobsService.deleteJob()` query `where: { status: 'PENDING' }` when building the notification list before deleting a job. Applicants whose status is already `ACCEPTED` receive zero notification when the job they were accepted for is deleted.

**Reproduction Scenario**
```
1. Employer accepts applicant A → status = ACCEPTED.
2. Employer deletes the job.
3. Code path: findMany({ where: { jobId, status: 'PENDING' } }) → 0 results.
4. Applicant A receives no notification.
5. Applicant A still believes they have the job.
```

**Impact**  
Accepted applicants are silently ghosted after a job deletion. High trust damage; in some jurisdictions a written acceptance constitutes a binding offer of employment.

**Root Cause**  
The `PENDING`-only filter was intended to catch pending applications during cancellation but inadvertently skips already-accepted ones.

**Suggested Fix**
```typescript
// jobs.service.ts / admin-jobs.service.ts — inside remove()
const affectedApps = await this.prisma.jobApplication.findMany({
  where: { jobId: id, status: { in: ['PENDING', 'ACCEPTED'] } },
  select: { applicantId: true, status: true },
});
await Promise.allSettled(
  affectedApps.map(app =>
    this.notifications.create({
      userId: app.applicantId,
      type: app.status === 'ACCEPTED'
        ? 'JOB_ACCEPTED_DELETED'
        : 'JOB_APPLICATION_CANCELLED',
      entityType: 'JOB',
      entityId: id,
    }).catch(err => this.logger.warn(`Notification failed for ${app.applicantId}`, err))
  ),
);
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `remove()`
- `apps/api/src/jobs/admin-jobs.service.ts` — `deleteJob()`

---

### C-3 — Cron Expiry Has No Distributed Lock

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Cron / Distributed Systems |

**Description**  
`JobExpiryService.expireOldJobs()` is scheduled with `@Cron(CronExpression.EVERY_DAY_AT_4AM)`. With N API replicas running, all N instances fire at 04:00. Each queries the same expired jobs, marks them EXPIRED, and dispatches notifications. Users receive N duplicate notifications per cron run.

**Reproduction Scenario**
```
1. Deploy 3 API replicas.
2. 04:00 — all 3 instances fire expireOldJobs() simultaneously.
3. Each finds the same 50 expiring jobs (DB not yet updated by first instance).
4. Each marks 50 jobs EXPIRED and sends notifications.
5. Result: 3× notifications per applicant on those 50 jobs.
   At 10 applicants/job: 1,500 duplicate notifications in one cron run.
```

**Impact**  
Notification spam at scale. Severely degrades user trust. Worsens with each additional replica deployed.

**Root Cause**  
`@Cron` runs per-process with no cross-instance coordination. No Redis distributed lock (NX) is acquired before running the cron body.

**Suggested Fix**
```typescript
// job-expiry.service.ts
async expireOldJobs() {
  const lockKey = 'cron:jobs:expiry';
  const acquired = await this.redis.set(lockKey, '1', 'NX', 'PX', 300_000); // 5min TTL
  if (!acquired) return; // another instance already running

  try {
    // ... existing expiry logic ...
  } finally {
    await this.redis.del(lockKey);
  }
}
```

**Files Involved**
- `apps/api/src/jobs/job-expiry.service.ts`

---

### C-4 — `apply()` Runs Outside Transaction — Orphaned Applications on Failure

| Field | Value |
|-------|-------|
| **Severity** | 🔴 Critical |
| **Category** | Data Integrity / Transactions |

**Description**  
`JobsService.apply()` creates the `JobApplication` record, then calls `this.notifications.create()` for the job owner. These two operations are sequential but not transactional. If the application is created successfully and the notification call throws, the applicant receives a 500 response (thinks apply failed) while the DB has their application — they are permanently blocked from re-applying due to the unique constraint.

**Reproduction Scenario**
```
1. Notifications service temporarily unreachable.
2. Driver submits application.
3. prisma.jobApplication.create() → succeeds, record created.
4. notifications.create()         → throws (connection refused).
5. Endpoint returns 500 to driver.
6. Driver retries → hits P2002 unique constraint → "already applied" error.
7. Job owner never sees the application.
8. Application is orphaned permanently.
```

**Impact**  
Application permanently orphaned. Driver locked out of re-applying. Job owner misses a candidate. The only recovery is a manual DB deletion.

**Root Cause**  
Notification dispatch is treated as a required side-effect rather than a best-effort post-commit action. No separation between mandatory DB write and optional side-effect.

**Suggested Fix**
```typescript
// jobs.service.ts — apply()
const application = await this.prisma.jobApplication.create({ /* ... */ });

// Notification is best-effort — never fail the apply call
this.notifications.create({ /* ... */ }).catch(err =>
  this.logger.error(`Failed to notify job owner of new application`, err.stack)
);

return application;
```
For guaranteed delivery, use a transactional outbox pattern with a background processor.

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `apply()`

---

## High

---

### H-1 — Any Authenticated User Can Apply Regardless of Profile Type

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Authorization / Business Logic |

**Description**  
`jobs.service.ts:apply()` does not verify that the applicant holds the correct profile type for the job. A user with no `DriverProfile` can apply to a `HIRING` job; a user with no `EmployerProfile` can apply to an `OFFERING` job. The frontend guards with a `canApply` flag, but there is no server-side enforcement.

**Reproduction Scenario**
```http
# User with no DriverProfile applies to a HIRING job via API
POST /jobs/:hiringJobId/apply
Authorization: Bearer <any_logged_in_user_token>
Content-Type: application/json
{ "message": "أريد الوظيفة" }
→ 201 Created  ← should be 403
```

**Impact**  
Any registered user can inject phantom applications. Job owner receives notifications for applicants with no professional profile, corrupting the hiring pipeline.

**Root Cause**  
Profile-type check exists only in the Next.js frontend component. The API layer has no guard.

**Suggested Fix**
```typescript
// jobs.service.ts — apply()
if (job.jobType === 'HIRING') {
  const driverProfile = await this.prisma.driverProfile.findUnique({ where: { userId: applicantId } });
  if (!driverProfile) throw new ForbiddenException('يجب إنشاء ملف سائق للتقديم على هذه الوظيفة');
} else if (job.jobType === 'OFFERING') {
  const employerProfile = await this.prisma.employerProfile.findUnique({ where: { userId: applicantId } });
  if (!employerProfile) throw new ForbiddenException('يجب إنشاء ملف صاحب عمل للتقديم على هذا العرض');
}
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `apply()`

---

### H-2 — EXPIRED Jobs Can Be Reactivated to ACTIVE by Owner

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | State Machine / Authorization |

**Description**  
`jobs.service.ts:update()` validates allowed status transitions but the state machine only blocks invalid forward transitions — it does not prevent an owner from transitioning a system-terminal state (`EXPIRED`) back to `ACTIVE`. An owner can bypass the 30-day expiry limit by sending `PATCH /jobs/:id { "status": "ACTIVE" }`.

**Reproduction Scenario**
```
Day 30 — Cron changes job: ACTIVE → EXPIRED
Day 31 — Owner sends: PATCH /jobs/:id  { "status": "ACTIVE" }
→ 200 OK. Job reappears in search. New applications accepted.
Next 04:00 — Cron expires it again (createdAt + 30 days still in the past).
```

**Impact**  
Breaks the expiry mechanism entirely. Jobs can be kept alive indefinitely. Cron re-expiry next morning generates duplicate "expired" notifications.

**Root Cause**  
`VALID_TRANSITIONS` map: `{ ACTIVE: ['CLOSED'], CLOSED: [], EXPIRED: [] }`. EXPIRED → ACTIVE is not explicitly blocked by the current implementation's check logic.

**Suggested Fix**
```typescript
// jobs.service.ts — update()
if (dto.status) {
  const VALID: Record<string, string[]> = { ACTIVE: ['CLOSED'], CLOSED: [], EXPIRED: [] };
  if (!(VALID[job.status] ?? []).includes(dto.status)) {
    throw new BadRequestException(`Cannot transition from ${job.status} to ${dto.status}`);
  }
}
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `update()`

---

### H-3 — Employer Can Accept/Reject on CLOSED/EXPIRED Jobs

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Business Logic / State Machine |

**Description**  
`updateApplicationStatus()` validates the application's own state machine but never checks the parent job's status. An employer can send `PATCH /jobs/applications/:id { status: 'ACCEPTED' }` for an application belonging to a CLOSED or EXPIRED job.

**Reproduction Scenario**
```
1. Job is CLOSED.
2. Employer API-calls: PATCH /jobs/applications/:appId  { status: 'ACCEPTED' }
3. No error returned. Application transitions to ACCEPTED.
4. Applicant receives acceptance notification for a closed role.
```

**Impact**  
Applicant believes they were hired for a closed/expired role. Misleading communications; potential contractual confusion.

**Suggested Fix**
```typescript
// jobs.service.ts — updateApplicationStatus()
const application = await this.prisma.jobApplication.findUnique({
  where: { id: applicationId },
  include: { job: { select: { status: true, userId: true } } },
});
if (!application) throw new NotFoundException();
if (application.job.status !== 'ACTIVE') {
  throw new BadRequestException('Cannot update application on a non-active job');
}
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `updateApplicationStatus()`

---

### H-4 — No Cap on ACCEPTED Applicants Per Job

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Business Logic |

**Description**  
There is no guard preventing an employer from accepting every applicant for a single-vacancy job. An employer can accept 100 out of 100 applicants, each receiving an "ACCEPTED" notification believing they secured the role.

**Impact**  
Mass false acceptances. High trust damage. In regulated markets, a written acceptance may constitute a binding employment offer.

**Suggested Fix**
```typescript
// jobs.service.ts — updateApplicationStatus(), inside status === 'ACCEPTED' branch
const acceptedCount = await this.prisma.jobApplication.count({
  where: { jobId: application.jobId, status: 'ACCEPTED' },
});
const job = await this.prisma.driverJob.findUnique({ where: { id: application.jobId } });
if (acceptedCount >= (job.maxHires ?? 1)) {
  throw new BadRequestException('Maximum accepted applicants reached for this job');
}
```
Add `maxHires Int? @default(1)` to the `DriverJob` schema.

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `updateApplicationStatus()`
- `apps/api/prisma/schema.prisma` — `DriverJob` model

---

### H-5 — Job Owner Can Force-Withdraw an Applicant's Application

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Authorization |

**Description**  
`updateApplicationStatus()` (the employer-facing endpoint `PATCH /jobs/applications/:id`) does not block `status: 'WITHDRAWN'`. The state machine allows `PENDING → WITHDRAWN`. An employer can call this endpoint to withdraw an applicant's application on their behalf, and the applicant receives a `JOB_APPLICATION_REJECTED` notification (wrong type).

**Reproduction Scenario**
```http
# Job owner removes an applicant they dislike
PATCH /jobs/applications/:appId
Authorization: Bearer <job_owner_token>
{ "status": "WITHDRAWN" }
→ 200 OK. Applicant's status is now WITHDRAWN.
→ Applicant receives "your application was rejected" notification.
```

**Impact**  
Employer manipulates applicant records. Applicant's history shows WITHDRAWN (they didn't withdraw). Applicant receives misleading rejection notification.

**Suggested Fix**
```typescript
// jobs.service.ts — updateApplicationStatus()
if (status === 'WITHDRAWN') {
  throw new ForbiddenException('Only the applicant can withdraw their own application');
}
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `updateApplicationStatus()`

---

### H-6 — Admin Frontend Unprotected by Role Guard

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Authorization |

**Description**  
`apps/web/src/app/[locale]/admin/jobs/page.tsx` wraps its content in `<AuthGuard>` only. Any authenticated user (driver, employer) can navigate to `/admin/jobs` and see the admin interface — verification requests list, admin controls, and applicant data. Backend routes correctly return 403 for non-admins, but the page renders with whatever cached data exists and exposes the admin UI structure.

**Suggested Fix**  
Create an `AdminGuard` component that reads `user.role` from the auth context and redirects non-admins:
```tsx
// apps/web/src/components/admin-guard.tsx
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user || user.role !== 'ADMIN') redirect('/jobs');
  return <>{children}</>;
}
```
Replace `<AuthGuard>` with `<AdminGuard>` in the admin jobs page.

**Files Involved**
- `apps/web/src/app/[locale]/admin/jobs/page.tsx`

---

### H-7 — Admin `updateJob` Passes `data as any` to Prisma

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Authorization / Data Integrity |

**Description**  
```typescript
// admin-jobs.service.ts
async updateJob(jobId: string, data: { status?: string; title?: string }) {
  return this.prisma.driverJob.update({ where: { id: jobId }, data: data as any });
}
```
The TypeScript parameter type suggests only `status` and `title` are writable, but `as any` removes all type-checking. Any admin can send `{ userId: "<another_user_id>" }` and transfer job ownership.

**Reproduction Scenario**
```http
PATCH /admin/jobs/:id
Authorization: Bearer <admin_token>
{ "userId": "<victim_user_id>", "status": "ACTIVE" }
→ Job ownership transferred silently.
```

**Suggested Fix**
```typescript
// admin-jobs.service.ts — updateJob()
const allowed: { status?: JobStatus; title?: string } = {};
if (data.status) allowed.status = data.status as JobStatus;
if (data.title)  allowed.title  = data.title;
return this.prisma.driverJob.update({ where: { id: jobId }, data: allowed });
```

**Files Involved**
- `apps/api/src/jobs/admin-jobs.service.ts` — `updateJob()`

---

### H-8 — `getApplications()` Has No Pagination

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Scalability |

**Description**  
`JobsService.getApplications()` calls `findMany` with no `take` limit. A popular job receiving 500 applications returns all 500 rows (with nested applicant data) in a single response. The controller already accepts `page`/`limit` query params and passes them in, but the service ignores them.

**Impact**  
API memory exhaustion on popular jobs. Can be exploited for soft-DoS: create job, flood with applications, repeatedly call `getApplications`.

**Suggested Fix**
```typescript
// jobs.service.ts — getApplications()
async getApplications(jobId: string, userId: string, page = 1, limit = 20) {
  // ... ownership check ...
  const take = Math.min(limit, 50);
  const [items, total] = await this.prisma.$transaction([
    this.prisma.jobApplication.findMany({
      where: { jobId: job.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      include: { applicant: { select: { /* ... */ } } },
    }),
    this.prisma.jobApplication.count({ where: { jobId: job.id } }),
  ]);
  return { items, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } };
}
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `getApplications()`

---

### H-9 — `myApplications()` Returns Unbounded Result Set

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Scalability |

**Description**  
`JobsService.myApplications()` uses `findMany` with no `take` limit. A driver active for 2 years with 300 applications returns all 300 rows (including nested `job` relation) on every dashboard load.

**Impact**  
Memory pressure on API pod. At 100 concurrent active drivers, this is tens of thousands of rows in memory per request cycle. Potential OOM on the Node.js process.

**Suggested Fix**
```typescript
async myApplications(userId: string, page = 1, limit = 20) {
  const [items, total] = await this.prisma.$transaction([
    this.prisma.jobApplication.findMany({
      where: { applicantId: userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { job: { select: { /* ... */ } } },
    }),
    this.prisma.jobApplication.count({ where: { applicantId: userId } }),
  ]);
  return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}
```
Update `useMyApplications` hook and dashboard consumer accordingly.

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `myApplications()`
- `apps/api/src/jobs/jobs.controller.ts` — `myApplications()` route
- `apps/web/src/lib/api/jobs.ts` — `useMyApplications()`

---

### H-10 — `useCloseJob` Invalidates Wrong React Query Key

| Field | Value |
|-------|-------|
| **Severity** | 🟠 High |
| **Category** | Frontend Cache / UX Correctness |

**Description**  
`useCloseJob` on mutation success invalidates `['jobs']` and `['employer-applications']` but NOT `['job', id]` — the query key used by `useJob(id)` on the job detail page. After an employer closes a job from its detail page, the detail page continues showing `status: ACTIVE` until a full page reload.

**Reproduction Scenario**
```
1. Employer opens job detail page (badge shows ACTIVE).
2. Employer clicks "إغلاق الإعلان".
3. Mutation succeeds; list pages refresh correctly.
4. Detail page still shows ACTIVE badge — no refetch triggered.
```

**Suggested Fix**
```typescript
// apps/web/src/lib/api/jobs.ts — useCloseJob
export function useCloseJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => apiRequest(`/jobs/${jobId}`, { method: 'PATCH', body: JSON.stringify({ status: 'CLOSED' }) }),
    onSuccess: (_, jobId) => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['job', jobId] }); // ADD THIS
      qc.invalidateQueries({ queryKey: ['employer-applications'] });
    },
  });
}
```

**Files Involved**
- `apps/web/src/lib/api/jobs.ts` — `useCloseJob()`

---

## Medium

---

### M-1 — PENDING Applications Not Auto-Closed When Job Closes

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | State Machine |

**Description**  
When a job transitions to CLOSED (manual) or EXPIRED (cron), existing `PENDING` applications remain in `PENDING` state indefinitely. Applicants receive no notification; their applications appear actionable on the employer dashboard but can never be processed.

**Suggested Fix**  
On close/expiry, bulk-transition PENDING applications and notify applicants:
```typescript
await this.prisma.jobApplication.updateMany({
  where: { jobId: id, status: 'PENDING' },
  data: { status: 'REJECTED' },
});
// Then notify each applicant
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `update()` close path
- `apps/api/src/jobs/job-expiry.service.ts` — `expireOldJobs()`

---

### M-2 — Slug-Based Detail Cache Never Invalidated on Update/Delete

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Cache Invalidation |

**Description**  
`findOne()` caches with key `detail:{param}` where param may be a slug. `update()` and `remove()` invalidate only `detail:{uuid}`. If the first access was via slug, the slug-keyed cache entry is never cleaned and serves stale data for up to 10 minutes after any change.

**Reproduction Scenario**
```
GET /jobs/driver-needed-muscat   → cached as: detail:driver-needed-muscat
PATCH /jobs/:uuid { title: 'new' } → deletes: detail:{uuid}  ✓
                                  → leaves: detail:driver-needed-muscat  ✗ (stale)
```

**Suggested Fix**
```typescript
// jobs.service.ts — update() and remove()
if (job.slug) await this.redis.del(this.cacheKey(`detail:${job.slug}`));
await this.redis.del(this.cacheKey(`detail:${id}`));
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `update()`, `remove()`

---

### M-3 — Cron Expiry Does Not Update Meilisearch

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Search Consistency |

**Description**  
`expireOldJobs()` updates Postgres but does not remove expired jobs from Meilisearch. Expired jobs remain fully searchable indefinitely after the 04:00 cron run. Users clicking a search result hit a job that returns "EXPIRED" status or cannot accept applications.

**Suggested Fix**
```typescript
// job-expiry.service.ts — after updateMany
const expiredIds = await this.prisma.driverJob.findMany({
  where: { status: 'EXPIRED', updatedAt: { gte: new Date(Date.now() - 60_000) } },
  select: { id: true },
});
for (const { id } of expiredIds) {
  this.searchService.removeDocument(INDEXES.JOBS, id).catch(err =>
    this.logger.warn(`Search removal failed for expired job ${id}`, err)
  );
}
```

**Files Involved**
- `apps/api/src/jobs/job-expiry.service.ts`

---

### M-4 — Cron Expiry Does Not Invalidate Redis List Caches

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Cache Invalidation |

**Description**  
After `expireOldJobs()` marks jobs as EXPIRED in Postgres, the `jobs:list:*` Redis keys are not flushed. The public jobs listing continues serving expired jobs as ACTIVE for up to 5 minutes (the list cache TTL).

**Suggested Fix**
```typescript
// job-expiry.service.ts — after updateMany, if count > 0
await this.redis.delPattern('jobs:list:*');
this.logger.log(`Expired ${count} jobs, Redis list cache flushed`);
```

**Files Involved**
- `apps/api/src/jobs/job-expiry.service.ts`

---

### M-5 — No Notification When Job Expires or Closes

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Notifications |

**Description**  
Two notification gaps exist: (1) The cron job marks jobs as EXPIRED without notifying the job owner. (2) When an employer closes a job manually, neither the owner nor pending applicants receive a notification. Affected parties have no way to know the status changed without manually refreshing the dashboard.

**Impact**  
Job owners are unaware their post expired and needs renewal. Applicants wait indefinitely for a decision that will never come.

**Suggested Fix**  
In `expireOldJobs()`, notify each job owner after marking EXPIRED. In the close flow of `update()`, notify pending applicants with an appropriate "job closed" type.

**Files Involved**
- `apps/api/src/jobs/job-expiry.service.ts`
- `apps/api/src/jobs/jobs.service.ts` — `update()` close path

---

### M-6 — `UpdateJobDto` Allows Mutating `jobType` Post-Creation

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Business Logic |

**Description**  
`UpdateJobDto` includes `jobType` as an optional field. An employer can change a `HIRING` job to `OFFERING` after applicants have already applied with their DriverProfile. This changes the semantic type of the post and can invalidate all existing applications.

**Suggested Fix**
```typescript
// update-job.dto.ts
export class UpdateJobDto extends PartialType(OmitType(CreateJobDto, ['jobType'] as const)) {}
```

**Files Involved**
- `apps/api/src/jobs/dto/update-job.dto.ts`

---

### M-7 — No Cross-Field Validation: `minAge > maxAge` Accepted

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Business Logic / Validation |

**Description**  
`CreateJobDto` and `UpdateJobDto` validate each age field independently (`@Min(18)`, `@Max(70)`) but have no cross-field check that `minAge < maxAge`. A job with `minAge: 65, maxAge: 25` is accepted without error.

**Suggested Fix**
```typescript
// jobs.service.ts — create() and update()
if (dto.minAge !== undefined && dto.maxAge !== undefined && dto.minAge >= dto.maxAge) {
  throw new BadRequestException('minAge must be less than maxAge');
}
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — `create()`, `update()`
- `apps/api/src/jobs/dto/create-job.dto.ts`

---

### M-8 — `req.ip` Broken Behind Load Balancer

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Infrastructure |

**Description**  
`ViewCountHelper.incrementViewCount()` uses `req.ip` as the per-user deduplication key. Behind a reverse proxy or load balancer (nginx, AWS ALB), `req.ip` returns the proxy's IP. All users share the same IP, so only the first visitor per hour increments the counter; all subsequent views are silently dropped.

**Suggested Fix**
```typescript
// view-count.helper.ts
const clientIp =
  (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.ip;
```
Also configure Express `trust proxy` in `main.ts` to the correct hop count for your deployment.

**Files Involved**
- `apps/api/src/common/utils/view-count.helper.ts`
- `apps/api/src/main.ts` — Express `trust proxy` setting

---

### M-9 — Search and Notification Errors Silently Swallowed

| Field | Value |
|-------|-------|
| **Severity** | 🟡 Medium |
| **Category** | Observability |

**Description**  
All `searchService.*` calls are either not awaited or wrapped in empty `.catch(() => {})`. Similarly, notification `Promise.allSettled` results are never inspected. Any failure in Meilisearch or the notifications service produces zero log output, making operational debugging impossible.

**Suggested Fix**
```typescript
// Replace empty catch with structured logging
this.searchService.indexJob(job).catch(err =>
  this.logger.error(`Search indexing failed for job ${job.id}`, err.stack)
);

// Inspect allSettled results
const results = await Promise.allSettled(notificationPromises);
results.forEach((r, i) => {
  if (r.status === 'rejected')
    this.logger.warn(`Notification failed for user ${recipientIds[i]}`, r.reason);
});
```

**Files Involved**
- `apps/api/src/jobs/jobs.service.ts` — all search and notification call sites
- `apps/api/src/jobs/job-expiry.service.ts`
- `apps/api/src/jobs/admin-jobs.service.ts`

---

## Low

---

### L-1 — Non-Atomic Redis GET→SET for View Count

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Data Integrity |

**Description**  
`ViewCountHelper` performs `redis.get(key)` then `redis.set(key, '1', 'EX', 3600)` as two separate commands. Under high concurrency, two requests can both read `null` and both set the key, causing a double view count for one user session.

**Suggested Fix**
```typescript
const isNew = await this.redis.set(viewKey, '1', 'NX', 'EX', 3600);
if (isNew) {
  await this.prisma.driverJob.update({ where: { id: jobId }, data: { viewCount: { increment: 1 } } });
}
```

**Files Involved**
- `apps/api/src/common/utils/view-count.helper.ts`

---

### L-2 — `resumeUrl` Accepts Arbitrary External URLs

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Security |

**Description**  
`ApplyJobDto.resumeUrl` is validated as a URL string only. A malicious applicant can submit a URL pointing to a phishing page or malware host. The job owner sees a clickable "Resume" link in the applications panel and may follow it.

**Suggested Fix**  
Restrict to platform storage domains:
```typescript
@Matches(/^https:\/\/cdn\.yourdomain\.com\//, { message: 'resumeUrl must point to platform storage' })
resumeUrl?: string;
```
Better: enforce a pre-signed upload flow so raw external URLs are never accepted.

**Files Involved**
- `apps/api/src/jobs/dto/apply-job.dto.ts`

---

### L-3 — No Rate Limiting on `POST /:id/apply`

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Security |

**Description**  
The apply endpoint has no per-user rate limit beyond the DB unique constraint (one application per job per user). A bot can apply to every open job in a tight loop.

**Suggested Fix**
```typescript
// jobs.controller.ts — apply() route
@UseGuards(JwtAuthGuard, ThrottlerGuard)
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 applications per minute
@Post(':id/apply')
apply(...) { ... }
```

**Files Involved**
- `apps/api/src/jobs/jobs.controller.ts` — `apply()` route

---

### L-4 — `user.phone` Exposed in All Public Endpoints

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Data Leakage |

**Description**  
The `USER_SELECT` constant in `driver-profile.service.ts` and `employer-profile.service.ts` includes `phone: true`. This select is used in public endpoints (`GET /jobs/drivers/:id`, `GET /jobs/:id`) that require no authentication. Any anonymous visitor can enumerate all phone numbers via pagination.

**Suggested Fix**  
Remove `phone` from the public `USER_SELECT`. Expose phone only on the private `me` endpoint (profile owner) and to authenticated job owners viewing a specific applicant.

**Files Involved**
- `apps/api/src/jobs/driver-profile.service.ts` — `USER_SELECT`
- `apps/api/src/jobs/employer-profile.service.ts` — `USER_SELECT`
- `apps/api/src/jobs/jobs.service.ts` — `findOne()` user select

---

### L-5 — `expiresAt` Schema Field Never Populated

| Field | Value |
|-------|-------|
| **Severity** | 🔵 Low |
| **Category** | Data Integrity / Schema Debt |

**Description**  
`DriverJob` has an `expiresAt DateTime?` column that is never set during `create()` or `update()`. The cron job computes expiry as `createdAt + 30 days` at runtime. The field is dead weight that misleads future developers into thinking per-job expiry customisation is implemented.

**Suggested Fix**  
Either: (a) Remove `expiresAt` from the schema (migration required) and document the 30-day constant. OR (b) Set `expiresAt = new Date(Date.now() + 30 * 86400_000)` during `create()` and update the cron to query `WHERE expiresAt <= NOW()` — enabling per-job customisation in the future.

**Files Involved**
- `apps/api/prisma/schema.prisma` — `DriverJob.expiresAt`
- `apps/api/src/jobs/jobs.service.ts` — `create()`
- `apps/api/src/jobs/job-expiry.service.ts` — `expireOldJobs()`

---

## Fix Priority Roadmap

### Sprint 1 — Block Production Deploy (Critical)
| # | ID | Action |
|---|----|----|
| 1 | C-4 | Make notification in `apply()` best-effort post-commit |
| 2 | C-1 | Add CAS guard to `updateApplicationStatus()` |
| 3 | C-2 | Notify ACCEPTED applicants on job deletion |
| 4 | C-3 | Add Redis NX lock to `expireOldJobs()` |

### Sprint 2 — High Impact (Before Next Traffic Milestone)
| # | ID | Action |
|---|----|----|
| 5 | H-1 | Add profile-type check in `apply()` |
| 6 | H-2 | Enforce EXPIRED → ACTIVE blocked in state machine |
| 7 | H-3 | Guard `updateApplicationStatus()` against CLOSED/EXPIRED jobs |
| 8 | H-5 | Block WITHDRAWN status in employer endpoint |
| 9 | H-6 | Add `AdminGuard` to frontend admin pages |
| 10 | H-7 | Remove `as any` from admin `updateJob()` |
| 11 | H-8 | Add pagination to `getApplications()` |
| 12 | H-9 | Add pagination to `myApplications()` |
| 13 | H-10 | Fix `useCloseJob` to invalidate `['job', id]` |

### Sprint 3 — Planned Tech-Debt
| # | ID | Action |
|---|----|----|
| 14 | M-2 | Fix slug-based cache invalidation |
| 15 | M-3 | Remove expired jobs from Meilisearch in cron |
| 16 | M-4 | Flush Redis list cache in cron expiry |
| 17 | M-1 | Auto-close PENDING applications on job close/expiry |
| 18 | M-5 | Add notifications for expiry/close events |
| 19 | M-9 | Replace silent swallowing with structured logging |
| 20 | M-8 | Fix `req.ip` + configure `trust proxy` |
| 21 | M-6 | Remove `jobType` from `UpdateJobDto` |
| 22 | M-7 | Add `minAge < maxAge` cross-field validation |
| 23 | H-4 | Add `maxHires` enforcement |

### Sprint 4 — Quality & Polish
| # | ID | Action |
|---|----|----|
| 24 | L-4 | Remove `phone` from public USER_SELECT |
| 25 | L-1 | Use atomic `SET NX` for view count |
| 26 | L-2 | Restrict `resumeUrl` to platform domains |
| 27 | L-3 | Add `ThrottlerGuard` to apply route |
| 28 | L-5 | Decide on `expiresAt` — use it or remove it |

---

## What Is Already Working Correctly

- **IDOR prevention**: Ownership checked on every application read/write/delete ✅
- **Duplicate application prevention**: `@@unique([jobId, applicantId])` + `ConflictException` ✅
- **Self-apply guard**: `job.userId === applicantId` rejected at service layer ✅
- **Admin route authorization**: All `/admin/*` endpoints guarded with `@Roles('ADMIN')` + `RolesGuard` ✅
- **Verification flow**: `isVerified` can only be set by admin review — no bypass path ✅
- **View count rate-limiting**: Redis per-IP + 1hr TTL prevents simple inflation ✅
- **ValidationPipe**: Global `whitelist: true, forbidNonWhitelisted: true` blocks unknown fields ✅
- **Slug uniqueness**: `generateSlug` always appends a timestamp suffix — no silent collision ✅
- **Polymorphic orphan cleanup**: `cleanupPolymorphicOrphans` called on user `remove()` ✅
