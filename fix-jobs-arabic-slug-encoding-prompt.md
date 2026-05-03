# Agent Prompt — Fix Arabic Slug URL Encoding in Jobs Controller

---

## Context

SouqOne — NestJS backend.
Job slugs contain Arabic characters (e.g. `سائق-معدات-ثقيلة-mogrya5r`).
Browser encodes them to `%D8%B3%D8%A7%D8%A6%D9%82...` in the URL.
NestJS receives the encoded string — `findFirst` can't match it against the DB slug.

**Fix:** `decodeURIComponent(id)` before passing to service in ALL job endpoints that accept `:id`.

---

## File to Edit

```
apps/api/src/jobs/jobs.controller.ts
```

Read the full file before editing.

---

## Apply This Fix to ALL These Endpoints

Find every method that has `@Param('id') id: string` and calls a service method.
Apply `decodeURIComponent` to each one.

### Pattern to apply:

```ts
// BEFORE:
findOne(@Param('id') id: string, @Req() req: Request) {
  return this.jobsService.findOne(id, req.ip);
}

// AFTER:
findOne(@Param('id') id: string, @Req() req: Request) {
  return this.jobsService.findOne(decodeURIComponent(id), req.ip);
}
```

### Apply to these methods:

```
findOne          → jobsService.findOne
update           → jobsService.update
remove           → jobsService.remove
apply            → jobsService.apply
getApplications  → jobsService.getApplications
inviteDriver     → jobInviteService.invite
getSentInvites   → jobInviteService.getSentInvites
```

**Do NOT apply to:**
```
updateApplicationStatus   ← uses applicationId not jobId
withdrawApplication       ← uses applicationId not jobId
payForApplication         ← uses applicationId not jobId
releaseEscrow             ← uses escrowId
disputeEscrow             ← uses escrowId
reviewVerification        ← admin endpoint
```

---

## Validation

```bash
cd apps/api
npx tsc --noEmit
```

Manual test after deploy:
```bash
# Arabic slug should return 200:
curl "http://localhost:4000/api/v1/jobs/سائق-معدات-ثقيلة-mogrya5r"

# Encoded slug should also return 200:
curl "http://localhost:4000/api/v1/jobs/%D8%B3%D8%A7%D8%A6%D9%82-mogrya5r"
```

---

## Commit

```bash
git add apps/api/src/jobs/jobs.controller.ts
git commit -m "fix(jobs): decodeURIComponent for Arabic slugs in job endpoints"
git push
```

---

## Hard Rules

- ❌ Do NOT change service methods
- ❌ Do NOT change admin endpoints
- ❌ Do NOT apply to application/escrow/verification endpoints
- ✅ Only wrap `id` param with `decodeURIComponent()` before passing to service
- ✅ Apply to ALL job-id endpoints listed above
- ✅ Run `npx tsc --noEmit` after edit
