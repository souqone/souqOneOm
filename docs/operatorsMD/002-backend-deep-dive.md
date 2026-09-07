# Operators — Audit عميق (Backend) — كود حقيقي كامل

تاريخ: 2026-09-06 | مصدر: `souqOneOm` backend repo | Audit للقراءة فقط — مفيش أي تعديل

---

## 1) `operators.service.ts` — الكود الكامل بالحرف

الملف الحقيقي الشغال: `apps/api/src/operators/operators.service.ts` (209 سطر)

```typescript
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, OperatorType, EquipmentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorListingDto } from './dto/create-operator-listing.dto';
import { UpdateOperatorListingDto } from './dto/update-operator-listing.dto';
import { QueryOperatorListingsDto } from './dto/query-operator-listings.dto';
import { USER_SELECT, generateSlug } from '../common/utils/entity.utils';

import { GeoService } from '../locations/geo.service';
import { ENTITY_TYPES } from '../common/constants/entity-types.constants';

@Injectable()
export class OperatorsService {
  constructor(
    private readonly geoService: GeoService,
private readonly prisma: PrismaService) {}

  async create(dto: CreateOperatorListingDto, userId: string) {
    await this.geoService.validateLocationPair(dto.governorateId, dto.wilayaId);

    const item = await this.prisma.$transaction(async (tx) => {
      const createdItem = await tx.operatorListing.create({
        data: {
          title: dto.title,
          slug: generateSlug(dto.title),
          description: dto.description,
          operatorType: dto.operatorType as OperatorType,
          specializations: dto.specializations ?? [],
          experienceYears: dto.experienceYears,
          equipmentTypes: (dto.equipmentTypes ?? []) as EquipmentType[],
          certifications: dto.certifications ?? [],
          dailyRate: dto.dailyRate != null ? new Prisma.Decimal(dto.dailyRate) : null,
          hourlyRate: dto.hourlyRate != null ? new Prisma.Decimal(dto.hourlyRate) : null,
          currency: dto.currency ?? 'OMR',
          isPriceNegotiable: dto.isPriceNegotiable ?? false,
          governorateId: dto.governorateId,
          wilayaId: dto.wilayaId,
          latitude: dto.latitude,
          longitude: dto.longitude,
          contactPhone: dto.contactPhone,
          whatsapp: dto.whatsapp,
          userId,
        },
        include: {
          user: { select: USER_SELECT },
          governorateRef: true,
          wilayaRef: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: createdItem.id,
          action: 'UPSERT',
        },
      });

      return createdItem;
    });

    if (dto.latitude && dto.longitude) {
      await this.geoService.syncLocation('operator_listings', item.id, dto.latitude, dto.longitude);
    }

    return item;
  }

  async findAll(q: QueryOperatorListingsDto) {
    const page = q.page ?? 1;
    const limit = Math.min(q.limit ?? 20, 50);
    const where: Prisma.OperatorListingWhereInput = { status: 'ACTIVE' };
    if (q.operatorType) where.operatorType = q.operatorType as OperatorType;
    if (q.governorateId) where.governorateId = q.governorateId;
    if (q.wilayaId) where.wilayaId = q.wilayaId;
    if (q.search) {
      where.OR = [
        { title: { contains: q.search, mode: 'insensitive' } },
        { description: { contains: q.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.OperatorListingOrderByWithRelationInput = { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.operatorListing.findMany({
        where, orderBy, skip: (page - 1) * limit, take: limit,
        include: {
          user: { select: USER_SELECT },
          governorateRef: true,
          wilayaRef: true,
        },
      }),
      this.prisma.operatorListing.count({ where }),
    ]);
    return { items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const item = await this.prisma.operatorListing.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        governorateRef: true,
        wilayaRef: true,
      },
    });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    // TODO: migrate viewCount to Redis INCR + periodic sync for high traffic
    this.prisma.operatorListing.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
    return item;
  }

  async my(userId: string) {
    return this.prisma.operatorListing.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        governorateRef: true,
        wilayaRef: true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateOperatorListingDto) {
    const item = await this.prisma.operatorListing.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('إعلان المشغل غير موجود');
    if (item.userId !== userId) throw new ForbiddenException('لا يمكنك تعديل إعلان غيرك');

    if (dto.governorateId || dto.wilayaId) {
      const targetGov = dto.governorateId ?? item.governorateId;
      const targetWilaya = dto.wilayaId ?? item.wilayaId;
      if (targetGov && targetWilaya) {
        await this.geoService.validateLocationPair(targetGov, targetWilaya);
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.specializations !== undefined) data.specializations = dto.specializations;
    if (dto.experienceYears !== undefined) data.experienceYears = dto.experienceYears;
    if (dto.equipmentTypes !== undefined) data.equipmentTypes = dto.equipmentTypes as EquipmentType[];
    if (dto.certifications !== undefined) data.certifications = dto.certifications;
    if (dto.dailyRate !== undefined) data.dailyRate = new Prisma.Decimal(dto.dailyRate);
    if (dto.hourlyRate !== undefined) data.hourlyRate = new Prisma.Decimal(dto.hourlyRate);
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.isPriceNegotiable !== undefined) data.isPriceNegotiable = dto.isPriceNegotiable;
    if (dto.governorateId !== undefined) data.governorateId = dto.governorateId;
    if (dto.wilayaId !== undefined) data.wilayaId = dto.wilayaId;
    if (dto.latitude !== undefined) data.latitude = dto.latitude;
    if (dto.longitude !== undefined) data.longitude = dto.longitude;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone;
    if (dto.whatsapp !== undefined) data.whatsapp = dto.whatsapp;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.operatorListing.update({
        where: { id },
        data,
        include: {
          user: { select: USER_SELECT },
          governorateRef: true,
          wilayaRef: true,
        },
      });

      await tx.outboxEvent.create({
        data: {
          entityType: ENTITY_TYPES.OPERATOR_LISTING,
          entityId: res.id,
          action: 'UPSERT',
        },
      });

      return res;
    });

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      if (dto.latitude && dto.longitude) {
        await this.geoService.syncLocation('operator_listings', updated.id, dto.latitude, dto.longitude);
      } else if (dto.latitude === null || dto.longitude === null) {
        await this.geoService.clearLocation('operator_listings', updated.id);
      }
    }

    return updated;
  }

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

**ملاحظات مهمة على الكود ده (للاستخدام وقت كتابة الخطة):**
- `create()` و`update()` و`remove()` كلهم بيستخدموا `$transaction` + `outboxEvent` (نمط الـ outbox القياسي في المشروع) — Search sync هيشتغل صح.
- `findOne()`, `my()`, `findAll()` بيرجعوا `governorateRef`/`wilayaRef` كاملين — location display سليم.
- `dailyRate`/`hourlyRate`: أي واحد فيهم null يترضى (منطق الـ `ValidateIf` في الـ DTO — شوف قسم 2).
- **مفيش دعم لـ images/صور خالص** — لا في الـ `create()` data، ولا في أي DTO — `OperatorListing` كموديل بيانات مفيهوش صور إعلان (يستاهل يتفحص لو الخطة النهائية هتحتاج صور).
- `findOne()` بيعمل `viewCount.increment` **من غير أي rate-limiting بالـ IP** (على عكس باقي الـ verticals زي Buses/Parts اللي شفناها قبل كده بتستخدم Redis cooldown) — ده تفاوت يستحق يتسجل.

---

## 2) DTOs الكاملة بالحرف

الملفات الحقيقية اللي بيستوردها `operators.service.ts`/`operators.controller.ts` (من `./dto/...`) هي **re-export shims** بترجع لمصدر واحد حقيقي في `equipment/dto/`. الاتنين اتلصقوا هنا:

### `apps/api/src/operators/dto/create-operator-listing.dto.ts` (الملف اللي بيتم استيراده فعلياً)
```typescript
export { CreateOperatorListingDto } from '../../equipment/dto/create-operator-listing.dto';
```

### المصدر الحقيقي: `apps/api/src/equipment/dto/create-operator-listing.dto.ts`
```typescript
import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, MinLength, MaxLength, IsPositive, ArrayMinSize, ValidateIf
} from 'class-validator';

export class CreateOperatorListingDto {
  @IsString() 
  @MinLength(5, { message: 'العنوان يجب أن يكون 5 أحرف على الأقل' })
  @MaxLength(100, { message: 'العنوان يجب ألا يتجاوز 100 حرف' })
  title!: string;

  @IsString() 
  @MinLength(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل' })
  @MaxLength(2000, { message: 'الوصف يجب ألا يتجاوز 2000 حرف' })
  description!: string;

  @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'], { message: 'نوع الخدمة غير صالح' })
  operatorType!: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specializations?: string[];

  @IsInt() @Min(0)
  experienceYears!: number;

  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  equipmentTypes!: string[];

  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  certifications!: string[];

  @ValidateIf((o: any) => !o.hourlyRate)
  @IsNumber() @Min(1)
  dailyRate?: number;

  @ValidateIf((o: any) => !o.dailyRate)
  @IsNumber() @Min(1)
  hourlyRate?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsInt()
  @IsPositive()
  governorateId!: number;

  @IsInt()
  @IsPositive()
  wilayaId!: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsString() @MinLength(8)
  contactPhone!: string;

  @IsOptional() @IsString() @MinLength(8)
  whatsapp?: string;
}
```

**ملاحظة مهمة:** `operatorType`, `equipmentTypes`, `certifications` كلهم `string`/`string[]` عاديين مع `@IsEnum([...])` بقيم hard-coded كنص، **مش بيستخدموا الـ enum types الحقيقية من `@prisma/client`** (`OperatorType`, `EquipmentType`) في الـ DTO نفسه — التحويل بيحصل يدوي في الـ service (`dto.operatorType as OperatorType`). يستاهل الانتباه وقت كتابة أي حقل جديد.

### `apps/api/src/operators/dto/update-operator-listing.dto.ts` (shim)
```typescript
export { UpdateOperatorListingDto } from '../../equipment/dto/update-operator-listing.dto';
```

### المصدر الحقيقي: `apps/api/src/equipment/dto/update-operator-listing.dto.ts`
```typescript
import {
  IsString, IsOptional, IsEnum, IsInt, IsBoolean,
  IsNumber, IsArray, Min, MinLength, MaxLength, IsPositive, ArrayMinSize
} from 'class-validator';

export class UpdateOperatorListingDto {
  @IsOptional()
  @IsString() 
  @MinLength(5)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString() 
  @MinLength(10)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'])
  operatorType?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  specializations?: string[];

  @IsOptional()
  @IsInt() @Min(0)
  experienceYears?: number;

  @IsOptional()
  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  equipmentTypes?: string[];

  @IsOptional()
  @IsArray() 
  @ArrayMinSize(1) 
  @IsString({ each: true })
  certifications?: string[];

  @IsOptional()
  @IsNumber() @Min(1)
  dailyRate?: number;

  @IsOptional()
  @IsNumber() @Min(1)
  hourlyRate?: number;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsBoolean()
  isPriceNegotiable?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  governorateId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsNumber()
  latitude?: number;

  @IsOptional() @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString() @MinLength(8)
  contactPhone?: string;

  @IsOptional()
  @IsString() @MinLength(8)
  whatsapp?: string;
}
```

**⚠️ ملاحظة — هذا الملف بيستخدم `PartialType()`؟ لأ.** ده class حقيقي مستقل مكتوب يدوي بكل حقل عليه `@IsOptional()` بنفسه، مش `Partial<CreateOperatorListingDto>` ولا `PartialType()`. **ده مهم جداً**: على عكس الـ bug اللي اتلقى في `parts.controller.ts`/`services.controller.ts` (استخدام `Partial<X>` كـ TypeScript type بس بيلغي الـ validation على PATCH) — هنا `UpdateOperatorListingDto` **class حقيقي بديكوريتورز فعلية**، يبقى الـ validation شغال صح على الـ PATCH endpoint (اتأكد ده كمان من الـ controller في قسم 3 — الباراميتر typed كـ `UpdateOperatorListingDto` صراحة، مش `Partial<...>`).

### `apps/api/src/operators/dto/query-operator-listings.dto.ts` (shim)
```typescript
export { QueryOperatorListingsDto } from '../../equipment/dto/query-operator-listings.dto';
```

### المصدر الحقيقي: `apps/api/src/equipment/dto/query-operator-listings.dto.ts`
```typescript
import { IsOptional, IsString, IsEnum, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryOperatorListingsDto {
  @IsOptional() @IsEnum(['DRIVER', 'OPERATOR', 'TECHNICIAN', 'MAINTENANCE'])
  operatorType?: string;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  governorateId?: number;

  @IsOptional() @Type(() => Number) @IsInt() @IsPositive()
  wilayaId?: number;

  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  sortBy?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  limit?: number;

  @IsOptional() @IsString()
  userId?: string;
}
```
**ملاحظة:** `sortBy` موجود في الـ DTO بس **مش مستخدم خالص في `operators.service.ts`'s `findAll()`** — الـ `orderBy` مضروب على `{ createdAt: 'desc' }` ثابت دايماً (شوف قسم 1). حقل ميت في الـ query DTO.

---

## 3) `operators.controller.ts` — الكود الكامل

```typescript
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { OperatorsService } from './operators.service';
import { CreateOperatorListingDto } from './dto/create-operator-listing.dto';
import { UpdateOperatorListingDto } from './dto/update-operator-listing.dto';
import { QueryOperatorListingsDto } from './dto/query-operator-listings.dto';

@Controller('operators')
export class OperatorsController {
  constructor(private readonly svc: OperatorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateOperatorListingDto, @CurrentUser() user: JwtPayload) {
    return this.svc.create(dto, user.sub);
  }

  @Get()
  findAll(@Query() query: QueryOperatorListingsDto) {
    return this.svc.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  my(@CurrentUser() user: JwtPayload) {
    return this.svc.my(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOperatorListingDto, @CurrentUser() user: JwtPayload) {
    return this.svc.update(id, user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.svc.remove(id, user.sub);
  }
}
```

**الـ Route table كامل:**
| Method | Path | Guard | ملاحظة |
|---|---|---|---|
| POST | `/operators` | ✅ JwtAuthGuard | create |
| GET | `/operators` | ❌ عام | findAll (list/browse) |
| GET | `/operators/my` | ✅ JwtAuthGuard | إعلانات المستخدم الحالي |
| GET | `/operators/:id` | ❌ عام | تفاصيل إعلان |
| PATCH | `/operators/:id` | ✅ JwtAuthGuard | تعديل — **`UpdateOperatorListingDto` class حقيقي، الـ validation شغال صح** |
| DELETE | `/operators/:id` | ✅ JwtAuthGuard | حذف |

**⚠️ ترتيب الراوتات مهم هنا وسليم:** `GET /operators/my` معرّف *قبل* `GET /operators/:id` — لو كان بالعكس، NestJS كان هيحاول يفسر `my` كقيمة لـ `:id` بدل route منفصل. الترتيب الحالي صح.

---

## 4) تأكيد التكرار (الموجود فعلاً بين `equipment/` و`operators/`)

```
$ find apps/api/src -iname "*operator*"

apps/api/src/equipment/dto/create-operator-listing.dto.ts
apps/api/src/equipment/dto/query-operator-listings.dto.ts
apps/api/src/equipment/dto/update-operator-listing.dto.ts
apps/api/src/equipment/operators.controller.ts
apps/api/src/equipment/operators.service.ts
apps/api/src/operators
apps/api/src/operators/dto/create-operator-listing.dto.ts
apps/api/src/operators/dto/query-operator-listings.dto.ts
apps/api/src/operators/dto/update-operator-listing.dto.ts
apps/api/src/operators/operators.controller.ts
apps/api/src/operators/operators.module.ts
apps/api/src/operators/operators.service.ts
```

**✅ أيوه، فيه تكرار فعلي، لكن على مستويين مختلفين تماماً:**

### أ) DTOs — **مش تكرار حقيقي، مجرد إعادة تصدير (re-export)**
`operators/dto/*.ts` التلاتة كلهم سطر واحد بس، بيعملوا `export { X } from '../../equipment/dto/X'`. المصدر الحقيقي الوحيد هو `equipment/dto/*operator*.ts`. تعديل أي حقل لازم يتم في `equipment/dto/`، مش في `operators/dto/`.

### ب) Controller + Service — **تكرار حقيقي 100%، والنسخة اللي في `equipment/` كود ميت**

اتأكد بقراءة الـ modules مباشرة:

```typescript
// apps/api/src/equipment/equipment.module.ts (كامل)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { UploadsModule } from '../uploads/uploads.module';
import { EquipmentListingsService } from './equipment-listings.service';
import { EquipmentController } from './equipment.controller';

import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule, PrismaModule, RedisModule, UploadsModule],
  controllers: [EquipmentController],
  providers: [EquipmentListingsService],
  exports: [EquipmentListingsService],
})
export class EquipmentModule {}
```
**`EquipmentModule` مبيسجّلش `equipment/operators.controller.ts` ولا `equipment/operators.service.ts` خالص** — مش في `controllers`، مش في `providers`.

```typescript
// apps/api/src/operators/operators.module.ts (كامل)
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OperatorsService } from './operators.service';
import { OperatorsController } from './operators.controller';

import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [LocationsModule, PrismaModule],
  controllers: [OperatorsController],
  providers: [OperatorsService],
  exports: [OperatorsService],
})
export class OperatorsModule {}
```

```
$ grep -n "EquipmentModule\|OperatorsModule" apps/api/src/app.module.ts

27:import { EquipmentModule } from './equipment/equipment.module';
28:import { OperatorsModule } from './operators/operators.module';
68:    EquipmentModule,
69:    OperatorsModule,
```

**النسخة الشغالة فعلياً = `apps/api/src/operators/` بالكامل** (Controller + Service + الـ DTOs المُعاد تصديرها). أي `POST/GET/PATCH/DELETE` بيوصل لـ `/operators/*` بينفذ من هنا حصراً.

**`apps/api/src/equipment/operators.controller.ts` (50 سطر) و`apps/api/src/equipment/operators.service.ts` (146 سطر) = 196 سطر كود ميت تماماً.** غير مسجلين في أي `@Module`، مش قابلين للوصول من أي route، لا NestJS هيحمّلهم ولا أي HTTP request هيوصلهم. النسخة الميتة دي **أقدم وأبسط** من النسخة الحية — مثلاً مفيهاش `$transaction`/`outboxEvent` (يعني Search sync مكنش هيشتغل لو كانت هي الشغالة)، ومفيهاش `GeoService.validateLocationPair` في الـ create بتاعتها.

**التوصية للخطة النهائية:** حذف الملفين الميتين دول (`equipment/operators.controller.ts`, `equipment/operators.service.ts`) — أي تعديل مستقبلي على "Operators" لازم يروح لـ `src/operators/` بس، مش `src/equipment/`.

---

## 5) اختبارات موجودة بالفعل

```
$ find src -iname "*operator*spec*" -o -iname "*operator*test*"
[لا يوجد أي output]
```

**❌ صفر — مفيش أي unit test ولا e2e test لـ Operators خالص، لا للنسخة الحية ولا الميتة.** لا `operators.service.spec.ts`، لا `operators.e2e-spec.ts`. لو الخطة هتشمل أي تعديل على DTOs أو الـ service، محتاجين نبدأ من صفر في التغطية — مفيش baseline نتأكد إننا معملناش regression بيه.
