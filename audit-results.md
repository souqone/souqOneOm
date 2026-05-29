| Bug | الحالة | الملف | ملاحظة |
|-----|--------|-------|--------|
| A1 | ✅ | schema.prisma | BookingStatus |
| A2 | ✅ | schema.prisma | @default(ACCEPTED) |
| A3 | ✅ | transport.controller.ts | :id is after my |
| A4 | ✅ | carrier-profile.service.ts | include user in setAvailability |
| A5 | ✅ | transport-request.service.ts | include user in myRequests |
| A6 | ❌ | types.ts | relations required |
| A7 | ✅ | CreateRequestWizard.tsx | scheduledAt conditionally sent |
| A8 | ✅ | CreateRequestWizard.tsx | guard against double submit |
| B1 | ✅ | my-quotes/page.tsx | link to bookings |
| B10 | ❌ | my-bookings/page.tsx | supports carrier role |
| B11 | ✅ | bookings/[id]/page.tsx | isShipper correct |
| B2 | ✅ | SubNavBar.tsx | my-bookings link |
| B3 | ✅ | my-quotes/page.tsx | AuthGuard present |
| B4 | ✅ | CreateRequestWizard.tsx | Step 4 validation fields |
| B5 | ❌ | bookings/[id]/page.tsx | optional chaining on carrier |
| B6 | ✅ | carriers/dashboard/page.tsx | early return/loading |
| B7 | ✅ | jobs/my/page.tsx | deleted |
| B8 | ✅ | requests/[id]/page.tsx | canSubmitQuote check |
| B9 | ✅ | bookings/[id]/page.tsx | isCarrier correct |
| C1 | ✅ | CreateRequestWizard.tsx | toast error on validation |
| C11 | ✅ | my-requests/page.tsx | onRetry uses load |
| C12 | ✅ | requests/[id]/page.tsx | price visual feedback |
| C13 | ✅ | requests/[id]/page.tsx | hours validation |
| C14 | ✅ | requests/[id]/page.tsx | message trim |
| C15 | ❌ | my-requests/page.tsx | skeleton on tab change |
| C17 | ✅ | carriers/dashboard/page.tsx | slice requestId |
| C18 | ✅ | Step5Review.tsx | visual map confirmation |
| C2 | ✅ | my-quotes/page.tsx | pendingWithdrawals ref |
| C3 | ✅ | carriers/dashboard/page.tsx | toast timeout/close |
| C4 | ✅ | my-requests/page.tsx | setLoading first |
| C5 | ❌ | BrowseContent.tsx | filter badge |
| C6 | ✅ | carriers/register/page.tsx | finally setSubmitting |
| C7 | ✅ | carriers/register/page.tsx | text with spinner |
| C8 | ✅ | requests/[id]/page.tsx | messages visible |
| C9 | ✅ | RequestsGrid.tsx | scrollTo top on page change |
| D1 | ✅ | HeroSection.tsx | Translated hero |
| D10 | ✅ | Step1ServiceType.tsx | Translated |
| D11 | ❌ | Step2Route.tsx | Translated |
| D12 | ❌ | Step3Cargo.tsx | Translated |
| D13 | ❌ | Step4Timing.tsx | Translated |
| D14 | ✅ | TransportRequestCard.tsx | card texts translated |
| D15 | ❌ | requests/[id]/page.tsx | Translated |
| D16 | ❌ | requests/[id]/page.tsx | Translated |
| D17 | ❌ | my-requests/page.tsx | Translated |
| D18 | ❌ | my-quotes/page.tsx | Translated |
| D19 | ❌ | general | Translated |
| D2 | ❌ | constants.ts | no hardcoded strings |
| D20 | ❌ | general | Translated |
| D3 | ✅ | ar.json | ar translations |
| D4 | ✅ | en.json | en translations |
| D5 | ❌ | multiple | ناقل fallback |
| D6 | ❌ | multiple | toLocaleDateString |
| D7 | ✅ | CarrierCTA.tsx | Translated |
| D8 | ✅ | ServiceTypesGrid.tsx | Translated |
| D9 | ❌ | LatestRequests.tsx | Translated |
| E1 | ✅ | TransportRequestCard.tsx | Link import |
| E10 | ✅ | carriers/dashboard/page.tsx | Link import |
| E2 | ✅ | HeroSection.tsx | Link import |
| E3 | ✅ | CarrierCTA.tsx | Link import |
| E4 | ✅ | ServiceTypesGrid.tsx | Link import |
| E5 | ✅ | LatestRequests.tsx | Link import |
| E6 | ✅ | requests/[id]/page.tsx | Link import |
| E7 | ✅ | ServiceTypesGrid.tsx | Link import |
| E8 | ✅ | carriers/register/page.tsx | Link import |
| E9 | ✅ | my-quotes/page.tsx | Link import |
| F1 | ✅ | BrowseContent.tsx | router.replace |
| F10 | ✅ | BrowseContent.tsx | sortBy in URL |
| F2 | ✅ | BrowseContent.tsx | fromWilayat passed |
| F3 | ✅ | BrowseContent.tsx | keep URL params on page change |
| F4 | ✅ | BrowseContent.tsx | toWilayat passed |
| F5 | ❌ | BrowseContent.tsx | clear filters button |
| F6 | ❌ | TransportRequestCard.tsx | cargo fallback |
| F7 | ✅ | RouteMapView.tsx | conditional timeout |
| F8 | ✅ | CreateRequestWizard.tsx | STEP_FIELDS[4] |
| F9 | ✅ | Step5Review.tsx | visual map confirmation |
| N1 | ✅ | TransportRequestCard.tsx | canEdit check |
| N10 | ✅ | transport-quote.service.ts | transaction withdraw |
| N11 | ❌ | create-transport-request.dto.ts | budgetMin > budgetMax |
| N12 | ❌ | my-requests/page.tsx | pagination limit |
| N13 | ✅ | carriers/dashboard/page.tsx | Promise.allSettled |
| N15 | ✅ | my-requests/page.tsx | reload vs load |
| N16 | ✅ | requests/[id]/page.tsx | canSubmitQuote / banner |
| N17 | ✅ | my-requests/page.tsx | cancel button UI |
| N2 | ✅ | requests/[id]/edit/page.tsx | ownership redirect |
| N3 | ✅ | transport-request.service.ts | forbidden exception |
| N4 | ✅ | requests/[id]/page.tsx | getQuotes only owner |
| N5 | ❌ | requests/[id]/page.tsx | hasAlreadyQuoted check |
| N7 | ✅ | transport.controller.ts | bookings/:id vs bookings/my |
| N8 | ✅ | requests/[id]/page.tsx | cancel button |
| N9 | ✅ | transport-quote.service.ts | transaction accept |


**عدد الـ bugs المصلحة:** 67 من 90
