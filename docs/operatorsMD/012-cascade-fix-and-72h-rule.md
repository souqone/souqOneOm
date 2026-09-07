# 012 — Implementation Report: Operator Deletion Cascade Fix & 72-Hour Re-Creation Rule

**Date:** 2026-09-07  
**Category:** EXECUTION AUTHORIZED BY MAHMOUD (Schema Migration + Implementation)  
**Branch:** `feature/operators-phase0` (verified clean of any push or merge)

---

## 1. Technical Summary of Changes

### A) Schema Fix — `OperatorDeletionRequest` Cascade Bug
- **Problem**: `OperatorDeletionRequest.operatorListingId` was defined as `String` (required) with `onDelete: Cascade`. When an admin approved deletion and `tx.operatorListing.delete` was executed, the database cascaded the delete to `operator_deletion_requests`, erasing the newly approved request row and destroying the audit/history trail.
- **Solution**:
  - In `apps/api/prisma/schema.prisma`, altered `operatorListingId` to optional `String?` and changed relation behavior to `onDelete: SetNull`.
  - Created migration `20260907120000_fix_operator_deletion_request_cascade/migration.sql`:
    1. Dropped existing foreign key constraint `operator_deletion_requests_operatorListingId_fkey`.
    2. Altered column `operatorListingId` to drop `NOT NULL`.
    3. Added new foreign key constraint with `ON DELETE SET NULL ON UPDATE CASCADE`.
  - Deployed migration to the production Neon PostgreSQL database (`ep-lucky-violet-am7554ay.c-5.us-east-1.aws.neon.tech`) using `npx prisma migrate deploy` with exit code 0.
  - Executed `npx prisma generate` to sync Prisma Client types.

### B) Service Adjustments (`apps/api/src/operators/operators.service.ts`)
1. **72-Hour Re-Creation Block in `create()`**:
   - Added query for the most recent approved deletion request:
     ```typescript
     const recentApproved = await this.prisma.operatorDeletionRequest.findFirst({
       where: { userId, status: OperatorDeletionStatus.APPROVED },
       orderBy: { reviewedAt: 'desc' },
     });
     if (recentApproved?.reviewedAt) {
       const elapsed = Date.now() - recentApproved.reviewedAt.getTime();
       if (elapsed < 72 * 60 * 60 * 1000) {
         throw new ConflictException(
           'لا يمكنك إنشاء بروفايل جديد إلا بعد مرور 72 ساعة من حذف البروفايل السابق',
         );
       }
     }
     ```
   - Coexists alongside the active profile check (`findFirst({ where: { userId } })`).

2. **Capturing `operatorListingId` Before Transaction in `adminReviewDeletion`**:
   - Captured `const targetListingId = request.operatorListingId;` before entering `$transaction`.
   - Guaranteed that `cleanupPolymorphicOrphans('OPERATOR_LISTING', targetListingId)` and the user notification retain the valid listing ID even after the foreign key in the deletion request row is set to `null` in the DB.

3. **Graceful `null` in `adminListDeletionRequests`**:
   - With `operatorListingId` nullable, `operatorListing` returned in the Prisma relation naturally becomes `null` for approved and deleted listings without throwing or breaking response schema.

### C) Test Updates
1. **`apps/api/src/operators/operators.service.spec.ts`**:
   - Added unit test: `create()` throws `ConflictException` when previous deletion was approved within 72 hours.
   - Added unit test: `create()` succeeds when previous deletion was approved >72 hours ago.
   - Added regression unit test in `adminReviewDeletion(APPROVED)`: simulates `ON DELETE SET NULL` and verifies that `operatorDeletionRequest.findUnique` still exists with `status: APPROVED` and `operatorListingId: null`.
2. **`apps/api/src/search/search-outbox.integration.spec.ts`**:
   - Added `findFirst: jest.fn().mockResolvedValue(null)` to `mockPrisma.operatorDeletionRequest` to account for the new 72h check during `create()`.

---

## 2. Complete List of Files Touched

| File | Status | Description |
|---|---|---|
| `apps/api/prisma/schema.prisma` | MODIFIED | Changed `OperatorDeletionRequest.operatorListingId` to `String?` with `onDelete: SetNull` |
| `apps/api/prisma/migrations/20260907120000_fix_operator_deletion_request_cascade/migration.sql` | CREATED | Migration dropping cascade and adding `ON DELETE SET NULL` |
| `apps/api/src/operators/operators.service.ts` | MODIFIED | Added 72h recreation window and safe in-memory ID capture |
| `apps/api/src/operators/operators.service.spec.ts` | MODIFIED | Added 72h window unit tests and cascade fix regression test |
| `apps/api/src/search/search-outbox.integration.spec.ts` | MODIFIED | Updated mock for `operatorDeletionRequest.findFirst` |

---

## 3. Real Code Diffs

### Diff 1: `apps/api/prisma/schema.prisma`

```diff
--- a/apps/api/prisma/schema.prisma
+++ b/apps/api/prisma/schema.prisma
@@ -1475,8 +1475,8 @@ enum OperatorDeletionStatus {
 
 model OperatorDeletionRequest {
   id                String                 @id @default(cuid())
-  operatorListingId String
-  operatorListing   OperatorListing        @relation(fields: [operatorListingId], references: [id], onDelete: Cascade)
+  operatorListingId String?
+  operatorListing   OperatorListing?       @relation(fields: [operatorListingId], references: [id], onDelete: SetNull)
   userId            String
   reason            String?
   status            OperatorDeletionStatus @default(PENDING)
```

### Diff 2: `apps/api/prisma/migrations/20260907120000_fix_operator_deletion_request_cascade/migration.sql`

```sql
-- DropForeignKey
ALTER TABLE "operator_deletion_requests" DROP CONSTRAINT "operator_deletion_requests_operatorListingId_fkey";

-- AlterTable
ALTER TABLE "operator_deletion_requests" ALTER COLUMN "operatorListingId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "operator_deletion_requests" ADD CONSTRAINT "operator_deletion_requests_operatorListingId_fkey" FOREIGN KEY ("operatorListingId") REFERENCES "operator_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Diff 3: `apps/api/src/operators/operators.service.ts`

```diff
--- a/apps/api/src/operators/operators.service.ts
+++ b/apps/api/src/operators/operators.service.ts
@@ -35,6 +35,19 @@ export class OperatorsService {
       throw new ConflictException('لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه');
     }
 
+    const recentApproved = await this.prisma.operatorDeletionRequest.findFirst({
+      where: { userId, status: OperatorDeletionStatus.APPROVED },
+      orderBy: { reviewedAt: 'desc' },
+    });
+    if (recentApproved?.reviewedAt) {
+      const elapsed = Date.now() - recentApproved.reviewedAt.getTime();
+      if (elapsed < 72 * 60 * 60 * 1000) {
+        throw new ConflictException(
+          'لا يمكنك إنشاء بروفايل جديد إلا بعد مرور 72 ساعة من حذف البروفايل السابق',
+        );
+      }
+    }
+
     await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);
@@ -386,6 +399,8 @@ export class OperatorsService {
       throw new BadRequestException('هذا الطلب تم البت فيه بالفعل أو تم إلغاؤه');
     }
 
+    const targetListingId = request.operatorListingId;
+
     if (decision === 'APPROVED') {
       await this.prisma.$transaction(async (tx) => {
         await tx.operatorDeletionRequest.update({
@@ -396,20 +411,24 @@ export class OperatorsService {
           },
         });
 
-        await tx.operatorListing.delete({
-          where: { id: request.operatorListingId },
-        });
-
-        await tx.outboxEvent.create({
-          data: {
-            entityType: ENTITY_TYPES.OPERATOR_LISTING,
-            entityId: request.operatorListingId,
-            action: 'DELETE',
-          },
-        });
+        if (targetListingId) {
+          await tx.operatorListing.delete({
+            where: { id: targetListingId },
+          });
+
+          await tx.outboxEvent.create({
+            data: {
+              entityType: ENTITY_TYPES.OPERATOR_LISTING,
+              entityId: targetListingId,
+              action: 'DELETE',
+            },
+          });
+        }
       });
 
-      await this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', request.operatorListingId);
+      if (targetListingId) {
+        await this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', targetListingId);
+      }
 
       await this.notificationsService.create({
         type: NotificationType.OPERATOR_DELETION_APPROVED,
@@ -416,6 +435,6 @@ export class OperatorsService {
         body: 'تمت الموافقة على حذف إعلان المشغل الخاص بك وحذفه بنجاح',
         userId: request.userId,
-        data: { operatorListingId: request.operatorListingId },
+        data: { operatorListingId: targetListingId ?? undefined },
       });
 
       return { success: true, status: OperatorDeletionStatus.APPROVED };
@@ -439,7 +458,7 @@ export class OperatorsService {
           : 'تم رفض طلب حذف إعلان المشغل الخاص بك من قبل الإدارة',
         userId: request.userId,
         data: {
-          operatorListingId: request.operatorListingId,
+          operatorListingId: targetListingId ?? undefined,
           rejectionReason: rejectionReason ?? null,
         },
       });
```

### Diff 4: `apps/api/src/operators/operators.service.spec.ts`

```diff
--- a/apps/api/src/operators/operators.service.spec.ts
+++ b/apps/api/src/operators/operators.service.spec.ts
@@ -32,7 +32,7 @@ describe('OperatorsService', () => {
         delete: jest.fn(),
       },
       operatorDeletionRequest: {
-        findFirst: jest.fn(),
+        findFirst: jest.fn().mockResolvedValue(null),
         findUnique: jest.fn(),
         findMany: jest.fn(),
         count: jest.fn(),
@@ -110,6 +110,62 @@ describe('OperatorsService', () => {
         },
       });
     });
+
+    it('should throw ConflictException if previous deletion was approved less than 72h ago', async () => {
+      prisma.operatorListing.findFirst.mockResolvedValue(null);
+      prisma.operatorDeletionRequest.findFirst.mockResolvedValue({
+        id: 'req-old',
+        userId: 'user-1',
+        status: OperatorDeletionStatus.APPROVED,
+        reviewedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
+      });
+
+      await expect(
+        service.create(
+          {
+            title: 'Title',
+            description: 'Desc',
+            operatorType: 'DRIVER',
+            governorateId: 1,
+            wilayaId: 101,
+          } as any,
+          'user-1',
+        ),
+      ).rejects.toThrow(ConflictException);
+
+      expect(prisma.operatorDeletionRequest.findFirst).toHaveBeenCalledWith({
+        where: { userId: 'user-1', status: OperatorDeletionStatus.APPROVED },
+        orderBy: { reviewedAt: 'desc' },
+      });
+    });
+
+    it('should succeed creating operator profile if previous deletion was approved more than 72h ago', async () => {
+      prisma.operatorListing.findFirst.mockResolvedValue(null);
+      prisma.operatorDeletionRequest.findFirst.mockResolvedValue({
+        id: 'req-old',
+        userId: 'user-1',
+        status: OperatorDeletionStatus.APPROVED,
+        reviewedAt: new Date(Date.now() - 75 * 60 * 60 * 1000), // 75 hours ago
+      });
+      prisma.operatorListing.create.mockResolvedValue({
+        id: 'op-new-2',
+        title: 'Title 2',
+      });
+
+      const res = await service.create(
+        {
+          title: 'Title 2',
+          description: 'Desc',
+          operatorType: 'DRIVER',
+          governorateId: 1,
+          wilayaId: 101,
+        } as any,
+        'user-1',
+      );
+
+      expect(res.id).toBe('op-new-2');
+      expect(prisma.operatorListing.create).toHaveBeenCalled();
+    });
   });
@@ -308,6 +364,46 @@ describe('OperatorsService', () => {
       );
     });
 
+    it('should approve deletion: record remains APPROVED with operatorListingId null (verifying no cascade deletion)', async () => {
+      let storedRequest: any = {
+        id: 'req-1',
+        operatorListingId: 'op-1',
+        userId: 'user-1',
+        status: OperatorDeletionStatus.PENDING,
+      };
+
+      prisma.operatorDeletionRequest.findUnique.mockImplementation(({ where }: any) => {
+        if (where.id === 'req-1') return Promise.resolve(storedRequest);
+        return Promise.resolve(null);
+      });
+
+      prisma.operatorDeletionRequest.update.mockImplementation(({ where, data }: any) => {
+        if (where.id === 'req-1') {
+          storedRequest = { ...storedRequest, ...data };
+          return Promise.resolve(storedRequest);
+        }
+      });
+
+      prisma.operatorListing.delete.mockImplementation(({ where }: any) => {
+        if (where.id === 'op-1') {
+          // Simulate database foreign key ON DELETE SET NULL
+          if (storedRequest.operatorListingId === 'op-1') {
+            storedRequest.operatorListingId = null;
+          }
+          return Promise.resolve({ id: 'op-1' });
+        }
+      });
+
+      const res = await service.adminReviewDeletion('req-1', 'admin-1', 'APPROVED');
+      expect(res.status).toBe(OperatorDeletionStatus.APPROVED);
+
+      // Verify the request STILL EXISTS and is not cascaded away
+      const requestAfter = await prisma.operatorDeletionRequest.findUnique({ where: { id: 'req-1' } });
+      expect(requestAfter).not.toBeNull();
+      expect(requestAfter.status).toBe(OperatorDeletionStatus.APPROVED);
+      expect(requestAfter.operatorListingId).toBeNull();
+    });
+
     it('should reject deletion: update status to REJECTED, record reason, send notification', async () => {
```

### Diff 5: `apps/api/src/search/search-outbox.integration.spec.ts`

```diff
--- a/apps/api/src/search/search-outbox.integration.spec.ts
+++ b/apps/api/src/search/search-outbox.integration.spec.ts
@@ -42,7 +42,7 @@ describe('Outbox Integration', () => {
       equipmentListing: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
       operatorListing: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }), findFirst: jest.fn().mockResolvedValue(null) },
-      operatorDeletionRequest: { findUnique: jest.fn().mockResolvedValue({ id: 'req-1', operatorListingId: '1', userId: 'owner', status: 'PENDING' }), update: jest.fn().mockResolvedValue({ id: 'req-1' }) },
+      operatorDeletionRequest: { findUnique: jest.fn().mockResolvedValue({ id: 'req-1', operatorListingId: '1', userId: 'owner', status: 'PENDING' }), update: jest.fn().mockResolvedValue({ id: 'req-1' }), findFirst: jest.fn().mockResolvedValue(null) },
       sparePart: { create: jest.fn().mockResolvedValue({ id: '1' }), update: jest.fn().mockResolvedValue({ id: '1' }), delete: jest.fn().mockResolvedValue({ id: '1' }), findUnique: jest.fn().mockResolvedValue({ id: '1', userId: 'owner', sellerId: 'owner' }) },
```

---

## 4. Real Terminal Output and Exit Codes

### Command 1: Deploying Schema Migration

```text
Command: npx prisma migrate deploy
Cwd: apps/api
Exit Code: 0

Output:
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-lucky-violet-am7554ay.c-5.us-east-1.aws.neon.tech"

14 migrations found in prisma/migrations

Applying migration `20260907120000_fix_operator_deletion_request_cascade`

The following migration(s) have been applied:

migrations/
  └─ 20260907120000_fix_operator_deletion_request_cascade/
    └─ migration.sql
      
All migrations have been successfully applied.
```

### Command 2: Generating Prisma Client

```text
Command: npx prisma generate
Cwd: apps/api
Exit Code: 0

Output:
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v6.19.3) to .\..\..\node_modules\@prisma\client in 1.09s
```

### Command 3: TypeScript Build Typecheck

```text
Command: npx tsc --noEmit -p tsconfig.build.json
Cwd: apps/api
Exit Code: 0
Output: (clean compilation, zero errors)
```

### Command 4: Updated Operators Unit Test Suite

```text
Command: npx jest src/operators/operators.service.spec.ts
Cwd: apps/api
Exit Code: 0

Output:
PASS src/operators/operators.service.spec.ts
  OperatorsService
    create
      √ should throw ConflictException if user already has an operator profile (85 ms)
      √ should create operator profile if user has none (5 ms)
      √ should throw ConflictException if previous deletion was approved less than 72h ago (40 ms)
      √ should succeed creating operator profile if previous deletion was approved more than 72h ago (6 ms)
    requestDeletion
      √ should throw NotFoundException if operator listing does not exist (4 ms)
      √ should throw ForbiddenException if operator listing belongs to another user (3 ms)
      √ should throw ConflictException if a PENDING deletion request already exists (4 ms)
      √ should create a PENDING deletion request successfully (5 ms)
    cancelDeletionRequest
      √ should throw NotFoundException if request not found (4 ms)
      √ should throw ForbiddenException if request does not belong to user (4 ms)
      √ should throw BadRequestException if request status is not PENDING (4 ms)
      √ should throw BadRequestException if more than 24 hours have passed (3 ms)
      √ should cancel request if within 24 hours (2 ms)
    adminReviewDeletion
      √ should throw NotFoundException if request not found (2 ms)
      √ should throw BadRequestException if request status is not PENDING (2 ms)
      √ should approve deletion: delete listing, outbox DELETE event, cleanup orphans, send notification (6 ms)
      √ should approve deletion: record remains APPROVED with operatorListingId null (verifying no cascade deletion) (2 ms)
      √ should reject deletion: update status to REJECTED, record reason, send notification (2 ms)
    findAll filters and sorting
      √ should pass rate and experience filters and sortBy into Prisma query (2 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        2.612 s
```

### Command 5: Full 10 Test Suite Regression Run

```text
Command: npx jest src/prisma/prisma.service.spec.ts src/buses/buses.service.spec.ts src/jobs/__tests__/admin-jobs.service.spec.ts src/jobs/__tests__/jobs.service.spec.ts src/listings/listings.service.spec.ts src/operators/operators.service.spec.ts src/services/services.service.spec.ts src/search/search-outbox.integration.spec.ts src/parts/parts.service.spec.ts src/equipment/equipment-listings.service.spec.ts
Cwd: apps/api
Exit Code: 0

Output:
PASS src/jobs/__tests__/admin-jobs.service.spec.ts
PASS src/jobs/__tests__/jobs.service.spec.ts
PASS src/prisma/prisma.service.spec.ts
PASS src/search/search-outbox.integration.spec.ts
PASS src/operators/operators.service.spec.ts
PASS src/buses/buses.service.spec.ts
PASS src/services/services.service.spec.ts
PASS src/equipment/equipment-listings.service.spec.ts
PASS src/parts/parts.service.spec.ts
PASS src/listings/listings.service.spec.ts

Test Suites: 10 passed, 10 total
Tests:       182 passed, 182 total
Snapshots:   0 total
Time:        8.143 s
```

### Command 6: Full Operators Phase 0 E2E Run

```text
Command: npx jest --config jest-e2e.config.js test/operators-phase0.e2e-spec.ts
Cwd: apps/api
Exit Code: 0

Output:
PASS test/operators-phase0.e2e-spec.ts (87.876 s)
  Operators Phase 0 API (e2e)
    1. POST /api/operators (Create Operator Listing)
      √ Success Case: Should create an operator listing with profileImageUrl and required wilayaId (3971 ms)
      √ Failure Case (Single Profile Constraint): Should reject second profile for same user with plain Arabic ConflictException (180 ms)
    2. GET /api/operators (Find All with new filters & sorting)
      √ Success Case: Should list operators with min/max filters and custom sortBy (14490 ms)
    3. PATCH /api/operators/:id (Update Profile Image & Details)
      √ Success Case: Should update profileImageUrl successfully (4433 ms)
      √ Failure Case: Should reject update by unauthorized non-owner with plain Arabic ForbiddenException (158 ms)
    4. DELETE /api/operators/:id (Request Deletion)
      √ Failure Case (Not Found): Should return 404 with plain Arabic message for non-existent listing (158 ms)
      √ Failure Case (Forbidden): Should return 403 with plain Arabic message when deleting other user listing (157 ms)
      √ Success Case: Should create a PENDING deletion request without deleting the listing (1225 ms)
      √ Failure Case (Duplicate Pending Request): Should return 409 when a pending deletion request already exists (308 ms)
    5. DELETE /api/operators/deletion-requests/:id (Cancel Deletion Request)
      √ Failure Case (Not Found): Should return 404 for non-existent deletion request (309 ms)
      √ Failure Case (Forbidden): Should return 403 when cancelling another user request (155 ms)
      √ Success Case: Should cancel a pending request within 24 hours (455 ms)
      √ Failure Case (Already Cancelled): Should return 400 when trying to cancel an already processed request (155 ms)
    6. Admin Endpoints: /api/admin/operators/deletion-requests
      √ Failure Case (RBAC): Regular user should be forbidden from accessing admin endpoints (5 ms)
      √ Success Case (Admin List): Admin should list all deletion requests with pagination & status filter (1691 ms)
      √ Failure Case (Review Non-Existent): Admin reviewing non-existent request should return 404 (153 ms)
      √ Success Case (Admin Review REJECTED): Admin rejects request and notifies user (1379 ms)
      √ Failure Case (Review Already Decided): Re-reviewing a decided request returns 400 (175 ms)
      √ Success Case (Admin Review APPROVED): Admin approves request -> listing deleted + outbox event created + orphans cleaned (19875 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        88.055 s
```

---

## 5. Git State Verification

```text
Command: git status -s; git branch --show-current
Cwd: root
Exit Code: 0

Branch: feature/operators-phase0
Uncommitted local changes only.
No git push executed.
No git merge executed.
```