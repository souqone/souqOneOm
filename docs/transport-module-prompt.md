# IDE Agent Prompt — Transport Marketplace Module

## Context

You are working on **SouqOne** (سوق وان), a NestJS 10 + Prisma 6 + PostgreSQL 16 monorepo.
- Strict TypeScript everywhere — zero `any` except where Prisma forces it
- All error messages in Arabic
- Pattern to follow: the existing `jobs/` module (JobsService, JobEscrowService, etc.)
- Base URL: `http://localhost:4000/api/v1`
- Redis (Bull/ioredis) available via `RedisService`
- Notifications available via `NotificationsService`
- MeiliSearch available via `SearchService`

---

## Goal

Build a complete **Transport Marketplace** module at `apps/api/src/transport/`.

This is an **on-demand marketplace** — not a listings page. It connects:
- **Shippers** (طالب الخدمة): create transport requests
- **Carriers** (مزود الخدمة): submit price quotes or enable "available now" mode

---

## Step 1 — Prisma Schema

Add the following models to `apps/api/prisma/schema.prisma`:

```prisma
enum TransportServiceType {
  GOODS         // بضائع عامة
  FURNITURE     // أثاث
  CONSTRUCTION  // مواد بناء
  HEAVY         // معدات ثقيلة
  BACKLOAD      // حمولات راجعة
  EQUIPMENT     // تأجير معدات تشغيلية
}

enum TransportRequestStatus {
  OPEN          // منشور، ينتظر عروض
  QUOTED        // استقبل عروضاً
  ACCEPTED      // تم قبول عرض
  IN_PROGRESS   // جارٍ التنفيذ
  COMPLETED     // مكتمل
  CANCELLED     // ملغى
  EXPIRED       // انتهت صلاحيته
}

enum QuoteStatus {
  PENDING       // بانتظار رد الشيبر
  ACCEPTED      // مقبول
  REJECTED      // مرفوض
  WITHDRAWN     // سحبه المزود
}

enum VehicleType {
  PICKUP        // بيك أب
  VAN           // فان
  TRUCK_SMALL   // شاحنة صغيرة
  TRUCK_LARGE   // شاحنة كبيرة
  TRAILER       // تريلا
  EXCAVATOR     // حفار
  TIPPER        // قلاب
  CRANE         // رافعة
  OTHER
}

model CarrierProfile {
  id              String      @id @default(cuid())
  userId          String      @unique
  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyName     String?
  bio             String?
  vehicleTypes    VehicleType[]
  serviceTypes    TransportServiceType[]
  governorate     String
  city            String?
  contactPhone    String?
  whatsapp        String?

  isAvailable     Boolean     @default(false)   // وضع "متاح الآن"
  isVerified      Boolean     @default(false)

  // Stats (denormalized for performance)
  completedTrips  Int         @default(0)
  averageRating   Float       @default(0)
  reviewCount     Int         @default(0)

  quotes          TransportQuote[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([governorate, isAvailable])
}

model TransportRequest {
  id              String                  @id @default(cuid())
  userId          String
  user            User                    @relation(fields: [userId], references: [id], onDelete: Cascade)

  serviceType     TransportServiceType
  status          TransportRequestStatus  @default(OPEN)

  // Route
  fromGovernorate String
  fromCity        String?
  fromAddress     String
  fromLat         Float?
  fromLng         Float?

  toGovernorate   String
  toCity          String?
  toAddress       String
  toLat           Float?
  toLng           Float?

  // Cargo details
  cargoDescription String
  weightTons      Float?
  requiresHelper  Boolean     @default(false)  // يحتاج عمال مساعدة
  notes           String?

  // Timing
  scheduledAt     DateTime?   // null = أسرع وقت ممكن
  isFlexible      Boolean     @default(false)  // مرن في الوقت

  // Budget
  budgetMin       Decimal?    @db.Decimal(10, 3)
  budgetMax       Decimal?    @db.Decimal(10, 3)
  currency        String      @default("OMR")

  // Tracking
  viewCount       Int         @default(0)
  expiresAt       DateTime?   // auto-set to createdAt + 7 days

  quotes          TransportQuote[]
  booking         TransportBooking?

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([status, fromGovernorate])
  @@index([userId])
  @@index([serviceType, status])
}

model TransportQuote {
  id              String        @id @default(cuid())
  requestId       String
  request         TransportRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  carrierId       String
  carrier         CarrierProfile   @relation(fields: [carrierId], references: [id], onDelete: Cascade)

  status          QuoteStatus   @default(PENDING)

  price           Decimal       @db.Decimal(10, 3)
  currency        String        @default("OMR")
  estimatedHours  Float?        // وقت التسليم المتوقع بالساعات
  message         String?       // رسالة من المزود

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  booking         TransportBooking?

  @@unique([requestId, carrierId])  // مزود واحد = عرض واحد لكل طلب
  @@index([requestId, status])
  @@index([carrierId])
}

model TransportBooking {
  id              String        @id @default(cuid())
  requestId       String        @unique
  request         TransportRequest @relation(fields: [requestId], references: [id])
  quoteId         String        @unique
  quote           TransportQuote   @relation(fields: [quoteId], references: [id])

  status          TransportRequestStatus @default(IN_PROGRESS)
  confirmedAt     DateTime      @default(now())
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancellationReason String?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

After adding models run:
```bash
npx prisma generate
npx prisma db push
```

---

## Step 2 — File Structure

Create the following files inside `apps/api/src/transport/`:

```
transport/
├── transport.module.ts
├── transport.controller.ts
├── admin-transport.controller.ts
├── carrier-profile.service.ts
├── transport-request.service.ts
├── transport-quote.service.ts
├── transport-booking.service.ts
├── transport-expiry.service.ts
└── dto/
    ├── create-carrier-profile.dto.ts
    ├── update-carrier-profile.dto.ts
    ├── create-transport-request.dto.ts
    ├── update-transport-request.dto.ts
    ├── query-transport-requests.dto.ts
    ├── create-quote.dto.ts
    └── query-carriers.dto.ts
```

---

## Step 3 — DTOs

### `dto/create-carrier-profile.dto.ts`
```typescript
import { IsString, IsOptional, IsArray, IsEnum, MinLength } from 'class-validator';
import { VehicleType, TransportServiceType } from '@prisma/client';

export class CreateCarrierProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;

  @IsArray()
  @IsEnum(VehicleType, { each: true })
  vehicleTypes!: VehicleType[];

  @IsArray()
  @IsEnum(TransportServiceType, { each: true })
  serviceTypes!: TransportServiceType[];

  @IsString()
  governorate!: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;
}
```

### `dto/update-carrier-profile.dto.ts`
Same fields as Create but all `@IsOptional()`. Add:
```typescript
@IsOptional()
@IsBoolean()
isAvailable?: boolean;
```

### `dto/create-transport-request.dto.ts`
```typescript
import {
  IsString, IsEnum, IsOptional, IsNumber, IsBoolean,
  IsDateString, Min, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransportServiceType } from '@prisma/client';

export class CreateTransportRequestDto {
  @IsEnum(TransportServiceType)
  serviceType!: TransportServiceType;

  // From
  @IsString()
  fromGovernorate!: string;

  @IsOptional()
  @IsString()
  fromCity?: string;

  @IsString()
  @MinLength(5)
  fromAddress!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fromLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fromLng?: number;

  // To
  @IsString()
  toGovernorate!: string;

  @IsOptional()
  @IsString()
  toCity?: string;

  @IsString()
  @MinLength(5)
  toAddress!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  toLat?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  toLng?: number;

  // Cargo
  @IsString()
  @MinLength(5)
  cargoDescription!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightTons?: number;

  @IsOptional()
  @IsBoolean()
  requiresHelper?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  // Timing
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsBoolean()
  isFlexible?: boolean;

  // Budget
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  budgetMax?: number;
}
```

### `dto/query-transport-requests.dto.ts`
```typescript
import { IsOptional, IsString, IsEnum, IsNumberString } from 'class-validator';
import { TransportServiceType, TransportRequestStatus } from '@prisma/client';

export class QueryTransportRequestsDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

  @IsOptional()
  @IsEnum(TransportServiceType)
  serviceType?: TransportServiceType;

  @IsOptional()
  @IsEnum(TransportRequestStatus)
  status?: TransportRequestStatus;

  @IsOptional()
  @IsString()
  fromGovernorate?: string;

  @IsOptional()
  @IsString()
  toGovernorate?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
```

### `dto/create-quote.dto.ts`
```typescript
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDto {
  @IsNumber()
  @Min(0.001)
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  message?: string;
}
```

### `dto/query-carriers.dto.ts`
```typescript
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { VehicleType, TransportServiceType } from '@prisma/client';

export class QueryCarriersDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  governorate?: string;

  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @IsOptional()
  @IsEnum(TransportServiceType)
  serviceType?: TransportServiceType;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}
```

---

## Step 4 — Services

### `carrier-profile.service.ts`

Implement the following methods:

```typescript
@Injectable()
export class CarrierProfileService {
  constructor(private readonly prisma: PrismaService) {}

  // create(userId, dto) — throws ConflictException if profile exists
  // getMyProfile(userId) — throws NotFoundException if not found
  // update(userId, dto) — partial update, throws NotFoundException
  // findOne(id) — public profile by profile id
  // findAll(query: QueryCarriersDto) — paginated list with filters:
  //   governorate, vehicleType (has), serviceType (has), isAvailable, search (bio/companyName)
  // setAvailability(userId, isAvailable: boolean) — toggle "available now"
}
```

**Key rules:**
- `USER_SELECT` = `{ id, username, displayName, avatarUrl, phone, governorate, createdAt }`
- Pagination: default limit 12, max 50
- `findAll` returns `{ items, meta: { total, page, limit, totalPages } }`

---

### `transport-request.service.ts`

```typescript
@Injectable()
export class TransportRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly notifications: NotificationsService,
  ) {}
```

Implement:

**`create(userId, dto)`**
- Creates the request with `status: OPEN`
- Sets `expiresAt = now + 7 days`
- After creation, notifies matching available carriers:
  - Same `fromGovernorate`
  - `serviceTypes` includes request's `serviceType`
  - `isAvailable = true`
  - Max 30 carriers
- Notification: `type: 'SYSTEM'`, title: `'طلب نقل جديد قريب منك'`, body: `'طلب ${serviceType} من ${fromGovernorate} إلى ${toGovernorate}'`
- Invalidates Redis cache pattern `transport:list:*`

**`findAll(query: QueryTransportRequestsDto)`**
- Cache key: `transport:list:${JSON.stringify(query)}`
- TTL: 300 seconds
- Default `status: 'OPEN'`
- Filters: `serviceType`, `status`, `fromGovernorate`, `toGovernorate`, `userId`
- Sort: `createdAt` (default), `budgetMax`, `scheduledAt`
- Include: `user { id, username, displayName, avatarUrl, isVerified }`, `_count { quotes }`

**`findOne(id, ip?)`**
- Cache TTL: 600 seconds
- Rate-limited view count using `incrementViewCount(redis, 'TRANSPORT_REQUEST', id, ip)`
- Include: user details + `_count { quotes }` + `booking`

**`cancel(id, userId)`**
- Only owner can cancel
- Only `OPEN` or `QUOTED` requests can be cancelled
- Sets `status: CANCELLED`
- Invalidates cache

**`myRequests(userId, page, limit)`**
- Returns paginated requests for the user
- Include `_count { quotes }` and `booking`

---

### `transport-quote.service.ts`

```typescript
@Injectable()
export class TransportQuoteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}
```

**`submitQuote(requestId, userId, dto: CreateQuoteDto)`**
- Finds carrier profile by `userId`, throws `NotFoundException` if not found
- Finds request, throws `NotFoundException` if not found
- Request must be `OPEN` or `QUOTED`, else `BadRequestException`
- Carrier cannot quote their own request — check `request.userId !== userId`
- Creates quote with `status: PENDING`
- Updates request status to `QUOTED` if still `OPEN`
- Notifies shipper: `title: 'عرض سعر جديد'`, body: `'وصلك عرض بسعر ${price} ر.ع.'`
- Returns quote with carrier profile included

**`getQuotesForRequest(requestId, userId)`**
- Only request owner can view quotes
- Returns all quotes for the request ordered by `price asc`
- Include carrier profile + user

**`acceptQuote(quoteId, userId)`**
- Only request owner can accept
- Quote must be `PENDING`
- Request must be `OPEN` or `QUOTED`
- In a Prisma transaction:
  1. Update accepted quote → `status: ACCEPTED`
  2. Update all other quotes for this request → `status: REJECTED`
  3. Update request → `status: ACCEPTED`
  4. Create `TransportBooking` record
- Notifies accepted carrier: `title: 'تم قبول عرضك'`, body: `'تم قبول عرضك على طلب النقل'`
- Returns booking

**`withdrawQuote(quoteId, userId)`**
- Only the carrier who submitted can withdraw
- Quote must be `PENDING`
- Updates quote → `status: WITHDRAWN`
- If no more `PENDING` quotes on the request, revert request to `OPEN`

**`getMyQuotes(userId, page, limit)`**
- Gets carrier profile by userId
- Returns paginated quotes submitted by this carrier
- Include request details

---

### `transport-booking.service.ts`

```typescript
@Injectable()
export class TransportBookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}
```

**`markInProgress(bookingId, carrierId)`**
- Carrier confirms pickup started
- Updates booking `status: IN_PROGRESS`
- Updates request `status: IN_PROGRESS`
- Notifies shipper

**`complete(bookingId, shipperId)`**
- Only shipper can mark as complete
- Sets booking `status: COMPLETED`, `completedAt: now`
- Sets request `status: COMPLETED`
- Increments carrier's `completedTrips` counter: `prisma.carrierProfile.update({ data: { completedTrips: { increment: 1 } } })`
- Notifies carrier

**`cancel(bookingId, userId, reason?)`**
- Either shipper or carrier can cancel
- Sets `cancelledAt`, `cancellationReason`, `status: CANCELLED`
- Sets request `status: CANCELLED`
- Notifies the other party

**`getMyBookings(userId, role: 'shipper' | 'carrier', page, limit)`**
- For `shipper`: find bookings via `request.userId = userId`
- For `carrier`: find bookings via `quote.carrier.userId = userId`
- Include request + quote + carrier/shipper user info

---

### `transport-expiry.service.ts`

```typescript
@Injectable()
export class TransportExpiryService {
  private readonly logger = new Logger(TransportExpiryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async expireOldRequests() {
    const { count } = await this.prisma.transportRequest.updateMany({
      where: {
        status: { in: ['OPEN', 'QUOTED'] },
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });
    if (count > 0) this.logger.log(`Expired ${count} transport requests`);
  }
}
```

---

## Step 5 — Controller

### `transport.controller.ts`

```
Base: @Controller('transport')
```

All authenticated routes use `@UseGuards(JwtAuthGuard)` and `@CurrentUser() user: JwtPayload`.

#### Carrier Profile Routes
```
POST   /transport/carrier-profile        → carrierProfileService.create(user.sub, dto)
GET    /transport/carrier-profile/me     → carrierProfileService.getMyProfile(user.sub)
PATCH  /transport/carrier-profile        → carrierProfileService.update(user.sub, dto)
PATCH  /transport/carrier-profile/availability → carrierProfileService.setAvailability(user.sub, body.isAvailable)
GET    /transport/carriers               → carrierProfileService.findAll(query)   [public]
GET    /transport/carriers/:id           → carrierProfileService.findOne(id)      [public]
```

#### Transport Request Routes
```
POST   /transport/requests               → transportRequestService.create(user.sub, dto)
GET    /transport/requests               → transportRequestService.findAll(query) [public]
GET    /transport/requests/my            → transportRequestService.myRequests(user.sub, ...)
GET    /transport/requests/:id           → transportRequestService.findOne(id, req.ip) [public]
PATCH  /transport/requests/:id/cancel   → transportRequestService.cancel(id, user.sub)
```

#### Quote Routes
```
POST   /transport/requests/:id/quotes    → transportQuoteService.submitQuote(id, user.sub, dto)
GET    /transport/requests/:id/quotes    → transportQuoteService.getQuotesForRequest(id, user.sub)
PATCH  /transport/quotes/:id/accept      → transportQuoteService.acceptQuote(id, user.sub)
PATCH  /transport/quotes/:id/withdraw    → transportQuoteService.withdrawQuote(id, user.sub)
GET    /transport/quotes/my              → transportQuoteService.getMyQuotes(user.sub, ...)
```

#### Booking Routes
```
PATCH  /transport/bookings/:id/start     → transportBookingService.markInProgress(id, user.sub)
PATCH  /transport/bookings/:id/complete  → transportBookingService.complete(id, user.sub)
PATCH  /transport/bookings/:id/cancel    → transportBookingService.cancel(id, user.sub, body.reason)
GET    /transport/bookings/my            → transportBookingService.getMyBookings(user.sub, query.role, ...)
```

---

### `admin-transport.controller.ts`

```
Base: @Controller('admin/transport')
Guards: JwtAuthGuard, RolesGuard, @Roles('ADMIN')
```

```
GET    /admin/transport/requests         → list all requests (any status), full filters
GET    /admin/transport/carriers         → list all carrier profiles
GET    /admin/transport/stats            → aggregate stats
PATCH  /admin/transport/requests/:id     → update status (admin override)
DELETE /admin/transport/requests/:id     → hard delete
```

Admin stats should return:
```typescript
{
  requests: { total, open, quoted, accepted, inProgress, completed, cancelled, expired },
  quotes: { total, accepted, rejected, pending },
  carriers: { total, available, verified },
  bookings: { total, completed, cancelled },
}
```

---

## Step 6 — Module

### `transport.module.ts`

```typescript
@Module({
  imports: [PrismaModule, RedisModule, NotificationsModule, SearchModule],
  controllers: [TransportController, AdminTransportController],
  providers: [
    CarrierProfileService,
    TransportRequestService,
    TransportQuoteService,
    TransportBookingService,
    TransportExpiryService,
  ],
})
export class TransportModule {}
```

Register in `apps/api/src/app.module.ts`:
```typescript
import { TransportModule } from './transport/transport.module';
// add TransportModule to imports array
```

---

## Step 7 — Unit Tests

Create `apps/api/src/transport/__tests__/` with the following spec files:

### `carrier-profile.service.spec.ts`
Test: `create`, `getMyProfile`, `update`, `findAll` (with filters), `setAvailability`
- ConflictException if profile exists on create
- NotFoundException if no profile on getMyProfile/update

### `transport-request.service.spec.ts`
Test: `create`, `findAll` (cache hit + miss), `findOne`, `cancel`
- ForbiddenException on cancel by non-owner
- BadRequestException on cancel of non-cancellable status

### `transport-quote.service.spec.ts`
Test: `submitQuote`, `acceptQuote`, `withdrawQuote`, `getMyQuotes`
- ConflictException on duplicate quote
- ForbiddenException on quoting own request
- Transaction behavior on acceptQuote (other quotes rejected)

### `transport-booking.service.spec.ts`
Test: `markInProgress`, `complete`, `cancel`
- ForbiddenException for wrong role
- completedTrips incremented on complete

---

## Step 8 — TypeScript Rules

- No `any` unless Prisma `WhereInput` types require it
- All Decimal fields: use `new Prisma.Decimal(value)` when writing
- All services use constructor injection only
- All error messages in Arabic
- Cache keys pattern: `transport:list:*`, `transport:request:${id}`
- Follow existing `jobs/` module patterns exactly for Redis, notifications, and pagination

---

## Execution Order

1. Add Prisma models → generate + push
2. Create all DTOs
3. Implement services in order: CarrierProfile → TransportRequest → TransportQuote → TransportBooking → TransportExpiry
4. Implement controllers
5. Create module + register in app.module.ts
6. Write unit tests
7. Run `npm run typecheck` — fix all errors
8. Run `npm test` — all tests must pass
