# Agent Prompt — Fix Chat Critical Bugs (Frontend / Next.js)

---

## Context

SouqOne marketplace — Next.js 15 App Router + TypeScript.
3 critical chat bugs in the frontend identified by audit.

---

## Files to Edit

```
apps/web/src/features/rental/components/rental-detail-client.tsx
apps/web/src/app/[locale]/requests/[id]/page.tsx
apps/web/src/app/[locale]/operators/[id]/page.tsx
apps/web/src/features/chat/components/conversations-sidebar.tsx
```

---

## Read These Files First

```
apps/web/src/features/rental/components/rental-detail-client.tsx
apps/web/src/app/[locale]/requests/[id]/page.tsx
apps/web/src/app/[locale]/operators/[id]/page.tsx
apps/web/src/features/chat/components/conversations-sidebar.tsx
apps/web/src/features/sale/components/sale-page-shell.tsx   ← reference implementation
apps/web/src/app/[locale]/jobs/[id]/job-detail-client.tsx   ← reference implementation
```

Study `sale-page-shell.tsx` and `job-detail-client.tsx` carefully.
They are the **correct reference** for how chat is triggered.
Copy the exact same pattern for each fix below.

---

## Fix 1 — Add chat button to Rental Detail Page

### File: `rental-detail-client.tsx`

**Problem:** Zero chat integration. Users cannot message sellers from rental listings.

**Step 1 — Add the hook** (same as sale-page-shell.tsx):
```ts
import { useCreateConversation } from '@/lib/api'
import { useRouter } from '@/i18n/navigation'

// Inside component:
const createConversation = useCreateConversation()
const router = useRouter()
```

**Step 2 — Add the handler** (same pattern as sale-page-shell.tsx):
```ts
async function handleContactSeller() {
  if (!listing?.id) return
  try {
    const conv = await createConversation.mutateAsync({
      entityId: listing.id,
      entityType: 'LISTING',   // Rental listings use the same LISTING type
    })
    router.push(`/messages/${conv.id}`)
  } catch (err) {
    // Show error toast if available, otherwise silently fail
    console.error('Failed to create conversation', err)
  }
}
```

**Step 3 — Add the button** in the CTA / price card area.
Find where the booking button is rendered and add the chat button alongside it.
Follow the exact same button style used in `sale-page-shell.tsx`:

```tsx
<button
  onClick={handleContactSeller}
  disabled={createConversation.isPending}
  className="w-full h-11 rounded-xl border border-outline-variant/25 text-[13px] font-medium text-on-surface
             flex items-center justify-center gap-2 hover:bg-surface-container hover:border-outline-variant/40
             transition-all disabled:opacity-50"
>
  {createConversation.isPending
    ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
    : <span className="material-symbols-outlined text-base">chat</span>
  }
  تواصل مع المؤجر
</button>
```

**Note:** If there is a mobile sticky CTA bar at the bottom of the rental page,
add the chat button there too — check the file before deciding placement.

---

## Fix 2 — Fix wrong navigation route in Equipment Request page

### File: `apps/web/src/app/[locale]/requests/[id]/page.tsx`

**Problem:** After creating a conversation, the page navigates to `/chat/${conv.id}`
which does not exist. Should be `/messages/${conv.id}`.

**Find** (audit found this at line 88):
```ts
router.push(`/chat/${conv.id}`)
```

**Replace with:**
```ts
router.push(`/messages/${conv.id}`)
```

There may be only one occurrence. Verify with:
```bash
grep -n "router.push.*chat" apps/web/src/app/[locale]/requests/[id]/page.tsx
```

Fix every occurrence found.

---

## Fix 3 — Fix wrong navigation route in Operator Listing page

### File: `apps/web/src/app/[locale]/operators/[id]/page.tsx`

**Problem:** Same wrong route as Fix 2.
Audit found this at line 44.

**Find:**
```ts
router.push(`/chat/${conv.id}`)
```

**Replace with:**
```ts
router.push(`/messages/${conv.id}`)
```

Verify with:
```bash
grep -n "router.push.*chat" apps/web/src/app/[locale]/operators/[id]/page.tsx
```

Fix every occurrence found.

---

## Fix 4 — Add missing entity label keys in Conversations Sidebar

### File: `apps/web/src/features/chat/components/conversations-sidebar.tsx`

**Problem:** 4 entity types have no label mapping.
Raw enum strings like `"EQUIPMENT_LISTING"` are rendered as badge text.

**Find** the `ENTITY_KEYS` object (audit found it at lines 14–19):
```ts
const ENTITY_KEYS: Record<string, string> = {
  LISTING: 'entityListing',
  SPARE_PART: 'entitySparePart',
  CAR_SERVICE: 'entityCarService',
  JOB: 'entityJob',
};
```

**Replace with:**
```ts
const ENTITY_KEYS: Record<string, string> = {
  LISTING:            'entityListing',
  BUS_LISTING:        'entityBusListing',
  SPARE_PART:         'entitySparePart',
  CAR_SERVICE:        'entityCarService',
  TRANSPORT:          'entityTransport',
  JOB:                'entityJob',
  EQUIPMENT_LISTING:  'entityEquipmentListing',
  EQUIPMENT_REQUEST:  'entityEquipmentRequest',
  OPERATOR_LISTING:   'entityOperatorListing',
};
```

**Then add the missing i18n keys** to both translation files:

### `apps/web/src/messages/ar.json`

Find the `"pages"` section and add inside it:
```json
"entityBusListing": "حافلة",
"entityTransport": "نقل",
"entityEquipmentListing": "معدة",
"entityEquipmentRequest": "طلب معدة",
"entityOperatorListing": "مشغّل"
```

### `apps/web/src/messages/en.json`

Find the `"pages"` section and add inside it:
```json
"entityBusListing": "Bus",
"entityTransport": "Transport",
"entityEquipmentListing": "Equipment",
"entityEquipmentRequest": "Equipment Request",
"entityOperatorListing": "Operator"
```

---

## Validation

```bash
cd apps/web
npx tsc --noEmit
npx eslint src/features/rental/components/rental-detail-client.tsx \
           src/app/[locale]/requests/[id]/page.tsx \
           src/app/[locale]/operators/[id]/page.tsx \
           src/features/chat/components/conversations-sidebar.tsx \
           --max-warnings 0
```

Manual test checklist:
```
□ Rental detail page → "تواصل مع المؤجر" button visible
□ Rental detail page → clicking button → navigates to /messages/[id]
□ Equipment Request page → clicking chat → navigates to /messages/[id] (not /chat/)
□ Operator page → clicking chat → navigates to /messages/[id] (not /chat/)
□ Conversations sidebar → entity badges show Arabic labels (not raw enum strings)
□ All 9 entity types show correct Arabic label in sidebar badge
```

---

## Commit Messages

```bash
# Fix 1
git commit -m "fix(chat): add contact seller button to rental detail page"

# Fix 2 + 3
git commit -m "fix(chat): correct navigation route from /chat/ to /messages/"

# Fix 4
git commit -m "fix(chat): add missing entity type labels in conversations sidebar"
```

---

## Hard Rules

- ❌ Do NOT change the chat hook implementation (`useCreateConversation`)
- ❌ Do NOT change the conversation sidebar layout — only `ENTITY_KEYS` object
- ❌ Do NOT use `/chat/` route anywhere — always `/messages/`
- ❌ Do NOT hardcode Arabic strings — use i18n keys
- ❌ Do NOT add the chat button before reading where the booking button is placed
- ✅ Copy the exact button style from `sale-page-shell.tsx` for consistency
- ✅ Add i18n keys to BOTH `ar.json` and `en.json`
- ✅ Run tsc + eslint after all 4 fixes
