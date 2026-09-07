# تقرير الأدلة التكميلية للمرحلة صفر (008 - Phase 0 Evidence Gaps)

**التصنيف**: Category A — Read-Only / Audit  
**الفرع**: `feature/operators-phase0`  
**تاريخ التوثيق**: 2026-09-07  

---

## 1. قائمة الملفات التي تم فحصها / توثيقها بالكامل (Inspected Files)

1. `apps/api/prisma/migrations/20260907000000_add_operator_deletion_requests_and_profile_image/migration.sql`
2. `apps/api/src/operators/operators.service.ts`
3. `apps/api/src/operators/admin-operators.controller.ts`
4. `apps/api/prisma/schema.prisma`

---

## 2. المحتويات الخام والأدلة المطلوبة (Raw Outputs & Verbatim Evidence)

### 1) المحتوى الكامل لملف الترحيل (migration.sql)
**المسار**: `apps/api/prisma/migrations/20260907000000_add_operator_deletion_requests_and_profile_image/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "OperatorDeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_DELETION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'OPERATOR_DELETION_REJECTED';

-- AlterTable
ALTER TABLE "operator_listings" ADD COLUMN "profileImageUrl" TEXT,
ALTER COLUMN "wilayaId" SET NOT NULL;

-- CreateTable
CREATE TABLE "operator_deletion_requests" (
    "id" TEXT NOT NULL,
    "operatorListingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "OperatorDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_deletion_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "operator_deletion_requests_operatorListingId_idx" ON "operator_deletion_requests"("operatorListingId");

-- CreateIndex
CREATE INDEX "operator_deletion_requests_status_idx" ON "operator_deletion_requests"("status");

-- AddForeignKey
ALTER TABLE "operator_deletion_requests" ADD CONSTRAINT "operator_deletion_requests_operatorListingId_fkey" FOREIGN KEY ("operatorListingId") REFERENCES "operator_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

---

### 2) الـ `git diff` الكامل غير المجتزأ لملف `operators.service.ts`
**الأمر المنفذ**: `git diff apps/api/src/operators/operators.service.ts`  
**Exit Code**: 0  

```diff
diff --git a/apps/api/src/operators/operators.service.ts b/apps/api/src/operators/operators.service.ts
index 39fbddb..71ccc21 100644
--- a/apps/api/src/operators/operators.service.ts
+++ b/apps/api/src/operators/operators.service.ts
@@ -1,15 +1,23 @@
 import {
+  BadRequestException,
+  ConflictException,
   ForbiddenException,
   Injectable,
   NotFoundException,
 } from '@nestjs/common';
-import { Prisma, OperatorType, EquipmentType } from '@prisma/client';
+import {
+  Prisma,
+  OperatorType,
+  EquipmentType,
+  OperatorDeletionStatus,
+  NotificationType,
+} from '@prisma/client';
 import { PrismaService } from '../prisma/prisma.service';
+import { NotificationsService } from '../notifications/notifications.service';
 import { CreateOperatorListingDto } from './dto/create-operator-listing.dto';
 import { UpdateOperatorListingDto } from './dto/update-operator-listing.dto';
 import { QueryOperatorListingsDto } from './dto/query-operator-listings.dto';
 import { USER_SELECT, generateSlug } from '../common/utils/entity.utils';
-
 import { GeoService } from '../locations/geo.service';
 import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
 
@@ -17,9 +25,16 @@ import { ENTITY_TYPES } from '../common/constants/entity-types.constants';
 export class OperatorsService {
   constructor(
     private readonly geoService: GeoService,
-private readonly prisma: PrismaService) {}
+    private readonly prisma: PrismaService,
+    private readonly notificationsService: NotificationsService,
+  ) {}
 
   async create(dto: CreateOperatorListingDto, userId: string) {
+    const existing = await this.prisma.operatorListing.findFirst({ where: { userId } });
+    if (existing) {
+      throw new ConflictException('لديك بروفايل مشغّل بالفعل، يمكنك تعديله أو طلب حذفه');
+    }
+
     await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);
 
     const item = await this.prisma.$transaction(async (tx) => {
@@ -37,6 +52,7 @@ private readonly prisma: PrismaService) {}
           hourlyRate: dto.hourlyRate != null ? new Prisma.Decimal(dto.hourlyRate) : null,
           currency: dto.currency ?? 'OMR',
           isPriceNegotiable: dto.isPriceNegotiable ?? false,
+          profileImageUrl: dto.profileImageUrl ?? null,
           governorateId: dto.governorateId,
           wilayaId: dto.wilayaId,
           latitude: dto.latitude,
@@ -77,6 +93,8 @@ private readonly prisma: PrismaService) {}
     if (q.operatorType) where.operatorType = q.operatorType as OperatorType;
     if (q.governorateId) where.governorateId = q.governorateId;
     if (q.wilayaId) where.wilayaId = q.wilayaId;
+    if (q.userId) where.userId = q.userId;
+
     if (q.search) {
       where.OR = [
         { title: { contains: q.search, mode: 'insensitive' } },
@@ -84,11 +102,67 @@ private readonly prisma: PrismaService) {}
       ];
     }
 
-    const orderBy: Prisma.OperatorListingOrderByWithRelationInput = { createdAt: 'desc' };
+    if (q.minDailyRate !== undefined || q.maxDailyRate !== undefined) {
+      where.dailyRate = {
+        ...(q.minDailyRate !== undefined ? { gte: new Prisma.Decimal(q.minDailyRate) } : {}),
+        ...(q.maxDailyRate !== undefined ? { lte: new Prisma.Decimal(q.maxDailyRate) } : {}),
+      };
+    }
+
+    if (q.minHourlyRate !== undefined || q.maxHourlyRate !== undefined) {
+      where.hourlyRate = {
+        ...(q.minHourlyRate !== undefined ? { gte: new Prisma.Decimal(q.minHourlyRate) } : {}),
+        ...(q.maxHourlyRate !== undefined ? { lte: new Prisma.Decimal(q.maxHourlyRate) } : {}),
+      };
+    }
+
+    if (q.minExperienceYears !== undefined || q.maxExperienceYears !== undefined) {
+      where.experienceYears = {
+        ...(q.minExperienceYears !== undefined ? { gte: q.minExperienceYears } : {}),
+        ...(q.maxExperienceYears !== undefined ? { lte: q.maxExperienceYears } : {}),
+      };
+    }
+
+    let orderBy: Prisma.OperatorListingOrderByWithRelationInput = { createdAt: 'desc' };
+    switch (q.sortBy) {
+      case 'oldest':
+      case 'createdAt_asc':
+        orderBy = { createdAt: 'asc' };
+        break;
+      case 'dailyRate_asc':
+      case 'price_asc':
+        orderBy = { dailyRate: 'asc' };
+        break;
+      case 'dailyRate_desc':
+      case 'price_desc':
+        orderBy = { dailyRate: 'desc' };
+        break;
+      case 'hourlyRate_asc':
+        orderBy = { hourlyRate: 'asc' };
+        break;
+      case 'hourlyRate_desc':
+        orderBy = { hourlyRate: 'desc' };
+        break;
+      case 'experience_desc':
+        orderBy = { experienceYears: 'desc' };
+        break;
+      case 'popular':
+      case 'views_desc':
+        orderBy = { viewCount: 'desc' };
+        break;
+      case 'newest':
+      case 'createdAt_desc':
+      default:
+        orderBy = { createdAt: 'desc' };
+        break;
+    }
 
     const [items, total] = await this.prisma.$transaction([
       this.prisma.operatorListing.findMany({
-        where, orderBy, skip: (page - 1) * limit, take: limit,
+        where,
+        orderBy,
+        skip: (page - 1) * limit,
+        take: limit,
         include: {
           user: { select: USER_SELECT },
           governorateRef: true,
@@ -110,7 +184,6 @@ private readonly prisma: PrismaService) {}
       },
     });
     if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
-    // TODO: migrate viewCount to Redis INCR + periodic sync for high traffic
     this.prisma.operatorListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
     return item;
   }
@@ -150,6 +223,7 @@ private readonly prisma: PrismaService) {}
     if (dto.hourlyRate !== undefined) data.hourlyRate = new Prisma.Decimal(dto.hourlyRate);
     if (dto.currency !== undefined) data.currency = dto.currency;
     if (dto.isPriceNegotiable !== undefined) data.isPriceNegotiable = dto.isPriceNegotiable;
+    if (dto.profileImageUrl !== undefined) data.profileImageUrl = dto.profileImageUrl;
     if (dto.governorateId !== undefined) data.governorateId = dto.governorateId;
     if (dto.wilayaId !== undefined) data.wilayaId = dto.wilayaId;
     if (dto.latitude !== undefined) data.latitude = dto.latitude;
@@ -190,20 +264,179 @@ private readonly prisma: PrismaService) {}
     return updated;
   }
 
-  async remove(id: string, userId: string) {
+  async requestDeletion(id: string, userId: string, reason?: string) {
     const item = await this.prisma.operatorListing.findUnique({ where: { id } });
     if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
     if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');
-    await this.prisma.$transaction(async (tx) => {
-      await tx.operatorListing.delete({ where: { id } });
-      await tx.outboxEvent.create({
+
+    const pending = await this.prisma.operatorDeletionRequest.findFirst({
+      where: {
+        operatorListingId: id,
+        status: OperatorDeletionStatus.PENDING,
+      },
+    });
+    if (pending) {
+      throw new ConflictException('يوجد طلب حذف قيد المراجعة بالفعل لهذا الإعلان');
+    }
+
+    const request = await this.prisma.operatorDeletionRequest.create({
+      data: {
+        operatorListingId: id,
+        userId,
+        reason: reason ?? null,
+        status: OperatorDeletionStatus.PENDING,
+      },
+    });
+
+    return {
+      message: 'تم تقديم طلب الحذف بنجاح وهو قيد مراجعة الإدارة',
+      request,
+    };
+  }
+
+  async cancelDeletionRequest(requestId: string, userId: string) {
+    const request = await this.prisma.operatorDeletionRequest.findUnique({
+      where: { id: requestId },
+    });
+    if (!request) {
+      throw new NotFoundException('طلب الحذف غير موجود');
+    }
+    if (request.userId !== userId) {
+      throw new ForbiddenException('لا يمكنك إلغاء طلب حذف لا يخصك');
+    }
+    if (request.status !== OperatorDeletionStatus.PENDING) {
+      throw new BadRequestException('لا يمكن إلغاء طلب تم البت فيه بالفعل أو تم إلغاؤه');
+    }
+
+    const elapsedMs = Date.now() - request.createdAt.getTime();
+    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
+    if (elapsedMs > twentyFourHoursMs) {
+      throw new BadRequestException('انتهت مهلة إلغاء طلب الحذف (24 ساعة)، الطلب قيد مراجعة الإدارة الآن');
+    }
+
+    return this.prisma.operatorDeletionRequest.update({
+      where: { id: requestId },
+      data: {
+        status: OperatorDeletionStatus.CANCELLED,
+        cancelledAt: new Date(),
+      },
+    });
+  }
+
+  async adminListDeletionRequests(status?: OperatorDeletionStatus, page = 1, limit = 20) {
+    const safeLimit = Math.min(limit, 50);
+    const where: Prisma.OperatorDeletionRequestWhereInput = status ? { status } : {};
+
+    const [items, total] = await this.prisma.$transaction([
+      this.prisma.operatorDeletionRequest.findMany({
+        where,
+        skip: (page - 1) * safeLimit,
+        take: safeLimit,
+        orderBy: { createdAt: 'desc' },
+        include: {
+          operatorListing: {
+            include: {
+              user: { select: USER_SELECT },
+              governorateRef: true,
+              wilayaRef: true,
+            },
+          },
+        },
+      }),
+      this.prisma.operatorDeletionRequest.count({ where }),
+    ]);
+
+    return {
+      items,
+      meta: {
+        total,
+        page,
+        limit: safeLimit,
+        totalPages: Math.ceil(total / safeLimit),
+      },
+    };
+  }
+
+  async adminReviewDeletion(
+    requestId: string,
+    adminId: string,
+    decision: 'APPROVED' | 'REJECTED',
+    rejectionReason?: string,
+  ) {
+    const request = await this.prisma.operatorDeletionRequest.findUnique({
+      where: { id: requestId },
+    });
+    if (!request) {
+      throw new NotFoundException('طلب الحذف غير موجود');
+    }
+    if (request.status !== OperatorDeletionStatus.PENDING) {
+      throw new BadRequestException('هذا الطلب تم البت فيه بالفعل أو تم إلغاؤه');
+    }
+
+    if (decision === 'APPROVED') {
+      await this.prisma.$transaction(async (tx) => {
+        await tx.operatorDeletionRequest.update({
+          where: { id: requestId },
+          data: {
+            status: OperatorDeletionStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: new Date(),
          },
        });

        await tx.operatorListing.delete({
          where: { id: request.operatorListingId },
        });

        await tx.outboxEvent.create({
          data: {
            entityType: ENTITY_TYPES.OPERATOR_LISTING,
            entityId: request.operatorListingId,
            action: 'DELETE',
          },
        });
      });

      await this.prisma.cleanupPolymorphicOrphans('OPERATOR_LISTING', request.operatorListingId);

      await this.notificationsService.create({
        type: NotificationType.OPERATOR_DELETION_APPROVED,
        title: 'تمت الموافقة على طلب الحذف',
        body: 'تمت الموافقة على حذف إعلان المشغل الخاص بك وحذفه بنجاح',
        userId: request.userId,
        data: { operatorListingId: request.operatorListingId },
      });

      return { success: true, status: OperatorDeletionStatus.APPROVED };
    }

    if (decision === 'REJECTED') {
      const updated = await this.prisma.operatorDeletionRequest.update({
        where: { id: requestId },
        data: {
          status: OperatorDeletionStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          rejectionReason: rejectionReason ?? null,
        },
      });

      await this.notificationsService.create({
        type: NotificationType.OPERATOR_DELETION_REJECTED,
        title: 'تم رفض طلب الحذف',
        body: rejectionReason
          ? `تم رفض طلب حذف إعلان المشغل: ${rejectionReason}`
          : 'تم رفض طلب حذف إعلان المشغل الخاص بك من قبل الإدارة',
        userId: request.userId,
        data: {
          operatorListingId: request.operatorListingId,
          rejectionReason: rejectionReason ?? null,
        },
      });

      return updated;
    }

    throw new BadRequestException('قرار غير صالح');
   }
 }
```

---

### 3) المحتوى الكامل لملف `admin-operators.controller.ts`
**المسار**: `apps/api/src/operators/admin-operators.controller.ts`

```typescript
import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OperatorDeletionStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { OperatorsService } from './operators.service';
import { AdminReviewDeletionDto } from './dto/admin-review-deletion.dto';

@Controller('admin/operators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOperatorsController {
  constructor(private readonly operatorsService: OperatorsService) {}

  @Get('deletion-requests')
  listDeletionRequests(
    @Query('status') status?: OperatorDeletionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.operatorsService.adminListDeletionRequests(status, pageNum, limitNum);
  }

  @Patch('deletion-requests/:id')
  reviewDeletion(
    @Param('id') id: string,
    @Body() dto: AdminReviewDeletionDto,
    @CurrentUser() admin: JwtPayload,
  ) {
    return this.operatorsService.adminReviewDeletion(
      id,
      admin.sub,
      dto.decision,
      dto.rejectionReason,
    );
  }
}
```

---

### 4) الفحص الخام لتحويل `wilayaId Int?` إلى `wilayaId Int` في `schema.prisma`
**الأمر المنفذ**: `git diff apps/api/prisma/schema.prisma | Select-String -Pattern "wilayaId" -Context 3`  
**Exit Code**: 0  

**المخرجات الخام**:
```text
     // New Location Fields
     governorateId  Int?
     governorateRef Governorate? @relation(fields: [governorateId], references: [id], onDelete: Restrict)
> -  wilayaId       Int?
> -  wilayaRef      Wilaya?      @relation(fields: [wilayaId], references: [id], onDelete: Restrict)
> +  wilayaId       Int
> +  wilayaRef      Wilaya       @relation(fields: [wilayaId], references: [id], onDelete: Restrict)
  +
  +  deletionRequests OperatorDeletionRequest[]
```

**سياق الـ diff الكامل للكتلة المعنية في `schema.prisma`**:
```diff
@@ -1442,11 +1444,15 @@ model OperatorListing {
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
 
+  profileImageUrl String?
+
   // New Location Fields
   governorateId  Int?
   governorateRef Governorate? @relation(fields: [governorateId], references: [id], onDelete: Restrict)
-  wilayaId       Int?
-  wilayaRef      Wilaya?      @relation(fields: [wilayaId], references: [id], onDelete: Restrict)
+  wilayaId       Int
+  wilayaRef      Wilaya       @relation(fields: [wilayaId], references: [id], onDelete: Restrict)
+
+  deletionRequests OperatorDeletionRequest[]
```
