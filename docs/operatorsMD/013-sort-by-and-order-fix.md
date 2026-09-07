# 013 — Implementation Report: Operators SortBy & SortOrder Decoupling Fix & Verification

**Date:** 2026-09-07  
**Category:** A (Code changes + local tests only; no schema/migration changes)  
**Branch:** `feature/operators-phase0` (verified clean of any push or merge)

---

## 1. Technical Summary of Changes

### A) The Root Cause & Bug
- **Problem**: In `QueryOperatorListingsDto`, `sortBy` previously accepted string input, but in `findAll()` of `operators.service.ts`, the switch-case expected legacy composite values (`dailyRate_asc`, `price_desc`, `newest`, `popular`, etc.).
- **Impact**: Any clean field passed by clients or DTOs did not match the compound strings in the switch-case, falling through to the `default` branch (`createdAt: desc`). The sorting feature was effectively a no-op for real clients.

### B) The Solution
1. **Decoupled Fields in `QueryOperatorListingsDto` (`apps/api/src/equipment/dto/query-operator-listings.dto.ts`)**:
   - Replaced raw string validation with whitelist decorators using `@IsIn`:
     ```typescript
     @IsOptional()
     @IsIn(['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'])
     sortBy?: string;

     @IsOptional()
     @IsIn(['asc', 'desc'])
     sortOrder?: 'asc' | 'desc';
     ```
   - Re-exported transparently to `apps/api/src/operators/dto/query-operator-listings.dto.ts`.

2. **Clean Dynamic OrderBy in `findAll()` (`apps/api/src/operators/operators.service.ts`)**:
   - Completely eliminated the outdated switch-case block.
   - Replaced with direct lookup and direction assignment:
     ```typescript
     const allowedSortFields = ['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'];
     const sortField = allowedSortFields.includes(q.sortBy ?? '') ? q.sortBy! : 'createdAt';
     const sortDirection: 'asc' | 'desc' = q.sortOrder === 'asc' ? 'asc' : 'desc';
     const orderBy: Prisma.OperatorListingOrderByWithRelationInput = { [sortField]: sortDirection };
     ```

3. **New Test Coverage**:
   - **`query-operator-listings.dto.spec.ts` (New)**: Validates that valid `sortBy` fields and `sortOrder` values pass, while invalid values like `sortBy=hacked` or `sortOrder=sideways` are rejected by `class-validator`.
   - **`operators.service.spec.ts`**:
     - `sortBy=dailyRate&sortOrder=asc` asserts `orderBy: { dailyRate: 'asc' }` on Prisma call.
     - `sortBy=viewCount&sortOrder=desc` asserts `orderBy: { viewCount: 'desc' }` on Prisma call.
     - Default behavior with no `sortBy` asserts `orderBy: { createdAt: 'desc' }`.
   - **`test/operators-phase0.e2e-spec.ts`**:
     - Updated Section 2 to request `sortBy=dailyRate&sortOrder=asc`.
     - Added e2e failure test asserting that `GET /api/operators?sortBy=hacked` returns HTTP 400 Bad Request.

---

## 2. Complete List of Files Touched

| File | Status | Description |
|---|---|---|
| `apps/api/src/equipment/dto/query-operator-listings.dto.ts` | MODIFIED | Added `@IsIn` validation for `sortBy` and added `sortOrder` |
| `apps/api/src/operators/operators.service.ts` | MODIFIED | Removed switch-case; implemented dynamic `orderBy` from `sortField` and `sortDirection` |
| `apps/api/src/operators/dto/query-operator-listings.dto.spec.ts` | CREATED | Dedicated unit tests for DTO whitelist validation |
| `apps/api/src/operators/operators.service.spec.ts` | MODIFIED | Added explicit tests asserting exact `orderBy` objects |
| `apps/api/test/operators-phase0.e2e-spec.ts` | MODIFIED | Updated e2e query and added 400 rejection test for invalid `sortBy` |

---

## 3. Real Code Diffs

### Diff 1: `apps/api/src/equipment/dto/query-operator-listings.dto.ts`

```diff
--- a/apps/api/src/equipment/dto/query-operator-listings.dto.ts
+++ b/apps/api/src/equipment/dto/query-operator-listings.dto.ts
@@ -1,4 +1,4 @@
-import { IsOptional, IsString, IsEnum, IsInt, IsNumber, Min, IsPositive } from 'class-validator';
+import { IsOptional, IsString, IsEnum, IsInt, IsNumber, Min, IsPositive, IsIn } from 'class-validator';
 import { Type } from 'class-transformer';
 
 export class QueryOperatorListingsDto {
@@ -14,9 +14,14 @@ export class QueryOperatorListingsDto {
   @IsOptional() @IsString()
   search?: string;
 
-  @IsOptional() @IsString()
+  @IsOptional()
+  @IsIn(['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'])
   sortBy?: string;
 
+  @IsOptional()
+  @IsIn(['asc', 'desc'])
+  sortOrder?: 'asc' | 'desc';
+
   @IsOptional() @Type(() => Number) @IsInt() @Min(1)
   page?: number;
```

### Diff 2: `apps/api/src/operators/operators.service.ts`

```diff
--- a/apps/api/src/operators/operators.service.ts
+++ b/apps/api/src/operators/operators.service.ts
@@ -136,39 +136,10 @@ export class OperatorsService {
       };
     }
 
-    let orderBy: Prisma.OperatorListingOrderByWithRelationInput = { createdAt: 'desc' };
-    switch (q.sortBy) {
-      case 'oldest':
-      case 'createdAt_asc':
-        orderBy = { createdAt: 'asc' };
-        break;
-      case 'dailyRate_asc':
-      case 'price_asc':
-        orderBy = { dailyRate: 'asc' };
-        break;
-      case 'dailyRate_desc':
-      case 'price_desc':
-        orderBy = { dailyRate: 'desc' };
-        break;
-      case 'hourlyRate_asc':
-        orderBy = { hourlyRate: 'asc' };
-        break;
-      case 'hourlyRate_desc':
-        orderBy = { hourlyRate: 'desc' };
-        break;
-      case 'experience_desc':
-        orderBy = { experienceYears: 'desc' };
-        break;
-      case 'popular':
-      case 'views_desc':
-        orderBy = { viewCount: 'desc' };
-        break;
-      case 'newest':
-      case 'createdAt_desc':
-      default:
-        orderBy = { createdAt: 'desc' };
-        break;
-    }
+    const allowedSortFields = ['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'];
+    const sortField = allowedSortFields.includes(q.sortBy ?? '') ? q.sortBy! : 'createdAt';
+    const sortDirection: 'asc' | 'desc' = q.sortOrder === 'asc' ? 'asc' : 'desc';
+    const orderBy: Prisma.OperatorListingOrderByWithRelationInput = { [sortField]: sortDirection };
 
     const [items, total] = await this.prisma.$transaction([
       this.prisma.operatorListing.findMany({
```

### Diff 3: `apps/api/src/operators/dto/query-operator-listings.dto.spec.ts` (Full file content)

```typescript
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryOperatorListingsDto } from './query-operator-listings.dto';

describe('QueryOperatorListingsDto validation', () => {
  it('should accept valid sortBy and sortOrder values', async () => {
    const validFields = ['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'];
    for (const field of validFields) {
      const dto = plainToInstance(QueryOperatorListingsDto, { sortBy: field, sortOrder: 'asc' });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should reject invalid sortBy value (e.g. hacked) with validation error', async () => {
    const dto = plainToInstance(QueryOperatorListingsDto, { sortBy: 'hacked' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const sortByError = errors.find((e) => e.property === 'sortBy');
    expect(sortByError).toBeDefined();
  });

  it('should reject invalid sortOrder value with validation error', async () => {
    const dto = plainToInstance(QueryOperatorListingsDto, { sortOrder: 'sideways' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const sortOrderError = errors.find((e) => e.property === 'sortOrder');
    expect(sortOrderError).toBeDefined();
  });
});
```

### Diff 4: `apps/api/src/operators/operators.service.spec.ts`

```diff
--- a/apps/api/src/operators/operators.service.spec.ts
+++ b/apps/api/src/operators/operators.service.spec.ts
@@ -374,7 +374,7 @@ describe('OperatorsService', () => {
   });
 
   describe('findAll filters and sorting', () => {
-    it('should pass rate and experience filters and sortBy into Prisma query', async () => {
+    it('should pass rate and experience filters and sortBy with sortOrder into Prisma query', async () => {
       prisma.operatorListing.findMany.mockResolvedValue([]);
       prisma.operatorListing.count.mockResolvedValue(0);
 
@@ -384,7 +384,8 @@ describe('OperatorsService', () => {
         maxHourlyRate: 50,
         minExperienceYears: 3,
         maxExperienceYears: 10,
-        sortBy: 'dailyRate_asc',
+        sortBy: 'dailyRate',
+        sortOrder: 'asc',
       });
 
       expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
@@ -398,6 +398,45 @@ describe('OperatorsService', () => {
         }),
       );
     });
+
+    it('should sort by dailyRate asc when sortBy=dailyRate and sortOrder=asc', async () => {
+      prisma.operatorListing.findMany.mockResolvedValue([]);
+      prisma.operatorListing.count.mockResolvedValue(0);
+
+      await service.findAll({ sortBy: 'dailyRate', sortOrder: 'asc' });
+
+      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
+        expect.objectContaining({
+          orderBy: { dailyRate: 'asc' },
+        }),
+      );
+    });
+
+    it('should sort by viewCount desc when sortBy=viewCount and sortOrder=desc', async () => {
+      prisma.operatorListing.findMany.mockResolvedValue([]);
+      prisma.operatorListing.count.mockResolvedValue(0);
+
+      await service.findAll({ sortBy: 'viewCount', sortOrder: 'desc' });
+
+      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
+        expect.objectContaining({
+          orderBy: { viewCount: 'desc' },
+        }),
+      );
+    });
+
+    it('should default to { createdAt: "desc" } when no sortBy is provided at all', async () => {
+      prisma.operatorListing.findMany.mockResolvedValue([]);
+      prisma.operatorListing.count.mockResolvedValue(0);
+
+      await service.findAll({});
+
+      expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(
+        expect.objectContaining({
+          orderBy: { createdAt: 'desc' },
+        }),
+      );
+    });
   });
 });
```

### Diff 5: `apps/api/test/operators-phase0.e2e-spec.ts`

```diff
--- a/apps/api/test/operators-phase0.e2e-spec.ts
+++ b/apps/api/test/operators-phase0.e2e-spec.ts
@@ -113,7 +113,8 @@ describe('Operators Phase 0 API (e2e)', () => {
           maxHourlyRate: 50,
           minExperienceYears: 5,
           maxExperienceYears: 15,
-          sortBy: 'dailyRate_asc',
+          sortBy: 'dailyRate',
+          sortOrder: 'asc',
         })
         .expect(200);
 
@@ -120,6 +120,17 @@ describe('Operators Phase 0 API (e2e)', () => {
       expect(res.body.meta).toBeDefined();
       expect(res.body.meta.total).toBeGreaterThanOrEqual(1);
     });
+
+    it('Failure Case: Should reject invalid sortBy value with 400', async () => {
+      const res = await request(app.getHttpServer())
+        .get('/api/operators')
+        .query({
+          sortBy: 'hacked',
+        })
+        .expect(400);
+
+      expect(res.body.statusCode).toBe(400);
+    });
   });
```

---

## 4. Real Terminal Output and Exit Codes

### Command 1: TypeScript Build Typecheck

```text
Command: npx tsc --noEmit -p tsconfig.build.json
Cwd: apps/api
Exit Code: 0
Output: (clean compilation, zero errors)
```

### Command 2: Unit Tests (Operators Service + DTO Whitelist)

```text
Command: npx jest src/operators/dto/query-operator-listings.dto.spec.ts src/operators/operators.service.spec.ts
Cwd: apps/api
Exit Code: 0

Output:
PASS src/operators/dto/query-operator-listings.dto.spec.ts
PASS src/operators/operators.service.spec.ts

Test Suites: 2 passed, 2 total
Tests:       25 passed, 25 total
Snapshots:   0 total
Time:        3.366 s
Ran all test suites matching /src\\operators\\dto\\query-operator-listings.dto.spec.ts|src\\operators\\operators.service.spec.ts/i.
```

### Command 3: Full 11 Test Suite Regression Run

```text
Command: npx jest src/prisma/prisma.service.spec.ts src/buses/buses.service.spec.ts src/jobs/__tests__/admin-jobs.service.spec.ts src/jobs/__tests__/jobs.service.spec.ts src/listings/listings.service.spec.ts src/operators/operators.service.spec.ts src/operators/dto/query-operator-listings.dto.spec.ts src/services/services.service.spec.ts src/search/search-outbox.integration.spec.ts src/parts/parts.service.spec.ts src/equipment/equipment-listings.service.spec.ts
Cwd: apps/api
Exit Code: 0

Output:
PASS src/jobs/__tests__/jobs.service.spec.ts
PASS src/jobs/__tests__/admin-jobs.service.spec.ts
PASS src/search/search-outbox.integration.spec.ts
PASS src/operators/operators.service.spec.ts
PASS src/operators/dto/query-operator-listings.dto.spec.ts
PASS src/buses/buses.service.spec.ts
PASS src/services/services.service.spec.ts
PASS src/listings/listings.service.spec.ts
PASS src/equipment/equipment-listings.service.spec.ts
PASS src/prisma/prisma.service.spec.ts
PASS src/parts/parts.service.spec.ts

Test Suites: 11 passed, 11 total
Tests:       188 passed, 188 total
Snapshots:   0 total
Time:        6.318 s, estimated 7 s
```

### Command 4: Full E2E Test Suite Run

```text
Command: npx jest --config jest-e2e.config.js test/operators-phase0.e2e-spec.ts
Cwd: apps/api
Exit Code: 0

Output:
PASS test/operators-phase0.e2e-spec.ts (177.249 s)
  Operators Phase 0 API (e2e)
    1. POST /api/operators (Create Operator Listing)
      √ Success Case: Should create an operator listing with profileImageUrl and required wilayaId (21382 ms)
      √ Failure Case (Single Profile Constraint): Should reject second profile for same user with plain Arabic ConflictException (3012 ms)
    2. GET /api/operators (Find All with new filters & sorting)
      √ Success Case: Should list operators with min/max filters and custom sortBy (16739 ms)
      √ Failure Case: Should reject invalid sortBy value with 400 (8 ms)
    3. PATCH /api/operators/:id (Update Profile Image & Details)
      √ Success Case: Should update profileImageUrl successfully (18436 ms)
      √ Failure Case: Should reject update by unauthorized non-owner with plain Arabic ForbiddenException (3374 ms)
    4. DELETE /api/operators/:id (Request Deletion)
      √ Failure Case (Not Found): Should return 404 with plain Arabic message for non-existent listing (624 ms)
      √ Failure Case (Forbidden): Should return 403 with plain Arabic message when deleting other user listing (787 ms)
      √ Success Case: Should create a PENDING deletion request without deleting the listing (9623 ms)
      √ Failure Case (Duplicate Pending Request): Should return 409 when a pending deletion request already exists (3914 ms)
    5. DELETE /api/operators/deletion-requests/:id (Cancel Deletion Request)
      √ Failure Case (Not Found): Should return 404 for non-existent deletion request (4970 ms)
      √ Failure Case (Forbidden): Should return 403 when cancelling another user request (1497 ms)
      √ Success Case: Should cancel a pending request within 24 hours (4174 ms)
      √ Failure Case (Already Cancelled): Should return 400 when trying to cancel an already processed request (1524 ms)
    6. Admin Endpoints: /api/admin/operators/deletion-requests
      √ Failure Case (RBAC): Regular user should be forbidden from accessing admin endpoints (5 ms)
      √ Success Case (Admin List): Admin should list all deletion requests with pagination & status filter (1961 ms)
      √ Failure Case (Review Non-Existent): Admin reviewing non-existent request should return 404 (158 ms)
      √ Success Case (Admin Review REJECTED): Admin rejects request and notifies user (1387 ms)
      √ Failure Case (Review Already Decided): Re-reviewing a decided request returns 400 (162 ms)
      √ Success Case (Admin Review APPROVED): Admin approves request -> listing deleted + outbox event created + orphans cleaned (27131 ms)

Test Suites: 1 passed, 1 total
Tests:       20 passed, 20 total
Snapshots:   0 total
Time:        177.388 s
```

---

## 5. Verification Matrix Against Mandated Tests

| Test Case | Expected Behavior | Actual Verification | Result |
|---|---|---|---|
| `sortBy=dailyRate&sortOrder=asc` | Prisma call receives `{ dailyRate: 'asc' }` | Verified via Jest `expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(...)` | PASS |
| `sortBy=viewCount&sortOrder=desc` | Prisma call receives `{ viewCount: 'desc' }` | Verified via Jest `expect(prisma.operatorListing.findMany).toHaveBeenCalledWith(...)` | PASS |
| No `sortBy` provided | Defaults to `{ createdAt: 'desc' }` | Verified via Jest with empty query input `{}` | PASS |
| Invalid `sortBy` value (e.g. `sortBy=hacked`) | Validation rejects with 400 | Verified via DTO unit test and E2E HTTP 400 assertion | PASS |
| 11 Regression Test Suites | All existing services & verticals pass | 188 tests passed across 11 test suites | PASS |
| Operators E2E Suite | All 20 scenarios pass against real test DB | 20 tests passed in 177s | PASS |

---

## 6. Git State Verification

```text
Command: git status -s; git branch --show-current
Cwd: root
Exit Code: 0

Branch: feature/operators-phase0
Uncommitted local changes only.
No git push executed.
No git merge executed.
```