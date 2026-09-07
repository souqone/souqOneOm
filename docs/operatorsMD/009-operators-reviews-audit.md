# تقرير تدقيق نظام التقييمات والمحادثات للمشغلين (009 - Operators Reviews & Conversations Audit)

**التصنيف**: Category A — Read-Only / Audit  
**الفرع**: `feature/operators-phase0`  
**تاريخ الفحص**: 2026-09-07  

---

## 1. قائمة الملفات التي تم فحصها (Inspected Files)

### أ) الباك إند (apps/api):
1. `apps/api/src/reviews/reviews.controller.ts`
2. `apps/api/src/reviews/reviews.service.ts`
3. `apps/api/src/reviews/dto/create-review.dto.ts`
4. `apps/api/src/prisma/prisma.service.ts`
5. `apps/api/prisma/schema.prisma`
6. `apps/api/src/chat/chat.service.ts`
7. `apps/api/src/common/constants/entity-types.constants.ts`

### ب) تطبيق الموبايل (Souqoneapp):
8. `Souqoneapp/app/equipment/operators/[id].tsx`
9. `Souqoneapp/app/reviews/[entityId].tsx`
10. `Souqoneapp/src/api/reviews.ts`
11. `Souqoneapp/src/components/jobs/RatingBadges.tsx`
12. `Souqoneapp/app/transport/carriers/[id].tsx`
13. `Souqoneapp/app/jobs/drivers/[id].tsx`

---

## 2. الإجابات التفصيلية بالأدلة والكود الخام (Findings with Verbatim Code)

---

### السؤال الأول: هل يقبل endpoint إنشاء التقييمات `OPERATOR_LISTING` حالياً؟

#### أ) دالة إنشاء التقييم من `apps/api/src/reviews/reviews.service.ts` (السطور 26–92):
```typescript
  async create(dto: CreateReviewDto, reviewerId: string) {
    if (dto.revieweeId === reviewerId) {
      throw new BadRequestException('لا يمكنك تقييم نفسك');
    }

    // Carrier reviews must go through POST /transport/bookings/:id/review
    // to guarantee the booking validation runs and prevent duplicate notifications.
    if (dto.entityType === ENTITY_TYPES.CARRIER_PROFILE) {
      throw new BadRequestException(
        'يجب تقييم الناقل من خلال صفحة الحجز (POST /transport/bookings/:id/review)',
      );
    }

    // Job-related review validation: require ACCEPTED application
    if (dto.entityType === ENTITY_TYPES.DRIVER_PROFILE || dto.entityType === ENTITY_TYPES.EMPLOYER_PROFILE) {
      await this.validateJobReview(dto, reviewerId);
    }

    let review;
    try {
      review = await this.prisma.review.create({
        data: {
          rating: dto.rating,
          comment: dto.comment,
          entityType: dto.entityType as ReviewEntityType,
          entityId: dto.entityId,
          reviewerId,
          revieweeId: dto.revieweeId,
        },
        include: {
          reviewer: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        },
      });
    } catch (err) {
      if (isPrismaUniqueError(err)) {
        throw new BadRequestException('لقد قمت بتقييم هذا العنصر مسبقاً');
      }
      throw err;
    }

    // Recalculate average rating
    await this.recalculateUserRating(dto.revieweeId);

    // Also recalculate profile-level ratings for job reviews
    if (dto.entityType === ENTITY_TYPES.DRIVER_PROFILE) {
      await this.recalculateDriverProfileRating(dto.entityId);
    } else if (dto.entityType === ENTITY_TYPES.EMPLOYER_PROFILE) {
      await this.recalculateEmployerProfileRating(dto.entityId);
    } else if (dto.entityType === ENTITY_TYPES.CARRIER_PROFILE) {
      await this.recalculateCarrierProfileRating(dto.entityId);
    }

    // Notify the reviewee
    try {
      await this.notifications.create({
        type: 'REVIEW_RECEIVED',
        title: 'تقييم جديد',
        body: `حصلت على تقييم ${dto.rating} نجوم`,
        userId: dto.revieweeId,
        data: { reviewId: review.id, entityType: dto.entityType, entityId: dto.entityId },
      });
    } catch (err) {
      this.logger.warn(`Failed to send review notification: ${(err as Error).message}`);
    }

    return review;
  }
```

#### ب) التحقق من نوع الكيان في `apps/api/src/reviews/dto/create-review.dto.ts`:
```typescript
import { IsInt, Min, Max, IsString, IsOptional, IsIn } from 'class-validator';

const ENTITY_TYPES = ['LISTING', 'BUS_LISTING', 'EQUIPMENT_LISTING', 'OPERATOR_LISTING', 'DRIVER_PROFILE', 'EMPLOYER_PROFILE', 'CARRIER_PROFILE'] as const;

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsIn(ENTITY_TYPES)
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsString()
  revieweeId!: string;
}
```
**النتيجة**: نعم، `OPERATOR_LISTING` مقبول صراحة ومُعرّف في كل من الـ DTO وفي enum `ReviewEntityType` في `schema.prisma`.

#### ج) نمط التحقق من الأهلية (Eligibility Check) الموجود حالياً في المشروع:
1. **قطاع التوظيف (Jobs)**: يتحقق من وجود طلب توظيف بحالة `ACCEPTED` بين الطرفين:
   ```typescript
   private async validateJobReview(dto: CreateReviewDto, reviewerId: string) {
     const application = await this.prisma.jobApplication.findFirst({
       where: {
         status: 'ACCEPTED',
         OR: [
           { job: { userId: reviewerId }, applicantId: dto.revieweeId },
           { applicantId: reviewerId, job: { userId: dto.revieweeId } },
         ],
       },
     });

     if (!application) {
       throw new BadRequestException('لا يمكنك تقييم إلا بعد قبول طلب التوظيف');
     }
   }
   ```
2. **قطاع النقل (Carriers)**: يُمنع التقييم عبر endpoint العام تماماً ويُوجّه العميل للحجز الفعلي:
   `if (dto.entityType === ENTITY_TYPES.CARRIER_PROFILE) throw new BadRequestException('يجب تقييم الناقل من خلال صفحة الحجز (POST /transport/bookings/:id/review)');`
3. **بقية القطاعات (Cars, Buses, Equipment, Operators)**: لا يوجد أي قيد تفاعل حالياً؛ أي مستخدم مسجل يستطيع تقييم أي إعلان طالما ليس إعلانه الخاص ولم يسبق له تقييمه.

---

### السؤال الثاني: هل تعرض شاشة تفاصيل المشغل في الموبايل التقييمات؟

#### أ) شاشة تفاصيل المشغل `Souqoneapp/app/equipment/operators/[id].tsx`:
- **النتيجة**: **لا تعرض إطلاقاً** أي قائمة تقييمات، ولا متوسط التقييم، ولا زر "أضف تقييم".
- تم فحص الملف بالكامل (811 سطر) ولا توجد به أي كلمة `review` أو `rating` أو أي مكون نجوم.

#### ب) المكونات وشاشات التقييم القابلة لإعادة الاستخدام في الموبايل:
1. **شاشة التقييمات العامة المركزية**: `Souqoneapp/app/reviews/[entityId].tsx`:
   - شاشة متكاملة تقبل `entityId` و `type` (مثل `?type=OPERATOR_LISTING` أو `?type=USER`).
   - تعرض متوسط التقييم، عدد المراجعات، نجوم التقييم، قائمة التقييمات مع التعليقات، ونموذج إرسال تقييم جديد مع التحقق.
   - يستدعيها قطاع النقل عند الرغبة في عرض تقييمات ناقل: `router.push('/reviews/' + userId + '?type=USER')`.
2. **مكون الشارة الرقمية للتقييم**: `Souqoneapp/src/components/jobs/RatingBadges.tsx`:
   - يعرض شارة التقييم مثل `⭐ 4.8`، مستخدم في بطاقات الناقلين والسائقين.
3. **نمط العرض المباشر في تفاصيل الناقل**: `Souqoneapp/app/transport/carriers/[id].tsx`:
   - يعرض سطراً بسيطاً وأنيقاً:
   ```tsx
   <View style={s.ratingRow}>
     <Ionicons name="star" size={16} color="#f59e0b" />
     <Text style={s.rating}>{profile.averageRating ?? 'جديد'}</Text>
     <Text style={s.trips}>({profile.totalTrips ?? 0} رحلة)</Text>
   </View>
   ```

---

### السؤال الثالث: هل تحذف `cleanupPolymorphicOrphans` سجلات التقييمات (Review)؟

#### الكود الفعلي الكامل لدالة `cleanupPolymorphicOrphans` في `apps/api/src/prisma/prisma.service.ts` (السطور 35–49):
```typescript
  /**
   * Clean up orphaned Conversation and Favorite records that reference
   * a deleted entity via the polymorphic entityType + entityId columns.
   *
   * Call this AFTER successfully deleting any entity that can be referenced
   * by Conversations or Favorites.
   */
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

#### النتيجة القاطعة:
- **لا، دالة `cleanupPolymorphicOrphans` الرسمية لا تحذف من جدول `Review` إطلاقاً**؛ بل تحذف فقط من `Favorite` و `Conversation`.
- **استنتاج للمقارنة مع سكريبت 005**:
  في سكريبت التنظيف المسبق `cleanup-operator-duplicates.ts` تم تنفيذ الحذف اليدوي التالي:
  ```typescript
  const favs = await tx.favorite.deleteMany({ where: { entityType: ENTITY_TYPES.OPERATOR_LISTING, entityId: { in: duplicateIds } } });
  const convs = await tx.conversation.deleteMany({ where: { entityType: ENTITY_TYPES.OPERATOR_LISTING, entityId: { in: duplicateIds } } });
  const revs = await tx.review.deleteMany({ where: { entityType: 'OPERATOR_LISTING', entityId: { in: duplicateIds } } });
  ```
  هذا الحذف اليدوي لـ `Review` كان إضافة يدوية بالكامل من السكريبت، ولم يكن موجوداً في الدالة المركزية المشتركة. وبالتالي، إذا أردنا حذف تقييمات الإعلانات المحذوفة مستقبلاً، يجب تحديث دالة `cleanupPolymorphicOrphans` نفسها لتشمل `this.review.deleteMany({ where: { entityType: entityType as ReviewEntityType, entityId } })`.

---

### السؤال الرابع: رابط المحادثة بالمشغل — كيف نتحقق أن "هذا المستخدم تواصل فعلياً مع هذا المشغل"؟

#### أ) تعريف نموذج `Conversation` و `ConversationParticipant` في `schema.prisma` (السطور 314–356):
```prisma
model Conversation {
  id String @id @default(cuid())

  entityType String // LISTING | SPARE_PART | CAR_SERVICE | JOB | OPERATOR_LISTING
  entityId   String // ID of the related entity

  // Backward compat — optional relation kept for existing listing conversations
  listingId String?
  listing   Listing? @relation(fields: [listingId], references: [id], onDelete: Cascade)

  transportBooking TransportBooking?

  participants ConversationParticipant[]
  messages     Message[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([entityType, entityId])
  @@index([listingId])
  @@map("conversations")
}

model ConversationParticipant {
  id String @id @default(cuid())

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  lastReadAt DateTime?
  isArchived Boolean   @default(false)

  @@unique([userId, conversationId])
  @@index([userId])
  @@index([conversationId])
  @@map("conversation_participants")
}
```

#### ب) الحقول التي تربط المحادثة بالإعلان وبالمستخدمين:
- الربط بالإعلان: عبر الحقلين `entityType: "OPERATOR_LISTING"` و `entityId: operatorListing.id`.
- الربط بالمستخدمين: لا يوجد عمودان ثابتان مثل buyer/seller في جدول `conversations`، بل توجد علاقة `participants` في جدول `conversation_participants` حيث يرتبط كل من العميل وصاحب الإعلان بسجل يحدد `userId` و `conversationId`.
- الرسائل: جدول `messages` يحتوي على `senderId` و `conversationId`.

#### ج) نمط الاستعلام الموجود في المشروع للتحقق من وجود محادثة:
في `apps/api/src/chat/chat.service.ts` (السطور 95–103):
```typescript
const existing = await this.prisma.conversation.findFirst({
  where: {
    entityType,
    entityId,
    AND: [
      { participants: { some: { userId } } },
      { participants: { some: { userId: ownerId } } },
    ],
  },
});
```

#### د) الاستعلام المثالي المقترح لأهلية التقييم:
لضمان أن العميل **أرسل رسالة فعلية** (وليس مجرد فتح نافذة محادثة فارغة):
```typescript
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
```

#### ⚠️ ملاحظة حرجة تم اكتشافها أثناء التدقيق (Bug Alert في الموبايل):
في ملف `Souqoneapp/app/equipment/operators/[id].tsx` عند السطر 110:
```typescript
      const res = await chatApi.createRoom({
        entityType: 'OPERATOR',  // <--- خطأ هنا: يرسل OPERATOR بدلاً من OPERATOR_LISTING
        entityId: operator.id,
        receiverId: sellerId,
      })
```
في المقابل، في الباك إند `apps/api/src/chat/chat.service.ts` عند السطر 60:
```typescript
      case 'OPERATOR_LISTING': {
        const e = await this.prisma.operatorListing.findUnique({ where: { id: entityId }, select: { userId: true, title: true } });
        if (!e) throw new NotFoundException('إعلان المشغل غير موجود');
        return { ownerId: e.userId, title: e.title };
      }
      default:
        throw new BadRequestException('نوع كيان غير معروف');
```
إذا ضغط المستخدم في شاشة الموبايل الحالية على "مراسلة المشغل"، سيرسل التطبيق `OPERATOR`، وسيرد الباك إند بـ `400: نوع كيان غير معروف`. يجب تعديل الموبايل ليرسل `OPERATOR_LISTING` (أو دعم `OPERATOR` كـ alias في الباك إند).

---

## 3. ملخص وتوصيات للخطوة التالية

1. **الباك إند**: إضافة فحص الأهلية `validateOperatorReview` في `reviews.service.ts` قبل إنشاء التقييم، مع فحص وجود رسالة صادرة من المقيم لنفس الإعلان.
2. **الموبايل**:
   - تصحيح `entityType` من `'OPERATOR'` إلى `'OPERATOR_LISTING'` في دالة `handleChat`.
   - إضافة قسم التقييمات في شاشة المشغل مع زر الانتقال إلى `/reviews/${operator.id}?type=OPERATOR_LISTING`.
3. **تنظيف الأيتام**: تحديث `cleanupPolymorphicOrphans` في `prisma.service.ts` لتشمل جدول `Review` جنباً إلى جنب مع `Favorite` و `Conversation`.
