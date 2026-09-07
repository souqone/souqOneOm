# 005 — Duplicate Profile Audit and Cleanup Report

**Date:** 2026-09-07  
**Vertical:** Operators (`operator_listings`)  
**Database:** Neon PostgreSQL (`ep-lucky-violet-am7554ay-pooler`)  
**Scope:** One-time data maintenance — NO application code modified.

---

## 1. Exactly What Was Done

1. **Step 1 Read-Only Audit:**
   - Executed SQL queries to find any `userId` in `OperatorListing` with count > 1.
   - Verified both literal model name (`"OperatorListing"`) and underlying PostgreSQL table name (`"operator_listings"`, mapped via `@@map("operator_listings")` in `schema.prisma` line 1471).
   - Found **1 user** with duplicate profiles: `userId = "cmnkvxvcz0000ra6s0ygryofv"` having **7 total listings**.
   - Total rows before cleanup: **7**. Distinct users: **1**.

2. **Step 2 Maintenance Cleanup:**
   - Created standalone script `apps/api/scripts/ts/cleanup-operator-duplicates.ts`.
   - Executed atomic Prisma transaction per affected user:
     - Ordered user's `OperatorListing` records by `createdAt DESC`.
     - **Kept newest record intact:** ID `cmsxoke9u0053mv0xnswaushk` (Title: `"مشغل حفار محترف"`, CreatedAt: `2026-08-17T20:22:41.730Z`).
     - **Deleted 6 older duplicate records:**
       1. `cmqmrt922000uq40p9d58xjkm` ("مشغل حفار", `2026-06-20T19:48:41.046Z`)
       2. `cmo11du06002rra5cguv9jv7c` ("مشغل بلدوزر وجرافة", `2026-04-16T05:26:17.382Z`)
       3. `cmo11dtt2002pra5cmnr1g8qu` ("فني صيانة مولدات كهربائية", `2026-04-16T05:26:17.127Z`)
       4. `cmo11dtg9002nra5cpm77io1l` ("فني صيانة معدات هيدروليك", `2026-04-16T05:26:16.666Z`)
       5. `cmo11dtbx002lra5cjwwg4z0y` ("مشغل رافعة برجية معتمد", `2026-04-16T05:26:16.510Z`)
       6. `cmo11dt2q002jra5cay11l2aj` ("سائق معدات ثقيلة - خبرة 10 سنوات", `2026-04-16T05:26:16.179Z`)
     - **Created 6 Outbox Events** with `entityType: ENTITY_TYPES.OPERATOR_LISTING` (`'OPERATOR_LISTING'`), `action: 'DELETE'` for Meilisearch search-sync consistency.
     - **Cleaned polymorphic orphans** (`Favorite`, `Conversation`, `Review`) for all 6 deleted IDs.
   - Re-ran audit queries: confirmed **0 duplicate users remaining**, total rows = **1**, distinct users = **1**.
   - Zero modifications to `operators.service.ts`, `operators.controller.ts`, or any DTO.

---

## 2. Full List of Files Inspected / Created / Touched

| Action | Path |
|---|---|
| Created | `apps/api/scripts/ts/audit-operator-duplicates.ts` (Step 1 audit runner) |
| Created | `apps/api/scripts/ts/cleanup-operator-duplicates.ts` (Step 2 cleanup runner) |
| Created | `docs/operatorsMD/005-duplicate-profile-audit-and-cleanup.md` (this report) |
| Inspected | `apps/api/prisma/schema.prisma` |
| Inspected | `apps/api/src/operators/operators.service.ts` |
| Inspected | `apps/api/src/prisma/prisma.service.ts` |
| Inspected | `apps/api/src/common/constants/entity-types.constants.ts` |

---

## 3. Real Before / After Raw Data

### 3A. STEP 1 — Raw Output Before Cleanup

#### Query 1: Literal `"OperatorListing"` vs Mapped Table `"operator_listings"`
*Note: In PostgreSQL, `schema.prisma` defines `@@map("operator_listings")`, so the underlying table is `"operator_listings"`.*

```
--- 1A: Literal Query with "OperatorListing" ---
Invalid `prisma.$queryRawUnsafe()` invocation:
Raw query failed. Code: `42P01`. Message: `relation "OperatorListing" does not exist`
Reason: In schema.prisma line 1471, model OperatorListing has @@map("operator_listings").
```

#### Query 1 (Mapped Table): Duplicate Users
```sql
SELECT "userId", COUNT(*) as cnt
FROM "operator_listings"
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
```
**Raw JSON Output:**
```json
[
  {
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "cnt": "7"
  }
]
```
```
┌─────────┬─────────────────────────────┬─────┐
│ (index) │ userId                      │ cnt │
├─────────┼─────────────────────────────┼─────┤
│ 0       │ 'cmnkvxvcz0000ra6s0ygryofv' │ '7' │
└─────────┴─────────────────────────────┴─────┘
```

#### Query 2: Total OperatorListing Rows
```sql
SELECT COUNT(*) FROM "operator_listings";
```
**Raw JSON Output:**
```json
[
  {
    "count": "7"
  }
]
```

#### Query 3: Distinct User Count
```sql
SELECT COUNT(DISTINCT "userId") FROM "operator_listings";
```
**Raw JSON Output:**
```json
[
  {
    "count": "1"
  }
]
```

#### Query 4: Detailed Listings for `userId = "cmnkvxvcz0000ra6s0ygryofv"`
```sql
SELECT id, "userId", title, "createdAt"
FROM "operator_listings"
WHERE "userId" = 'cmnkvxvcz0000ra6s0ygryofv'
ORDER BY "createdAt" DESC;
```
**Raw JSON Output:**
```json
[
  {
    "id": "cmsxoke9u0053mv0xnswaushk",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل حفار محترف",
    "createdAt": "2026-08-17T20:22:41.730Z"
  },
  {
    "id": "cmqmrt922000uq40p9d58xjkm",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل حفار",
    "createdAt": "2026-06-20T19:48:41.046Z"
  },
  {
    "id": "cmo11du06002rra5cguv9jv7c",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل بلدوزر وجرافة",
    "createdAt": "2026-04-16T05:26:17.382Z"
  },
  {
    "id": "cmo11dtt2002pra5cmnr1g8qu",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "فني صيانة مولدات كهربائية",
    "createdAt": "2026-04-16T05:26:17.127Z"
  },
  {
    "id": "cmo11dtg9002nra5cpm77io1l",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "فني صيانة معدات هيدروليك",
    "createdAt": "2026-04-16T05:26:16.666Z"
  },
  {
    "id": "cmo11dtbx002lra5cjwwg4z0y",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل رافعة برجية معتمد",
    "createdAt": "2026-04-16T05:26:16.510Z"
  },
  {
    "id": "cmo11dt2q002jra5cay11l2aj",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "سائق معدات ثقيلة - خبرة 10 سنوات",
    "createdAt": "2026-04-16T05:26:16.179Z"
  }
]
```

---

### 3B. STEP 2 — Cleanup Execution and Post-Verification

#### Record Kept:
- **ID:** `cmsxoke9u0053mv0xnswaushk`
- **Title:** `مشغل حفار محترف`
- **CreatedAt:** `2026-08-17T20:22:41.730Z`
- **Status:** `ACTIVE`

#### Records Deleted (6 IDs):
1. `cmqmrt922000uq40p9d58xjkm` ("مشغل حفار", `2026-06-20T19:48:41.046Z`)
2. `cmo11du06002rra5cguv9jv7c` ("مشغل بلدوزر وجرافة", `2026-04-16T05:26:17.382Z`)
3. `cmo11dtt2002pra5cmnr1g8qu` ("فني صيانة مولدات كهربائية", `2026-04-16T05:26:17.127Z`)
4. `cmo11dtg9002nra5cpm77io1l` ("فني صيانة معدات هيدروليك", `2026-04-16T05:26:16.666Z`)
5. `cmo11dtbx002lra5cjwwg4z0y` ("مشغل رافعة برجية معتمد", `2026-04-16T05:26:16.510Z`)
6. `cmo11dt2q002jra5cay11l2aj` ("سائق معدات ثقيلة - خبرة 10 سنوات", `2026-04-16T05:26:16.179Z`)

#### Outbox Events Created:
- **Total Created:** 6 rows in table `"outbox_events"`
- **Entity Type:** `OPERATOR_LISTING`
- **Action:** `DELETE`

#### Polymorphic Orphan Cleanup:
- **Favorites Deleted:** 0
- **Conversations Deleted:** 0
- **Reviews Deleted:** 0

---

### 3C. Post-Cleanup Verification Queries (Raw Output)

#### Query 1: Duplicates Check
```sql
SELECT "userId", COUNT(*) as cnt
FROM "operator_listings"
GROUP BY "userId"
HAVING COUNT(*) > 1
ORDER BY cnt DESC;
```
**Raw JSON Output:**
```json
[]
```
```
┌─────────┐
│ (index) │
├─────────┤
└─────────┘
```
*(Zero rows returned — duplicate state completely eliminated)*

#### Query 2: Total OperatorListing Rows
```sql
SELECT COUNT(*) FROM "operator_listings";
```
**Raw JSON Output:**
```json
[
  {
    "count": "1"
  }
]
```

#### Query 3: Distinct User Count
```sql
SELECT COUNT(DISTINCT "userId") FROM "operator_listings";
```
**Raw JSON Output:**
```json
[
  {
    "count": "1"
  }
]
```

#### Remaining Record in Database:
```
┌─────────┬─────────────────────────────┬─────────────────────────────┬───────────────────┬──────────────────────────┬──────────┐
│ (index) │ id                          │ userId                      │ title             │ createdAt                │ status   │
├─────────┼─────────────────────────────┼─────────────────────────────┼───────────────────┼──────────────────────────┼──────────┤
│ 0       │ 'cmsxoke9u0053mv0xnswaushk' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'مشغل حفار محترف' │ 2026-08-17T20:22:41.730Z │ 'ACTIVE' │
└─────────┴─────────────────────────────┴─────────────────────────────┴───────────────────┴──────────────────────────┴──────────┘
```

---

## 4. Real Terminal Output with Exit Codes

### Command 1: Step 1 Audit Script Execution
```bash
npx tsx scripts/ts/audit-operator-duplicates.ts
```
**Exit Code:** `0`  
**Raw Terminal Output:**
```
====================================================
STEP 1: RAW SQL AUDIT ON "OperatorListing" vs "operator_listings"
Database URL configured: true
====================================================

--- 1A: Literal Query with "OperatorListing" ---
Error executing against "OperatorListing": 
Invalid `prisma.$queryRawUnsafe()` invocation:


Raw query failed. Code: `42P01`. Message: `relation "OperatorListing" does not exist`
Reason: In schema.prisma line 1471, model OperatorListing has @@map("operator_listings").

--- 1B: Query on mapped table "operator_listings" ---
Query: SELECT "userId", COUNT(*) as cnt FROM "operator_listings" GROUP BY "userId" HAVING COUNT(*) > 1 ORDER BY cnt DESC;
Result (raw JSON): [
  {
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "cnt": "7"
  }
]
┌─────────┬─────────────────────────────┬─────┐
│ (index) │ userId                      │ cnt │
├─────────┼─────────────────────────────┼─────┤
│ 0       │ 'cmnkvxvcz0000ra6s0ygryofv' │ '7' │
└─────────┴─────────────────────────────┴─────┘

Query: SELECT COUNT(*) FROM "operator_listings";
Result (raw JSON): [
  {
    "count": "7"
  }
]
┌─────────┬───────┐
│ (index) │ count │
├─────────┼───────┤
│ 0       │ '7'   │
└─────────┴───────┘

Query: SELECT COUNT(DISTINCT "userId") FROM "operator_listings";
Result (raw JSON): [
  {
    "count": "1"
  }
]
┌─────────┬───────┐
│ (index) │ count │
├─────────┼───────┤
│ 0       │ '1'   │
└─────────┴───────┘

--- 1C: Prisma ORM Level Verification ---
prisma.operatorListing.count(): 7
prisma.operatorListing distinct user count: 1

--- 1D: Detailed listings for 1 duplicate user(s) ---

Query for userId: cmnkvxvcz0000ra6s0ygryofv
Raw output for cmnkvxvcz0000ra6s0ygryofv: [
  {
    "id": "cmsxoke9u0053mv0xnswaushk",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل حفار محترف",
    "createdAt": "2026-08-17T20:22:41.730Z"
  },
  {
    "id": "cmqmrt922000uq40p9d58xjkm",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل حفار",
    "createdAt": "2026-06-20T19:48:41.046Z"
  },
  {
    "id": "cmo11du06002rra5cguv9jv7c",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل بلدوزر وجرافة",
    "createdAt": "2026-04-16T05:26:17.382Z"
  },
  {
    "id": "cmo11dtt2002pra5cmnr1g8qu",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "فني صيانة مولدات كهربائية",
    "createdAt": "2026-04-16T05:26:17.127Z"
  },
  {
    "id": "cmo11dtg9002nra5cpm77io1l",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "فني صيانة معدات هيدروليك",
    "createdAt": "2026-04-16T05:26:16.666Z"
  },
  {
    "id": "cmo11dtbx002lra5cjwwg4z0y",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "مشغل رافعة برجية معتمد",
    "createdAt": "2026-04-16T05:26:16.510Z"
  },
  {
    "id": "cmo11dt2q002jra5cay11l2aj",
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "title": "سائق معدات ثقيلة - خبرة 10 سنوات",
    "createdAt": "2026-04-16T05:26:16.179Z"
  }
]
┌─────────┬─────────────────────────────┬─────────────────────────────┬────────────────────────────────────┬──────────────────────────┐
│ (index) │ id                          │ userId                      │ title                              │ createdAt                │
├─────────┼─────────────────────────────┼─────────────────────────────┼────────────────────────────────────┼──────────────────────────┤
│ 0       │ 'cmsxoke9u0053mv0xnswaushk' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'مشغل حفار محترف'                  │ 2026-08-17T20:22:41.730Z │
│ 1       │ 'cmqmrt922000uq40p9d58xjkm' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'مشغل حفار'                        │ 2026-06-20T19:48:41.046Z │
│ 2       │ 'cmo11du06002rra5cguv9jv7c' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'مشغل بلدوزر وجرافة'               │ 2026-04-16T05:26:17.382Z │
│ 3       │ 'cmo11dtt2002pra5cmnr1g8qu' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'فني صيانة مولدات كهربائية'        │ 2026-04-16T05:26:17.127Z │
│ 4       │ 'cmo11dtg9002nra5cpm77io1l' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'فني صيانة معدات هيدروليك'         │ 2026-04-16T05:26:16.666Z │
│ 5       │ 'cmo11dtbx002lra5cjwwg4z0y' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'مشغل رافعة برجية معتمد'           │ 2026-04-16T05:26:16.510Z │
│ 6       │ 'cmo11dt2q002jra5cay11l2aj' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'سائق معدات ثقيلة - خبرة 10 سنوات' │ 2026-04-16T05:26:16.179Z │
└─────────┴─────────────────────────────┴─────────────────────────────┴────────────────────────────────────┴──────────────────────────┘

====================================================
STEP 1 AUDIT COMPLETED
====================================================
```

---

### Command 2: Step 2 Cleanup Script Execution
```bash
npx tsx scripts/ts/cleanup-operator-duplicates.ts
```
**Exit Code:** `0`  
**Raw Terminal Output:**
```
====================================================
STEP 2: CLEANUP OF OPERATOR_LISTING DUPLICATES
Database URL configured: true
====================================================

[BEFORE] Total OperatorListing rows in DB: 7
[AUDIT] Found 1 user(s) with duplicate OperatorListing rows:
┌─────────┬─────────────────────────────┬─────┐
│ (index) │ userId                      │ cnt │
├─────────┼─────────────────────────────┼─────┤
│ 0       │ 'cmnkvxvcz0000ra6s0ygryofv' │ '7' │
└─────────┴─────────────────────────────┴─────┘

----------------------------------------------------
Processing duplicates for userId: cmnkvxvcz0000ra6s0ygryofv (Count: 7)
  -> KEEPING newest listing: ID=cmsxoke9u0053mv0xnswaushk | Title="مشغل حفار محترف" | CreatedAt=2026-08-17T20:22:41.730Z
  -> MARKED TO DELETE: ID=cmqmrt922000uq40p9d58xjkm | Title="مشغل حفار" | CreatedAt=2026-06-20T19:48:41.046Z
  -> MARKED TO DELETE: ID=cmo11du06002rra5cguv9jv7c | Title="مشغل بلدوزر وجرافة" | CreatedAt=2026-04-16T05:26:17.382Z
  -> MARKED TO DELETE: ID=cmo11dtt2002pra5cmnr1g8qu | Title="فني صيانة مولدات كهربائية" | CreatedAt=2026-04-16T05:26:17.127Z
  -> MARKED TO DELETE: ID=cmo11dtg9002nra5cpm77io1l | Title="فني صيانة معدات هيدروليك" | CreatedAt=2026-04-16T05:26:16.666Z
  -> MARKED TO DELETE: ID=cmo11dtbx002lra5cjwwg4z0y | Title="مشغل رافعة برجية معتمد" | CreatedAt=2026-04-16T05:26:16.510Z
  -> MARKED TO DELETE: ID=cmo11dt2q002jra5cay11l2aj | Title="سائق معدات ثقيلة - خبرة 10 سنوات" | CreatedAt=2026-04-16T05:26:16.179Z
  -> Created 6 outbox DELETE events.
  -> Cleaned polymorphic orphans: Favorites=0, Conversations=0, Reviews=0
  -> Successfully deleted 6 duplicate OperatorListing row(s).

====================================================
VERIFICATION AFTER CLEANUP
====================================================
[AFTER] Total OperatorListing rows in DB: 1 (Before: 7)
[AFTER] Total rows deleted: 6

[AFTER] Checking duplicate user query again:
Duplicates query result (raw JSON): []
┌─────────┐
│ (index) │
├─────────┤
└─────────┘

[AFTER] All remaining OperatorListing rows:
┌─────────┬─────────────────────────────┬─────────────────────────────┬───────────────────┬──────────────────────────┬──────────┐
│ (index) │ id                          │ userId                      │ title             │ createdAt                │ status   │
├─────────┼─────────────────────────────┼─────────────────────────────┼───────────────────┼──────────────────────────┼──────────┤
│ 0       │ 'cmsxoke9u0053mv0xnswaushk' │ 'cmnkvxvcz0000ra6s0ygryofv' │ 'مشغل حفار محترف' │ 2026-08-17T20:22:41.730Z │ 'ACTIVE' │
└─────────┴─────────────────────────────┴─────────────────────────────┴───────────────────┴──────────────────────────┴──────────┘

--- CLEANUP SUMMARY REPORT ---
[
  {
    "userId": "cmnkvxvcz0000ra6s0ygryofv",
    "kept": {
      "id": "cmsxoke9u0053mv0xnswaushk",
      "title": "مشغل حفار محترف",
      "createdAt": "2026-08-17T20:22:41.730Z"
    },
    "deleted": [
      {
        "id": "cmqmrt922000uq40p9d58xjkm",
        "title": "مشغل حفار",
        "createdAt": "2026-06-20T19:48:41.046Z"
      },
      {
        "id": "cmo11du06002rra5cguv9jv7c",
        "title": "مشغل بلدوزر وجرافة",
        "createdAt": "2026-04-16T05:26:17.382Z"
      },
      {
        "id": "cmo11dtt2002pra5cmnr1g8qu",
        "title": "فني صيانة مولدات كهربائية",
        "createdAt": "2026-04-16T05:26:17.127Z"
      },
      {
        "id": "cmo11dtg9002nra5cpm77io1l",
        "title": "فني صيانة معدات هيدروليك",
        "createdAt": "2026-04-16T05:26:16.666Z"
      },
      {
        "id": "cmo11dtbx002lra5cjwwg4z0y",
        "title": "مشغل رافعة برجية معتمد",
        "createdAt": "2026-04-16T05:26:16.510Z"
      },
      {
        "id": "cmo11dt2q002jra5cay11l2aj",
        "title": "سائق معدات ثقيلة - خبرة 10 سنوات",
        "createdAt": "2026-04-16T05:26:16.179Z"
      }
    ]
  }
]

====================================================
STEP 2 CLEANUP COMPLETED SUCCESSFULLY
====================================================
```

---

### Command 3: Final Post-Cleanup Re-Verification Script Execution
```bash
npx tsx scripts/ts/audit-operator-duplicates.ts
```
**Exit Code:** `0`  
**Raw Terminal Output:**
```
====================================================
STEP 1: RAW SQL AUDIT ON "OperatorListing" vs "operator_listings"
Database URL configured: true
====================================================

--- 1A: Literal Query with "OperatorListing" ---
Error executing against "OperatorListing": 
Invalid `prisma.$queryRawUnsafe()` invocation:


Raw query failed. Code: `42P01`. Message: `relation "OperatorListing" does not exist`
Reason: In schema.prisma line 1471, model OperatorListing has @@map("operator_listings").

--- 1B: Query on mapped table "operator_listings" ---
Query: SELECT "userId", COUNT(*) as cnt FROM "operator_listings" GROUP BY "userId" HAVING COUNT(*) > 1 ORDER BY cnt DESC;
Result (raw JSON): []
┌─────────┐
│ (index) │
├─────────┤
└─────────┘

Query: SELECT COUNT(*) FROM "operator_listings";
Result (raw JSON): [
  {
    "count": "1"
  }
]
┌─────────┬───────┐
│ (index) │ count │
├─────────┼───────┤
│ 0       │ '1'   │
└─────────┴───────┘

Query: SELECT COUNT(DISTINCT "userId") FROM "operator_listings";
Result (raw JSON): [
  {
    "count": "1"
  }
]
┌─────────┬───────┐
│ (index) │ count │
├─────────┼───────┤
│ 0       │ '1'   │
└─────────┴───────┘

--- 1C: Prisma ORM Level Verification ---
prisma.operatorListing.count(): 1
prisma.operatorListing distinct user count: 1

--- 1D: Duplicate User Details ---
Zero duplicate users found (duplicateUsers.length === 0).

====================================================
STEP 1 AUDIT COMPLETED
====================================================
```
