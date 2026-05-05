# SouqOne — Complete Codebase Intelligence Report

> **Generated:** 2025-05  
> **Repo root:** `c:\Users\DELL\Desktop\m`  
> **Git remote:** `github.com/Mahmoud997s/SouqOne`  
> **Active branch:** `feature/listing-delete-button`  
> **Project name (package.json):** `carone` (Arabic/English marketplace for Oman)

---

## Section 1 — Repo Structure & Configuration

### 1.1 Monorepo Layout (depth 3, excluding node_modules / .git / .next / dist)

```
m/
├── apps/
│   ├── api/                    NestJS 10 REST + WebSocket backend
│   │   ├── prisma/
│   │   │   └── schema.prisma   1 783-line full database schema
│   │   ├── src/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── buses/
│   │   │   ├── cars/
│   │   │   ├── chat/
│   │   │   ├── common/
│   │   │   ├── equipment/
│   │   │   ├── favorites/
│   │   │   ├── jobs/
│   │   │   ├── listings/
│   │   │   ├── mail/
│   │   │   ├── notifications/
│   │   │   ├── operators/
│   │   │   ├── parts/
│   │   │   ├── payments/
│   │   │   ├── reviews/
│   │   │   ├── search/
│   │   │   ├── services/
│   │   │   ├── transport/
│   │   │   ├── uploads/
│   │   │   └── users/
│   │   ├── package.json
│   │   └── .env.example
│   └── web/                    Next.js 15 App Router frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── globals.css
│       │   │   └── [locale]/   All routed pages live here
│       │   ├── components/     Shared UI components
│       │   ├── features/       Feature-scoped modules
│       │   │   ├── listings/
│       │   │   ├── transport/
│       │   │   └── sale/
│       │   ├── i18n/           routing.ts + request.ts
│       │   ├── lib/            api/, auth.ts, constants/, utils
│       │   ├── messages/       ar.json + en.json
│       │   └── providers/      React context providers
│       ├── package.json
│       └── .env.example
├── packages/
│   ├── types/                  Shared TypeScript types
│   │   └── src/
│   │       ├── index.ts
│   │       ├── user.ts
│   │       ├── listing.ts
│   │       ├── messaging.ts
│   │       └── notification.ts
│   ├── ui/                     Shared React component library
│   └── config/                 Shared config (ESLint, TypeScript)
├── .github/
│   └── workflows/ci.yml        GitHub Actions CI pipeline
├── docker-compose.yml
├── turbo.json
├── package.json                Root monorepo manifest
└── CODEBASE_INTEL.md           ← this file
```

### 1.2 Root `package.json`

```json
{
  "name": "carone",
  "version": "0.0.1",
  "private": true,
  "description": "سوق وان - SouqOne",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":            "turbo dev",
    "build":          "turbo build",
    "lint":           "turbo lint",
    "format":         "prettier --write .",
    "db:generate":    "turbo db:generate",
    "db:push":        "turbo db:push",
    "db:migrate":     "turbo db:migrate",
    "clean":          "turbo clean && rm -rf node_modules",
    "typecheck":      "turbo typecheck"
  },
  "engines": { "node": ">=20.0.0" },
  "dependencies": { "@anthropic-ai/sdk": "^0.39.0" }
}
```

### 1.3 `turbo.json` — Task Pipeline

| Task | Depends on | Cache | Outputs |
|---|---|---|---|
| `build` | `^build`, `db:generate` | yes | `.next/**`, `dist/**` |
| `dev` | — | no (persistent) | — |
| `lint` | `db:generate` | yes | — |
| `typecheck` | `db:generate` | yes | — |
| `test` | `db:generate` | no | — |
| `clean` | — | no | — |
| `db:generate` | — | yes | `.prisma/**`, `node_modules/.prisma/**` |
| `db:push` | — | no | — |
| `db:migrate` | — | no | — |

### 1.4 `docker-compose.yml` — Local Dev Services

| Service | Image | Port | Volume |
|---|---|---|---|
| `db` | `postgres:16` | `5400:5432` | `postgres_data` |
| `redis` | `redis:7-alpine` | `6379:6379` | `redis_data` |
| `meilisearch` | `getmeili/meilisearch:v1.12` | `7700:7700` | `meilisearch_data` |

- Postgres env: `POSTGRES_DB=carone`, `POSTGRES_USER=carone`, `POSTGRES_PASSWORD=carone`
- Redis: `appendonly yes`
- MeiliSearch: `MEILI_ENV=development`, `MEILI_MASTER_KEY` set

### 1.5 GitHub Actions CI (`.github/workflows/ci.yml`)

**Triggers:** push to `main`/`develop`; PRs to `main`/`develop`  
**Concurrency:** cancel-in-progress per PR/ref

**Jobs:**
1. **quality** — `npm ci` (cached), Turbo cache, lint (affected on PRs), typecheck (affected on PRs), build
2. **test-api** — Postgres 16 + Redis 7 service containers, `prisma db push`, Jest
3. **ci-ok** — gate job; single branch-protection target

**Caching strategy:**
- `node_modules` keyed by `package-lock.json` hash
- Turbo local cache keyed by SHA with restore-keys fallback
- Turbo remote cache ready via `TURBO_TOKEN` + `TURBO_TEAM` secrets (not yet configured)

> ⚠️ **Branch protection NOT yet applied** — direct push to `main` currently possible.

---

## Section 2 — Database Schema (PostgreSQL 16 / Prisma ORM)

> Schema file: `apps/api/prisma/schema.prisma` (1 783 lines)  
> Generator: `prisma-client-js`  
> Datasource: `postgresql`, `DATABASE_URL` env var  
> Shadow database: `SHADOW_DATABASE_URL`

### 2.1 Core User Tables

#### `User`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `email` | `String` | unique |
| `username` | `String` | unique |
| `password` | `String?` | nullable — Google OAuth users have no password |
| `displayName` | `String?` | |
| `avatarUrl` | `String?` | |
| `bio` | `String?` | |
| `phone` | `String?` | |
| `phoneCountryCode` | `String?` | |
| `country` | `String?` | |
| `governorate` | `String?` | Oman governorate |
| `city` | `String?` | |
| `isVerified` | `Boolean` | email verified flag |
| `emailVerificationCode` | `String?` | 6-digit OTP |
| `emailVerificationExpiry` | `DateTime?` | |
| `passwordResetCode` | `String?` | |
| `passwordResetExpiry` | `DateTime?` | |
| `role` | `UserRole` | default `USER` |
| `isBanned` | `Boolean` | default false |
| `isOnline` | `Boolean` | default false |
| `lastSeenAt` | `DateTime?` | |
| `createdAt` | `DateTime` | default now |
| `updatedAt` | `DateTime` | auto-update |
| **Relations** | listings, busListings, equipmentListings, sparePartListings, carServiceListings, operatorListings, driverProfile, employerProfile, carrierProfile, transportRequests, conversations (via participants), messages, favorites, notifications, pushSubscriptions, reviewsGiven, reviewsReceived, bookings, payments, subscription, loginAudits, refreshTokens |

#### `RefreshToken`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `token` | `String` | unique, hashed |
| `userId` | `String` | FK → User |
| `userAgent` | `String?` | |
| `ipAddress` | `String?` | |
| `expiresAt` | `DateTime` | |
| `createdAt` | `DateTime` | |

#### `LoginAudit`
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `userId` | `String` | FK → User |
| `ipAddress` | `String?` | |
| `userAgent` | `String?` | |
| `success` | `Boolean` | |
| `failureReason` | `String?` | |
| `createdAt` | `DateTime` | |

### 2.2 Listing Tables

#### `Listing` (Cars — sale / rental / wanted)
| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `slug` | `String` | unique, auto-generated |
| `title` | `String` | |
| `description` | `String` | |
| `listingType` | `ListingType` | SALE, RENTAL, WANTED |
| `make` | `String?` | |
| `model` | `String?` | |
| `year` | `Int?` | |
| `mileage` | `Int?` | |
| `fuelType` | `FuelType?` | |
| `transmission` | `Transmission?` | |
| `bodyType` | `String?` | |
| `exteriorColor` | `String?` | |
| `interior` | `String?` | |
| `engineSize` | `String?` | |
| `horsepower` | `Int?` | |
| `doors` | `Int?` | |
| `seats` | `Int?` | |
| `driveType` | `String?` | |
| `vin` | `String?` | |
| `price` | `Decimal?` | |
| `dailyPrice` | `Decimal?` | rental only |
| `weeklyPrice` | `Decimal?` | rental only |
| `monthlyPrice` | `Decimal?` | rental only |
| `currency` | `String` | default `OMR` |
| `isPriceNegotiable` | `Boolean` | default false |
| `condition` | `Condition?` | |
| `status` | `ListingStatus` | default `ACTIVE` |
| `isPremium` | `Boolean` | default false |
| `isFeatured` | `Boolean` | default false |
| `featuredUntil` | `DateTime?` | |
| `governorate` | `String?` | |
| `city` | `String?` | |
| `latitude` | `Float?` | |
| `longitude` | `Float?` | |
| `viewCount` | `Int` | default 0 |
| `sellerId` | `String` | FK → User |
| **Relations** | images (ListingImage), seller, favorites, bookings, conversations |

#### `BusListing`
| Field | Type | Notable |
|---|---|---|
| `busListingType` | `BusListingType` | BUS_SALE, BUS_SALE_WITH_CONTRACT, BUS_RENT, BUS_CONTRACT |
| `make` / `model` / `year` | various | |
| `capacity` | `Int?` | passenger seats |
| `busType` | `BusType?` | MINI, MIDI, FULL, DOUBLE_DECKER, SCHOOL, VIP, OTHER |
| `price` / `dailyPrice` / `monthlyPrice` | `Decimal?` | |
| `withDriver` | `Boolean` | |
| `status` | `BusListingStatus` | |
| Images | `BusListingImage[]` | separate table |
| Offers | `BusOffer[]` | |
| Status History | `BusListingStatusHistory[]` | audit trail |

#### `EquipmentListing`
| Field | Type | Notable |
|---|---|---|
| `listingType` | `EquipmentListingType` | EQUIPMENT_SALE, EQUIPMENT_RENT |
| `equipmentType` | `EquipmentType` | EXCAVATOR, CRANE, LOADER, BULLDOZER, FORKLIFT, CONCRETE_MIXER, GENERATOR, COMPRESSOR, SCAFFOLDING, WELDING_MACHINE, TRUCK, DUMP_TRUCK, WATER_TANKER, LIGHT_EQUIPMENT, OTHER_EQUIPMENT |
| `hoursUsed` | `Int?` | |
| `withOperator` | `Boolean` | |
| `price` / `dailyPrice` / `monthlyPrice` | `Decimal?` | |
| Images | `EquipmentListingImage[]` | |

#### `SparePart`
| Field | Type | Notable |
|---|---|---|
| `partCategory` | `PartCategory` | ENGINE, BODY, ELECTRICAL, SUSPENSION, BRAKES, INTERIOR, TIRES, BATTERIES, OILS, ACCESSORIES |
| `condition` | `PartCondition` | NEW, USED, REFURBISHED |
| `isOriginal` | `Boolean` | |
| `compatibleMakes` | `String[]` | |
| `yearFrom` / `yearTo` | `Int?` | compatibility range |
| Images | `SparePartImage[]` | |

#### `CarService`
| Field | Type | Notable |
|---|---|---|
| `serviceType` | `ServiceType` | MAINTENANCE, CLEANING, INSPECTION, BODYWORK, TOWING, MODIFICATION, KEYS_LOCKS, ACCESSORIES_INSTALL, OTHER_SERVICE |
| `providerType` | `ProviderType` | WORKSHOP, MOBILE, BOTH |
| `isHomeService` | `Boolean` | |
| `priceFrom` / `priceTo` | `Decimal?` | |
| `workingDays` | `String[]` | |
| `workingHoursOpen` / `workingHoursClose` | `String?` | |
| Images | `CarServiceImage[]` | |

#### `OperatorListing`
| Field | Type | Notable |
|---|---|---|
| `operatorType` | `String` | specialization label |
| `experienceYears` | `Int?` | |
| `dailyRate` / `hourlyRate` | `Decimal?` | |
| `equipmentTypes` | `String[]` | |
| `certifications` | `String[]` | |

### 2.3 Equipment Marketplace Tables

#### `EquipmentRequest`
| Field | Type | Notes |
|---|---|---|
| `slug` | `String` | unique |
| `equipmentType` | `EquipmentType` | |
| `startDate` / `endDate` | `DateTime?` | |
| `budgetMin` / `budgetMax` | `Decimal?` | |
| `withOperator` | `Boolean` | |
| `requestStatus` | `EquipmentRequestStatus` | OPEN, IN_PROGRESS, CLOSED, CANCELLED |
| `bids` | `EquipmentBid[]` | |

#### `EquipmentBid`
| Field | Type | Notes |
|---|---|---|
| `amount` | `Decimal` | |
| `includedOperator` | `Boolean` | |
| `status` | `BidStatus` | PENDING, ACCEPTED, REJECTED, WITHDRAWN |
| `message` | `String?` | |

### 2.4 Jobs Marketplace Tables

#### `DriverJob`
| Field | Type | Notable |
|---|---|---|
| `slug` | `String` | unique |
| `jobType` | `JobType` | OFFERING, HIRING |
| `employmentType` | `EmploymentType` | FULL_TIME, PART_TIME, CONTRACT, FREELANCE |
| `requiredLicenses` | `String[]` | |
| `vehicleType` | `VehicleType?` | |
| `salaryAmount` | `Decimal?` | |
| `salaryPeriod` | `SalaryPeriod` | DAILY, WEEKLY, MONTHLY, YEARLY, PER_TRIP |
| `hasOwnVehicle` | `Boolean` | |
| `languages` | `String[]` | |
| `status` | `JobStatus` | OPEN, CLOSED, FILLED, EXPIRED |
| `applications` | `JobApplication[]` | |
| `invites` | `JobInvite[]` | |

#### `JobApplication`
| Field | Type | |
|---|---|---|
| `coverLetter` | `String?` | |
| `status` | `ApplicationStatus` | PENDING, REVIEWING, ACCEPTED, REJECTED, WITHDRAWN |
| `escrow` | `JobEscrow?` | |

#### `JobEscrow`
- `amount` (Decimal), `status` (HELD, RELEASED, DISPUTED, REFUNDED)

#### `DriverProfile` / `EmployerProfile`
- Driver: `licenses[]`, `vehicleTypes[]`, `languages[]`, `experienceYears`, `hasOwnVehicle`, `verificationStatus`
- Employer: `companyName`, `companyType`, `contactPhone`

### 2.5 Transport Marketplace Tables

#### `CarrierProfile`
- `vehicleTypes[]`, `maxWeightTons`, `serviceTypes[]`, `governorates[]`, `isAvailable`, `rating`

#### `TransportRequest`
- `serviceType` (TransportServiceType), `fromGovernorate`/`toGovernorate`, `scheduledDate`, `weightTons`, `budgetMin`/`budgetMax`, `status` (OPEN→QUOTED→BOOKED→IN_PROGRESS→COMPLETED→CANCELLED→EXPIRED)

#### `TransportQuote` / `TransportBooking`
- Quote: `price`, `estimatedDays`, `message`, `status` (PENDING/ACCEPTED/REJECTED/WITHDRAWN)
- Booking: `totalPrice`, `status` (PENDING/IN_PROGRESS/COMPLETED/CANCELLED)

### 2.6 Social & Chat Tables

#### `Conversation`
- `participants` (ConversationParticipant[]), `messages` (Message[])
- Polymorphic listing ref: `listingId`, `busListingId`, `equipmentListingId`
- `lastMessageAt`, per-participant `isArchived`

#### `Message`
- `content`, `type` (TEXT/IMAGE/SYSTEM), `isDeleted`, `reactions` (MessageReaction[])

#### `MessageReaction`
- `emoji`, `userId`, `messageId`

### 2.7 Booking, Payment, Reviews

#### `Booking`
- `entityType` (LISTING/BUS_LISTING/EQUIPMENT_LISTING), `entityId` (polymorphic), `startDate`/`endDate`, `totalPrice`, `status` (PENDING/CONFIRMED/CANCELLED/COMPLETED/NO_SHOW)

#### `Payment`
- Thawani payment gateway; `sessionId`, `idempotencyKey`, `type` (FEATURED/SUBSCRIPTION), `amount`, `status` (PENDING/COMPLETED/FAILED/REFUNDED), `ipAddress` for fraud detection

#### `Subscription`
- `plan` (BASIC/PRO/BUSINESS), `status` (ACTIVE/CANCELLED/EXPIRED), period dates, `cancelAtPeriodEnd`

#### `Review`
- `rating` (1–5), `comment`, `reply` (seller reply), unique `(reviewerId, revieweeId)` prevents duplicates

### 2.8 Vehicle Reference Tables

- `Brand` → `CarModel` → `CarYear` hierarchy
- Brand fields: `name`, `slug`, `logoUrl`, `isPopular`, `country`

### 2.9 Notifications & Push

- `Notification`: `type` (rich enum), `title`, `body`, `data` (Json), `isRead`
- `PushSubscription`: VAPID Web Push — `endpoint`, `p256dh`, `auth`

### 2.10 Key Enums Summary

| Enum | Values |
|---|---|
| `UserRole` | USER, ADMIN, MODERATOR |
| `ListingType` | SALE, RENTAL, WANTED |
| `ListingStatus` | DRAFT, ACTIVE, SOLD, ARCHIVED, SUSPENDED |
| `BusListingType` | BUS_SALE, BUS_SALE_WITH_CONTRACT, BUS_RENT, BUS_CONTRACT |
| `EquipmentListingType` | EQUIPMENT_SALE, EQUIPMENT_RENT |
| `EquipmentType` | EXCAVATOR, CRANE, LOADER, BULLDOZER, FORKLIFT, CONCRETE_MIXER, GENERATOR, COMPRESSOR, SCAFFOLDING, WELDING_MACHINE, TRUCK, DUMP_TRUCK, WATER_TANKER, LIGHT_EQUIPMENT, OTHER_EQUIPMENT |
| `JobType` | OFFERING, HIRING |
| `EmploymentType` | FULL_TIME, PART_TIME, CONTRACT, FREELANCE |
| `ApplicationStatus` | PENDING, REVIEWING, ACCEPTED, REJECTED, WITHDRAWN |
| `TransportServiceType` | GOODS, FURNITURE, CONSTRUCTION, HEAVY, BACKLOAD, EQUIPMENT |
| `BookingStatus` | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW |
| `PaymentType` | FEATURED, SUBSCRIPTION |
| `SubscriptionPlan` | BASIC, PRO, BUSINESS |
| `FuelType` | PETROL, DIESEL, HYBRID, ELECTRIC |
| `Transmission` | AUTOMATIC, MANUAL |
| `Condition` | NEW, LIKE_NEW, USED, GOOD, FAIR, POOR |
| `PartCategory` | ENGINE, BODY, ELECTRICAL, SUSPENSION, BRAKES, INTERIOR, TIRES, BATTERIES, OILS, ACCESSORIES |
| `ServiceType` | MAINTENANCE, CLEANING, INSPECTION, BODYWORK, TOWING, MODIFICATION, KEYS_LOCKS, ACCESSORIES_INSTALL, OTHER_SERVICE |
| `MessageType` | TEXT, IMAGE, SYSTEM |
| `VerificationStatus` | PENDING, APPROVED, REJECTED |
| `BidStatus` | PENDING, ACCEPTED, REJECTED, WITHDRAWN |

---

## Section 3 — Backend Modules & API Endpoints

> All routes are prefixed with `/api/v1`  
> Global throttler guard (default 60 req/min) applied app-wide  
> JWT guard: `JwtAuthGuard` (passport-jwt strategy)  
> Roles guard: `RolesGuard` with `@Roles('ADMIN')` decorator

### 3.1 `AuthModule` — `/api/v1/auth`

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| POST | `/signup` | — | 5/min | Register new user, sends verification email |
| POST | `/login` | — | 5/min | Email+password login, returns access+refresh tokens |
| POST | `/google` | — | — | Google OAuth login/register |
| POST | `/refresh` | — | — | Exchange refresh token for new access token |
| POST | `/logout` | — | — | Revoke refresh token |
| POST | `/verify-email` | JWT | 5/min | Submit 6-digit OTP to verify email |
| POST | `/resend-verification` | JWT | 3/min | Re-send verification email |
| POST | `/forgot-password` | — | 3/min | Send password reset code to email |
| POST | `/reset-password` | — | 5/min | Submit reset code + new password |

**Key services:** `AuthService`, `AuthTokenService`, `AuthAuditService`, `TokenCleanupService` (scheduled)  
**DTOs:** `LoginDto`, `SignupDto`, `RefreshTokenDto`, `GoogleAuthDto`, `VerifyEmailDto`, `ForgotPasswordDto`, `ResetPasswordDto`

---

### 3.2 `UsersModule` — `/api/v1/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/me` | JWT | Get own profile |
| PATCH | `/me` | JWT | Update profile (displayName, avatarUrl, bio, phone, governorate, city) |
| PATCH | `/me/password` | JWT | Change password |
| GET | `/me/sessions` | JWT | List active refresh token sessions |
| DELETE | `/me/sessions/:sessionId` | JWT | Revoke specific session |
| POST | `/me/sessions/revoke-all` | JWT | Revoke all sessions |
| GET | `/me/login-history` | JWT | List login audit records |
| GET | `/:id` | — | Get public profile |

---

### 3.3 `ListingsModule` — `/api/v1/listings` (Cars)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create car listing |
| GET | `/` | — | Browse listings (QueryListingsDto filters) |
| GET | `/my` | JWT | Own listings |
| GET | `/:id` | — | Get by ID |
| GET | `/slug/:slug` | — | Get by slug |
| PATCH | `/:id` | JWT | Update listing |
| DELETE | `/:id` | JWT | Delete listing |
| GET | `/search/suggestions` | — | Quick autocomplete (min 2 chars) |

**QueryListingsDto fields:** `listingType`, `make`, `model`, `year`, `minPrice`, `maxPrice`, `condition`, `fuelType`, `transmission`, `governorate`, `city`, `status`, `page`, `limit`, `sortBy`

---

### 3.4 `BusesModule` — `/api/v1/buses`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create bus listing |
| GET | `/` | — | Browse (QueryBusListingsDto) |
| GET | `/my` | JWT | Own bus listings |
| GET | `/slug/:slug` | — | By slug + viewCount++ |
| GET | `/:id` | — | By ID + viewCount++ |
| PATCH | `/:id` | JWT | Update |
| DELETE | `/:id` | JWT | Delete |
| POST | `/:id/images` | JWT | Add images (array of URLs) |
| DELETE | `/images/:imageId` | JWT | Remove image |
| GET | `/:id/status-history` | JWT | Audit trail |
| GET | `/:id/stats` | JWT | View/booking stats |
| POST | `/:id/offers` | JWT | Submit offer (CreateBusOfferDto) |
| GET | `/:id/offers` | JWT | List offers for listing |
| PATCH | `/offers/:offerId` | JWT | Update offer status |

---

### 3.5 `EquipmentModule` — `/api/v1/equipment`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create equipment listing |
| GET | `/` | — | Browse |
| GET | `/my` | JWT | Own listings |
| GET | `/slug/:slug` | — | By slug |
| GET | `/:id` | — | By ID |
| PATCH | `/:id` | JWT | Update |
| DELETE | `/:id` | JWT | Delete |
| POST | `/:id/images` | JWT | Add images |
| DELETE | `/images/:imageId` | JWT | Remove image |

**Also `EquipmentRequestsController` — `/api/v1/equipment-requests`:**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create request |
| GET | `/` | — | Browse requests |
| GET | `/my` | JWT | Own requests |
| GET | `/:id` | — | Single request |
| PATCH | `/:id` | JWT | Update request |
| PATCH | `/:id/status` | JWT | Change request status |
| DELETE | `/:id` | JWT | Delete request |
| POST | `/:id/bids` | JWT | Submit bid |
| PATCH | `/:id/bids/:bidId/accept` | JWT | Accept bid |
| PATCH | `/:id/bids/:bidId/reject` | JWT | Reject bid |

**Also `OperatorsController` — `/api/v1/operators`** (separate OperatorListing CRUD)

---

### 3.6 `PartsModule` — `/api/v1/parts`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create spare part listing |
| GET | `/` | — | Browse (QueryPartsDto) |
| GET | `/my` | JWT | Own parts |
| GET | `/:id` | — | Single part |
| PATCH | `/:id` | JWT | Update |
| DELETE | `/:id` | JWT | Delete |

---

### 3.7 `ServicesModule` — `/api/v1/services`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create car service listing |
| GET | `/` | — | Browse |
| GET | `/my` | JWT | Own services |
| GET | `/slug/:slug` | — | By slug |
| GET | `/:id` | — | By ID |
| PATCH | `/:id/status` | JWT | Toggle active status |
| PATCH | `/:id` | JWT | Update |
| DELETE | `/:id` | JWT | Delete |

---

### 3.8 `CarsModule` — `/api/v1/cars`

Brand/Model/Year reference data:
- `GET /cars/brands` — all brands
- `GET /cars/brands/:brandId/models` — models for brand
- `GET /cars/models/:modelId/years` — years for model

---

### 3.9 `BookingsModule` — `/api/v1/bookings`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create booking (CreateBookingDto) |
| GET | `/my` | JWT | My sent bookings |
| GET | `/received` | JWT | Bookings received as seller/owner |
| GET | `/availability/:entityType/:entityId` | JWT | Check availability calendar |
| GET | `/calculate-price` | JWT | Price estimate for date range |
| GET | `/:id` | JWT | Single booking |
| PATCH | `/:id/status` | JWT | Update status (CONFIRMED/CANCELLED/COMPLETED) |

---

### 3.10 `ChatModule` — `/api/v1/chat`

All routes require JWT.

| Method | Path | Description |
|---|---|---|
| POST | `/conversations` | Create or get existing conversation |
| GET | `/conversations` | List all conversations (with search, includeArchived) |
| GET | `/conversations/:id` | Get messages (paginated, GetMessagesDto) |
| GET | `/conversations/:id/search` | Full-text message search |
| POST | `/conversations/:id/messages` | Send message |
| PATCH | `/conversations/:id/read` | Mark conversation as read |
| PATCH | `/conversations/:id/archive` | Archive/unarchive conversation |
| DELETE | `/messages/:id` | Soft-delete message |
| POST | `/messages/:id/react` | Toggle emoji reaction |

**WebSocket Gateway (`ChatGateway`):** Socket.IO with Redis adapter  
Events emitted: `new_message`, `message_read`, `user_online`, `user_offline`, `typing`

---

### 3.11 `JobsModule` — `/api/v1/jobs`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create job listing |
| GET | `/` | — | Browse (QueryJobsDto) |
| GET | `/recommended` | JWT | AI-matched recommendations |
| GET | `/my` | JWT | Own job listings |
| POST | `/driver-profile` | JWT | Create driver profile |
| GET | `/driver-profile/me` | JWT | Own driver profile |
| PATCH | `/driver-profile` | JWT | Update driver profile |
| GET | `/drivers` | — | Browse drivers (QueryDriversDto) |
| GET | `/drivers/:id` | — | Single driver |
| GET | `/drivers/:id/reviews` | — | Driver reviews |
| POST | `/employer-profile` | JWT | Create employer profile |
| GET | `/employer-profile/me` | JWT | Own employer profile |
| PATCH | `/employer-profile` | JWT | Update employer profile |
| GET | `/employers/:id` | — | Single employer |
| GET | `/invites/my` | JWT | My received invites |
| POST | `/:id/invite/:driverId` | JWT | Invite driver to job |
| PATCH | `/invites/:id` | JWT | Accept/decline invite |
| POST | `/verification/submit` | JWT | Submit verification docs |
| GET | `/verification/status` | JWT | Own verification status |
| GET | `/admin/verifications` | JWT+ADMIN | List all verifications |
| PATCH | `/admin/verifications/:id` | JWT+ADMIN | Approve/reject verification |
| POST | `/applications/:id/pay` | JWT | Pay escrow for application |
| POST | `/escrow/:id/release` | JWT | Release escrow to driver |
| POST | `/escrow/:id/dispute` | JWT | Dispute escrow |
| GET | `/:id` | — | Single job |
| PATCH | `/:id` | JWT | Update job |
| DELETE | `/:id` | JWT | Delete job |
| POST | `/:id/apply` | JWT | Apply to job (ApplyJobDto) |
| GET | `/:id/applications` | JWT | List applications |
| PATCH | `/applications/:id` | JWT | Update application status |
| POST | `/applications/:id/withdraw` | JWT | Withdraw application |

---

### 3.12 `TransportModule` — `/api/v1/transport`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/carrier-profile` | JWT | Create carrier profile |
| GET | `/carrier-profile/me` | JWT | Own carrier profile |
| PATCH | `/carrier-profile` | JWT | Update profile |
| PATCH | `/carrier-profile/availability` | JWT | Toggle availability |
| GET | `/carriers` | — | Browse carriers |
| GET | `/carriers/:id` | — | Single carrier |
| POST | `/requests` | JWT | Create transport request |
| GET | `/requests` | — | Browse requests |
| GET | `/requests/my` | JWT | Own requests |
| GET | `/requests/:id` | — | Single request |
| PATCH | `/requests/:id/cancel` | JWT | Cancel request |
| POST | `/requests/:id/quotes` | JWT | Submit quote |
| GET | `/requests/:id/quotes` | JWT | List quotes for request |
| PATCH | `/quotes/:id/accept` | JWT | Accept quote (creates booking) |
| PATCH | `/quotes/:id/withdraw` | JWT | Withdraw quote |
| GET | `/quotes/my` | JWT | Own submitted quotes |
| PATCH | `/bookings/:id/start` | JWT | Mark booking in-progress |
| PATCH | `/bookings/:id/complete` | JWT | Mark booking complete |
| PATCH | `/bookings/:id/cancel` | JWT | Cancel booking |
| GET | `/bookings/my` | JWT | Own bookings (role: shipper/carrier) |

---

### 3.13 `PaymentsModule` — `/api/v1/payments`

Payment provider: **Thawani** (Omani payment gateway)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/featured` | JWT | Create featured listing payment session |
| POST | `/subscribe` | JWT | Create subscription payment session |
| GET | `/verify/:sessionId` | — | Verify payment result |
| POST | `/webhook` | — | Thawani webhook (secret header check) |
| GET | `/my` | JWT | Own payment history |
| GET | `/plans` | — | Get subscription plans |
| GET | `/subscription` | JWT | Own active subscription |
| POST | `/subscription/cancel` | JWT | Cancel subscription |

Bull queue: `payment-webhook` with retry (3 attempts, exponential backoff 5s)  
Idempotency key header: `idempotency-key`

---

### 3.14 `ReviewsModule` — `/api/v1/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Create review |
| GET | `/` | — | Browse (QueryReviewsDto) |
| GET | `/summary/:userId` | — | Rating summary for user |
| POST | `/:id/reply` | JWT | Seller reply to review |

---

### 3.15 `NotificationsModule` — `/api/v1/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/push/vapid-key` | — | Get VAPID public key |
| POST | `/push/subscribe` | JWT | Register push subscription |
| POST | `/push/unsubscribe` | JWT | Remove push subscription |
| GET | `/` | JWT | List notifications (page, limit, filter: all/unread) |
| GET | `/unread-count` | JWT | Unread count |
| PATCH | `/:id/read` | JWT | Mark single read |
| PATCH | `/read-all` | JWT | Mark all read |

---

### 3.16 `FavoritesModule` — `/api/v1/favorites`

All routes require JWT.

| Method | Path | Description |
|---|---|---|
| POST | `/:entityType/:entityId` | Toggle favorite (generic — any entity type) |
| POST | `/:listingId` | Toggle favorite (backward-compat, assumes LISTING) |
| GET | `/` | List favorites (type?, page, limit) |
| GET | `/check/:entityType/:entityId` | Check if favorited |
| GET | `/check/:listingId` | Check if favorited (backward-compat) |
| GET | `/ids` | Get all favorited IDs (for bulk checking) |

**Entity types:** LISTING, BUS_LISTING, EQUIPMENT_LISTING, EQUIPMENT_REQUEST, OPERATOR_LISTING, SPARE_PART, CAR_SERVICE, JOB

---

### 3.17 `SearchModule` — `/api/v1/search`

MeiliSearch-backed unified search.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | Unified full-text search across all indexes |
| GET | `/autocomplete` | — | Fast autocomplete (q, limit) |
| POST | `/reindex` | JWT | Full re-sync from PostgreSQL (admin) |

**SearchQueryDto fields:** `q`, `entityType`, `governorate`, `minPrice`, `maxPrice`, `make`, `model`, `condition`, `listingType`, `sortBy` (newest/price:asc/price:desc), `page`, `limit`  
**MeiliSearch indexes:** `listings`, `buses`, `parts`, `services`, `jobs`

---

### 3.18 `UploadsModule` — `/api/v1/uploads`

All routes require JWT. File size limit: 10 MB per file.

| Method | Path | Description |
|---|---|---|
| POST | `/` | Upload single file (multipart/form-data `file`) |
| POST | `/multiple` | Upload up to 10 files (`files`) |
| GET | `/listings/:listingId/images` | Get listing images |
| POST | `/listings/:listingId/images` | Upload + attach image to listing |
| POST | `/listings/:listingId/images/url` | Attach pre-uploaded URL to listing |
| DELETE | `/listings/:listingId/images/:imageId` | Remove listing image |
| PATCH | `/listings/:listingId/images/reorder` | Reorder images |
| POST | `/parts/:partId/images` | Upload spare part image |
| DELETE | `/parts/images/:imageId` | Remove part image |
| POST | `/services/:serviceId/images` | Upload service image |
| DELETE | `/services/images/:imageId` | Remove service image |
| POST | `/buses/:busId/images` | Upload bus image |
| POST | `/equipment/:equipmentId/images` | Upload equipment image |

Upload provider: **Cloudinary**. Local static files served under `/uploads/` via Express static.

---

### 3.19 Common Infrastructure (`apps/api/src/common/`)

| Path | Purpose |
|---|---|
| `decorators/current-user.decorator.ts` | Extracts JWT payload from request |
| `decorators/roles.decorator.ts` | Sets required roles metadata |
| `guards/roles.guard.ts` | Checks user role against metadata |
| `guards/jwt-auth.guard.ts` | Extends passport JWT guard |
| `filters/http-exception.filter.ts` | Global exception → structured JSON |
| `interceptors/sanitize.interceptor.ts` | Global input sanitization |
| `interceptors/image-normalize.interceptor.ts` | Normalizes image URL responses |
| `listeners/listing-notification.listener.ts` | EventEmitter2 listener for cross-module notifications |
| `dto/pagination-query.dto.ts` | `{ page?: number; limit?: number }` |
| `utils/` | slug-generator, hash helpers, etc. |
| `adapters/redis-io.adapter.ts` | Redis Socket.IO adapter (horizontal scaling) |
| `events/` | Custom event definitions |
| `services/prisma.service.ts` | Prisma singleton |

---

## Section 4 — Frontend Routing (Next.js 15 App Router)

> All routes live under `apps/web/src/app/[locale]/`  
> Locales: `ar` (default, RTL) and `en` (LTR)  
> Root redirect: `/` → `/ar`  
> Legacy redirects: `/search` → `/browse`, `/search/cars` → `/browse/cars`  
> Font: Almarai (Arabic-optimized, weights 300/400/700/800)  
> Layout providers (in nesting order): `NextIntlClientProvider` → `ThemeProvider` → `QueryProvider` → `AuthProvider` → `FavoritesProvider` → `AuthModalProvider` → `ToastProvider` → `SearchProvider` → `PageTransition`

### 4.1 Route Tree

```
[locale]/
├── layout.tsx                Root locale layout (providers, font, dir, metadata)
├── page.tsx                  Homepage (hero, category grid, featured listings)
│
├── browse/                   Unified listing browse (MeiliSearch-backed)
│   └── [category]/page.tsx   Category-filtered browse (cars/buses/parts/services/jobs)
│
├── sale/                     Listing detail pages
│   ├── car/[id]/page.tsx
│   ├── bus/[id]/page.tsx
│   ├── part/[id]/page.tsx
│   └── service/[id]/page.tsx
│
├── add-listing/              Create listing flow
│   ├── page.tsx              Category selection page
│   └── [type]/page.tsx       Dynamic form router (car/bus/equipment/parts/service/operator)
│
├── edit-listing/             Edit listing flow
│   ├── car/[id]/page.tsx     Custom car edit form (pre-populated ListingForm)
│   ├── [type]/[id]/
│   │   ├── page.tsx          Supported-type check + render EditListingClient
│   │   └── client.tsx        Dynamic edit form loader (GenericEditForm-based)
│   └── job/[id]/page.tsx     Custom job edit form
│
├── jobs/                     Jobs marketplace
│   ├── page.tsx              Jobs browse page (enhanced filter UI)
│   ├── new/page.tsx          Create job listing
│   └── [id]/page.tsx         Job detail page
│
├── equipment/                Heavy equipment marketplace
│   ├── page.tsx              Equipment landing
│   ├── requests/
│   │   ├── page.tsx          Browse equipment requests
│   │   ├── new/page.tsx      Create equipment request
│   │   └── [id]/page.tsx     Request detail
│   └── operators/
│       └── [id]/page.tsx     Operator profile
│
├── transport/                Transport marketplace
│   ├── layout.tsx
│   ├── page.tsx              Landing (hero + service grid + latest requests + CTA)
│   ├── browse/page.tsx       Browse transport requests
│   ├── new/page.tsx          Create transport request (5-step wizard)
│   ├── requests/[id]/page.tsx  Request detail + quotes sidebar
│   ├── bookings/[id]/page.tsx  Booking detail
│   ├── my-requests/page.tsx    Own requests
│   ├── my-quotes/page.tsx      Own submitted quotes
│   └── carrier/
│       ├── register/page.tsx   Register as carrier
│       ├── dashboard/page.tsx  Carrier dashboard
│       └── [id]/page.tsx       Carrier public profile
│
├── messages/                 Chat
│   ├── layout.tsx
│   ├── page.tsx              Conversation list
│   └── [conversationId]/page.tsx  Chat thread
│
├── notifications/page.tsx    Notifications feed
│
├── bookings/
│   ├── page.tsx              My bookings list
│   └── [id]/page.tsx         Booking detail
│
├── favorites/page.tsx        Saved favorites (grid/list toggle)
│
├── profile/
│   ├── page.tsx              Own profile (tabs: overview/listings/bookings/settings/security)
│   └── [userId]/page.tsx     Public user/seller profile
│
├── auth/                     Standalone auth pages (also intercepted as modals)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── verify-email/page.tsx
│
├── @modal/                   Parallel route for in-app auth modals
│   └── (.)login / (.)register / …   Intercepted auth routes
│
├── legal/
│   ├── privacy/page.tsx
│   └── terms/page.tsx
│
└── dev/
    └── unified-card/page.tsx  Dev preview page for UnifiedCard component
```

### 4.2 `apps/web/next.config.js` Key Settings

```js
output: 'standalone'
transpilePackages: ['@carone/ui', '@carone/types']
reactStrictMode: true
serverExternalPackages: (from next-intl plugin)
images.remotePatterns: [API host, localhost]
redirects: /search → /browse, /search/cars → /browse/cars
experimental.allowedDevOrigins: ['localhost', local IPs]
```

---

## Section 5 — Frontend Components

### 5.1 Layout Components (`components/layout/`)

| Component | Description |
|---|---|
| `Navbar` | Glassmorphism top nav, logo, category links, search bar, auth buttons, dark mode toggle, language switcher |
| `BottomNav` | Mobile sticky bottom navigation (5 tabs: home/browse/add/messages/profile) |
| `Footer` | Site footer with links |
| `PageWrapper` | Standard page padding/max-width wrapper |
| `SectionHeader` | Reusable section title + subtitle |
| `Breadcrumbs` | Page breadcrumb trail |
| `HeroSection` | Landing hero with gradient background |
| `CategoryGrid` | Horizontal category scroll strip |
| `SearchBar` (layout) | Full-width search bar in navbar |

### 5.2 Auth Components (`components/auth/`)

| Component | Description |
|---|---|
| `AuthModal` | Fixed overlay modal, dark backdrop blur, logo 52px + name 22px, Escape closes |
| `AuthPage` | Standalone auth page (same visual as modal) |
| `AuthLayout` | **DEAD CODE** — no imports, can be deleted |
| `AuthGuard` | Client component; redirects unauthenticated users to login |
| `AuthOverlay` | Portal that renders auth modal for intercepted routes |
| `GoogleSignIn` | Google OAuth button with SDK integration |

### 5.3 Listing Display Components

| Component | Description |
|---|---|
| `ListingPageShell` (`listing-page-shell.tsx`) | Full detail page layout: image gallery, title/price, specs, seller card, map, related listings |
| `SellerCard` (`seller-card.tsx`) | Seller info card with avatar, rating, verification badge, contact buttons |
| `ListingBadge` (`listing-badge.tsx`) | Status badge chip (للبيع/للإيجار/مطلوب) |
| `HomepageBadge` (`homepage-badge.tsx`) | Featured badge ribbon for premium/featured listings |
| `VerifiedBadge` (`verified-badge.tsx`) | Blue checkmark for verified accounts |
| `FavoriteButton` (`favorite-button.tsx`) | Heart toggle button using `FavoritesProvider` context |
| `EmptyState` (`empty-state.tsx`) | Empty result illustration + message |
| `ErrorState` (`error-state.tsx`) | Error illustration + retry action |
| `LoadingSkeleton` (`loading-skeleton.tsx`) | Shimmer skeleton placeholder |

### 5.4 Unified Card System (`features/listings/components/`)

| Component | Description |
|---|---|
| `UnifiedCard` | Generic listing card: `RibbonBadge` (top-start), `TrustBadge`, `DetailChip[]` (capped to 2 rows), favorite button, price, location |
| `ListingCard` | Car-specific card (extends UnifiedCard pattern) |
| `ListingsPageShell` | Full browse page: filter sidebar + grid/list + pagination |
| `FilterSidebar` | Left-panel filter drawer with chips, range sliders, select fields |
| `FilterBar` | Horizontal filter chips bar (mobile-optimized) |
| `ListingGrid` | Responsive CSS grid of listing cards |
| `SortControl` | Dropdown sort selector |
| `PaginationBar` | Page navigation |
| `ListingCardSkeleton` | Skeleton for card loading state |

### 5.5 Bookings Components (`components/bookings/`)

12 components including:
- `BookingCard` — booking summary card with status badge
- `BookingCalendar` — availability calendar picker
- `BookingStatusBadge` — colored status chip
- `BookingTimeline` — status history stepper
- `PriceBreakdown` — nightly/weekly price calculation display
- `BookingActions` — confirm/cancel/complete action buttons

### 5.6 Dashboard Components (`components/dashboard/`) — 40 files

Seller/owner dashboard panels:
- `MyListingsList` — paginated own listings with status controls
- `MyBookingsList` — received bookings management
- `AnalyticsPanel` — view count / booking charts
- `ListingStatusControl` — activate/suspend/mark sold
- `EarningsSummary` — payment totals

### 5.7 Chat Components (`components/notifications/`) — 11 files

- `ConversationList` — sidebar list with unread counts
- `MessageBubble` — chat bubble with reactions
- `MessageInput` — textarea + emoji + image attach
- `TypingIndicator` — animated "..." dots
- `ReactionPicker` — emoji reaction popover
- `MessageReadReceipt` — double-tick read status
- `ConversationSearch` — search within messages
- `ArchiveToggle` — archive/unarchive conversation

### 5.8 Profile Components (`components/profile/`) — 14 files

- `ProfilePageClient` — outer client wrapper
- `ProfileHero` / `ProfileHeroSkeleton` — avatar, name, stats strip
- `ProfileNavTabs` / `ProfileNavTabsSkeleton` — tab navigation
- `ProfileOverviewTab` — summary stats + recent activity
- `ProfileListingsTab` / Skeleton — own listings grid
- `ProfileBookingsTab` / Skeleton — bookings history
- `ProfileSettingsCard` — editable profile fields form
- `ProfileSettingsTab` — settings section wrapper
- `ProfileSecurityTab` — password change + sessions
- `ProfileVerificationStatus` — email/phone verification status

### 5.9 Notification Components (`components/notifications/`) — 11 files

- `NotificationBell` — navbar bell with unread badge
- `NotificationDrawer` — slide-out notification panel
- `NotificationItem` — single notification row with icon
- `NotificationFilter` — all/unread toggle
- `PushNotificationBanner` — browser push permission prompt

### 5.10 Map Components (`components/map/`)

- `MapDisplay` — Leaflet map with marker (dynamically imported)
- `MapPicker` — interactive location picker
- `RouteMap` + `RouteMapClient` — two-point route display for transport

### 5.11 Shared UI Components (`components/ui/`) — 22 files

Radix UI-based primitives:
`Button`, `Input`, `Select`, `Textarea`, `Dialog`, `Drawer`, `Tooltip`, `Badge`, `Avatar`, `Tabs`, `DropdownMenu`, `Popover`, `Sheet`, `Separator`, `Skeleton`, `FilterChips`, `SearchBar`, `Spinner`, `Switch`, `Label`, `Checkbox`, `RadioGroup`

### 5.12 Providers (`providers/`)

| Provider | Purpose |
|---|---|
| `QueryProvider` | React Query (`TanStack Query`) client |
| `AuthProvider` | JWT token state, `useMe()` hook |
| `AuthModalProvider` | Open/close auth modal from any component |
| `ThemeProvider` | next-themes dark/light mode |
| `ToastProvider` | Toast notifications |
| `SearchProvider` | Global search state (query, filters, active category) |
| `FavoritesProvider` | Cached favorite IDs for bulk UI checks |

### 5.13 Key API Hooks (`lib/api/`)

Each file exports React Query hooks:

| File | Key hooks |
|---|---|
| `listings.ts` | `useListings(params)`, `useListing(id)`, `useMyListings()` |
| `buses.ts` | `useBusListings(params)`, `useBusListing(id)` |
| `equipment.ts` | `useEquipmentListings()`, `useEquipmentRequests()`, `useOperatorListings()` |
| `parts.ts` | `useParts(params)`, `usePart(id)` |
| `services.ts` | `useCarServices(params)`, `useCarService(id)` |
| `jobs.ts` | `useJobs(params)`, `useJob(id)`, `useMyJobs()`, `useDriverProfile()`, `useJobApplications()` |
| `chat.ts` | `useConversations()`, `useMessages(id)`, `useSendMessage()` |
| `bookings.ts` | `useMyBookings()`, `useReceivedBookings()`, `useBooking(id)` |
| `favorites.ts` | `useFavorites()`, `useToggleFavorite()`, `useFavoriteIds()` |
| `notifications.ts` | `useNotifications()`, `useUnreadCount()` |
| `payments.ts` | `useMyPayments()`, `useSubscription()`, `usePlans()` |
| `reviews.ts` | `useReviews(params)`, `useReviewSummary(userId)` |
| `search.ts` | `useSearch(params)`, `useAutocomplete(q)` |
| `users.ts` | `useMe()`, `usePublicProfile(id)` |
| `uploads.ts` | `useUpload()`, `useUploadMultiple()` |
| `cars.ts` | `useBrands()`, `useModels(brandId)`, `useYears(modelId)` |

### 5.14 Authentication Layer (`lib/auth.ts`)

- Token storage: `localStorage` keys `carone.auth_token` / `carone.refresh_token`
- `apiFetch(path, init)` — authenticated fetch with automatic 401 → refresh → retry
- `tryRefreshToken()` — de-duplicated concurrent refresh via singleton promise
- `decodeJwtPayload(token)` — client-side JWT decode (no verify)
- `JwtTokenPayload` type: `{ sub, email, username, role, iat, exp }`

---

## Section 6 — Styling System

> Framework: **Tailwind CSS v4** with `@theme` CSS custom properties  
> File: `apps/web/src/app/globals.css`  
> Design system name: **SouqOne Design System v6 — "The Editorial Marketplace"**

### 6.1 Design Tokens (`@theme`)

#### Color Palette

| Token | Light | Dark | Role |
|---|---|---|---|
| `--color-primary` | `#004ac6` | `#60a5fa` | Deep Authoritative Blue |
| `--color-primary-container` | `#2563eb` | `#1e40af` | |
| `--color-secondary` | `#475569` | `#94a3b8` | Slate UI elements |
| `--color-tertiary` | `#E8781E` | `#FB923C` | Orange accent |
| `--color-brand-navy` | `#0B2447` | — | Brand navy |
| `--color-brand-amber` | `#E8781E` | — | Brand orange |
| `--color-price-green` | `#16a34a` | `#34d399` | Price display |
| `--color-error` | `#dc2626` | `#ffb4ab` | |
| `--color-surface` | `#F5F7FA` | `#0a1628` | Page background |
| `--color-surface-container` | `#F0F2F6` | `#0f1a2e` | Card background |
| `--color-on-surface` | `#111827` | `#e2e8f0` | Body text |
| `--color-outline` | `#9CA3AF` | `#475569` | Borders |
| `--color-background` | `#F5F7FA` | `#060e1e` | HTML background |

#### Typography
- `--font-headline` + `--font-body`: Almarai (Google Font, Arabic subset)
- `line-height: 1.7` (body), `1.4` (headings)

#### Border Radius
- `--radius-sm: 4px`, `--radius-md/lg/xl/2xl: 12px`, `--radius-3xl/4xl/5xl: 16px`

### 6.2 Utility Classes

| Class | Purpose |
|---|---|
| `.glass-card` | White/blur card (80% opacity, 12px blur, border) |
| `.glass-nav` | Glassmorphism navbar (desktop) / solid (mobile ≤1023px) |
| `.btn-primary` | Deep blue gradient button |
| `.btn-success` | Green gradient button |
| `.btn-brand` | Orange gradient button |
| `.skeleton-pulse` | Shimmer loading animation |
| `.no-scrollbar` | Hide scrollbar |
| `.premium-scrollbar` | Blue thin custom scrollbar |
| `.animate-slide-up` | Slide-up entrance animation |
| `.shadow-ambient` | Soft ambient box-shadow |

### 6.3 Form Styles (`lib/constants/form-styles.ts`)

Shared Tailwind strings for consistent form UI:

```ts
formInput     // text input class string
formLabel     // label class string
formSection   // section wrapper class string
formSectionTitle // section heading class string
formChip      // chip/tag selector class string
formCheckbox  // checkbox class string
```

### 6.4 Dark Mode

Uses `next-themes` with `.dark` class strategy. All design tokens have dark equivalents in the `.dark {}` block. Deep Navy palette: `#0a1628` (surface), `#060e1e` (background), `#0f1a2e` (container).

### 6.5 Icons

- **Lucide React** — standard icons throughout the app
- **Material Symbols Outlined** — loaded from Google Fonts CDN in layout head, used in category grids and search engine UI

---

## Section 7 — Translations & i18n

> Framework: **next-intl**  
> Config: `apps/web/src/i18n/routing.ts` + `i18n/request.ts`  
> Messages: `apps/web/src/messages/ar.json` (primary) + `en.json`

### 7.1 Supported Locales

| Locale | Direction | Default |
|---|---|---|
| `ar` | RTL | ✅ Yes |
| `en` | LTR | No |

URL structure: `/{locale}/path` — e.g. `/ar/browse/cars`, `/en/browse/cars`

### 7.2 Message File Structure

Both `ar.json` and `en.json` follow the same namespace structure:

```
pages.*           — page titles, descriptions, OG metadata
nav.*             — navigation link labels
auth.*            — login/register/forgot-password form labels
profile.*         — profile page labels
listings.*        — listing form labels and field names
jobs.*            — jobs-specific labels
transport.*       — ~150 keys for transport marketplace
notifications.*   — notification type labels
bookings.*        — booking status and action labels
categories.*      — category names (vehiclesParts, buses, jobs, carServices, heavyEquipment)
enums.*           — human-readable enum translations (condition, fuel, transmission, etc.)
enumVehicle.*     — vehicle type enum labels
errors.*          — error message strings
common.*          — shared labels (save, cancel, loading, etc.)
```

### 7.3 Enum Translation Pattern

`lib/enum-translations.ts` — maps enum values to Arabic/English display strings  
`lib/translate-enum.ts` — `translateEnum(key, value, locale)` helper  
`features/listings/hooks/useItemTransformers.ts` — `useEnumTranslations()` + `translateEnum()` wired into `UnifiedCard` data

### 7.4 Server-Side Usage

```tsx
// In server components:
const t = await getTranslations({ locale, namespace: 'pages' });
const messages = await getMessages();

// In client components:
const t = useTranslations('listings');
const locale = useLocale();
```

---

## Section 8 — Shared Packages

### 8.1 `packages/types` — `@carone/types`

Exported from `src/index.ts`:

```ts
// user.ts
export enum UserRole          // USER, ADMIN, MODERATOR
export interface IUser        // Full user shape
export interface ICreateUser
export interface IUpdateUser
export const OMAN_GOVERNORATES  // 11 governorates array

// listing.ts
export enum ListingStatus     // DRAFT, ACTIVE, SOLD, ARCHIVED, SUSPENDED
export enum ItemCondition     // NEW, USED, LIKE_NEW, GOOD, FAIR, POOR
export enum FuelType          // PETROL, DIESEL, HYBRID, ELECTRIC
export enum Transmission      // AUTOMATIC, MANUAL
export interface IListing     // Full listing shape with all car fields
export interface IListingImage
export interface ICreateListing
export const POPULAR_MAKES    // 16 popular car brands in Oman

// messaging.ts
export enum MessageType       // TEXT, IMAGE, SYSTEM
export interface IConversation
export interface IConversationParticipant
export interface IMessage
export interface ISendMessage

// notification.ts
export enum NotificationType  // MESSAGE, LISTING_SOLD, LISTING_FAVORITED, PRICE_DROP, SYSTEM
export interface INotification
```

### 8.2 `packages/ui` — `@carone/ui`

Shared React component library transpiled into both apps.

### 8.3 `packages/config` — `@carone/config`

Shared ESLint, TypeScript, and Prettier configurations.

---

## Section 9 — Environment Variables

### 9.1 Backend (`apps/api/.env.example`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (includes DB name, user, password, port, schema) |
| `SHADOW_DATABASE_URL` | Shadow DB for Prisma migrate (Neon or local) |
| `REDIS_URL` | Redis connection URL (default `redis://localhost:6379`) |
| `JWT_SECRET` | Secret for access token signing |
| `JWT_EXPIRES_IN` | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Secret for refresh token signing |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token TTL (e.g. `7d`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `MEILI_HOST` | MeiliSearch URL (default `http://localhost:7700`) |
| `MEILI_MASTER_KEY` | MeiliSearch master key |
| `MAIL_HOST` | SMTP host (Mailtrap for dev) |
| `MAIL_PORT` | SMTP port |
| `MAIL_USER` | SMTP username |
| `MAIL_PASS` | SMTP password |
| `MAIL_FROM` | Sender email address |
| `NODE_ENV` | `development` or `production` |
| `PORT` | API listen port (default 3001) |
| `FRONTEND_URL` | Next.js URL for CORS (default `http://localhost:3000`) |
| `THAWANI_API_KEY` | Thawani payment gateway API key |
| `THAWANI_PUBLISHABLE_KEY` | Thawani publishable key |
| `THAWANI_BASE_URL` | Thawani API base URL |
| `THAWANI_WEBHOOK_SECRET` | Webhook secret header verification |
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
| `VAPID_SUBJECT` | Web Push subject (mailto:) |

### 9.2 Frontend (`apps/web/.env.example`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:3001`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID (public) |

### 9.3 CI/CD Secrets (`.github/workflows/ci.yml`)

| Secret | Used for |
|---|---|
| `RAILWAY_DEPLOY_HOOK_API` | Railway deploy webhook for API |
| `RAILWAY_DEPLOY_HOOK_WEB` | Railway deploy webhook for web |
| `PROD_API_URL` | Production health check URL |
| `PROD_WEB_URL` | Production web health check URL |
| `TURBO_TOKEN` | Turbo remote cache token (optional) |
| `TURBO_TEAM` | Turbo team name (optional) |

---

## Section 10 — Tests

### 10.1 API Unit Tests

> Runner: Jest  
> Location: `apps/api/src/**/*.spec.ts`  
> Count: **19 test suites / 264 tests** — all pass  
> DB: Postgres 16 service container in CI

Key spec files:
| File | Coverage |
|---|---|
| `auth/auth.service.spec.ts` | signup, login, refresh, logout, email verify, forgot/reset password |
| `payments/payments.service.spec.ts` | 35 test cases — featured/subscription payments, fraud detection, idempotency, state machine |
| `buses/buses.service.spec.ts` | CRUD, offers, images |
| `services/services.service.spec.ts` | CRUD, toggle status |
| `chat/chat.service.spec.ts` | conversation create, messages, reactions (EventEmitter2 mock) |
| `jobs/jobs.service.spec.ts` | create job, apply, duplicate application P2002 mock |
| `transport/__tests__/` | 4 suites, 33 tests — carrier profile, requests, quotes, bookings |

### 10.2 API E2E Tests

> Runner: Jest + Supertest  
> Location: `apps/api/test/*.e2e-spec.ts`  
> Count: 23 spec files  
> DB: separate `carone_e2e` database  
> CI: `continue-on-error: true`

### 10.3 Web E2E Tests

> Runner: **Playwright**  
> Location: `apps/web/e2e/*.spec.ts` (11 spec files)  
> Browser: Chromium only in CI  
> Artifact: `playwright-report` uploaded on failure  
> Script: `npm run test:e2e` → `playwright test --project=chromium`  
> CI: `continue-on-error: true`

### 10.4 Test Configuration Notes

- `turbo.json` `db:generate` outputs include both `node_modules/.prisma/**` AND `node_modules/@prisma/client/**` (ensures typecheck works in CI after generate)
- Quality job runs explicit `npx turbo run db:generate` before lint/typecheck/build
- Security audit: `npm audit` + `audit-ci` with `continue-on-error: true`
- Dependency review: GitHub native action on PRs, fail on high severity

---

## Section 11 — Git History (Last 30 Commits)

```
f13f581  feat(jobs): redesign jobs page with enhanced filtering and card UI
30b9f6d  feat(jobs): separate jobs domain from ListingShellPage
a56ac2f  feat: add job slug support and application/invite management UI
a108fc9  fix: update useMemo dependencies and replace quotes with HTML entities
46e26be  perf(web): optimize useFilterState hook by moving config into useMemo
9638181  feat: add archived conversations filter and refactor bookings page
7b34c1a  feat: add notifications filter, improve UI/UX, and enhance real-time updates
0704ad2  feat: add contact seller functionality to rental booking component
7b14364  perf: compress hero & category images to webp, use Next Image
6dfe609  feat: refactor profile page + add country/city location fields
140d3d1  fix: remove unused STATS constant in buses-landing-client
8a1bb31  fix: update listings flow and landing hero banners
17b2c69  test(api): remove trips e2e spec
ca8622d  test(api): remove removed services from e2e setup
f9b6bbf  fix(api): remove remaining trips upload service method
3f97401  db(api): add trips removal migration
0be6305  refactor(api): remove trips models from prisma schema
df92ccf  refactor(api): remove trips backend references
dee824e  refactor(api): remove TripsModule from app module
cd56f78  refactor(api): remove trips module directory
c755d67  refactor: remove insurance service
c1179f2  fix: treat BUS_CONTRACT as service type — unified form, proper badges
d5de025  feat: add per-type horizontal card sliders to buses landing page
bdf06e0  fix: fetch 5 images for listing favorites and use USER_SELECT constant
1b37da5  feat: return full entity data in favorites API for proper card rendering
7b9139f  fix: use native card components without custom overlays
f3c548e  feat: add grid/list view mode toggle to favorites page
04de215  fix: redesign favorites page to match seller page style
cee9b0b  refactor: rewrite favorites page as modular components
768574a  refactor: rewrite seller page as modular components
```

**Notable recent removals:** Trips module (7 commits) and Insurance service — removed as dead/unused features.

**Active branch:** `feature/listing-delete-button`

**Deployment flow:**
```
feature branch → PR → CI ✓ → merge to main → Railway auto-deploy
```

---

## Section 12 — Known Issues & TODOs

### 12.1 In-Code TODOs

| Location | TODO |
|---|---|
| `apps/api/src/equipment/equipment-listings.service.ts:70` | Migrate to GIN index or MeiliSearch for 50K+ records (current ILIKE search) |
| `apps/api/src/equipment/equipment-listings.service.ts:93` | Migrate `viewCount` to Redis INCR + periodic sync for high traffic |
| `apps/web/src/features/listings/components/ListingsPageShell.tsx:412` | Wire `handleSave` to favorites API (currently only `console.log`) |
| `apps/web/src/components/layout/bottom-nav.tsx` | Unresolved TODO |
| `apps/web/src/features/listings/components/FilterSidebar.tsx` | Unresolved TODO |
| `apps/web/src/features/sale/components/SalePageShell.tsx` | Unresolved TODO |
| `apps/api/src/equipment/equipment-requests.service.ts` | Unresolved TODO |
| `apps/api/src/equipment/operators.service.ts` | Unresolved TODO |
| `apps/api/src/operators/operators.service.ts` | Unresolved TODO |

### 12.2 Security Issues (From Audit)

| Issue | Severity | Detail |
|---|---|---|
| Fake reviews | HIGH | No booking requirement to leave a review — unique constraint `(reviewerId, revieweeId)` prevents duplicate but does not require verified transaction |
| `viewCount` manipulation | MEDIUM | Direct DB increment on every GET with no deduplication (IP/session), except listing-page-shell |
| N+1 queries in chat | MEDIUM | `getConversations` may load message counts via separate queries |
| Missing MeiliSearch for equipment | MEDIUM | Equipment listings use Prisma ILIKE — no full-text search via MeiliSearch |
| Missing caching on parts/equipment | LOW | No Redis caching layer on browse endpoints for parts and equipment |
| Direct push to `main` | HIGH | Branch protection not yet applied to main branch |

### 12.3 Dead Code

| File | Status |
|---|---|
| `components/auth/auth-layout.tsx` | Dead code — no imports anywhere |
| Insurance module (removed) | Commits c755d67 — stubs may remain in seeds |
| Trips module (removed) | Commits cd56f78 → 17b2c69 — stubs may remain in seed/script files |

### 12.4 Missing Features / Incomplete

| Feature | Status |
|---|---|
| Equipment browse MeiliSearch | Not indexed — uses ILIKE fallback |
| Equipment requests MeiliSearch | Not indexed |
| Operator listings MeiliSearch | Not indexed |
| Transport requests MeiliSearch | Not indexed |
| Bid submission UI | Needs verification (bookings phase ~95%) |
| End-to-end filter testing | Pending |
| Branch protection on `main` | NOT YET APPLIED |
| Turbo remote cache | Secrets not configured |
| Web Railway service | Needs Railway service setup |

---

## Section 13 — Feature-Level Category Configuration

### 13.1 Search Engine Entity Mapping

| UI Category | MeiliSearch Index | Favorite Entity Type |
|---|---|---|
| `cars` | `listings` | `LISTING` |
| `buses` | `buses` | `BUS_LISTING` |
| `parts` | `parts` | `SPARE_PART` |
| `services` | `services` | `CAR_SERVICE` |
| `jobs` | `jobs` | `JOB` |
| `equipment` | ❌ Not indexed | `EQUIPMENT_LISTING` |
| `equipment-requests` | ❌ Not indexed | `EQUIPMENT_REQUEST` |
| `operators` | ❌ Not indexed | `OPERATOR_LISTING` |

### 13.2 Main Category → Add-Listing Routes

| Category | Sub-type | Route |
|---|---|---|
| Vehicles & Parts | Car Sale | `/add-listing/car?type=SALE` |
| | Car Rental | `/add-listing/car?type=RENTAL` |
| | Spare Parts | `/add-listing/parts` |
| | Tires/Batteries | `/add-listing/parts?cat=TIRES` |
| | Accessories | `/add-listing/parts?cat=ACCESSORIES` |
| Buses | Bus Sale | `/add-listing/bus?type=BUS_SALE` |
| | Bus with Contract | `/add-listing/bus?type=BUS_SALE_WITH_CONTRACT` |
| | Bus Rent | `/add-listing/bus?type=BUS_RENT` |
| | Bus Contract | `/add-listing/bus?type=BUS_CONTRACT` |
| Jobs | Job Offering | `/jobs/new?type=OFFERING` |
| | Job Hiring | `/jobs/new?type=HIRING` |
| Car Services | Maintenance | `/add-listing/service?type=MAINTENANCE` |
| | Cleaning | `/add-listing/service?type=CLEANING` |
| | Inspection | `/add-listing/service?type=INSPECTION` |
| | Bodywork | `/add-listing/service?type=BODYWORK` |
| | Towing | `/add-listing/service?type=TOWING` |
| | Modification | `/add-listing/service?type=MODIFICATION` |
| | Keys/Locks | `/add-listing/service?type=KEYS_LOCKS` |
| | Accessories Install | `/add-listing/service?type=ACCESSORIES_INSTALL` |
| Heavy Equipment | Equipment Sale | `/add-listing/equipment?type=EQUIPMENT_SALE` |
| | Equipment Rental | `/add-listing/equipment?type=EQUIPMENT_RENT` |
| | Equipment Request | `/equipment/requests/new` |
| | Operator Listing | `/add-listing/operator` |

### 13.3 Listing Normalizer Map (`features/listings/config/categories.config.ts`)

Each category has a `normalize*()` function that converts raw API data to the `UnifiedListingItem` interface:

| Category | Normalizer | Key fields extracted |
|---|---|---|
| `cars` | `normalizeCar` | listingType → badge, year/mileage/transmission → details, price/dailyPrice |
| `buses` | `normalizeBus` | busListingType → badge, withDriver, capacity/make/year → details |
| `equipment` | `normalizeEquipment` | listingType (SALE/RENT) → badge, condition, equipmentType/hoursUsed → details |
| `parts` | `normalizePart` | partCategory → primary badge, isOriginal → secondary badge, compatibleMakes/years → details |
| `services` | `normalizeService` | serviceType → badge, isHomeService → secondary badge, providerName/hours → details |
| `equipment-requests` | `normalizeEquipmentRequest` | budgetMax/Min → price, 'طلب معدة' badge |
| `operators` | `normalizeOperator` | dailyRate/hourlyRate → price, operatorType/experienceYears → badges |

### 13.4 Oman Governorates (11)

مسقط، ظفار، مسندم، البريمي، الداخلية، شمال الباطنة، جنوب الباطنة، شمال الشرقية، جنوب الشرقية، الظاهرة، الوسطى

---

## Section 14 — Backend Dependencies

### 14.1 `apps/api` Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@nestjs/core` | ^10 | NestJS core |
| `@nestjs/common` | ^10 | NestJS common |
| `@nestjs/platform-express` | ^10 | Express adapter |
| `@nestjs/jwt` | ^10 | JWT module |
| `@nestjs/passport` | ^10 | Passport integration |
| `@nestjs/throttler` | ^5 | Rate limiting |
| `@nestjs/bull` | ^10 | Bull queue |
| `@nestjs/schedule` | ^4 | Cron jobs |
| `@nestjs/event-emitter` | ^2 | In-process events |
| `@nestjs/websockets` | ^10 | WebSocket support |
| `@nestjs/platform-socket.io` | ^10 | Socket.IO |
| `@prisma/client` | ^5 | Prisma ORM client |
| `prisma` | ^5 | Prisma CLI |
| `ioredis` | ^5 | Redis client |
| `@socket.io/redis-adapter` | ^8 | Socket.IO Redis adapter |
| `bull` | ^4 | Job queues |
| `meilisearch` | ^0.40 | MeiliSearch client |
| `bcryptjs` | ^2 | Password hashing |
| `passport-jwt` | ^4 | JWT strategy |
| `passport-google-oauth20` | ^2 | Google OAuth |
| `google-auth-library` | ^9 | Google token verify |
| `@nestjs-modules/mailer` | ^2 | Email module |
| `nodemailer` | ^6 | Email sending |
| `cloudinary` | ^2 | Image upload |
| `multer` | ^1 | File upload middleware |
| `class-validator` | ^0.14 | DTO validation |
| `class-transformer` | ^0.5 | DTO transformation |
| `web-push` | ^3 | Web Push notifications |
| `rxjs` | ^7 | Reactive extensions |

### 14.2 `apps/web` Production Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 15.x | Next.js framework |
| `react` | 19.x | React |
| `react-dom` | 19.x | React DOM |
| `tailwindcss` | 4.x | CSS framework |
| `next-intl` | ^3 | i18n |
| `next-themes` | ^0.4 | Dark/light mode |
| `@tanstack/react-query` | ^5 | Data fetching |
| `socket.io-client` | ^4 | Real-time chat |
| `framer-motion` | ^11 | Animations |
| `leaflet` | ^1 | Maps |
| `react-leaflet` | ^4 | React Leaflet |
| `lucide-react` | ^0.4 | Icons |
| `@radix-ui/*` | various | Accessible UI primitives |
| `@vercel/speed-insights` | ^1 | Performance monitoring |
| `date-fns` | ^3 | Date utilities |
| `zod` | ^3 | Schema validation |
| `clsx` | ^2 | Class merging |
| `tailwind-merge` | ^2 | Tailwind class merging |

---

## Section 15 — Architecture Decisions & Notes

### 15.1 Key Architectural Patterns

- **Monorepo with Turborepo** — shared caching, parallel task execution, incremental builds
- **Prisma as ORM** — type-safe queries, migrations, schema-first with `@prisma/client`
- **Polymorphic relations** — `entityType`/`entityId` pattern used in Booking, Favorite, and Notification tables to avoid N entity-specific FKs
- **Redis for Socket.IO** — horizontal scaling via `@socket.io/redis-adapter`
- **Bull queues** — async payment webhook processing with retry/DLQ
- **EventEmitter2** — in-process event bus for cross-module notifications (e.g. listing booked → notify seller)
- **MeiliSearch** — full-text search for 5 entity types; equipment/operators still use Prisma ILIKE
- **JWT sliding window** — 15m access + 7d refresh, refresh stored hashed in DB
- **Idempotency keys** — payment endpoints accept `idempotency-key` header to prevent double-charges
- **RTL-first design** — all layouts use `dir="rtl"` by default, `dir="ltr"` only for `en` locale

### 15.2 Production Infrastructure

| Service | Platform | Notes |
|---|---|---|
| API | Railway (Nixpacks) | `caroneapi-production.up.railway.app` |
| Web | Railway | Needs service setup |
| PostgreSQL | Railway plugin or Neon | |
| Redis | Railway plugin | |
| MeiliSearch | Railway plugin | |
| Images | Cloudinary | |
| Email | Mailtrap (dev) / SMTP (prod) | |

### 15.3 Removed Features (Historical)

- **Trips module** — removed across 7 commits (cd56f78 → 17b2c69) as dead/unused. Migration file added: `20260501043400_remove_trips_service`.
- **Insurance module** — removed in commit c755d67. Stubs may remain in seed files.

### 15.4 Common Pitfalls / Gotchas

1. **`viewCount` not deduplicated** — every GET increments count; easily manipulated
2. **Reviews require no booking** — unique constraint only prevents duplicate reviews between same pair, not fake ones from strangers
3. **Equipment/Operators not in MeiliSearch** — browse uses Prisma ILIKE (slow at scale)
4. **`AUTH_LAYOUT` dead code** — `components/auth/auth-layout.tsx` has no imports; safe to delete
5. **Windows ENOENT** — web build on Windows may fail generating `500.html` (pre-existing, unrelated to code changes)
6. **Branch protection** — not yet enforced on `main`; direct pushes technically possible until configured
7. **`ListingsPageShell` save handler** — `handleSave` wired to `console.log` instead of favorites API (known TODO)
8. **Turbo remote cache** — `TURBO_TOKEN`/`TURBO_TEAM` secrets exist in CI config but not yet populated; local cache only

---

*End of SouqOne Codebase Intelligence Report — 15 Sections*
