# SouqOne — Project Handoff Document

> سوق وان — أكبر سوق إلكتروني للمركبات والمعدات في سلطنة عُمان  
> Last updated: May 2026

---

## 1. Project Overview

**SouqOne** (formerly CarOne) is a full-stack marketplace for vehicles, heavy equipment, spare parts, and related services in **Oman**.

- **Target market:** Oman (currency: OMR — Omani Rial)
- **Languages:** Arabic (default, RTL) + English
- **Primary domain:** Vehicles (cars, buses), heavy equipment, operators, spare parts, car services, transport, jobs
- **Repo:** `github.com/Mahmoud997s/SouqOne`
- **Branch protection:** Active on `main` — all work goes through feature branches + PRs

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Monorepo** | Turborepo + npm workspaces | turbo 2.4 |
| **Frontend** | Next.js (App Router) | 15.1 |
| **UI** | React | 19 |
| **Styling** | Tailwind CSS | 4.2 |
| **Icons** | Lucide React + Google Material Symbols | latest |
| **Animations** | Framer Motion | 12.x |
| **i18n** | next-intl | 4.9 |
| **Maps** | Leaflet + react-leaflet | 1.9 / 5.0 |
| **State** | TanStack React Query | 5.x |
| **Backend** | NestJS | 10.4 |
| **ORM** | Prisma | 6.x |
| **Database** | PostgreSQL | 16 |
| **Cache/Queue** | Redis + Bull | 7 / 4.x |
| **Search** | MeiliSearch | 1.12 |
| **Real-time** | Socket.IO + Redis adapter | 4.7 |
| **Auth** | JWT (access + refresh) + Google OAuth | — |
| **Media** | Cloudinary | — |
| **Email** | Mailtrap / Nodemailer | — |
| **Payments** | Thawani (Omani payment gateway) | — |
| **CI/CD** | GitHub Actions → Vercel (web) | — |
| **Node** | >= 20 | — |

---

## 3. Repository Structure

```
SouqOne/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── src/
│   │   │   ├── app/[locale]/   # App Router pages (ar/en)
│   │   │   ├── components/     # Shared UI components
│   │   │   ├── features/       # Feature modules (ads, chat, home, listings, rental, sale)
│   │   │   ├── i18n/           # next-intl config
│   │   │   ├── lib/            # API clients, constants, utilities
│   │   │   └── messages/       # ar.json, en.json (translation files)
│   │   ├── public/             # Static assets (images, icons)
│   │   └── next.config.js
│   │
│   └── api/                    # NestJS 10 backend
│       ├── src/
│       │   ├── auth/           # JWT + Google OAuth + login audit
│       │   ├── cars/           # Car listings CRUD
│       │   ├── buses/          # Bus listings CRUD
│       │   ├── equipment/      # Equipment listings + requests + bids
│       │   ├── operators/      # Operator listings
│       │   ├── parts/          # Spare parts
│       │   ├── services/       # Car services
│       │   ├── transport/      # Transport services
│       │   ├── jobs/           # Driver jobs + applications
│       │   ├── chat/           # Real-time messaging (WebSocket)
│       │   ├── bookings/       # Booking system
│       │   ├── payments/       # Thawani payment integration
│       │   ├── reviews/        # Review/rating system
│       │   ├── search/         # MeiliSearch integration
│       │   ├── uploads/        # File upload (Cloudinary)
│       │   ├── notifications/  # Push + in-app notifications
│       │   ├── favorites/      # User favorites
│       │   ├── users/          # User profiles
│       │   ├── common/         # Shared guards, filters, interceptors, utils
│       │   └── main.ts         # Bootstrap (port 4000, prefix /api/v1)
│       └── prisma/
│           ├── schema.prisma   # Database schema
│           ├── migrations/     # SQL migrations
│           ├── seeds/          # Seed scripts (dev + prod)
│           └── scripts/        # DB utility scripts
│
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared config
│
├── docker-compose.yml          # Dev services (Postgres, Redis, MeiliSearch)
├── turbo.json                  # Turborepo pipeline config
└── .github/workflows/ci.yml   # CI/CD pipeline
```

---

## 4. Database Models (Prisma)

### Core
- **User** — email, username, phone, country, governorate, isVerified, role (USER/ADMIN), averageRating, reviewCount
- **RefreshToken** — JWT refresh token storage
- **LoginAudit** — login attempt tracking

### Listings
- **Listing** — cars (make, model, year, mileage, fuelType, transmission, price, listingType: SALE/RENT/WANTED)
- **BusListing** — buses (busListingType: BUS_SALE/BUS_RENT/BUS_CONTRACT, busType, capacity, etc.)
- **EquipmentListing** — heavy equipment (equipmentType, condition, hourlyRate, etc.)
- **SparePart** — spare parts
- **CarService** — car service providers
- **TransportService** — transport/logistics services
- **OperatorListing** — equipment operators

### Marketplace
- **EquipmentRequest** / **EquipmentBid** — equipment bidding system with Redis rate-limiting
- **DriverJob** / **JobApplication** — job board for drivers
- **Booking** — rental booking system

### Social
- **Conversation** / **Message** / **MessageReaction** — real-time chat
- **Favorite** — user favorites
- **Notification** — push + in-app notifications
- **Review** — user review/rating system

### Payments
- **Payment** — Thawani payment records with state machine + fraud detection
- **Subscription** — subscription plans

### Images
- Separate image models per listing type: ListingImage, BusListingImage, EquipmentListingImage, SparePartImage, CarServiceImage, TransportImage

---

## 5. Frontend Architecture

### Routing
- **Locales:** `ar` (default), `en` — prefix always shown (`/ar/...`, `/en/...`)
- **Layout:** RTL-first, `dir="rtl"` by default
- **Auth modals:** Intercepting routes (`@modal/(.)login`, `@modal/(.)register`, etc.)
- **Add listing:** Single dynamic route `/add-listing/[type]` with FORM_MAP

### Key Pages
| Route | Description |
|-------|-------------|
| `/` | Home page with hero slider, category navigation |
| `/motors` | Cars landing page |
| `/buses` | Buses landing page |
| `/equipment` | Equipment landing page |
| `/browse/[category]` | Unified browse page with filters |
| `/sale/[id]` | Car/vehicle detail page |
| `/rental/[id]` | Rental detail page |
| `/jobs` | Jobs board |
| `/messages` | Chat/messaging |
| `/add-listing/[type]` | Add listing form (car, bus, equipment, operator, parts, service) |
| `/my-listings` | User's own listings |
| `/bookings` | User's bookings |
| `/favorites` | User's favorites |
| `/profile` | User profile |
| `/seller/[id]` | Seller public profile |

### Feature Modules (`src/features/`)
- **ads/** — ad display, vehicle cards, forms (add-car, add-bus, add-equipment, etc.)
- **listings/** — UnifiedCard, category config, normalization, hooks (useItemTransformers, useUnifiedListings)
- **chat/** — 10 components + hooks + services for real-time messaging
- **home/** — hero section, search box, jobs section, rental section
- **rental/** — rental page shell, booking card, calendar, pricing
- **sale/** — sale page shell, price card, mobile CTA bar

### Shared Components (`src/components/`)
- **layout/** — Navbar, mobile drawer, footer
- **ui/** — filter chips, buttons, search bar, badges
- **auth/** — AuthModal, AuthPage

### Styling Conventions
- Tailwind CSS 4 with custom CSS variables in `globals.css`
- Brand colors: `--color-brand-navy` (#0B2447), `--color-brand-amber` (#FE5E00), `--color-brand-green`
- Material Design 3 semantic tokens: `bg-surface-container`, `text-on-surface`, etc.
- `btn-brand`, `btn-primary`, `auth-input`, `auth-select` utility classes

---

## 6. Backend Architecture

### API Design
- **Base URL:** `http://localhost:4000/api/v1`
- **REST API** with NestJS controllers + services + repositories
- **WebSocket** gateway for real-time chat (Socket.IO + Redis adapter)
- **Global validation:** `ValidationPipe` (whitelist, transform, forbidNonWhitelisted)
- **Global filters:** `GlobalExceptionFilter`
- **Global interceptors:** `SanitizeInterceptor`, `NormalizeImagesInterceptor`

### Auth Flow
1. Register/login → access token (short-lived) + refresh token (DB-stored)
2. Google OAuth supported
3. Email verification + password reset via code
4. Login audit trail

### Key Modules
| Module | Description |
|--------|-------------|
| `auth` | JWT auth, Google OAuth, token refresh, login audit |
| `cars` | Car listings CRUD + search |
| `buses` | Bus listings + offers |
| `equipment` | Equipment listings + requests + bids |
| `operators` | Operator listings |
| `parts` | Spare parts |
| `services` | Car services |
| `transport` | Transport services |
| `jobs` | Driver jobs + applications |
| `chat` | WebSocket messaging + Redis adapter |
| `bookings` | Booking system |
| `payments` | Thawani integration + state machine + fraud detection |
| `reviews` | Review/rating system |
| `search` | MeiliSearch full-text search |
| `uploads` | Cloudinary file uploads |
| `notifications` | Push (web-push) + in-app notifications |
| `favorites` | User favorites |

### Common Utilities (`src/common/`)
- **Guards:** JwtAuthGuard, RolesGuard
- **Decorators:** @CurrentUser, @Roles
- **Filters:** GlobalExceptionFilter
- **Interceptors:** SanitizeInterceptor, NormalizeImagesInterceptor
- **Utils:** prisma-error.util.ts, entity.utils.ts
- **Constants:** user-select.constant.ts (USER_SELECT_PUBLIC, USER_SELECT_DETAIL)
- **Adapters:** RedisIoAdapter (Socket.IO + Redis)

---

## 7. Development Setup

### Prerequisites
- Node.js >= 20
- Docker + Docker Compose
- npm (package manager)

### Steps

```bash
# 1. Clone
git clone https://github.com/Mahmoud997s/SouqOne.git
cd SouqOne

# 2. Install dependencies
npm install

# 3. Start infrastructure (Postgres, Redis, MeiliSearch)
docker compose up -d

# 4. Setup environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Edit .env files with your values

# 5. Generate Prisma client + push schema
npm run db:generate
npm run db:push

# 6. Start dev servers
npm run dev
# → Web: http://localhost:3000
# → API: http://localhost:4000/api/v1
```

### Docker Services
| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL 16 | 5400 | postgres / postgres / carOne |
| Redis 7 | 6379 | — |
| MeiliSearch 1.12 | 7700 | Key: `carone_meili_master_key_2024` |

### Environment Variables (API)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5400/carOne
REDIS_URL=redis://localhost:6379
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=carone_meili_master_key_2024
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
GOOGLE_CLIENT_ID=<google-client-id>
THAWANI_API_KEY=<thawani-key>
THAWANI_SECRET_KEY=<thawani-secret>
```

### Environment Variables (Web)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=http://localhost:4000
```

---

## 8. Scripts & Commands

```bash
# Development
npm run dev              # Start all dev servers (turbo)

# Build
npm run build            # Build all packages (turbo)

# Type checking
npm run typecheck        # TypeScript check all packages

# Linting
npm run lint             # ESLint all packages

# Testing (API)
cd apps/api
npm test                 # Unit tests (264 tests, 19 suites)
npm run test:e2e         # E2E tests

# Testing (Web)
cd apps/web
npm run test:e2e         # Playwright E2E tests (Chromium)

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB (no migration)
npm run db:migrate       # Run migrations

# Formatting
npm run format           # Prettier format all files
```

---

## 9. Git Workflow

```
feature/xxx  →  PR  →  CI ✓  →  merge to main
```

1. **Never push directly to `main`** — branch protection is active
2. Create feature branch: `git checkout -b feature/xxx`
3. Commit + push to feature branch
4. Open PR targeting `main`
5. CI pipeline runs: Quality (lint + typecheck + build) + Unit tests
6. Merge after CI passes

### CI Pipeline (`.github/workflows/ci.yml`)
- **Quality job:** lint + typecheck + build (Turbo cached)
- **API unit tests:** 264 tests, 19 suites (Postgres 16 + Redis 7 service containers)
- **Gate job (CI ✓):** required for merge

---

## 10. Deployment

| Service | Platform | Trigger |
|---------|----------|---------|
| **Web** | Vercel | Auto-deploy on PR merge to `main` |
| **API** | Railway | Auto-deploy on push to `main` |
| **DB** | Neon (PostgreSQL) | Managed |
| **Redis** | Railway | Managed |

---

## 11. Key Conventions

### Code Style
- **TypeScript strict** everywhere
- **RTL-first** — all layouts assume `dir="rtl"`
- **Arabic as default** — translations in `ar.json` (primary) + `en.json`
- **Tailwind utility-first** — no custom CSS unless necessary
- **Material Symbols** for icons (via Google Fonts CDN) + Lucide for React component icons
- **Framer Motion** for animations

### File Organization
- Pages in `app/[locale]/...`
- Feature logic in `features/...`
- Shared components in `components/...`
- API calls in `lib/api/...`
- Types in `packages/types` or co-located

### Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase`
- API modules: NestJS convention (module, controller, service, dto, repository)
- Translation keys: `camelCase` nested under feature namespace

---

## 12. Current Status & Known Issues

### Completed ✅
- All listing types (cars, buses, equipment, operators, parts, services, transport)
- Add listing forms for all types
- Booking system
- Equipment bidding with Redis rate-limiting
- Real-time chat (WebSocket + Redis)
- Notifications
- Payment integration (Thawani)
- Subscription system
- Review/rating system
- Full-text search (MeiliSearch)
- CI/CD pipeline

### Known Issues ⚠️
- Bid submission UI needs verification
- End-to-end filter testing needed across all listing types
- Insurance & Trips modules deprecated (controllers return 410 Gone)
- Some N+1 query patterns in chat
- Missing MeiliSearch index for equipment

### Removed Modules 🗑️
- **Insurance** — controller returns 410 Gone
- **Trips** — controller returns 410 Gone, DB models removed

---

## 13. Contact

For questions about the codebase, reach out to the project owner via the GitHub repo issues or direct message.
