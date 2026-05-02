# Agent Prompt — Fix Notifications Backend (NestJS + Prisma)

---

## Context

You are working on the **SouqOne** marketplace backend — NestJS 10 + Prisma 6 + PostgreSQL 16.
The notifications module is at `apps/api/src/notifications/`.

You have 4 specific fixes to apply. Read each file before editing.
Apply all fixes in one pass. Do NOT change anything not mentioned below.

---

## Files to Edit

```
apps/api/src/notifications/notifications.service.ts
apps/api/src/notifications/notifications.controller.ts
apps/api/src/notifications/push.service.ts
```

---

## Fix 1 — Add `filter` param to `findAll` in `notifications.service.ts`

**Problem:** `findAll` fetches all notifications with no way to filter unread only.
The frontend needs `?filter=unread` support.

**Find this block:**
```ts
async findAll(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const retentionDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const where = { userId, createdAt: { gt: retentionDate } };
```

**Replace with:**
```ts
async findAll(userId: string, page = 1, limit = 20, filter?: 'all' | 'unread') {
  const skip = (page - 1) * limit;
  const retentionDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const where = {
    userId,
    createdAt: { gt: retentionDate },
    ...(filter === 'unread' ? { isRead: false } : {}),
  };
```

---

## Fix 2 — Simplify `markAsRead` in `notifications.service.ts`

**Problem:** Current impl runs 2 DB queries (updateMany → findFirst).
Replace with a cleaner single-read approach.

**Find this entire method:**
```ts
async markAsRead(id: string, userId: string) {
  const result = await this.prisma.notification.updateMany({
    where: { id, userId, isRead: false },
    data: { isRead: true },
  });

  if (result.count === 0) {
    const exists = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException('الإشعار غير موجود');
  }

  return { message: 'تم تحديد الإشعار كمقروء' };
}
```

**Replace with:**
```ts
async markAsRead(id: string, userId: string) {
  const notification = await this.prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) throw new NotFoundException('الإشعار غير موجود');
  if (notification.isRead) return { message: 'تم تحديد الإشعار كمقروء' };

  await this.prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return { message: 'تم تحديد الإشعار كمقروء' };
}
```

---

## Fix 3 — Emit unread count with WebSocket event in `notifications.service.ts`

**Problem:** After creating a notification, the frontend only gets the notification object.
The unread badge count is only updated on the next poll.
Fix: include the new unread count in the emitted event.

**Find this block inside `create()`:**
```ts
// Fire event — ChatGateway listens and pushes via WebSocket
this.events.emit(NOTIFICATION_EVENTS.CREATED, {
  userId: dto.userId,
  notification,
});
```

**Replace with:**
```ts
// Fire event — ChatGateway listens and pushes via WebSocket
const unreadCount = await this.getUnreadCount(dto.userId);
this.events.emit(NOTIFICATION_EVENTS.CREATED, {
  userId: dto.userId,
  notification,
  unreadCount: unreadCount.count,
});
```

---

## Fix 4 — Add `filter` query param to controller + add `tag` to push payload

### 4a — `notifications.controller.ts`

**Problem:** Controller calls `findAll` without passing `filter` param.

**Find:**
```ts
@UseGuards(JwtAuthGuard)
@Get()
findAll(
  @CurrentUser() user: JwtPayload,
  @Query() query: PaginationQueryDto,
) {
  return this.notificationsService.findAll(user.sub, query.page ?? 1, query.limit ?? 20);
}
```

**Replace with:**
```ts
@UseGuards(JwtAuthGuard)
@Get()
findAll(
  @CurrentUser() user: JwtPayload,
  @Query() query: PaginationQueryDto,
  @Query('filter') filter?: 'all' | 'unread',
) {
  return this.notificationsService.findAll(
    user.sub,
    query.page ?? 1,
    query.limit ?? 20,
    filter,
  );
}
```

### 4b — `push.service.ts`

**Problem:** Push notifications have no `tag` — multiple notifications stack up
instead of replacing each other on the device.

**Find:**
```ts
const jsonPayload = JSON.stringify({
  title: payload.title,
  body: payload.body,
  icon: payload.icon || '/icons/icon-192x192.png',
  badge: '/icons/icon-72x72.png',
  url: payload.url || '/',
  data: payload.data,
});
```

**Replace with:**
```ts
const jsonPayload = JSON.stringify({
  title: payload.title,
  body: payload.body,
  icon: payload.icon || '/icons/icon-192x192.png',
  badge: '/icons/icon-72x72.png',
  url: payload.url || '/',
  tag: `souqone-${userId}`,
  renotify: true,
  data: payload.data,
});
```

---

## Validation

After applying all fixes, verify:

```bash
cd apps/api
npx tsc --noEmit
```

Expected: zero TypeScript errors.

If any error appears related to `filter` type — add this import at the top
of `notifications.service.ts` if not already present:
```ts
// No new imports needed — 'all' | 'unread' is an inline union type
```

---

## Hard Rules

- ❌ Do NOT change any other method or file
- ❌ Do NOT change the Prisma schema
- ❌ Do NOT add new dependencies
- ❌ Do NOT change the response shape of any endpoint
- ❌ Do NOT touch `notification.events.ts` or the DTOs
- ✅ Only edit the 3 files listed above
- ✅ Run `npx tsc --noEmit` after edits and fix any type errors
