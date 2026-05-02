# Agent Prompt — Fix Chat Critical Bugs (Backend / NestJS)

---

## Context

SouqOne marketplace — NestJS 10 + Prisma 6.
Chat module: `apps/api/src/chat/`

**One critical bug to fix in the backend:**
`BUS_LISTING` entity type is sent from the frontend but is not registered
in the backend's allowed entity types. Every attempt to start a chat from
a bus listing returns `400 نوع الكيان غير صالح`.

---

## Files to Edit

```
apps/api/src/chat/dto/create-conversation.dto.ts
apps/api/src/chat/chat.service.ts
```

---

## Read These Files First

Before editing, read:
```
apps/api/src/chat/dto/create-conversation.dto.ts
apps/api/src/chat/chat.service.ts
apps/api/src/buses/buses.service.ts     ← to find the correct Prisma model name
apps/api/prisma/schema.prisma           ← to confirm BusListing model fields
```

---

## Fix 1 — Add `BUS_LISTING` to allowed entity types

### File: `apps/api/src/chat/dto/create-conversation.dto.ts`

**Find** the `ENTITY_TYPES` array (or `@IsEnum` / `@IsIn` decorator).
It currently looks like this:

```ts
export const ENTITY_TYPES = [
  'LISTING',
  'SPARE_PART',
  'CAR_SERVICE',
  'TRANSPORT',
  'JOB',
  'EQUIPMENT_LISTING',
  'EQUIPMENT_REQUEST',
  'OPERATOR_LISTING',
] as const;
```

**Add** `'BUS_LISTING'` to the array:

```ts
export const ENTITY_TYPES = [
  'LISTING',
  'BUS_LISTING',       // ← ADD THIS
  'SPARE_PART',
  'CAR_SERVICE',
  'TRANSPORT',
  'JOB',
  'EQUIPMENT_LISTING',
  'EQUIPMENT_REQUEST',
  'OPERATOR_LISTING',
] as const;
```

---

## Fix 2 — Add `BUS_LISTING` case to `resolveEntityOwner`

### File: `apps/api/src/chat/chat.service.ts`

**Find** the `resolveEntityOwner` method.
It has a `switch` statement with cases for each entity type.

**Add** a `case 'BUS_LISTING':` block.
Before adding, read `apps/api/prisma/schema.prisma` to confirm:
- The Prisma model name for bus listings (likely `BusListing`)
- The field that holds the seller/owner ID (likely `userId` or `sellerId`)

Then add the case following the exact same pattern as the existing cases:

```ts
case 'BUS_LISTING': {
  const bus = await this.prisma.busListing.findUnique({
    where: { id: entityId },
    select: { userId: true },   // ← verify field name from schema
  });
  if (!bus) throw new NotFoundException('الحافلة غير موجودة');
  return bus.userId;             // ← verify field name from schema
}
```

**Important:** Verify the exact field name from `schema.prisma` before writing.
Do NOT assume it is `userId` — check first.

---

## Fix 3 — Add `BUS_LISTING` case to `resolveEntityTitle`

### File: `apps/api/src/chat/chat.service.ts`

**Find** the `resolveEntityTitle` method (or equivalent).
It resolves a human-readable title for the conversation header.

**Add** a `case 'BUS_LISTING':` block following the same pattern:

```ts
case 'BUS_LISTING': {
  const bus = await this.prisma.busListing.findUnique({
    where: { id: entityId },
    select: { title: true },   // ← verify field name from schema
  });
  return bus?.title ?? 'حافلة';
}
```

**Verify** the title field name from `schema.prisma` before writing.

---

## Validation

```bash
cd apps/api
npx tsc --noEmit
npm test -- --testPathPattern=chat
```

Expected:
```
✅ 0 TypeScript errors
✅ Chat tests pass
```

Manual test checklist:
```
□ POST /api/v1/chat/conversations with entityType: "BUS_LISTING" → 201 (not 400)
□ POST /api/v1/chat/conversations with entityType: "LISTING" → still works
□ POST /api/v1/chat/conversations with entityType: "INVALID_TYPE" → still 400
□ Self-messaging guard still works for BUS_LISTING
```

---

## Hard Rules

- ❌ Do NOT change any other entity type
- ❌ Do NOT change the response shape of any endpoint
- ❌ Do NOT skip reading schema.prisma before writing field names
- ❌ Do NOT add `BUS_LISTING` to `ENTITY_TYPES` without also adding it to
  both `resolveEntityOwner` AND `resolveEntityTitle`
- ✅ All 3 fixes must be applied together — they are interdependent
- ✅ Run `npx tsc --noEmit` after edits
