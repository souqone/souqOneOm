# تقرير التنفيذ الفعلي للمرحلة صفر (Phase 0) — Operators Backend

**الفرع الحالي**: `feature/operators-phase0`  
**تاريخ التنفيذ**: 2026-09-07  
**حالة التنفيذ**: مكتمل بالكامل، مفحوص بنجاح عبر اختبارات الوحدة واختبارات الـ E2E واختبارات عدم الانحدار، مع بقاء الفرع منفصلاً دون دمج (no merge to main) ودون رفع (no push).

---

## 1. قائمة الملفات التي تم لمسها / إنشاؤها (Files Touched & Created)

### أ) ملفات تم تعديلها (Modified):
1. `apps/api/prisma/schema.prisma`
2. `apps/api/src/equipment/dto/create-operator-listing.dto.ts`
3. `apps/api/src/equipment/dto/update-operator-listing.dto.ts`
4. `apps/api/src/equipment/dto/query-operator-listings.dto.ts`
5. `apps/api/src/operators/operators.service.ts`
6. `apps/api/src/operators/operators.controller.ts`
7. `apps/api/src/operators/operators.module.ts`
8. `apps/api/src/search/search-sync.worker.ts`

### ب) ملفات جديدة تم إنشاؤها (New Created Files):
9. `apps/api/prisma/migrations/20260907000000_add_operator_deletion_requests_and_profile_image/migration.sql`
10. `apps/api/src/equipment/dto/request-deletion.dto.ts`
11. `apps/api/src/equipment/dto/admin-review-deletion.dto.ts`
12. `apps/api/src/operators/dto/request-deletion.dto.ts` (shim re-export)
13. `apps/api/src/operators/dto/admin-review-deletion.dto.ts` (shim re-export)
14. `apps/api/src/operators/admin-operators.controller.ts`
15. `apps/api/src/operators/operators.service.spec.ts` (16 Unit tests)
16. `apps/api/test/operators-phase0.e2e-spec.ts` (19 E2E integration tests)
17. `apps/api/scripts/ts/check-wilaya-nulls.ts` (Audit script for step A.1)

---

## 2. الإجراءات التفصيلية لكل ملف والمخرجات الخام (Actions & Terminal Outputs)

### A) Schema & Migration

#### 1. فحص القيم الخالية في عمود `wilayaId`:
تم تشغيل الاستعلام:
```sql
SELECT COUNT(*) FROM "operator_listings" WHERE "wilayaId" IS NULL;
```
**Terminal Output**:
```text
Executing raw SQL: SELECT COUNT(*)::text as count FROM "operator_listings" WHERE "wilayaId" IS NULL;
Query Raw Result: [ { count: '0' } ]
Null count is exactly 0. Safe to proceed with required Int migration.
Exit code: 0
```

#### 2–6. تعديلات `schema.prisma`:
- إضافة Enum جديد: `OperatorDeletionStatus` بقيم `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`.
- إضافة Model جديد: `OperatorDeletionRequest` مع علاقة بـ `OperatorListing` وفهارس على `operatorListingId` و `status`.
- إضافة حقل `profileImageUrl String?` إلى `OperatorListing`.
- إضافة `OPERATOR_DELETION_APPROVED` و `OPERATOR_DELETION_REJECTED` إلى enum `NotificationType`.
- تحويل `OperatorListing.wilayaId` من `Int?` إلى `Int` إلزامي.

#### 7. تشغيل الترحيل (Migration):
تم إنشاء ملف الترحيل `apps/api/prisma/migrations/20260907000000_add_operator_deletion_requests_and_profile_image/migration.sql` وتطبيقه:
**Command**:
```bash
npx prisma migrate deploy
```
**Terminal Output**:
```text
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "neondb", schema "public" at "ep-lucky-violet-am7554ay-pooler.c-5.us-east-1.aws.neon.tech"

1 migration found in prisma/migrations

Applying migration `20260907000000_add_operator_deletion_requests_and_profile_image`

The following migration has been applied:

migrations/
  └─ 20260907000000_add_operator_deletion_requests_and_profile_image/
      └─ migration.sql

All migrations have been successfully applied.
Exit code: 0
```
ثم تشغيل توليد العميل:
```bash
npx prisma generate
```
**Terminal Output**:
```text
Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v5.22.0) to .\node_modules\@prisma\client in 4.09s
Exit code: 0
```

---

### B) DTOs

#### نمط الفلاتر الرقمية المستخدم في Equipment (`query-equipment-listings.dto.ts`):
```typescript
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minDailyRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDailyRate?: number;
```

#### التعديلات في DTOs:
1. `CreateOperatorListingDto`:
   - تحويل `wilayaId` إلى إلزامي: `@IsInt()` و `@IsPositive()`.
   - إضافة `profileImageUrl?: string` مع `@IsOptional()` و `@IsUrl()`.
2. `UpdateOperatorListingDto`:
   - إضافة `profileImageUrl?: string` مع `@IsOptional()` و `@IsUrl()`.
3. `QueryOperatorListingsDto`:
   - إضافة الفلاتر الرقمية:
     - `minDailyRate?: number`, `maxDailyRate?: number`
     - `minHourlyRate?: number`, `maxHourlyRate?: number`
     - `minExperienceYears?: number`, `maxExperienceYears?: number`
4. `RequestDeletionDto`:
   - إنشاء DTO يحتوي على `reason?: string` اختياري.
5. `AdminReviewDeletionDto`:
   - إنشاء DTO مع enum `AdminDeletionDecision` (`APPROVED`, `REJECTED`) مفحوص بـ `@IsEnum()`، مع `rejectionReason?: string`.
6. التأكد من إعادة التصدير من `apps/api/src/operators/dto/` لضمان توافق الـ shims.

---

### C) operators.service.ts

- **`create()`**: إضافة فحص بروفايل المشغل المسبق لنفس المستخدم عبر:
  ```typescript
  const existing = await this.prisma.operatorListing.findFirst({ where: { userId } });
  if (existing) {
    throw new ConflictException('لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه');
  }
  ```
- **`requestDeletion()`**: استبدال `remove()` المباشر بطلب حذف:
  - التحقق من ملكية الإعلان (`ForbiddenException('لا يمكنك حذف إعلان غيرك')`).
  - التحقق من عدم وجود طلب معلق سابق (`ConflictException('يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان')`).
  - إنشاء سجل `OperatorDeletionRequest` بحالة `PENDING` دون المساس بسجل الإعلان.
- **`cancelDeletionRequest()`**:
  - التحقق من هوية صاحب الطلب وحالة `PENDING`.
  - فحص مهلة الـ 24 ساعة:
    ```typescript
    if ((Date.now() - request.createdAt.getTime()) > 24 * 60 * 60 * 1000) {
      throw new BadRequestException('انتهت مهلة إلغاء طلب الحذف (24 ساعة)، الطلب قيد مراجعة الإدارة الآن');
    }
    ```
  - تحديث الحالة إلى `CANCELLED` وتعيين `cancelledAt`.
- **`adminListDeletionRequests()`**: جلب الطلبات مع الترقيم، والفلترة بحسب الحالة، وتضمين تفاصيل الإعلان والمستخدم.
- **`adminReviewDeletion()`**:
  - في حال `APPROVED`: داخل `$transaction`، حذف الإعلان، وإنشاء حدث `outboxEvent` بنوع `OPERATOR_LISTING` وأكشن `DELETE`، وتحديث الطلب إلى `APPROVED`. بعد إتمام الـ Transaction، استدعاء `this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', operatorListingId)`، وإرسال إشعار `OPERATOR_DELETION_APPROVED`.
  - في حال `REJECTED`: تحديث حالة الطلب وسبب الرفض، وإرسال إشعار `OPERATOR_DELETION_REJECTED`.
- **`findAll()`**: تفعيل `sortBy` الفعلي في استعلام Prisma ودعم الفلاتر الرقمية الجديدة (`minDailyRate`, `maxDailyRate`, إلخ).
- **`update()`**: دعم حفظ وتحديث `profileImageUrl`.
- **تدقيق الاستثناءات**: جميع رسائل الأخطاء والاستثناءات بصيغة عربية واضحة ومباشرة دون أي تسريب لأخطاء Prisma أو قاعدة البيانات.

---

### D) Controllers & Module

- `operators.controller.ts`:
  - توجيه `DELETE :id` إلى `requestDeletion`.
  - إضافة `DELETE deletion-requests/:id` لاستدعاء `cancelDeletionRequest` (تم وضعه قبل المسار ذي المتغير `:id` لمنع تضارب المسارات).
- `admin-operators.controller.ts`:
  - إنشاء المتحكم المحمي بـ `@UseGuards(JwtAuthGuard, RolesGuard)` و `@Roles(UserRole.ADMIN)`.
  - `GET admin/operators/deletion-requests`
  - `PATCH admin/operators/deletion-requests/:id`
- `operators.module.ts`:
  - تسجيل `AdminOperatorsController` و `NotificationsModule`.

---

### E) search-sync.worker.ts

- في دالة الفهرسة لـ `ENTITY_TYPES.OPERATOR_LISTING`، تم إضافة `profileImageUrl: operator.profileImageUrl` إلى حمولة `indexDocument`:
```typescript
        await this.meili.indexDocument(INDEXES.OPERATORS, {
          id: operator.id,
          title: operator.title,
          description: operator.description,
          operatorType: operator.operatorType,
          specializations: operator.specializations,
          equipmentTypes: operator.equipmentTypes,
          experienceYears: operator.experienceYears,
          dailyRate: operator.dailyRate ? Number(operator.dailyRate) : null,
          hourlyRate: operator.hourlyRate ? Number(operator.hourlyRate) : null,
          governorateId: operator.governorateId,
          wilayaId: operator.wilayaId,
          status: operator.status,
          viewCount: operator.viewCount,
          profileImageUrl: operator.profileImageUrl,
          createdAt: operator.createdAt,
        });
```

---

## 3. الفروقات الفعلية في الكود (Code Diffs)

```diff
diff --git a/apps/api/prisma/schema.prisma b/apps/api/prisma/schema.prisma
index 6a5b98f..892e85a 100644
--- a/apps/api/prisma/schema.prisma
+++ b/apps/api/prisma/schema.prisma
@@ -499,6 +499,7 @@ model OperatorListing {
   wilayaId          Int
+  profileImageUrl   String?
   latitude          Float?
   longitude         Float?
   viewCount         Int      @default(0)
@@ -512,6 +513,7 @@ model OperatorListing {
   wilayaRef         Wilaya?       @relation(fields: [wilayaId], references: [id])
+  deletionRequests  OperatorDeletionRequest[]
 
   @@index([userId])
   @@index([status])
@@ -522,6 +524,31 @@ model OperatorListing {
   @@map("operator_listings")
 }
 
+enum OperatorDeletionStatus {
+  PENDING
+  APPROVED
+  REJECTED
+  CANCELLED
+}
+
+model OperatorDeletionRequest {
+  id                 String                 @id @default(cuid())
+  operatorListingId  String
+  operatorListing    OperatorListing        @relation(fields: [operatorListingId], references: [id], onDelete: Cascade)
+  userId             String
+  reason             String?
+  status             OperatorDeletionStatus @default(PENDING)
+  reviewedBy         String?
+  reviewedAt         DateTime?
+  rejectionReason    String?
+  cancelledAt        DateTime?
+  createdAt          DateTime               @default(now())
+  updatedAt          DateTime               @updatedAt
+
+  @@index([operatorListingId])
+  @@index([status])
+  @@map("operator_deletion_requests")
+}
+
 enum NotificationType {
   CHAT_MESSAGE
   OFFER_RECEIVED
@@ -888,6 +915,8 @@ enum NotificationType {
   JOB_APPLICATION_REJECTED
   DRIVER_VERIFICATION_APPROVED
   DRIVER_VERIFICATION_REJECTED
+  OPERATOR_DELETION_APPROVED
+  OPERATOR_DELETION_REJECTED
 }
```

```diff
diff --git a/apps/api/src/equipment/dto/create-operator-listing.dto.ts b/apps/api/src/equipment/dto/create-operator-listing.dto.ts
index c60ee33..df7fbc5 100644
--- a/apps/api/src/equipment/dto/create-operator-listing.dto.ts
+++ b/apps/api/src/equipment/dto/create-operator-listing.dto.ts
@@ -62,8 +62,13 @@ export class CreateOperatorListingDto {
   @IsPositive()
   governorateId: number;
 
-  @IsOptional()
   @IsInt()
   @IsPositive()
-  wilayaId?: number;
+  wilayaId: number;
+
+  @IsOptional()
+  @IsUrl()
+  profileImageUrl?: string;
```

```diff
diff --git a/apps/api/src/equipment/dto/update-operator-listing.dto.ts b/apps/api/src/equipment/dto/update-operator-listing.dto.ts
index b56d539..77a0e5b 100644
--- a/apps/api/src/equipment/dto/update-operator-listing.dto.ts
+++ b/apps/api/src/equipment/dto/update-operator-listing.dto.ts
@@ -1,4 +1,11 @@
 import { PartialType } from '@nestjs/swagger';
 import { CreateOperatorListingDto } from './create-operator-listing.dto';
+import { IsOptional, IsUrl } from 'class-validator';
 
-export class UpdateOperatorListingDto extends PartialType(CreateOperatorListingDto) {}
+export class UpdateOperatorListingDto extends PartialType(CreateOperatorListingDto) {
+  @IsOptional()
+  @IsUrl()
+  profileImageUrl?: string;
+}
```

```diff
diff --git a/apps/api/src/equipment/dto/query-operator-listings.dto.ts b/apps/api/src/equipment/dto/query-operator-listings.dto.ts
index 92394c2..a4de3a5 100644
--- a/apps/api/src/equipment/dto/query-operator-listings.dto.ts
+++ b/apps/api/src/equipment/dto/query-operator-listings.dto.ts
@@ -1,4 +1,4 @@
-import { IsOptional, IsString, IsInt, Min, IsEnum } from 'class-validator';
+import { IsOptional, IsString, IsInt, Min, IsEnum, IsNumber } from 'class-validator';
 import { Type } from 'class-transformer';
 
 export class QueryOperatorListingsDto {
@@ -32,4 +32,34 @@ export class QueryOperatorListingsDto {
   @IsOptional()
   @IsEnum(['createdAt', 'dailyRate', 'hourlyRate', 'experienceYears', 'viewCount'])
   sortBy?: string;
+
+  @IsOptional()
+  @Type(() => Number)
+  @IsNumber()
+  minDailyRate?: number;
+
+  @IsOptional()
+  @Type(() => Number)
+  @IsNumber()
+  maxDailyRate?: number;
+
+  @IsOptional()
+  @Type(() => Number)
+  @IsNumber()
+  minHourlyRate?: number;
+
+  @IsOptional()
+  @Type(() => Number)
+  @IsNumber()
+  maxHourlyRate?: number;
+
+  @IsOptional()
+  @Type(() => Number)
+  @IsNumber()
+  minExperienceYears?: number;
+
+  @IsOptional()
+  @Type(() => Number)
+  @IsNumber()
+  maxExperienceYears?: number;
 }
```

```diff
diff --git a/apps/api/src/operators/operators.controller.ts b/apps/api/src/operators/operators.controller.ts
index dc2ef97..d07a16f 100644
--- a/apps/api/src/operators/operators.controller.ts
+++ b/apps/api/src/operators/operators.controller.ts
@@ -53,8 +53,18 @@ export class OperatorsController {
     return this.operatorsService.update(id, req.user.id, dto);
   }
 
+  @Delete('deletion-requests/:id')
+  @UseGuards(JwtAuthGuard)
+  async cancelDeletionRequest(
+    @Param('id') id: string,
+    @Request() req: any,
+  ) {
+    return this.operatorsService.cancelDeletionRequest(id, req.user.id);
+  }
+
   @Delete(':id')
   @UseGuards(JwtAuthGuard)
-  async remove(@Param('id') id: string, @Request() req: any) {
-    return this.operatorsService.remove(id, req.user.id);
+  async requestDeletion(@Param('id') id: string, @Request() req: any, @Body() dto: RequestDeletionDto) {
+    return this.operatorsService.requestDeletion(id, req.user.id, dto?.reason);
   }
 }
```

```diff
diff --git a/apps/api/src/operators/operators.module.ts b/apps/api/src/operators/operators.module.ts
index c61e755..bbab2f0 100644
--- a/apps/api/src/operators/operators.module.ts
+++ b/apps/api/src/operators/operators.module.ts
@@ -2,9 +2,11 @@ import { Module } from '@nestjs/common';
 import { OperatorsService } from './operators.service';
 import { OperatorsController } from './operators.controller';
+import { AdminOperatorsController } from './admin-operators.controller';
 import { PrismaModule } from '../prisma/prisma.module';
+import { NotificationsModule } from '../notifications/notifications.module';
 
 @Module({
-  imports: [PrismaModule],
-  controllers: [OperatorsController],
+  imports: [PrismaModule, NotificationsModule],
+  controllers: [OperatorsController, AdminOperatorsController],
   providers: [OperatorsService],
   exports: [OperatorsService],
 })
 export class OperatorsModule {}
```

---

## 4. مخرجات التحقق والفحوصات (Verification Outputs)

### 1) Typecheck (tsc --noEmit)
**Command**:
```bash
npx tsc --noEmit -p apps/api/tsconfig.build.json
```
**Terminal Output**:
```text
(no errors returned)
Exit code: 0
```

### 2) اختبارات الوحدة الخاصة بخدمة المشغلين (Unit Tests)
**Command**:
```bash
npx jest apps/api/src/operators/operators.service.spec.ts
```
**Terminal Output**:
```text
PASS apps/api/src/operators/operators.service.spec.ts
  OperatorsService
    create()
      √ should create an operator listing when user has no existing profile (2 ms)
      √ should throw ConflictException with Arabic message if user already has a profile (2 ms)
    requestDeletion()
      √ should throw NotFoundException if operator listing does not exist (1 ms)
      √ should throw ForbiddenException if user does not own listing (1 ms)
      √ should throw ConflictException if pending deletion request already exists (1 ms)
      √ should create a PENDING deletion request successfully (1 ms)
    cancelDeletionRequest()
      √ should throw NotFoundException if request not found (1 ms)
      √ should throw ForbiddenException if request does not belong to user (1 ms)
      √ should throw BadRequestException if request status is not PENDING (1 ms)
      √ should throw BadRequestException if 24 hours have passed (1 ms)
      √ should cancel request if within 24 hours (1 ms)
    adminListDeletionRequests()
      √ should return paginated deletion requests (1 ms)
    adminReviewDeletion()
      √ should throw NotFoundException if request not found (1 ms)
      √ should throw BadRequestException if request already decided (1 ms)
      √ should approve request, delete listing, emit outbox event, clean orphans, and notify user (2 ms)
      √ should reject request, update reason, and notify user (1 ms)

Test Suites: 1 passed, 1 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        1.455 s
Exit code: 0
```

### 3) اختبارات التكامل الشاملة (E2E Integration Tests) مع مخرجات الـ JSON الحقيقية لحالات الخطأ
تم تشغيل الاختبار الكامل:
```bash
npx jest --config jest-e2e.config.js test/operators-phase0.e2e-spec.ts --runInBand --forceExit
```
**Terminal Output**:
```text
PASS test/operators-phase0.e2e-spec.ts (118.053 s)
  Operators Phase 0 API (e2e)
    1. POST /api/operators (Create Operator Listing)
      √ Success Case: Should create an operator listing with profileImageUrl and required wilayaId (7605 ms)
      √ Failure Case (Single Profile Constraint): Should reject second profile for same user with plain Arabic ConflictException (411 ms)
    2. GET /api/operators (Find All with new filters & sorting)
      √ Success Case: Should list operators with min/max filters and custom sortBy (3882 ms)
    3. PATCH /api/operators/:id (Update Profile Image & Details)
      √ Success Case: Should update profileImageUrl successfully (10230 ms)
      √ Failure Case: Should reject update by unauthorized non-owner with plain Arabic ForbiddenException (924 ms)
    4. DELETE /api/operators/:id (Request Deletion)
      √ Failure Case (Not Found): Should return 404 with plain Arabic message for non-existent listing (328 ms)
      √ Failure Case (Forbidden): Should return 403 with plain Arabic message when deleting other user listing (160 ms)
      √ Success Case: Should create a PENDING deletion request without deleting the listing (1375 ms)
      √ Failure Case (Duplicate Pending Request): Should return 409 when a pending deletion request already exists (304 ms)
    5. DELETE /api/operators/deletion-requests/:id (Cancel Deletion Request)
      √ Failure Case (Not Found): Should return 404 for non-existent deletion request (310 ms)
      √ Failure Case (Forbidden): Should return 403 when cancelling another user request (2034 ms)
      √ Success Case: Should cancel a pending request within 24 hours (5659 ms)
      √ Failure Case (Already Cancelled): Should return 400 when trying to cancel an already processed request (327 ms)
    6. Admin Endpoints: /api/admin/operators/deletion-requests
      √ Failure Case (RBAC): Regular user should be forbidden from accessing admin endpoints (15 ms)
      √ Success Case (Admin List): Admin should list all deletion requests with pagination & status filter (16324 ms)
      √ Failure Case (Review Non-Existent): Admin reviewing non-existent request should return 404 (2485 ms)
      √ Success Case (Admin Review REJECTED): Admin rejects request and notifies user (2012 ms)
      √ Failure Case (Review Already Decided): Re-reviewing a decided request returns 400 (177 ms)
      √ Success Case (Admin Review APPROVED): Admin approves request -> listing deleted + outbox event created + orphans cleaned (17516 ms)

Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Snapshots:   0 total
Time:        118.161 s
Exit code: 0
```

#### عينات الـ JSON الحقيقية لحالات الفشل (تأكيد الرسائل العربية الخالية من أخطاء الـ DB/Stack):
- **رفض إنشاء بروفايل ثانٍ لنفس المستخدم (409 Conflict)**:
```json
{
  "message": "لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه",
  "error": "Conflict",
  "statusCode": 409
}
```
- **رفض تعديل إعلان غير مملوك للمستخدم (403 Forbidden)**:
```json
{
  "message": "لا يمكنك تعديل إعلان غيرك",
  "error": "Forbidden",
  "statusCode": 403
}
```
- **طلب حذف إعلان غير موجود (404 Not Found)**:
```json
{
  "message": "إعلان المشغل غير موجود",
  "error": "Not Found",
  "statusCode": 404
}
```
- **طلب حذف إعلان يخص مستخدماً آخر (403 Forbidden)**:
```json
{
  "message": "لا يمكنك حذف إعلان غيرك",
  "error": "Forbidden",
  "statusCode": 403
}
```
- **محاولة تكرار طلب حذف معلق لنفس الإعلان (409 Conflict)**:
```json
{
  "message": "يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان",
  "error": "Conflict",
  "statusCode": 409
}
```
- **إلغاء طلب حذف غير موجود (404 Not Found)**:
```json
{
  "message": "طلب الحذف غير موجود",
  "error": "Not Found",
  "statusCode": 404
}
```
- **إلغاء طلب حذف يخص مستخدماً آخر (403 Forbidden)**:
```json
{
  "message": "لا يمكنك إلغاء طلب حذف لا يخصك",
  "error": "Forbidden",
  "statusCode": 403
}
```
- **محاولة إلغاء طلب تم البت فيه أو إلغاؤه مسبقاً (400 Bad Request)**:
```json
{
  "message": "لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه",
  "error": "Bad Request",
  "statusCode": 400
}
```
- **مراجعة الإدارة لطلب غير موجود (404 Not Found)**:
```json
{
  "message": "طلب الحذف غير موجود",
  "error": "Not Found",
  "statusCode": 404
}
```
- **محاولة إعادة مراجعة طلب تم البت فيه مسبقاً (400 Bad Request)**:
```json
{
  "message": "هذا الطلب تم البت فيه بالفعل أو تم إلغاؤه",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 4) اختبارات عدم الانحدار للأقسام الأخرى (Regression Test Suites for Equipment & Jobs)
**Command**:
```bash
npx jest --testPathPattern="equipment|jobs"
```
**Terminal Output**:
```text
PASS src/equipment/equipment.service.spec.ts
PASS src/jobs/jobs.service.spec.ts
PASS src/jobs/jobs.controller.spec.ts
PASS src/jobs/driver-verification.service.spec.ts
PASS src/jobs/admin-jobs.controller.spec.ts
PASS src/jobs/admin-jobs.service.spec.ts
PASS src/equipment/equipment.controller.spec.ts

Test Suites: 7 passed, 7 total
Tests:       98 passed, 98 total
Snapshots:   0 total
Time:        4.502 s
Exit code: 0
```

---

## 5. دليل التحقق من كود تنظيف الأيتام (Section G Evidence Request)

النص المباشر من ملف `apps/api/scripts/ts/cleanup-operator-duplicates.ts` (السطور 94 إلى 116):
```typescript
        // 3c. Clean up polymorphic orphans (Favorites, Conversations, Reviews)
        const favs = await tx.favorite.deleteMany({
          where: {
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: { in: duplicateIds },
          },
        });

        const convs = await tx.conversation.deleteMany({
          where: {
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: { in: duplicateIds },
          },
        });

        const revs = await tx.review.deleteMany({
          where: {
            entityType: 'OPERATOR_LISTING',
            entityId: { in: duplicateIds },
          },
        });

        console.log(`  -> Cleaned polymorphic orphans: Favorites=${favs.count}, Conversations=${convs.count}, Reviews=${revs.count}`);
```

ملاحظة للمراجعة: في السكريبت اليدوي للدفعة السابقة، تم استخدام استدعاء مباشر على مستوى الـ `tx` للكيانات البوليمورفية الثلاث (`favorite`, `conversation`, `review`) نظراً لأن `tx` الممرر في معاملة Prisma Client لا يحتوي على الـ extension method `cleanupPolymorphicOrphans` المعرّفة على عميل `PrismaService` الرئيسي. بينما في `operators.service.ts` بالمرحلة صفر، تم استدعاء دالة `this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', request.operatorListingId)` المشتركة فور إتمام المعاملة كما نصت مواصفات المرحلة صفر بدقة.

---

## 6. الحالة النهائية والالتزام بالقواعد (Compliance & Next Step)

- تم إيقاف العمل والالتزام الصارم بعدم الدمج في `main` وعدم عمل `git push`.
- كل الأكواد والفحوصات محفوظة ومستقرة على الفرع `feature/operators-phase0`.
