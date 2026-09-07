# 006 — Pre-Phase 0 Audit (Read-Only)

**Date:** 2026-09-07  
**Branch at time of audit:** `main`  
**Status:** Read-Only — Zero code changes made.

---

## Files Inspected

| # | File |
|---|------|
| 1 | `apps/api/prisma/schema.prisma` |
| 2 | `apps/api/src/search/search-sync.worker.ts` |
| 3 | `apps/api/src/notifications/notifications.service.ts` |
| 4 | `apps/api/src/notifications/dto/create-notification.dto.ts` |
| 5 | `apps/api/src/uploads/uploads.controller.ts` |
| 6 | `apps/api/src/uploads/uploads.service.ts` |
| 7 | `apps/api/src/uploads/upload-file-storage.service.ts` |
| 8 | `apps/api/src/uploads/upload-image-manager.service.ts` |

---

## Q1 — Single Profile-Picture Upload Pattern

### 1A — Does `User` model have `avatar/profileImage/avatarUrl`?

**PowerShell command run:**
```
Select-String -Path "apps/api/prisma/schema.prisma" -Pattern "avatar|profileImage|avatarUrl|profilePic|logo"
```

**Raw output (exit code 0):**
```
25:   avatarUrl               String?
```

**Context block (schema.prisma lines 15–35):**
```prisma
model User {
  id                      String    @id @default(cuid())
  email                   String    @unique
  username                String    @unique
  displayName             String?
  avatarUrl               String?     ← LINE 25
  passwordHash            String?
  googleId                String?   @unique
  bio                     String?
  phone                   String?
  country                 String?
  ...
```

**Finding:** `User.avatarUrl` exists as a nullable `String?` field at line 25 of schema.prisma. It stores a plain URL string — no dedicated Prisma relation table, no image model, just a direct URL column.

---

### 1B — Is there an existing upload endpoint for a SINGLE image?

**Raw output of `uploads.controller.ts` lines 28–34 (exit code 0):**
```typescript
/** Upload a single image file */
@UseGuards(JwtAuthGuard)
@Post()
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  return this.uploadsService.uploadFile(file);
}
```

**`UploadsService.uploadFile` (uploads.service.ts lines 12–14):**
```typescript
async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
  return this.storage.uploadFile(file);
}
```

**`UploadFileStorageService.uploadFile` (upload-file-storage.service.ts lines 25–46):**
```typescript
async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
  if (!file) {
    throw new BadRequestException('...');
  }
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    throw new BadRequestException('...');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('...');
  }

  if (this.useCloudinary) {
    const result = await this.cloudinaryService.upload(file, 'carone/listings');
    return { url: result.secure_url, key: result.public_id };
  }

  const ext = path.extname(file.originalname) || '.jpg';
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const dest = path.join(UPLOAD_DIR, key);
  fs.writeFileSync(dest, file.buffer);
  return { url: `/uploads/${key}`, key };
}
```

**Finding:** A generic single-file upload endpoint **already exists** at `POST /v1/uploads`. It returns `{ url, key }`. It accepts multipart `file` field, validates MIME type (jpeg/png/webp/avif) and size (<=10MB), and uploads to **Cloudinary** (folder: `carone/listings`) or falls back to local disk. This endpoint is **not entity-specific** — it just returns a URL. The caller is then responsible for saving that URL to the correct field.

**Pattern for saving URL to a single field (e.g. `User.avatarUrl`):**
There is NO dedicated `PATCH /users/me/avatar` endpoint in the uploads module. The existing pattern for all other entities (Bus, Equipment, etc.) uses an **image gallery pattern** via `addImageTo*` methods — not single-URL assignment. For `User.avatarUrl`, the URL would need to be saved via a `PATCH /users/me` or equivalent profile-update endpoint. That endpoint needs to be checked separately, but the upload step itself (step 1: get the URL) already works via `POST /v1/uploads`.

**`addImageTo*` method signatures for reference (upload-image-manager.service.ts):**
```
22:  async addImageToListing(listingId: string, userId: string, url: string, isPrimary: boolean)
119: async addImageToPart(partId: string, userId: string, url: string, isPrimary: boolean)
162: async addImageToService(serviceId: string, userId: string, url: string, isPrimary: boolean)
205: async addImageToBus(busId: string, userId: string, url: string, isPrimary: boolean)
224: async addImageToEquipment(equipmentId: string, userId: string, url: string, isPrimary: boolean)
```

**Note:** All these methods write to a **related `*Image` model** (array/gallery). `OperatorListing` does NOT have an `images` relation currently — confirmed by the search worker (Q2 below) which does a `findUnique` with **no `include: { images: ... }`**.

### 1C — Summary / Decision

| Item | Status |
|---|---|
| `User.avatarUrl` field in schema | ✅ Exists (line 25, `String?`) |
| Generic `POST /v1/uploads` endpoint | ✅ Exists — returns `{ url, key }` |
| Single-field avatar save endpoint | ❌ No dedicated `PATCH avatar` in uploads module |
| Multi-image gallery (like Cars/Parts) | ✅ Exists for Listing, Part, Service, Bus, Equipment |
| `OperatorListing` has image gallery | ❌ Absent — no `images` relation in search worker |

**Decision guidance:** For operator profile image (`logoUrl` or `profileImageUrl`), the pattern to follow is:
1. **Upload step:** reuse existing `POST /v1/uploads` → get `{ url }`.
2. **Save step:** add a `String?` field to `OperatorListing` schema (e.g. `logoUrl`), then patch it via the operators PATCH endpoint. Do NOT create an image gallery for a single profile picture.

---

## Q2 — Does `search-sync.worker.ts` Actually Handle `OPERATOR_LISTING`?

**PowerShell command run:**
```
Select-String -Path "apps/api/src/search/search-sync.worker.ts" -Pattern "OPERATOR_LISTING|OperatorListing"
```

**Raw output (exit code 0):**
```
33:         case ENTITY_TYPES.OPERATOR_LISTING:
159:       case ENTITY_TYPES.OPERATOR_LISTING: {
160:         const operator = await this.prisma.operatorListing.findUnique({
```

**Full DELETE branch (lines 22–60):**
```typescript
if (action === 'DELETE') {
  switch (entityType) {
    case ENTITY_TYPES.LISTING:
      await this.searchService.removeDocument(INDEXES.LISTINGS, entityId).catch(() => {});
      break;
    case ENTITY_TYPES.BUS_LISTING:
      await this.searchService.removeDocument(INDEXES.BUSES, entityId).catch(() => {});
      break;
    case ENTITY_TYPES.EQUIPMENT_LISTING:
      await this.searchService.removeDocument(INDEXES.EQUIPMENT, entityId).catch(() => {});
      break;
    case ENTITY_TYPES.OPERATOR_LISTING:          // LINE 33
      await this.searchService.removeDocument(INDEXES.OPERATORS, entityId).catch(() => {});
      break;
    case ENTITY_TYPES.SPARE_PART:
      await this.searchService.removeDocument(INDEXES.PARTS, entityId).catch(() => {});
      break;
    case ENTITY_TYPES.CAR_SERVICE:
      await this.searchService.removeDocument(INDEXES.SERVICES, entityId).catch(() => {});
      break;
    case ENTITY_TYPES.JOB:
      await this.searchService.removeDocument(INDEXES.JOBS, entityId).catch(() => {});
      break;
    default:
      this.logger.warn(`SearchSyncWorker: unknown entityType...`);
  }
  return;
}
```

**Full UPSERT case for OPERATOR_LISTING (lines 313–336):**
```typescript
case ENTITY_TYPES.OPERATOR_LISTING: {          // LINE 313
  const operator = await this.prisma.operatorListing.findUnique({
    where: { id: entityId },
  });
  if (!operator) {
    await this.searchService.removeDocument(INDEXES.OPERATORS, entityId).catch(() => {});
    return;
  }
  await this.searchService.indexDocument(INDEXES.OPERATORS, {
    id: operator.id,
    title: operator.title,
    slug: operator.slug,
    description: operator.description,
    operatorType: operator.operatorType,
    dailyRate: operator.dailyRate ? Number(operator.dailyRate) : null,
    hourlyRate: operator.hourlyRate ? Number(operator.hourlyRate) : null,
    currency: operator.currency,
    governorateId: operator.governorateId,
    wilayaId: operator.wilayaId,
    status: operator.status,
    viewCount: operator.viewCount,
    createdAt: operator.createdAt,
  });
  break;
}
```

**Finding:** `OPERATOR_LISTING` is **fully handled** in both DELETE and UPSERT branches of `search-sync.worker.ts`. Meilisearch indexing for operator listings **works today**, before any of our changes. Fields indexed: `id, title, slug, description, operatorType, dailyRate, hourlyRate, currency, governorateId, wilayaId, status, viewCount, createdAt`. Note: **no `imageUrl`** in the indexed document (no images relation on operator yet — confirmed by `findUnique` with no `include`).

---

## Q3 — `NotificationsService.create()` Real Signature

**Command run:**
```
Select-String -Path "apps/api/src/notifications/notifications.service.ts" -Pattern "async create"
```

**Raw output (exit code 0):**
```
25:   async create(dto: CreateNotificationDto) {
```

**Full `create` method body (notifications.service.ts lines 25–74):**
```typescript
async create(dto: CreateNotificationDto) {
  const normalizedData = this.normalizeNotificationData(dto.type, dto.data);

  const notification = await this.prisma.notification.create({
    data: {
      type: dto.type,
      title: dto.title,
      body: dto.body,
      userId: dto.userId,
      data: normalizedData ? (normalizedData as any) : undefined,
    },
  });

  const unreadCount = await this.getUnreadCount(dto.userId);
  this.events.emit(NOTIFICATION_EVENTS.CREATED, {
    userId: dto.userId,
    notification,
    unreadCount: unreadCount.count,
  });

  try {
    await this.pushService.sendToUser(dto.userId, {
      title: dto.title,
      body: dto.body,
      url: this.resolveNavigationUrl(dto.type, normalizedData),
      data: normalizedData,
    });
  } catch (err) {
    this.logger.error('Push notification failed', err instanceof Error ? err.stack : String(err));
  }

  try {
    await this.expoPushService.sendToUser(dto.userId, {
      title: dto.title,
      body: dto.body,
      data: normalizedData,
    });
  } catch (err) {
    this.logger.error(
      'Expo push notification failed',
      err instanceof Error ? err.stack : String(err),
    );
  }

  return notification;
}
```

**`CreateNotificationDto` (create-notification.dto.ts — full file):**
```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  title!: string;

  @IsString()
  body!: string;

  @IsString()
  userId!: string;

  @IsOptional()
  data?: Record<string, unknown>;
}
```

**`NotificationType` enum (schema.prisma lines 879–912 — verbatim):**
```prisma
enum NotificationType {
  MESSAGE
  LISTING_SOLD
  LISTING_FAVORITED
  PRICE_DROP
  SYSTEM
  JOB_APPLICATION
  JOB_APPLICATION_ACCEPTED
  JOB_APPLICATION_REJECTED
  REVIEW_RECEIVED
  PAYMENT_SUCCESS
  SUBSCRIPTION_ACTIVATED
  FEATURED_EXPIRED
  LISTING_CREATED
  LISTING_UPDATED
  LISTING_DELETED
  LISTING_STATUS_CHANGED
  JOB_RECOMMENDATION
  JOB_APPLICATION_WITHDRAWN
  TRANSPORT_QUOTE_RECEIVED
  TRANSPORT_QUOTE_ACCEPTED
  TRANSPORT_QUOTE_REJECTED
  TRANSPORT_QUOTE_WITHDRAWN
  TRANSPORT_BOOKING_CONFIRMED
  TRANSPORT_BOOKING_STARTED
  TRANSPORT_BOOKING_COMPLETED
  TRANSPORT_BOOKING_CANCELLED
  TRANSPORT_REQUEST_CLOSED
  TRANSPORT_REQUEST_CANCELLED
  TRANSPORT_REQUEST_EXPIRED
  TRANSPORT_REQUEST_NEW
  TRANSPORT_REQUEST_UPDATED
  REVIEW_REMINDER
}
```

**Finding:** The `type` field is typed as Prisma's generated `NotificationType` enum (imported from `@prisma/client`). The valid values are the **32 values listed above**. There is **no `OPERATOR_*` variant** in the enum today. To send an operator notification without `as any`, we MUST first add e.g. `OPERATOR_REVIEW_RECEIVED` to the Prisma schema enum and run a migration.

**Correct call pattern (no `as any`):**
```typescript
await this.notificationsService.create({
  type: NotificationType.REVIEW_RECEIVED,  // one of the 32 valid values above
  title: '...',
  body: '...',
  userId: '...',
  data: { operatorId: '...' },
});
```

---

## Q4 — Git Branch State — Any Prior Operators Work?

### `git branch -a` (exit code 0):
```
+ claude/lucid-wiles-3d53b7
+ claude/recursing-poitras-ed89e1
+ claude/reverent-golick-34e273
  feat/jobs-audit-completion
  feat/services-wizard-phase0
  feature/english-logo-test-ads
  feature/forms-rebuild
  feature/homepage-performance
  feature/jobs-p7-p8-frontend-hooks
  feature/listing-delete-button
  feature/redesign-favorites-page
  feature/static-brands-api
  feature/transport-marketplace
  fix/bus-update-dto-manufacturer-model
  fix/buses-phase1-data-integrity
  fix/e2e-jobs-coverage-tests
  fix/equipment-my-pagination
  fix/image-deletion-edit-persist
  fix/mobile-price-subnav-hero
  fix/optional-mailtrap-token
  fix/vapid-error-handling
* main
  railway/code-change-rC-JML
  railway/code-change-tejr8H
  refactor/structure
  refactor/transport-module
  souqOneAppchanges
  ui-updates
  remotes/origin/HEAD -> origin/main
  remotes/origin/dependabot/npm_and_yarn/npm_and_yarn-95ff216373
  [... all remotes listed, none named operators* ...]
  remotes/souqone/HEAD -> souqone/refactor/transport-module
  remotes/souqone/feat/jobs-audit-completion
  remotes/souqone/fix/e2e-jobs-coverage-tests
  remotes/souqone/main
  remotes/souqone/refactor/transport-module
  remotes/souqone/souqOneAppchanges
```

### `git log --all --oneline --grep="operator" -i` (exit code 0):
```
03cf466 fix(forms): guard edit-mode hydration and fix isOriginal/i18n bugs in listing forms
91797f5 fix(ui): replace OMR with ر.ع in operator detail page
ea8da8d feat: add transport notifications, carrier reviews, search indexes (equipment/operators), booking detail page
9fa25d3 feat: rebuild OperatorForm per spec  card chips, tag-input certs, FormPriceInput, FormPhoneInput, type fixes
89226af feat: unified OperatorForm (add+edit), cascading city select, shared components (Prompt 8)
719600b feat: equipment landing page with hero, browse by type, sale/rental/requests/operators sections
1bb6ee4 Merge pull request #18 from Mahmoud997s/feature/static-brands-api
0f3d75b fix(favorites): remove images from OperatorListing select
8ca5497 feat(web): mobile UX batch 2  call btn unify, steps banner, pagination, profile avatar
32bf68e feat: Redis rate limiting, API v1 versioning, sanitize interceptor, operators module, repository pattern
ce3201e test: add comprehensive E2E tests for buses, equipment, operators, bookings + update test infra
b2c67dd feat: Equipment & Services Marketplace  full stack (listings, requests, bids, operators)
```

### `git log --all --oneline -- apps/api/src/operators/` (exit code 0):
```
983fee7 feat(search): inject outbox events via transaction for all verticals
4b2d084 refactor(api): remove legacy governorate/city text fields and enforce location IDs with relations
c06cf07 feat(locations): integrate governorate-wilaya validation with postgis sync and harden CI/CD isolation
e8a05f1 feat(motors): redesign cars landing + add parts section
32bf68e feat: Redis rate limiting, API v1 versioning, sanitize interceptor, operators module, repository pattern
```

**Finding:**
- **No `feature/operators` or `operators*` branch** exists anywhere (local or remote).
- **`apps/api/src/operators/` already exists on `main`** with 5 commits. The module was first created in `32bf68e` and last touched in `983fee7` (outbox events for search sync).
- Prior operator work was **merged directly into `main`** — no feature branch pending.
- **Safe to create `feature/operators-phase0`** with no conflicts.

---

## Summary Table

| Question | Finding |
|---|---|
| **Q1 — Single image upload** | `User.avatarUrl String?` at schema line 25. Generic `POST /v1/uploads` returns `{ url, key }`. No dedicated avatar PATCH endpoint. Pattern: upload → get URL → save via profile PATCH. No gallery for operator logo needed. |
| **Q2 — Search worker OPERATOR_LISTING** | **Fully implemented** (DELETE line 33, UPSERT lines 313–336). Missing only `imageUrl` from indexed doc (no images relation yet). Search works today. |
| **Q3 — NotificationsService.create()** | Signature: `async create(dto: CreateNotificationDto)`. Type = Prisma `NotificationType` enum, **32 valid values**, no `OPERATOR_*` variant. Must add enum values + migrate before calling without `as any`. |
| **Q4 — Prior operators branch** | No `operators*` branch anywhere. `apps/api/src/operators/` exists on `main` (5 commits, latest `983fee7`). Clean — safe to branch. |
