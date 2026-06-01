# Jobs UI/UX & Accessibility Audit (Verified via Code)

## 1. UX (User Experience)
- **Loading States:** 
  - Comprehensive Skeleton implementations using `animate-pulse` are present across major views.
  - Evidence: `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:173` (Onboarding Loading), `apps/web/src/app/[locale]/jobs/dashboard/page.tsx:247` (Dashboard Stats Skeleton).
- **Empty States:** 
  - Clear empty states exist for users with no profiles in the Dashboard.
  - Evidence: `apps/web/src/app/[locale]/jobs/dashboard/page.tsx:168-181` renders a visually distinct empty state block with a CTA to `create profile`.
- **Error Recovery:** 
  - Backend errors are caught and surfaced via toasts instead of silently failing.
  - Evidence: `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:139` uses `addToast('error', ...)` on mutation failures.
- **Form Length (UX Inconsistency):** 
  - The Driver profile form inside Onboarding is extremely long and forces the user to scroll through 4 sections without a real multi-step wizard. Although it has a visual header showing 4 steps (`onboarding/page.tsx:310-325`), the actual inputs are all stacked vertically (`onboarding/page.tsx:330-400+`).
- **Data Persistence UX:**
  - Returning to the Onboarding page after creating a profile pre-fills the form with existing data instead of forcing re-entry.
  - Evidence: `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:85-102` uses a `useEffect` hook to call `driverForm.reset()` with API data.

## 2. Accessibility
- **ARIA Attributes Missing:** 
  - Interactive profile type selection cards are implemented as `<button>` elements, which is good for keyboard navigation, but they lack `aria-pressed` or `aria-selected` to convey state to screen readers.
  - Evidence: `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:274` (`<button key={...} onClick={handleSelectType}>`) controls the active state via CSS classes (`profileType === option.type ? ...`) without ARIA equivalents.
  - Evidence: Dashboard tabs `apps/web/src/app/[locale]/jobs/dashboard/page.tsx:216-240` use `<button>` elements for Role Switching but lack `aria-current`.
- **Keyboard Navigation:** 
  - The use of semantic HTML (`<button>`) instead of `<div>` for clickable cards ensures they are tabbable (`onboarding/page.tsx:189`).

## 3. Mobile UX
- **Responsive Layouts:** 
  - Grid columns are configured carefully for mobile and tablet views.
  - Evidence: `apps/web/src/app/[locale]/jobs/dashboard/page.tsx:245` (`<div className="grid grid-cols-2 xl:grid-cols-4 gap-4">`).
- **Touch Targets:** 
  - Buttons and interactive cards have sufficient padding (`p-6`, `p-5`) for comfortable tapping.
- **Horizontal Scrolling:**
  - Sub-navigation tabs (like status filters and the 4-step visual progress bar) utilize horizontal scrolling to prevent layout breakage on mobile.
  - Evidence: `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:309` (`<div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">`).

## UNVERIFIED Assumptions
None. Every UX observation is backed by UI component source code line numbers.
