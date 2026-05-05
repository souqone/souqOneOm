# Agent Prompt — Chat UI Rebuild (Next.js + Tailwind v4 + shadcn/ui)

---

## Context

SouqOne marketplace — Chat system UI.
The chat lives at `/messages` (sidebar) and `/messages/[id]` (chat room).
Layout is already built in `app/[locale]/messages/layout.tsx` — do NOT touch it.

You are rebuilding/improving **4 components** and **1 hook** to match the mockup.
The backend WebSocket + REST API is fully built and working.

Tech: Next.js 15 App Router, Tailwind v4, shadcn/ui, Socket.IO client,
TanStack React Query v5, next-intl, Lucide icons + Material Symbols.

**RTL-first** — `dir="rtl"` on all wrappers.
**Mobile-first** — single column default, desktop layout in `layout.tsx`.

---

## 1. Files to Edit (NOT create from scratch)

```
apps/web/src/features/chat/components/
  ├── conversations-sidebar.tsx     ← Fix entity labels + improve UI
  ├── chat-header.tsx               ← Add listing banner + all entity type links
  ├── chat-bubble.tsx               ← Improve status indicators
  └── chat-input.tsx                ← Review and align with mockup

apps/web/src/features/chat/hooks/
  └── use-chat-room.ts              ← DO NOT TOUCH (working correctly)
```

Read every file fully before editing.

---

## 2. Color System (Tailwind v4 — semantic tokens only)

```
bg-background                 ← page bg
bg-surface-container-lowest   ← card / bubble (received)
bg-surface-container-low      ← hover states
bg-surface-container-high     ← skeleton / muted
bg-primary                    ← sent bubble bg
bg-primary/8                  ← tint backgrounds
bg-primary/10                 ← icon containers

text-on-surface               ← primary text
text-on-surface-variant       ← secondary / captions
text-primary                  ← brand / links
text-on-primary               ← text on filled primary bg
text-error                    ← danger

border-outline-variant/8      ← subtle borders
border-outline-variant/15     ← default borders
border-outline-variant/30     ← hover borders
border-primary/20             ← active borders
```

---

## 3. Entity Type Config

Define ONCE at top of `conversations-sidebar.tsx` and import where needed:

```ts
// features/chat/constants/entity-config.ts  (create this file)
export const ENTITY_KEYS: Record<string, string> = {
  LISTING:            'entityListing',
  BUS_LISTING:        'entityBusListing',
  SPARE_PART:         'entitySparePart',
  CAR_SERVICE:        'entityCarService',
  TRANSPORT:          'entityTransport',
  JOB:                'entityJob',
  EQUIPMENT_LISTING:  'entityEquipmentListing',
  EQUIPMENT_REQUEST:  'entityEquipmentRequest',
  OPERATOR_LISTING:   'entityOperatorListing',
}

export const ENTITY_BADGE_COLORS: Record<string, string> = {
  LISTING:            'bg-blue-500/10 text-blue-600 border-blue-200',
  BUS_LISTING:        'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  SPARE_PART:         'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  CAR_SERVICE:        'bg-green-500/10 text-green-600 border-green-200',
  TRANSPORT:          'bg-red-500/10 text-red-600 border-red-200',
  JOB:                'bg-violet-500/10 text-violet-600 border-violet-200',
  EQUIPMENT_LISTING:  'bg-orange-500/10 text-orange-600 border-orange-200',
  EQUIPMENT_REQUEST:  'bg-pink-500/10 text-pink-600 border-pink-200',
  OPERATOR_LISTING:   'bg-teal-500/10 text-teal-600 border-teal-200',
}

export const ENTITY_NAVIGATE: Record<string, (entityId: string) => string | null> = {
  LISTING:            (id) => `/sale/car/${id}`,
  BUS_LISTING:        (id) => `/sale/bus/${id}`,
  SPARE_PART:         (id) => `/sale/part/${id}`,
  CAR_SERVICE:        (id) => `/sale/service/${id}`,
  TRANSPORT:          (id) => `/sale/transport/${id}`,
  JOB:                (id) => `/jobs/${id}`,
  EQUIPMENT_LISTING:  (id) => `/sale/equipment/${id}`,
  EQUIPMENT_REQUEST:  (id) => `/requests/${id}`,
  OPERATOR_LISTING:   (id) => `/operators/${id}`,
}
```

---

## 4. ConversationsSidebar — Full Spec

### What to keep (DO NOT change):
- All data fetching hooks (`useConversations`, `useUnreadCount`, etc.)
- WebSocket event handlers
- Search logic
- Archive / delete handlers

### What to improve:

#### 4.1 Header
```tsx
<div className="px-4 pt-4 pb-3 border-b border-outline-variant/8 sticky top-0 bg-surface-container-lowest z-10">
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <h2 className="font-semibold text-on-surface text-[16px]">{tp('sidebarTitle')}</h2>
      {unreadCount > 0 && (
        <span className="bg-primary text-on-primary text-[10px] font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
          {unreadCount}
        </span>
      )}
    </div>
    {/* New conversation button — icon only */}
    <button aria-label="محادثة جديدة"
      className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center text-primary hover:bg-primary/15 transition-all">
      <span className="material-symbols-outlined text-base">edit</span>
    </button>
  </div>

  {/* Search input */}
  <div className="relative">
    <span className="material-symbols-outlined absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-base">
      search
    </span>
    <input
      value={search} onChange={e => setSearch(e.target.value)}
      placeholder={tp('sidebarSearchPlaceholder')}
      className="w-full pe-9 ps-3 py-2.5 bg-surface-container-low rounded-xl text-[12px]
                 border border-outline-variant/10 focus:outline-none focus:ring-2
                 focus:ring-primary/15 focus:border-primary/20 transition-all
                 placeholder:text-on-surface-variant/30"
    />
  </div>
</div>
```

#### 4.2 Conversation Row
```tsx
// Each conversation item:
<button
  onClick={() => router.push(`/messages/${conv.id}`)}
  className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/[0.06]
              text-right transition-all relative group
              ${isActive ? 'bg-primary/5' : 'hover:bg-surface-container-low/60'}`}
>
  {/* Unread indicator bar — RTL: right side */}
  {conv.unreadCount > 0 && (
    <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-primary rounded-l-full" />
  )}

  {/* Avatar */}
  <div className="relative flex-shrink-0">
    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold text-base
                    text-on-primary shadow-sm flex-shrink-0
                    ${isActive
                      ? 'bg-gradient-to-br from-primary to-[#0B2447]'
                      : 'bg-gradient-to-br from-surface-container-high to-surface-container'
                    }`}>
      {/* Avatar image OR first letter fallback */}
      {otherUser?.avatarUrl
        ? <Image src={getImageUrl(otherUser.avatarUrl)} alt={otherUser.displayName} fill className="object-cover rounded-2xl" />
        : <span className={isActive ? 'text-on-primary' : 'text-on-surface-variant'}>
            {(otherUser?.displayName || otherUser?.username || '?')[0]?.toUpperCase()}
          </span>
      }
    </div>
    {/* Online dot */}
    {isOnline && (
      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
    )}
  </div>

  {/* Content */}
  <div className="flex-1 min-w-0">
    {/* Row 1: Name + Time */}
    <div className="flex items-center justify-between mb-0.5">
      <span className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'font-bold text-on-surface' : 'font-medium text-on-surface/80'}`}>
        {otherUser?.displayName || otherUser?.username}
      </span>
      <span className="text-[10px] text-on-surface-variant/50 flex-shrink-0 mr-2">
        {timeAgo(conv.lastMessageAt)}
      </span>
    </div>

    {/* Row 2: Entity badge + listing name */}
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                       ${ENTITY_BADGE_COLORS[conv.entityType] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}>
        {conv.entityType && tp(ENTITY_KEYS[conv.entityType] ?? 'notifTypeOther')}
      </span>
      {conv.entityTitle && (
        <span className="text-[10px] text-on-surface-variant/60 truncate">{conv.entityTitle}</span>
      )}
    </div>

    {/* Row 3: Last message + unread count */}
    <div className="flex items-center justify-between">
      <span className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'text-on-surface-variant font-medium' : 'text-on-surface-variant/60'}`}>
        {conv.lastMessage?.type === 'IMAGE'
          ? `📷 ${tp('sidebarImageMsg')}`
          : conv.lastMessage?.type === 'AUDIO'
          ? `🎤 ${tp('sidebarAudioMsg')}`
          : conv.lastMessage?.content ?? ''
        }
      </span>
      {conv.unreadCount > 0 && (
        <span className="flex-shrink-0 mr-2 min-w-5 h-5 bg-primary text-on-primary text-[9px] font-bold rounded-full flex items-center justify-center px-1">
          {conv.unreadCount}
        </span>
      )}
    </div>
  </div>
</button>
```

#### 4.3 All States

**Loading:**
```tsx
<div className="space-y-0">
  {[...Array(6)].map((_, i) => (
    <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/[0.06]"
      aria-hidden="true">
      <Skeleton className="w-11 h-11 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-28 rounded-full" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
        <Skeleton className="h-2.5 w-20 rounded-full" />
        <Skeleton className="h-2.5 w-3/4 rounded-full" />
      </div>
    </div>
  ))}
</div>
```

**Empty (no conversations):**
```tsx
<div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6"
  role="status">
  <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center">
    <span className="material-symbols-outlined text-on-surface-variant/30 text-3xl">chat</span>
  </div>
  <p className="text-on-surface font-semibold text-[14px]">{tp('sidebarNoConversations')}</p>
  <p className="text-on-surface-variant text-[12px]">{tp('sidebarStartConversation')}</p>
</div>
```

**Empty (search no results):**
```tsx
<div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6"
  role="status">
  <span className="material-symbols-outlined text-on-surface-variant/20 text-4xl">search_off</span>
  <p className="text-on-surface-variant text-[13px]">{tp('sidebarNoResults')}</p>
  <button onClick={() => setSearch('')}
    className="text-primary text-[12px] font-medium underline underline-offset-2">
    {tp('sidebarTryAnother')}
  </button>
</div>
```

---

## 5. ChatHeader — Full Spec

### What to keep:
- All props as-is
- Online/typing status logic
- Search toggle
- Back button

### What to improve:

#### 5.1 Main header row
```tsx
<div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/8
               bg-surface-container-lowest shadow-[0_1px_0_rgba(0,0,0,0.04)] sticky top-0 z-10">

  {/* Back button — mobile only */}
  <Link href="/messages"
    className="lg:hidden w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center
               text-on-surface-variant hover:bg-surface-container transition-all flex-shrink-0"
    aria-label="العودة">
    <span className="material-symbols-outlined text-base">chevron_right</span>
  </Link>

  {/* Avatar */}
  <div className="relative flex-shrink-0">
    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#0B2447]
                   flex items-center justify-center text-on-primary font-semibold text-base shadow-sm overflow-hidden">
      {participant?.avatarUrl
        ? <Image src={getImageUrl(participant.avatarUrl)} alt={participant.displayName} fill className="object-cover" />
        : (participant?.displayName || participant?.username || '?')[0]?.toUpperCase()
      }
    </div>
    {isOnline && (
      <div className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background" />
    )}
  </div>

  {/* Name + status */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <p className="font-semibold text-on-surface text-[14px] truncate">
        {participant?.displayName || participant?.username || tp('chatDefaultUser')}
      </p>
      {/* Entity type badge */}
      {entityType && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0
                         ${ENTITY_BADGE_COLORS[entityType] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/20'}`}>
          {tp(ENTITY_KEYS[entityType] ?? 'notifTypeOther')}
        </span>
      )}
    </div>
    <p className={`text-[11px] font-medium ${isOnline ? 'text-green-600' : 'text-on-surface-variant/50'}`}>
      {isTyping
        ? <span className="text-primary">{tp('chatTyping')}</span>
        : isOnline ? tp('chatOnline') : tp('chatOffline')
      }
    </p>
  </div>

  {/* Action buttons */}
  <div className="flex items-center gap-1 flex-shrink-0">
    <button onClick={onToggleSearch} aria-label="بحث في المحادثة"
      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                 ${searchMode ? 'bg-primary/10 text-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}`}>
      <span className="material-symbols-outlined text-base">search</span>
    </button>
    <button aria-label="المزيد"
      className="w-8 h-8 rounded-xl bg-surface-container-low flex items-center justify-center
                text-on-surface-variant hover:bg-surface-container transition-all">
      <span className="material-symbols-outlined text-base">more_vert</span>
    </button>
  </div>
</div>
```

#### 5.2 Listing Banner (below header, dismissible)

Show when `listing !== null`. Dismiss stores in local state only (not persisted).

```tsx
{listing && !bannerDismissed && (
  <div className="mx-3 mt-3 flex items-center gap-3 bg-primary/[0.04] border border-primary/10
                 rounded-2xl p-3 group/banner">

    {/* Listing thumbnail */}
    <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden flex-shrink-0">
      {listing.images?.[0]
        ? <Image src={getImageUrl(listing.images[0].url)} alt={listing.title} width={48} height={48} className="object-cover w-full h-full" />
        : <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/30 text-xl">directions_car</span>
          </div>
      }
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      {entityType && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border mb-1 inline-block
                         ${ENTITY_BADGE_COLORS[entityType] ?? ''}`}>
          {tp(ENTITY_KEYS[entityType] ?? 'notifTypeOther')}
        </span>
      )}
      <p className="text-[12px] font-semibold text-on-surface truncate">{listing.title}</p>

      {/* Navigate to listing link */}
      {entityType && listing.entityId && ENTITY_NAVIGATE[entityType]?.(listing.entityId) && (
        <Link href={ENTITY_NAVIGATE[entityType](listing.entityId)!}
          className="text-[10px] text-primary font-medium hover:underline flex items-center gap-0.5 mt-0.5">
          {tp('chatViewListing')}
          <span className="material-symbols-outlined text-xs">chevron_left</span>
        </Link>
      )}
    </div>

    {/* Dismiss */}
    <button onClick={() => setBannerDismissed(true)} aria-label="إغلاق"
      className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center
                text-on-surface-variant/40 hover:bg-surface-container-low hover:text-on-surface-variant
                transition-all flex-shrink-0">
      <span className="material-symbols-outlined text-xs">close</span>
    </button>
  </div>
)}
```

**Local state needed in ChatHeader:**
```ts
const [bannerDismissed, setBannerDismissed] = useState(false)
```

---

## 6. ChatBubble — Improve Status Indicators

### What to keep:
- All message rendering logic
- Image / audio / deleted message handling
- Reaction rendering
- Long-press / context menu

### What to improve — status indicator only:

```tsx
// Status icons — bottom of sent bubble only (isMine === true)
const STATUS_DISPLAY = {
  sending:   { icon: 'radio_button_unchecked', color: 'text-on-primary/40' },
  sent:      { icon: 'done',                  color: 'text-on-primary/60' },
  delivered: { icon: 'done_all',              color: 'text-on-primary/60' },
  read:      { icon: 'done_all',              color: 'text-primary-container' },
} as const

// Usage — below the bubble time:
{isMine && (
  <div className="flex items-center justify-start gap-1 mt-0.5 px-1">
    <span className="text-[10px] text-on-surface-variant/40">{timeDisplay}</span>
    <span className={`material-symbols-outlined text-sm leading-none ${STATUS_DISPLAY[message.status ?? 'sent'].color}`}
      style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>
      {STATUS_DISPLAY[message.status ?? 'sent'].icon}
    </span>
  </div>
)}

{!isMine && (
  <span className="text-[10px] text-on-surface-variant/40 mt-0.5 px-1 block">
    {timeDisplay}
  </span>
)}
```

**Bubble colors:**
```tsx
// Sent (isMine):
className="bg-primary text-on-primary rounded-2xl rounded-bl-sm px-3.5 py-2.5
           shadow-[0_1px_4px_rgba(0,0,0,0.08)]"

// Received (!isMine):
className="bg-surface-container-lowest text-on-surface border border-outline-variant/[0.08]
           rounded-2xl rounded-br-sm px-3.5 py-2.5
           shadow-[0_1px_4px_rgba(0,0,0,0.04)]"

// Deleted (both):
className="bg-surface-container-high/60 text-on-surface-variant/50 border border-outline-variant/10
           rounded-2xl px-3.5 py-2.5 italic text-[12px]"
```

---

## 7. ChatInput — Review Only

Read `chat-input.tsx` fully first. If it already matches:
- RTL layout ✓
- Send button visible when input has text ✓
- Voice button when empty ✓
- Attach / image button ✓

Only make changes if something is missing or broken.
If it already works correctly — do NOT touch it.

---

## 8. All Chat States to Handle

### Reconnecting banner (already exists — keep and improve style):
```tsx
{!connected && (
  <div className="bg-amber-500/90 backdrop-blur-sm text-white text-[11px] text-center py-2
                 flex items-center justify-center gap-2 font-medium">
    <WifiOff size={13} />
    <span>{tp('msgChatReconnecting')}</span>
    <Loader2 size={12} className="animate-spin" />
  </div>
)}
```

### Loading state (chat room):
```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 bg-surface-container-low/20">
  <div className="w-12 h-12 rounded-2xl bg-primary/8 flex items-center justify-center">
    <Loader2 className="animate-spin text-primary" size={24} />
  </div>
  <span className="text-[11px] text-on-surface-variant/40">{tp('msgChatLoading')}</span>
</div>
```

### Error state (chat room):
```tsx
<div className="flex-1 flex items-center justify-center bg-surface-container-low/20">
  <div className="text-center px-6">
    <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
      <WifiOff size={24} className="text-error" />
    </div>
    <p className="text-[14px] font-semibold text-on-surface mb-1">{tp('msgChatError')}</p>
    <p className="text-[11px] text-on-surface-variant/50 mb-4">{tp('msgChatErrorDesc')}</p>
    <button onClick={() => refetch()}
      className="bg-primary text-on-primary rounded-xl px-5 py-2.5 text-[12px] font-semibold
                inline-flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
      <RefreshCw size={13} />
      {tp('msgChatRetry')}
    </button>
  </div>
</div>
```

### Empty messages (new conversation):
```tsx
<div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
  <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center">
    <span className="material-symbols-outlined text-primary/25 text-3xl">chat</span>
  </div>
  <p className="text-[12px] text-on-surface-variant/40 font-medium">
    {tp('msgChatStartConversation')}
  </p>
</div>
```

---

## 9. Typing Indicator

Keep existing logic. Improve visual only:

```tsx
{isTyping && (
  <div className={`flex mb-1 px-1 ${isMine ? 'justify-start' : 'justify-end'}`}>
    <div className="bg-surface-container-lowest border border-outline-variant/[0.08]
                   rounded-2xl rounded-br-sm px-4 py-3
                   shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex gap-1">
        {[0, 150, 300].map(delay => (
          <span key={delay}
            className="w-2 h-2 bg-primary/30 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  </div>
)}
```

---

## 10. i18n Keys to Add

Add to `ar.json` and `en.json` under `"pages"`:

```json
// ar.json
"entityBusListing":       "حافلة",
"entityTransport":        "نقل",
"entityEquipmentListing": "معدة",
"entityEquipmentRequest": "طلب معدة",
"entityOperatorListing":  "مشغّل",
"chatViewListing":        "عرض الإعلان",
"chatOnline":             "متصل الآن",
"chatOffline":            "غير متصل",
"chatTyping":             "يكتب..."

// en.json
"entityBusListing":       "Bus",
"entityTransport":        "Transport",
"entityEquipmentListing": "Equipment",
"entityEquipmentRequest": "Equipment Request",
"entityOperatorListing":  "Operator",
"chatViewListing":        "View Listing",
"chatOnline":             "Online",
"chatOffline":            "Offline",
"chatTyping":             "Typing..."
```

---

## 11. Validation

```bash
cd apps/web
npx tsc --noEmit
npx eslint src/features/chat/ --max-warnings 0
```

Manual checklist:
```
□ Sidebar — all 9 entity types show correct Arabic badge label
□ Sidebar — entity listing name visible below badge
□ Sidebar — unread count badge visible + right-side blue bar
□ Sidebar — online green dot visible
□ Sidebar — avatar fallback (first letter) works
□ ChatHeader — listing banner visible with correct entity badge
□ ChatHeader — "عرض الإعلان" link navigates to correct route for each entity type
□ ChatHeader — banner dismisses on ✕ click
□ ChatBubble — sent: done / done_all gray / done_all blue (read)
□ ChatBubble — received: no status icon
□ ChatBubble — deleted: italic placeholder text
□ Typing indicator — 3 dots animate correctly
□ Reconnecting banner — shows when Socket disconnects
```

---

## Hard Rules

- ❌ Do NOT touch `use-chat-room.ts` — working correctly
- ❌ Do NOT touch `layout.tsx` — correct as-is
- ❌ Do NOT recreate ENTITY_KEYS inline — import from `constants/entity-config.ts`
- ❌ Do NOT use `gray-*` colors — semantic tokens only
- ❌ Do NOT hardcode Arabic strings — i18n keys
- ❌ Do NOT change WebSocket event names or API calls
- ✅ Create `features/chat/constants/entity-config.ts` as single source of truth
- ✅ Import ENTITY_KEYS, ENTITY_BADGE_COLORS, ENTITY_NAVIGATE from constants file
- ✅ Run tsc + eslint after all changes
