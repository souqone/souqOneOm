# Operators — تأكيد: بيانات جانبية مرتبطة + نمط موافقة الأدمن الموجود

تاريخ: 2026-09-06 | مصدر: `souqOneOm` backend repo | Audit للقراءة فقط — مفيش أي تعديل. كل النتائج بالحرف من غير تلخيص.

---

## 1) كل علاقات `OperatorListing` في الـ schema

```
$ grep -n "OperatorListing" apps/api/prisma/schema.prisma

55:  operatorListings  OperatorListing[]         @relation("UserOperatorListings")
145:  operatorListings  OperatorListing[]
173:  operatorListings  OperatorListing[]
1409:// خدمات التشغيل — OperatorListing
1411:model OperatorListing {
1440:  user   User   @relation("UserOperatorListings", fields: [userId], references: [id], onDelete: Cascade)
```

**تفصيل الأسطر:**
- سطر 55: `User.operatorListings` — علاقة الاستخدام العكسية (كل إعلانات مستخدم معين).
- سطر 145، 173: نفس النمط، back-relations من `Governorate`/`Wilaya` (نفس النمط الموجود لكل الـ verticals التانية).
- سطر 1440: العلاقة الحقيقية الوحيدة على `OperatorListing` نفسه — `userId` فقط، مفيش أي حقل تاني بيربطه بموديل تاني (`onDelete: Cascade` على الـ user relation).

**النتيجة: مفيش أي `@relation` مباشر من `Review`, `Favorite`, `Report` أو أي موديل تاني لـ `OperatorListing`.** أي ارتباط موجود هيبقى polymorphic (نص + ID بدون FK حقيقي) — شوف قسم 2.

---

## 2) موديل `Review` — النمط الـ Polymorphic

```
$ grep -n "model Review" -A 20 apps/api/prisma/schema.prisma

1477:model Review {
1478-  id      String  @id @default(cuid())
1479-  rating  Int // 1-5
1480-  comment String?
1481-
1482-  entityType ReviewEntityType
1483-  entityId   String
1484-
1485-  reviewerId String
1486-  reviewer   User   @relation("ReviewsGiven", fields: [reviewerId], references: [id], onDelete: Cascade)
1487-
1488-  revieweeId String
1489-  reviewee   User   @relation("ReviewsReceived", fields: [revieweeId], references: [id], onDelete: Cascade)
1490-
1491-  reply ReviewReply?
1492-
1493-  createdAt DateTime @default(now())
1494-  updatedAt DateTime @updatedAt
1495-
1496-  @@unique([reviewerId, entityType, entityId])
1497-  @@index([revieweeId])
```

✅ **أيوه، Polymorphic فعلاً** — بس بحقل اسمه `entityType` (نوعه `ReviewEntityType` enum حقيقي، مش `listingType` نص عادي زي ما كان متوقع في السؤال) + `entityId: String`. مفيش FK حقيقي على `entityId` — يعني مفيش `onDelete` cascade على مستوى الـ DB لو الإعلان اتحذف.

```
$ grep -n "enum ReviewEntityType" -A 15 apps/api/prisma/schema.prisma

1467:enum ReviewEntityType {
1468-  LISTING
1469-  BUS_LISTING
1470-  EQUIPMENT_LISTING
1471-  OPERATOR_LISTING
1472-  DRIVER_PROFILE
1473-  EMPLOYER_PROFILE
1474-  CARRIER_PROFILE
1475-}
```

✅ **`OPERATOR_LISTING` مدرج فعلاً في الـ enum.** يعني الـ Reviews ممكن تتعمل على إعلانات المشغلين بشكل شرعي ومدعوم في الـ schema.

**بونص — فحصت `Favorite` كمان (مذكور في التاسك):**
```
$ grep -n "model Favorite" -A 20 apps/api/prisma/schema.prisma

411:model Favorite {
412-  id String @id @default(cuid())
413-
414-  userId String
415-  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
416-
417-  entityType String @default("LISTING") // LISTING | JOB | SPARE_PART | CAR_SERVICE
418-  entityId   String
419-
420-  // Keep optional relation for listing queries
421-  listingId String?
422-  listing   Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)
423-
424-  createdAt DateTime @default(now())
425-
426-  @@unique([userId, entityType, entityId])
427-  @@index([userId])
428-  @@index([entityType, entityId])
429-  @@map("favorites")
430-}
```

⚠️ **ملاحظة مهمة غير مطلوبة صراحة بس مهمة:** `Favorite.entityType` نص حر (`String`) مش enum، والتعليق جنبه بيقول `// LISTING | JOB | SPARE_PART | CAR_SERVICE` بس — **`OPERATOR_LISTING` (ولا `BUS_LISTING` ولا `EQUIPMENT_LISTING`) مش مذكورين في التعليق ده خالص**، رغم إن الحقل نص حر مش بيمنع تقنياً تخزين `'OPERATOR_LISTING'` فيه. يستاهل يتفحص هل الموبايل بيبعت مفضلات على إعلانات المشغلين أصلاً ولا لأ (برّه نطاق السؤال ده، بس مسجلها كملاحظة).

---

## 3) `remove()` كامل في `operators.service.ts`

```typescript
// apps/api/src/operators/operators.service.ts:193-209 (نهاية الملف)
  async remove(id: string, userId: string) {
    const item = await this.prisma.operatorListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك حذف إعلان غيرك');
    await this.prisma.$transaction(async (tx) => {
      await tx.operatorListing.delete({ where: { id } });
      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: id,
          action: 'DELETE',
        },
      });
    });
    return { deleted: true };
  }
}
```

**ده الكود الكامل — لا يوجد أي سطر إضافي بعد أو قبل غير اللي ظاهر هنا.** ملاحظتين مباشرتين ليها علاقة بالتاسك:
1. **مفيش أي `cleanupPolymorphicOrphans` call** — شوف قسم 5.
2. **مفيش أي فحص "هل فيه Reviews مرتبطة" قبل الحذف** — الحذف بيحصل مباشرة (`tx.operatorListing.delete`) من غير أي شرط أو تحقق مسبق. لو فيه Reviews مرتبطة بالإعلان ده (entityType=OPERATOR_LISTING, entityId=هذا الـ id)، هتفضل موجودة في الجدول لوحدها بعد الحذف (orphaned)، لأن مفيش FK حقيقي.

---

## 4) نمط "موافقة أدمن" موجود بالفعل — Driver Verification

```
$ grep -rn "PENDING_APPROVAL\|PENDING_DELETION\|approvalStatus\|AdminApproval" apps/api/src apps/api/prisma/schema.prisma

[لا يوجد أي output — صفر نتايج بالأسماء دي بالحرف]
```

**مفيش تطابق حرفي مع الأسماء المحددة في السؤال.** بس توسعت البحث زي ما طلب التاسك ("حتى لو لغرض تاني")، ولقيت نمط حقيقي وكامل: **`DriverVerification`** (توثيق حساب السائق) — submit → pending → admin يوافق/يرفض → notification. ده أقرب نمط موجود فعلياً في المشروع، ومناسب تماماً كمرجع بدل اختراع نمط جديد.

### الـ Model (schema.prisma)
```prisma
enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

model DriverVerification {
  id              String        @id @default(cuid())
  driverProfileId String
  driverProfile   DriverProfile @relation(fields: [driverProfileId], references: [id], onDelete: Cascade)

  licenseImageUrl     String
  licenseBackImageUrl String?
  idImageUrl          String
  idBackImageUrl      String?
  notes               String?

  status          VerificationStatus @default(PENDING)
  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([driverProfileId])
  @@index([status])
  @@map("driver_verifications")
}
```

### الـ Service كامل (`apps/api/src/jobs/driver-verification.service.ts`, 127 سطر)
```typescript
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DriverVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ───── SUBMIT VERIFICATION ───── */
  async submit(userId: string, data: { licenseImageUrl: string; licenseBackImageUrl?: string; idImageUrl: string; idBackImageUrl?: string; notes?: string }) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('يجب إنشاء بروفايل سائق أولاً');

    if (profile.isVerified) throw new ConflictException('حسابك موثّق بالفعل');

    // Check for pending verification
    const pending = await this.prisma.driverVerification.findFirst({
      where: { driverProfileId: profile.id, status: 'PENDING' },
    });
    if (pending) throw new ConflictException('لديك طلب توثيق معلّق بالفعل');

    return this.prisma.driverVerification.create({
      data: {
        driverProfileId: profile.id,
        licenseImageUrl: data.licenseImageUrl,
        licenseBackImageUrl: data.licenseBackImageUrl,
        idImageUrl: data.idImageUrl,
        idBackImageUrl: data.idBackImageUrl,
        notes: data.notes,
      },
    });
  }

  /* ───── GET MY VERIFICATION STATUS ───── */
  async getMyStatus(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('لا يوجد بروفايل سائق');

    return this.prisma.driverVerification.findMany({
      where: { driverProfileId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ───── ADMIN: LIST VERIFICATIONS (paginated) ───── */
  async adminList(status?: string, page = 1, limit = 20) {
    const where: any = {};
    if (status) where.status = status;

    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [items, total] = await Promise.all([
      this.prisma.driverVerification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          driverProfile: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true, email: true } },
            },
          },
        },
      }),
      this.prisma.driverVerification.count({ where }),
    ]);

    return { items, meta: { total, page, limit: take, totalPages: Math.ceil(total / take) } };
  }

  /* ───── ADMIN: REVIEW ───── */
  async adminReview(
    verificationId: string,
    adminId: string,
    decision: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
  ) {
    const verification = await this.prisma.driverVerification.findUnique({
      where: { id: verificationId },
      include: { driverProfile: { include: { user: true } } },
    });
    if (!verification) throw new NotFoundException('طلب التوثيق غير موجود');
    if (verification.status !== 'PENDING') {
      throw new BadRequestException(`لا يمكن مراجعة طلب بحالة: ${verification.status}`);
    }

    const updated = await this.prisma.driverVerification.update({
      where: { id: verificationId },
      data: {
        status: decision,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: decision === 'REJECTED' ? rejectionReason : null,
      },
    });

    // If approved, mark driver profile as verified
    if (decision === 'APPROVED') {
      await this.prisma.driverProfile.update({
        where: { id: verification.driverProfileId },
        data: { isVerified: true },
      });
    }

    // Notify the driver — include data.url so the SYSTEM type navigates to their profile
    const statusText = decision === 'APPROVED' ? 'تم توثيق حسابك بنجاح ✓' : `تم رفض طلب التوثيق: ${rejectionReason || 'بدون سبب'}`;
    await this.notifications.create({
      userId: verification.driverProfile.userId,
      type: 'SYSTEM' as any,
      title: decision === 'APPROVED' ? 'تم التوثيق' : 'رُفض التوثيق',
      body: statusText,
      data: { verificationId, url: '/jobs/driver-profile' },
    });

    return updated;
  }
}
```

### الـ Controller + الـ Guard المستخدم للـ admin route (`apps/api/src/jobs/admin-jobs.controller.ts`)
```typescript
import {
  Controller, Get, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { AdminJobsService } from './admin-jobs.service';
import { DriverVerificationService } from './driver-verification.service';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminJobsController {
  constructor(
    private readonly adminJobsService: AdminJobsService,
    private readonly verificationService: DriverVerificationService,
  ) {}

  // ...

  @Get('verifications')
  listVerifications(@Query('status') status?: string) {
    return this.verificationService.adminList(status);
  }

  @Patch('verifications/:id')
  reviewVerification(
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.verificationService.adminReview(id, user.sub, body.decision, body.rejectionReason);
  }
}
```

**النمط الكامل القابل لإعادة الاستخدام لـ "طلب حذف يحتاج موافقة أدمن":**
- Enum بـ 3 حالات (`PENDING`/`APPROVED`/`REJECTED`).
- موديل منفصل لطلب المراجعة (`driverProfileId`/`reviewedBy`/`reviewedAt`/`rejectionReason`) بدل ما يتحط الحقول دي على الموديل الأصلي مباشرة.
- Guard مزدوج على مستوى الكلاس: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` — نفس الميكانيزم متاح يتطبق على أي controller تاني للأدمن.
- إشعار للمستخدم بعد القرار (`NotificationsService`).
- فحص `status !== 'PENDING'` قبل أي قرار — يمنع مراجعة نفس الطلب مرتين.

---

## 5) `cleanupPolymorphicOrphans` — التعريف الكامل + هل بيشمل Operators؟

```
$ grep -rn "cleanupPolymorphicOrphans" apps/api/src --include="*.ts" -l

apps/api/src/buses/buses.service.spec.ts
apps/api/src/buses/buses.service.ts
apps/api/src/common/services/base-listing.service.ts
apps/api/src/equipment/equipment-listings.service.ts
apps/api/src/jobs/admin-jobs.service.ts
apps/api/src/jobs/jobs.service.ts
apps/api/src/jobs/__tests__/admin-jobs.service.spec.ts
apps/api/src/jobs/__tests__/jobs.service.spec.ts
apps/api/src/listings/listings.service.spec.ts
apps/api/src/listings/listings.service.ts
apps/api/src/parts/parts.service.ts
apps/api/src/prisma/prisma.service.ts
apps/api/src/search/search-outbox.integration.spec.ts
apps/api/src/services/services.service.spec.ts
```

**`apps/api/src/operators/operators.service.ts` مش موجود في القايمة دي خالص.**

الدالة نفسها معرّفة في `apps/api/src/prisma/prisma.service.ts`:
```typescript
async cleanupPolymorphicOrphans(entityType: string, entityId: string): Promise<void> {
  try {
    const [favs, convs] = await this.$transaction([
      this.favorite.deleteMany({ where: { entityType, entityId } }),
      this.conversation.deleteMany({ where: { entityType, entityId } }),
    ]);
    if (favs.count > 0 || convs.count > 0) {
      this.logger.log(
        `Cleaned orphans for ${entityType}:${entityId} — ${favs.count} favorites, ${convs.count} conversations`,
      );
    }
  } catch (err) {
    this.logger.error(`Failed to clean orphans for ${entityType}:${entityId}`, (err as Error).stack);
  }
}
```

**الإجابة الدقيقة:** الدالة نفسها **generic تماماً** — بتاخد `entityType` كـ parameter نص حر، ومش عندها أي قائمة hard-coded لأنواع مسموحة أو ممنوعة. يعني **من ناحية القدرة التقنية، هي قادرة تتعامل مع `'OPERATOR_LISTING'` من غير أي تعديل عليها خالص لو حد ناداها بيه.**

**لكن — الاستخدام الفعلي:** `operators.service.ts`'s `remove()` (قسم 3 فوق) **مش بينادي الدالة دي خالص**، على عكس Buses/Equipment/Jobs/Listings/Parts اللي كلهم بينادوها في الـ `remove()`/`delete` بتاعتهم. يعني **النتيجة العملية دلوقتي: حذف إعلان مشغل لا بيمسح أي `Favorite` ولا `Conversation` مرتبطين بيه — بيفضلوا orphaned في الجداول دي.**
