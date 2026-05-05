# SouqOne — Structure Migration Report

> **Branch:** `refactor/structure`  
> **Date:** 2026-05  
> **TypeScript after migration:** ✅ 0 errors  
> **Old import paths remaining:** ✅ 0  

---

## 1. Files Moved

| Old Path | New Path |
|---|---|
| `components/auth/auth-card.tsx` | `features/auth/components/auth-card.tsx` |
| `components/auth/auth-overlay.tsx` | `features/auth/components/auth-overlay.tsx` |
| `components/auth/input-field.tsx` | `features/auth/components/input-field.tsx` |
| `components/auth/otp-input.tsx` | `features/auth/components/otp-input.tsx` |
| `components/auth/password-strength.tsx` | `features/auth/components/password-strength.tsx` |
| `components/auth/verify-content.tsx` | `features/auth/components/verify-content.tsx` |
| `components/bookings/BookingActiveHighlight.tsx` | `features/bookings/components/BookingActiveHighlight.tsx` |
| `components/bookings/BookingCard.tsx` | `features/bookings/components/BookingCard.tsx` |
| `components/bookings/BookingCardSkeleton.tsx` | `features/bookings/components/BookingCardSkeleton.tsx` |
| `components/bookings/BookingPendingOwnerAlert.tsx` | `features/bookings/components/BookingPendingOwnerAlert.tsx` |
| `components/bookings/BookingRateModal.tsx` | `features/bookings/components/BookingRateModal.tsx` |
| `components/bookings/BookingsFilterTabs.tsx` | `features/bookings/components/BookingsFilterTabs.tsx` |
| `components/bookings/BookingsList.tsx` | `features/bookings/components/BookingsList.tsx` |
| `components/bookings/BookingsListSkeleton.tsx` | `features/bookings/components/BookingsListSkeleton.tsx` |
| `components/bookings/BookingsPageClient.tsx` | `features/bookings/components/BookingsPageClient.tsx` |
| `components/bookings/BookingsRoleToggle.tsx` | `features/bookings/components/BookingsRoleToggle.tsx` |
| `components/bookings/BookingsStatsBar.tsx` | `features/bookings/components/BookingsStatsBar.tsx` |
| `components/bookings/empty/BookingsEmptyState.tsx` | `features/bookings/components/empty/BookingsEmptyState.tsx` |
| `components/dashboard/driver/**` (all files) | `features/dashboard/components/driver/**` |
| `components/dashboard/employer/**` (all files) | `features/dashboard/components/employer/**` |
| `components/notifications/NotificationCard.tsx` | `features/notifications/components/NotificationCard.tsx` |
| `components/notifications/NotificationCardSkeleton.tsx` | `features/notifications/components/NotificationCardSkeleton.tsx` |
| `components/notifications/NotificationsDesktopDetailPanel.tsx` | `features/notifications/components/NotificationsDesktopDetailPanel.tsx` |
| `components/notifications/NotificationsDesktopSidebar.tsx` | `features/notifications/components/NotificationsDesktopSidebar.tsx` |
| `components/notifications/NotificationsEmptyState.tsx` | `features/notifications/components/NotificationsEmptyState.tsx` |
| `components/notifications/NotificationsGroupHeader.tsx` | `features/notifications/components/NotificationsGroupHeader.tsx` |
| `components/notifications/NotificationsHero.tsx` | `features/notifications/components/NotificationsHero.tsx` |
| `components/notifications/NotificationsHeroSkeleton.tsx` | `features/notifications/components/NotificationsHeroSkeleton.tsx` |
| `components/notifications/NotificationsList.tsx` | `features/notifications/components/NotificationsList.tsx` |
| `components/notifications/NotificationsListSkeleton.tsx` | `features/notifications/components/NotificationsListSkeleton.tsx` |
| `components/notifications/NotificationsPageClient.tsx` | `features/notifications/components/NotificationsPageClient.tsx` |
| `components/profile/ProfileBookingsTab.tsx` | `features/profile/components/ProfileBookingsTab.tsx` |
| `components/profile/ProfileBookingsTabSkeleton.tsx` | `features/profile/components/ProfileBookingsTabSkeleton.tsx` |
| `components/profile/ProfileHero.tsx` | `features/profile/components/ProfileHero.tsx` |
| `components/profile/ProfileHeroSkeleton.tsx` | `features/profile/components/ProfileHeroSkeleton.tsx` |
| `components/profile/ProfileListingsTab.tsx` | `features/profile/components/ProfileListingsTab.tsx` |
| `components/profile/ProfileListingsTabSkeleton.tsx` | `features/profile/components/ProfileListingsTabSkeleton.tsx` |
| `components/profile/ProfileNavTabs.tsx` | `features/profile/components/ProfileNavTabs.tsx` |
| `components/profile/ProfileNavTabsSkeleton.tsx` | `features/profile/components/ProfileNavTabsSkeleton.tsx` |
| `components/profile/ProfileOverviewTab.tsx` | `features/profile/components/ProfileOverviewTab.tsx` |
| `components/profile/ProfilePageClient.tsx` | `features/profile/components/ProfilePageClient.tsx` |
| `components/profile/ProfileSecurityTab.tsx` | `features/profile/components/ProfileSecurityTab.tsx` |
| `components/profile/ProfileSettingsCard.tsx` | `features/profile/components/ProfileSettingsCard.tsx` |
| `components/profile/ProfileSettingsTab.tsx` | `features/profile/components/ProfileSettingsTab.tsx` |
| `components/profile/ProfileVerificationStatus.tsx` | `features/profile/components/ProfileVerificationStatus.tsx` |
| `components/favorites/FavoritesBulkActions.tsx` | `features/favorites/components/FavoritesBulkActions.tsx` |
| `components/favorites/FavoritesCategoryFilter.tsx` | `features/favorites/components/FavoritesCategoryFilter.tsx` |
| `components/favorites/FavoritesCategoryFilterSkeleton.tsx` | `features/favorites/components/FavoritesCategoryFilterSkeleton.tsx` |
| `components/favorites/FavoritesEmptyState.tsx` | `features/favorites/components/FavoritesEmptyState.tsx` |
| `components/favorites/FavoritesGrid.tsx` | `features/favorites/components/FavoritesGrid.tsx` |
| `components/favorites/FavoritesGridSkeleton.tsx` | `features/favorites/components/FavoritesGridSkeleton.tsx` |
| `components/favorites/FavoritesPageClient.tsx` | `features/favorites/components/FavoritesPageClient.tsx` |
| `components/drivers/DriverProfileCard.tsx` | `features/jobs/components/DriverProfileCard.tsx` |
| `components/jobs/jobs-page-guard.tsx` | `features/jobs/components/jobs-page-guard.tsx` |

**Total: 56 files moved**

---

## 2. Files Deleted (Dead Code)

| File | Reason |
|---|---|
| `components/auth/` (directory) | Moved to features/auth — dir removed |
| `components/bookings/` (directory) | Moved to features/bookings — dir removed |
| `components/dashboard/` (directory) | Moved to features/dashboard — dir removed |
| `components/notifications/` (directory) | Moved to features/notifications — dir removed |
| `components/profile/` (directory) | Moved to features/profile — dir removed |
| `components/favorites/` (directory) | Moved to features/favorites — dir removed |
| `components/drivers/` (directory) | Moved to features/jobs — dir removed |
| `components/jobs/` (directory) | Moved to features/jobs — dir removed |

> Note: `components/auth/AuthLayout.tsx` does NOT exist in this codebase (confirmed via grep). No dead file to delete.

---

## 3. Files Created

### Feature Barrel Indexes
| File | Purpose |
|---|---|
| `features/auth/index.ts` | Re-exports AuthOverlay, VerifyEmailContent, InputField, OtpInput, PasswordStrength |
| `features/bookings/index.ts` | Re-exports all 12 booking components |
| `features/profile/index.ts` | Re-exports all 14 profile components |
| `features/notifications/index.ts` | Re-exports all 11 notification components |
| `features/favorites/index.ts` | Re-exports all 7 favorites components |
| `features/dashboard/index.ts` | Re-exports DriverDashboardClient, EmployerDashboardClient |

### New Utilities
| File | Purpose |
|---|---|
| `lib/constants/routes.ts` | Centralized ROUTES constant (50 routes, all categories) |
| `apps/api/src/common/pipes/parse-entity-id.pipe.ts` | NestJS pipe for entity ID validation |

### New Type Domain Files (`packages/types/src/`)
| File | Contents |
|---|---|
| `common.ts` | Condition, FuelTypeEnum, TransmissionEnum, VehicleType, OMAN_GOVERNORATES_EN |
| `booking.ts` | BookingStatus, BookingEntityType, IBooking, ICreateBooking |
| `jobs.ts` | JobType, EmploymentType, SalaryPeriod, JobStatus, ApplicationStatus, VerificationStatus, IDriverJob, IDriverProfile, IEmployerProfile, IJobApplication |
| `transport.ts` | TransportServiceType, TransportRequestStatus, QuoteStatus, TransportBookingStatus, ICarrierProfile, ITransportRequest, ITransportQuote, ITransportBooking |
| `payment.ts` | PaymentType, PaymentStatus, SubscriptionPlan, SubscriptionStatus, IPayment, ISubscription, ISubscriptionPlan |

---

## 4. Import Paths Updated

| File | Change |
|---|---|
| `app/[locale]/layout.tsx` | `@/components/auth/auth-overlay` → `@/features/auth/components/auth-overlay` |
| `app/[locale]/login/login-form.tsx` | auth → features/auth |
| `app/[locale]/forgot-password/forgot-form.tsx` | auth → features/auth |
| `app/[locale]/reset-password/reset-form.tsx` | auth (3 imports) → features/auth |
| `app/[locale]/bookings/page.tsx` | components/bookings → features/bookings |
| `app/[locale]/profile/page.tsx` | components/profile → features/profile |
| `app/[locale]/notifications/page.tsx` | components/notifications → features/notifications |
| `app/[locale]/favorites/page.tsx` | components/favorites → features/favorites |
| `app/[locale]/dashboard/driver/page.tsx` | components/dashboard → features/dashboard |
| `app/[locale]/dashboard/employer/page.tsx` | components/dashboard → features/dashboard |
| `app/[locale]/jobs/invites/page.tsx` | components/jobs → features/jobs |
| `app/[locale]/jobs/my/page.tsx` | components/jobs → features/jobs |
| `app/[locale]/jobs/new/page.tsx` | components/jobs → features/jobs |
| `app/[locale]/jobs/verification/page.tsx` | components/jobs → features/jobs |
| `features/auth/components/auth-overlay.tsx` | Internal verify-content + icon imports fixed |
| `features/auth/components/verify-content.tsx` | Internal otp-input import fixed |
| `features/dashboard/components/employer/tabs/EmployerInviteTab.tsx` | components/drivers → features/jobs |

**Total: 17 files with updated imports, 22 individual import lines changed**

---

## 5. TypeScript Errors

| Stage | Errors |
|---|---|
| Before migration | 0 (baseline) |
| After all moves | 1 (barrel index: default vs named export) |
| After fix | **0 ✅** |

---

## 6. Remaining Work (Out of Scope for this PR)

| Item | Notes |
|---|---|
| `components/seller/` | 13 files — not specified in prompt, stays in `components/seller/` |
| `components/reviews/` | Not specified in prompt, stays in `components/reviews/` |
| `components/shared/` | Correctly stays in `components/shared/` |
| `components/map/` | Correctly stays in `components/map/` |
| `components/ui/` | UI primitives — correctly stays in `components/ui/` |
| `components/layout/` | Layout — correctly stays in `components/layout/` |
| `features/equipment/` | Created dirs but no files moved (no source in `components/equipment/`) |
| `features/browse/` | Target structure defined but no source files to move yet |
| MeiliSearch for equipment | Separate backend task (not frontend structure) |
| Branch protection on main | DevOps task |
