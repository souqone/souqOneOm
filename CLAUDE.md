\# CLAUDE.md — Souq One Marketplace



> هذا الملف يشرح هيكل المشروع وقواعد العمل للـ AI Assistant.

> ضعه في `C:\\Users\\DELL\\Desktop\\m\\CLAUDE.md`



\---



\## 1. نظرة عامة



\*\*Souq One\*\* — منصة Marketplace متكاملة للسوق العربي تشمل:

\- بيع وإيجار السيارات والمركبات

\- المعدات الثقيلة والمشغلين

\- قطع الغيار والخدمات

\- الوظائف وتوظيف السائقين

\- الأتوبيسات والرحلات



\---



\## 2. Tech Stack



| Layer | Technology |

|-------|-----------|

| Monorepo | Turborepo |

| Backend | NestJS + TypeScript |

| Frontend | Next.js 14 (App Router) |

| Database | PostgreSQL + Prisma ORM |

| Cache | Redis |

| Search | MeiliSearch |

| Images | Cloudinary |

| Payments | Thawani |

| Real-time | Socket.io |

| i18n | next-intl (AR + EN) |

| UI | Tailwind CSS + Radix UI |

| Testing | Jest + Playwright |



\---



\## 3. هيكل المشروع



```

m/                              ← Root (Turborepo)

├── apps/

│   ├── api/                    ← NestJS Backend

│   │   ├── src/                ← Source code الأساسي

│   │   ├── prisma/             ← Database schema وseeds

│   │   │   ├── schema.prisma

│   │   │   ├── seed.ts         ← Entry point للـ seeding

│   │   │   ├── seeds/

│   │   │   │   ├── dev/        ← Test data فقط

│   │   │   │   └── prod/       ← Production data

│   │   │   ├── scripts/        ← DB maintenance scripts

│   │   │   └── migrations/

│   │   ├── scripts/

│   │   │   ├── python/         ← Data generation scripts

│   │   │   └── ts/             ← Utility scripts (find-user, check-listings...)

│   │   └── data/

│   │       ├── raw/            ← NHTSA raw data

│   │       └── processed/      ← Car datasets (313 brands, arabic...)

│   └── web/                    ← Next.js Frontend

│       └── src/

│           ├── app/\[locale]/   ← Pages (AR/EN routing)

│           ├── components/     ← Shared components

│           ├── features/       ← Feature modules

│           ├── lib/api/        ← API clients

│           ├── providers/      ← React Context providers

│           ├── hooks/          ← Custom hooks

│           └── messages/       ← i18n translations (ar.json, en.json)

├── packages/

│   ├── types/                  ← Shared TypeScript types

│   ├── ui/                     ← Shared UI components

│   └── config/                 ← Shared ESLint/TS configs

├── docs/                       ← Audit reports

└── scripts/                    ← Root-level scripts

```



\---



\## 4. Backend Modules (apps/api/src/)



كل module يتبع نفس الـ pattern:



```

module-name/

├── module-name.module.ts

├── module-name.controller.ts

├── module-name.service.ts

└── dto/

&#x20;   ├── create-\*.dto.ts

&#x20;   ├── update-\*.dto.ts

&#x20;   └── query-\*.dto.ts

```



\### الـ Modules الموجودة:



| Module | الوظيفة |

|--------|---------|

| `auth` | JWT + Google OAuth + Email verification |

| `users` | User profiles |

| `listings` | Generic listings (base) |

| `cars` | Car brands, models, listings |

| `buses` | Bus listings + offers |

| `equipment` | Heavy equipment + bids + requests |

| `operators` | Equipment operators |

| `parts` | Car parts listings |

| `services` | Car services |

| `transport` | Transport listings |

| `trips` | Trip listings |

| `jobs` | Jobs + driver profiles + employer profiles |

| `bookings` | Rental bookings + pricing |

| `payments` | Thawani payment gateway |

| `chat` | Real-time messaging (Socket.io) |

| `notifications` | Push notifications |

| `favorites` | User favorites |

| `reviews` | Ratings and reviews |

| `search` | MeiliSearch integration |

| `uploads` | Cloudinary image upload |

| `mail` | Email service |

| `redis` | Cache service |



\### Common Utilities (src/common/):

\- `decorators/` — `@CurrentUser()`, `@Roles()`

\- `guards/` — `RolesGuard`, `AdminApiKeyGuard`

\- `interceptors/` — `SanitizeInterceptor`, `NormalizeImagesInterceptor`

\- `filters/` — `HttpExceptionFilter`

\- `services/` — `BaseListingService` (مشترك بين الـ listing modules)

\- `events/` — Listing events

\- `adapters/` — Redis Socket.io adapter



\---



\## 5. Frontend Features (apps/web/src/features/)



```

features/

├── ads/        ← إضافة وتعديل الإعلانات (forms)

├── chat/       ← نظام المحادثات

├── home/       ← الصفحة الرئيسية (hero, sections...)

├── listings/   ← عرض وفلترة الإعلانات

├── rental/     ← تفاصيل الإيجار + الحجز

└── sale/       ← تفاصيل البيع

```



\### قاعدة مهمة في الـ Frontend:

كل feature فيها:

```

feature/

├── index.ts          ← Public exports فقط

├── components/       ← UI components

├── hooks/            ← Custom hooks

├── types/            ← TypeScript types

├── config/           ← Configuration

└── utils/            ← Helper functions

```



\---



\## 6. قواعد مهمة عند الكتابة



\### Backend:

\- استخدم `PrismaService` مش `EntityManager`

\- الـ DTOs دايماً تستخدم `class-validator`

\- الـ Responses دايماً `{ data, meta }` للـ pagination

\- الـ Guards ترتيبها: `JwtAuthGuard` → `RolesGuard`

\- لا تعمل business logic في الـ Controller

\- الـ `BaseListingService` للـ CRUD المشترك



\### Frontend:

\- الـ API calls كلها في `src/lib/api/`

\- استخدم `useQuery` من TanStack Query

\- الـ i18n عن طريق `useTranslations()` من next-intl

\- الـ Images عن طريق `next/image` + Cloudinary URLs

\- RTL/LTR تلقائي حسب الـ locale



\### عام:

\- لا تعمل `console.log` في الـ production code

\- الـ environment variables في `.env` مش hardcoded

\- الـ Types المشتركة في `packages/types/src/`



\---



\## 7. الـ Environment Variables المهمة



```bash

\# apps/api/.env

DATABASE\_URL=

REDIS\_URL=

JWT\_SECRET=

CLOUDINARY\_\*=

THAWANI\_\*=

MEILI\_\*=

VAPID\_\*=



\# apps/web/.env.local

NEXT\_PUBLIC\_API\_URL=

NEXT\_PUBLIC\_MEILI\_\*=

```



\---



\## 8. أوامر مهمة



```bash

\# تشغيل المشروع

turbo dev



\# Backend فقط

cd apps/api \&\& npm run start:dev



\# Frontend فقط

cd apps/web \&\& npm run dev



\# Database

cd apps/api

npx prisma migrate dev     # migration جديد

npx prisma studio          # GUI للـ DB

npx prisma db seed         # تشغيل الـ seed



\# Build

turbo build

```



\---



\## 9. الـ Payment Flow



```

User → PaymentsController → ThawaniService → Webhook

&#x20;                                             ↓

&#x20;                                  PaymentWebhookProcessor

&#x20;                                             ↓

&#x20;                                  PaymentActivationService

&#x20;                                             ↓

&#x20;                                  Listing Activated

```



\---



\## 10. الـ Auth Flow



```

Register → Email Verification → JWT Token

Google OAuth → JWT Token

JWT → JwtStrategy → @CurrentUser() decorator

Refresh Token → AuthTokenService

```



\---



\## 11. ملاحظات على الـ Structure



\- `operators` module موجود في مكانين: `src/operators/` و`src/equipment/` — الأصح استخدام `src/operators/` للـ standalone operators

\- الـ `dist/` folder لا تعدل عليه يدوياً

\- الـ `scripts/ts/` في api مش مربوطة بـ NestJS، بتشتغل بـ `ts-node` مباشرة



\---



\## 12. عند طلب مساعدة من AI



اذكر دايماً:

1\. \*\*الـ Module\*\* اللي بتشتغل عليه

2\. \*\*Backend أو Frontend\*\*

3\. \*\*الـ Error\*\* كاملاً لو موجود

4\. \*\*الـ Expected behavior\*\*



مثال جيد:

> "في backend module jobs، عايز أضيف endpoint جديد لـ job recommendations، الـ service موجودة في job-recommendation.service.ts"

