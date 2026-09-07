# 015 — Operator Review Validation & Stray Files Audit Report

**Session Date**: 2026-09-07  
**Branch**: `feature/operators-phase0`  
**Category**: Category A (Investigation + Code changes + local tests only; NO git push / merge, NO deletion of stray files)

---

## 1. PART 1 — Stray Untracked Files Investigation

### A) `DEPLOY_REPORT.md`
1. **First 20 Lines**:
```markdown
# Deployment Report - Cars Backend P0/P1/P2

## STEP 1: Pre-push Sanity Checks

### `npm run build`
The Turborepo build process successfully built all packages, including Next.js static generation and NestJS API compilation.
**Exit Code**: `0`

### `npm run typecheck` (tsc --noEmit equivalent)
Ran `npm run typecheck` via Turbo (which invokes `tsc --noEmit` across packages).
**Exit Code**: `0` (Success, no type errors).

### `npm run test`
The script did not exist at the root `package.json`, however tests like `health.e2e-spec.ts`, `listings-p1.e2e-spec.ts`, and `search.e2e-spec.ts` were added and committed.

### `npx prisma validate`
Validated the correct schema path at `apps/api/prisma/schema.prisma`.
**Exit Code**: `0`
**Output**:
```text
Environment variables loaded from .env
Prisma schema loaded from apps\api\prisma\schema.prisma
The schema at apps\api\prisma\schema.prisma is valid 🚀
```
```
2. **File Metadata & Timestamp**:
- **Path**: `DEPLOY_REPORT.md`
- **LastWriteTime**: `8/23/2026 6:14:51 AM`
- **Length**: `2,916 bytes`
3. **Reference Grep**:
- Command: `git grep -n "DEPLOY_REPORT"` → Exit Code `1` (0 matches).
- Explicit note on line 30 inside `DEPLOY_REPORT.md`:
  > *"Excluded `LISTING_BACKEND_P0_P1_P2_SPEC.md` as it is a scratch/doc file."*
- Pertains to commit `73620f9` (`feat: Cars backend P0/P1/P2 hardening`) pushed to `origin/souqOneAppchanges`.

---

### B) `LISTING_BACKEND_P0_P1_P2_SPEC.md`
1. **First 20 Lines**:
```markdown
# Listing Backend — P0 / P1 / P2 Production Specification

## Document Purpose

هذا الملف هو المرجع التنظيمي لمرحلة إغلاق الـBackend الخاص بمنصة الإعلانات.

الهدف النهائي:

```text
P0
↓
P1
↓
P2
↓
Final Backend Audit
↓
BACKEND PRODUCTION READY
↓
Native / Next.js
```

> **مهم:** الـNative App وNext.js خارج نطاق هذه المراحل حاليًا.

---

# 0. Scope — ما الذي نعتبره Listing Backend؟

الهدف هو جعل **منظومة Add Listing / Edit Listing العامة Production-Ready**.
```
2. **File Metadata & Timestamp**:
- **Path**: `LISTING_BACKEND_P0_P1_P2_SPEC.md`
- **LastWriteTime**: `8/20/2026 11:05:35 PM`
- **Length**: `17,084 bytes`
3. **Reference Grep**:
- Command: `git grep -n "LISTING_BACKEND_P0_P1_P2_SPEC"` → Exit Code `1` (0 matches).

---

### C) `apps/api/scripts/ts/test-conn.ts`
1. **Full Content (28 lines)**:
```typescript
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env.production') });

async function test(url: string, label: string) {
  console.log(`Testing ${label}: ${url.replace(/:[^:@]+@/, ':***@')}`);
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.$queryRawUnsafe('SELECT 1 as connected');
    console.log(`Success ${label}:`, res);
  } catch (e: any) {
    console.error(`Failed ${label}:`, e.message);
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  const poolerUrl = process.env.DATABASE_URL!;
  const directUrl = poolerUrl.replace('-pooler', '').replace('&channel_binding=require', '');
  await test(poolerUrl, 'POOLER');
  await test(directUrl, 'DIRECT');
}

main();
```
2. **File Metadata & Timestamp**:
- **Path**: `apps/api/scripts/ts/test-conn.ts`
- **LastWriteTime**: `9/7/2026 4:20:09 AM`
- **Length**: `862 bytes`
3. **Reference Grep**:
- Command: `git grep -n "test-conn" apps/api/` → Exit Code `1` (0 matches).

---

### Assessment of Provenance
- **`LISTING_BACKEND_P0_P1_P2_SPEC.md` & `DEPLOY_REPORT.md`**: Leftover specification and deployment documentation from August 20-23, 2026, generated during the earlier Cars Backend P0/P1/P2 hardening task on branch `souqOneAppchanges`. When branch `feature/operators-phase0` was branched off, untracked files remained in the local workspace working directory. Neither is referenced anywhere in the codebase.
- **`apps/api/scripts/ts/test-conn.ts`**: Leftover scratch script created earlier today (Sep 7, 2026, 4:20 AM) during report 006/007 to test Neon DB connectivity via direct vs pooler URLs against `.env.production`.
- **Action Taken**: None deleted or modified, preserving all three files untouched pending Mahmoud's explicit direction.

---

## 2. Exactly What Was Done in Code (PART 2)

### A) Modified `apps/api/src/reviews/reviews.service.ts`
- Added check inside `create()`:
  ```typescript
  if (dto.entityType === ENTITY_TYPES.OPERATOR_LISTING) {
    await this.validateOperatorReview(dto, reviewerId);
  }
  ```
- Implemented private method `validateOperatorReview(dto: CreateReviewDto, reviewerId: string)`:
  ```typescript
  private async validateOperatorReview(dto: CreateReviewDto, reviewerId: string) {
    const contactRecord = await this.prisma.conversation.findFirst({
      where: {
        entityType: ENTITY_TYPES.OPERATOR_LISTING,
        entityId: dto.entityId,
        participants: { some: { userId: reviewerId } },
        messages: { some: { senderId: reviewerId } },
      },
    });
    if (!contactRecord) {
      throw new BadRequestException('يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً');
    }
  }
  ```
- Checked field names against `Conversation` (`entityType`, `entityId`, `participants`, `messages`), `ConversationParticipant` (`userId`), and `Message` (`senderId`) in `apps/api/prisma/schema.prisma` — all matched 100%.

### B) Created Unit Tests: `apps/api/src/reviews/reviews.service.spec.ts`
Added 7 unit tests covering:
1. Self-review validation: throws 400 (`'لا يمكنك تقييم نفسك'`).
2. `validateOperatorReview`: throws 400 when no conversation exists between reviewer and operator.
3. `validateOperatorReview`: throws 400 when conversation exists but reviewer sent 0 messages.
4. `validateOperatorReview`: successfully creates review when conversation exists AND reviewer sent a message.
5. Regression test: `validateJobReview` throws 400 for `DRIVER_PROFILE` when no accepted application exists.
6. Regression test: `validateJobReview` succeeds for `DRIVER_PROFILE` when accepted application exists.
7. Regression test: `CARRIER_PROFILE` review throws 400 directing user to booking review endpoint.

### C) Updated E2E Tests: `apps/api/test/operators-phase0.e2e-spec.ts`
Added Section `3.5 POST /api/reviews (Operator Review Contact Requirement)`:
1. `Failure Case`: Reviewing operator without prior conversation returns 400 with `'يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً'`.
2. `Failure Case`: Reviewing operator with conversation where reviewer sent no message returns 400 with `'يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً'`.
3. `Success Case`: Reviewing operator with conversation AND a message sent by reviewer succeeds with HTTP 201 Created.

---

## 3. Full List of Files Touched / Created

| Status | File Path | Description |
|---|---|---|
| **MODIFIED** | `apps/api/src/reviews/reviews.service.ts` | Added `validateOperatorReview` validation and private method |
| **NEW** | `apps/api/src/reviews/reviews.service.spec.ts` | 7 unit tests for ReviewsService & operator review rules |
| **MODIFIED** | `apps/api/test/operators-phase0.e2e-spec.ts` | Added 3 E2E test cases for operator review workflow |
| **UNTOUCHED** | `DEPLOY_REPORT.md` | Inspected metadata, left untouched |
| **UNTOUCHED** | `LISTING_BACKEND_P0_P1_P2_SPEC.md` | Inspected metadata, left untouched |
| **UNTOUCHED** | `apps/api/scripts/ts/test-conn.ts` | Inspected metadata, left untouched |

---

## 4. Real Code Diffs

### Diff: `apps/api/src/reviews/reviews.service.ts`

```diff
diff --git a/apps/api/src/reviews/reviews.service.ts b/apps/api/src/reviews/reviews.service.ts
index 928f5e3..1548bda 100644
--- a/apps/api/src/reviews/reviews.service.ts
+++ b/apps/api/src/reviews/reviews.service.ts
@@ -41,6 +41,10 @@ export class ReviewsService {
       await this.validateJobReview(dto, reviewerId);
     }
 
+    if (dto.entityType === ENTITY_TYPES.OPERATOR_LISTING) {
+      await this.validateOperatorReview(dto, reviewerId);
+    }
+
     let review;
     try {
       review = await this.prisma.review.create({
@@ -185,6 +189,20 @@ export class ReviewsService {
     }
   }
 
+  private async validateOperatorReview(dto: CreateReviewDto, reviewerId: string) {
+    const contactRecord = await this.prisma.conversation.findFirst({
+      where: {
+        entityType: ENTITY_TYPES.OPERATOR_LISTING,
+        entityId: dto.entityId,
+        participants: { some: { userId: reviewerId } },
+        messages: { some: { senderId: reviewerId } },
+      },
+    });
+    if (!contactRecord) {
+      throw new BadRequestException('يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً');
+    }
+  }
+
   private async recalculateUserRating(userId: string) {
     const result = await this.prisma.review.aggregate({
       where: { revieweeId: userId },
```

---

## 5. Real Terminal Output & Exit Codes

### Command 1: Stray Files Timestamps
Command:
```powershell
Get-Item "DEPLOY_REPORT.md", "LISTING_BACKEND_P0_P1_P2_SPEC.md", "apps/api/scripts/ts/test-conn.ts" | Select-Object Name, LastWriteTime, Length
```
Output:
```
Name                             LastWriteTime         Length
----                             -------------         ------
DEPLOY_REPORT.md                 8/23/2026 6:14:51 AM    2916
LISTING_BACKEND_P0_P1_P2_SPEC.md 8/20/2026 11:05:35 PM  17084
test-conn.ts                     9/7/2026 4:20:09 AM      862
```
Exit Code: `0`

---

### Command 2: Stray Files References Check
Command:
```bash
git grep -n "DEPLOY_REPORT"
git grep -n "LISTING_BACKEND_P0_P1_P2_SPEC"
git grep -n "test-conn" apps/api/
```
Output:
```
(empty output across all 3 commands)
```
Exit Code: `1` *(0 matches found)*

---

### Command 3: Unit Tests for ReviewsService
Command:
```bash
npm run test -- src/reviews/reviews.service.spec.ts
```
Output:
```
> @carone/api@0.0.1 test
> jest --passWithNoTests src/reviews/reviews.service.spec.ts

PASS src/reviews/reviews.service.spec.ts
  ReviewsService
    Self Review Validation
      √ should throw BadRequestException when user attempts to review themselves (51 ms)
    validateOperatorReview()
      √ should throw BadRequestException when NO conversation exists between reviewer and operator (5 ms)
      √ should throw BadRequestException when conversation exists but reviewer sent ZERO messages (10 ms)
      √ should create review successfully when conversation exists AND reviewer sent a message (5 ms)
    validateJobReview() regression
      √ should reject DRIVER_PROFILE review if no ACCEPTED application exists (5 ms)
      √ should accept DRIVER_PROFILE review if ACCEPTED application exists (3 ms)
    CARRIER_PROFILE review validation
      √ should reject direct CARRIER_PROFILE review with instruction to use booking review endpoint (4 ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
Snapshots:   0 total
Time:        2.344 s
Ran all test suites matching /src\\reviews\\reviews.service.spec.ts/i.
```
Exit Code: `0`

---

### Command 4: TypeScript Build Check
Command:
```bash
npx tsc --noEmit -p apps/api/tsconfig.build.json
```
Output:
```
(clean output - 0 type errors)
```
Exit Code: `0`

---

### Command 5: E2E Test Run
Command:
```bash
npm run test:e2e -- test/operators-phase0.e2e-spec.ts
```
Output:
```
> @carone/api@0.0.1 test:e2e
> jest --config jest-e2e.config.js --runInBand --forceExit test/operators-phase0.e2e-spec.ts

  console.log
    REAL JSON (Review Operator Without Conversation 400): {
      "message": "يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً",
      "error": "Bad Request",
      "statusCode": 400
    }

      at Object.<anonymous> (test/operators-phase0.e2e-spec.ts:181:15)

  console.log
    REAL JSON (Review Operator Without Sent Messages 400): {
      "message": "يمكنك فقط تقييم المشغل بعد التواصل معه عبر الرسائل أولاً",
      "error": "Bad Request",
      "statusCode": 400
    }

      at Object.<anonymous> (test/operators-phase0.e2e-spec.ts:213:15)

  console.log
    REAL JSON (Review Operator Success 201): {
      "id": "cmtrap7u0000srat8i0p4opyt",
      "rating": 5,
      "comment": "مشغل ممتاز ومحترف جداً وتم التواصل معه بنجاح",
      "entityType": "OPERATOR_LISTING",
      "entityId": "cmtraoexw000erat8tvutewzh",
      "reviewerId": "cmtranqzz0003rat8bhgicrhw",
      "revieweeId": "cmtranogk0000rat8c3uvsren",
      "createdAt": "2026-09-07T13:47:37.320Z",
      "updatedAt": "2026-09-07T13:47:37.320Z",
      "reviewer": {
        "id": "cmtranqzz0003rat8bhgicrhw",
        "username": "user_1788788788679_2_jp36s",
        "displayName": null,
        "avatarUrl": null,
        "isVerified": false
      }
    }

      at Object.<anonymous> (test/operators-phase0.e2e-spec.ts:253:15)

PASS test/operators-phase0.e2e-spec.ts (170.836 s)
  Operators Phase 0 API (e2e)
    1. POST /api/operators (Create Operator Listing)
      √ Success Case: Should create an operator listing with profileImageUrl and required wilayaId (6851 ms)
      √ Failure Case (Single Profile Constraint): Should reject second profile for same user with plain Arabic ConflictException (1100 ms)
    2. GET /api/operators (Find All with new filters & sorting)
      √ Success Case: Should list operators with min/max filters and custom sortBy (7705 ms)
      √ Failure Case: Should reject invalid sortBy value with 400 (10 ms)
    3. PATCH /api/operators/:id (Update Profile Image & Details)
      √ Success Case: Should update profileImageUrl successfully (18492 ms)
      √ Failure Case: Should reject update by unauthorized non-owner with plain Arabic ForbiddenException (902 ms)
    3.5 POST /api/reviews (Operator Review Contact Requirement)
      √ Failure Case: Reviewing operator without prior conversation returns 400 with Arabic message (349 ms)
      √ Failure Case: Reviewing operator with conversation but zero messages from reviewer returns 400 (1881 ms)
      √ Success Case: Reviewing operator with conversation AND sent message succeeds (17998 ms)
    4. DELETE /api/operators/:id (Request Deletion)
      √ Failure Case (Not Found): Should return 404 with plain Arabic message for non-existent listing (154 ms)
      √ Failure Case (Forbidden): Should return 403 with plain Arabic message when deleting other user listing (154 ms)
      √ Success Case: Should create a PENDING deletion request without deleting the listing (1264 ms)
      √ Failure Case (Duplicate Pending Request): Should return 409 when a pending deletion request already exists (302 ms)
    5. DELETE /api/operators/deletion-requests/:id (Cancel Deletion Request)
      √ Failure Case (Not Found): Should return 404 for non-existent deletion request (310 ms)
      √ Failure Case (Forbidden): Should return 403 when cancelling another user request (155 ms)
      √ Success Case: Should cancel a pending request within 24 hours (457 ms)
      √ Failure Case (Already Cancelled): Should return 400 when trying to cancel an already processed request (179 ms)
    6. Admin Endpoints: /api/admin/operators/deletion-requests
      √ Failure Case (RBAC): Regular user should be forbidden from accessing admin endpoints (15 ms)
      √ Success Case (Admin List): Admin should list all deletion requests with pagination & status filter (15623 ms)
      √ Failure Case (Validation): Admin list with malformed page (?page=abc) returns 400 validation error (13 ms)
      √ Failure Case (Review Non-Existent): Admin reviewing non-existent request should return 404 (304 ms)
      √ Success Case (Admin Review REJECTED): Admin rejects request and notifies user (1171 ms)
      √ Failure Case (Review Already Decided): Re-reviewing a decided request returns 400 (153 ms)
      √ Success Case (Admin Review APPROVED): Admin approves request -> listing deleted + outbox event created + orphans cleaned (27235 ms)

Test Suites: 1 passed, 1 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        170.998 s
Ran all test suites matching /test\\operators-phase0.e2e-spec.ts/i.
```
Exit Code: `0`

---

### Command 6: Full Jest Regression Run (All Suites)
Command:
```bash
npm run test
```
Output:
```
Test Suites: 36 passed, 36 total
Tests:       529 passed, 529 total
Snapshots:   0 total
Time:        15.058 s
Ran all test suites.
```
Exit Code: `0` *(Total test suites increased from 35 to 36; total passing tests increased from 522 to 529; 0 failures)*

---

### Command 7: Git Status & Branch Check
Command:
```bash
git status -s; git branch --show-current
```
Output:
```
 M apps/api/prisma/schema.prisma
 M apps/api/src/equipment/dto/create-operator-listing.dto.ts
 M apps/api/src/equipment/dto/query-operator-listings.dto.ts
 M apps/api/src/equipment/dto/update-operator-listing.dto.ts
D  apps/api/src/equipment/operators.controller.ts
D  apps/api/src/equipment/operators.service.ts
 M apps/api/src/operators/operators.controller.ts
 M apps/api/src/operators/operators.module.ts
 M apps/api/src/operators/operators.service.ts
 M apps/api/src/prisma/prisma.service.ts
 M apps/api/src/reviews/reviews.service.ts
 M apps/api/src/search/search-outbox.integration.spec.ts
 M apps/api/src/search/search-sync.worker.ts
?? DEPLOY_REPORT.md
?? LISTING_BACKEND_P0_P1_P2_SPEC.md
?? apps/api/prisma/migrations/20260907000000_add_operator_deletion_requests_and_profile_image/
?? apps/api/prisma/migrations/20260907120000_fix_operator_deletion_request_cascade/
?? apps/api/scripts/ts/audit-operator-duplicates.ts
?? apps/api/scripts/ts/check-wilaya-nulls.ts
?? apps/api/scripts/ts/cleanup-operator-duplicates.ts
?? apps/api/scripts/ts/test-conn.ts
?? apps/api/src/equipment/dto/admin-review-deletion.dto.ts
?? apps/api/src/equipment/dto/request-deletion.dto.ts
?? apps/api/src/operators/admin-operators.controller.ts
?? apps/api/src/operators/dto/admin-list-deletion-requests.dto.spec.ts
?? apps/api/src/operators/dto/admin-list-deletion-requests.dto.ts
?? apps/api/src/operators/dto/admin-review-deletion.dto.ts
?? apps/api/src/operators/dto/query-operator-listings.dto.spec.ts
?? apps/api/src/operators/dto/request-deletion.dto.ts
?? apps/api/src/operators/operators.service.spec.ts
?? apps/api/src/prisma/prisma.service.spec.ts
?? apps/api/src/reviews/reviews.service.spec.ts
?? apps/api/test/operators-phase0.e2e-spec.ts
...
feature/operators-phase0
```
Exit Code: `0`
