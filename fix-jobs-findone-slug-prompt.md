# Agent Prompt — Fix Jobs findOne: Accept Slug or ID

---

## Context

SouqOne — NestJS backend on Railway.
Job detail URLs use slugs (e.g. `سائق-معدات-ثقيلة-mogrya5r`).
The frontend passes the full slug to `GET /jobs/:id`.
The backend `findOne` currently does `where: { id }` which only matches UUID → returns 404.

**Fix:** Accept both `id` (UUID) and `slug` in `findOne`.

---

## File to Edit

```
apps/api/src/jobs/jobs.service.ts
```

Read the full file before editing.

---

## The Fix

Find the `findOne` method. It currently has:

```ts
const job = cached ?? await this.prisma.driverJob.findUnique({
  where: { id },
  include: { ... },
});
```

**Replace `findUnique` with `findFirst` + OR condition:**

```ts
const job = cached ?? await this.prisma.driverJob.findFirst({
  where: {
    OR: [
      { id },
      { slug: id },
    ],
  },
  include: {
    // keep exact same include as before — do NOT change
  },
});
```

**Why `findFirst` not `findUnique`:**
```
findUnique → only accepts single unique field
findFirst  → accepts OR conditions ✅
```

---

## Validation

```bash
cd apps/api
npx tsc --noEmit
```

Manual test:
```bash
# Test with slug:
curl http://localhost:4000/api/v1/jobs/سائق-معدات-ثقيلة-mogrya5r

# Test with UUID:
curl http://localhost:4000/api/v1/jobs/[actual-uuid]

# Both should return 200 with job data
```

---

## Hard Rules

- ❌ Do NOT change the include block
- ❌ Do NOT change cache logic
- ❌ Do NOT change view count logic
- ✅ Only change `findUnique` → `findFirst` + OR condition
- ✅ Run `npx tsc --noEmit` after edit
- ✅ Commit and push to trigger Railway deploy
