# Jobs User Flow Document (Verified via Code)

## 1. Onboarding Flow
- **Entry Point:** `/jobs/onboarding`
- **Initial State Check:** 
  - API `GET /jobs/driver-profile/me` and `GET /jobs/employer-profile/me` are called (`apps/web/src/app/[locale]/jobs/onboarding/page.tsx:64-65`).
  - If both profiles exist, immediately redirect to `/jobs/dashboard` (`onboarding/page.tsx:120`).
  - If one profile exists, shows options to go to dashboard or create the missing profile type (`onboarding/page.tsx:188-233`).
- **Step 1 (Select Type):** User selects Driver or Employer. Sets state `profileType` (`onboarding/page.tsx:264-292`).
- **Step 2 (Form Fill):** 
  - Driver Form: 4 internal sub-steps (License, Experience, Languages, Bio) visually displayed but in one long form (`onboarding/page.tsx:310`).
  - Employer Form: Single form.
- **Exit Point:** 
  - Submit Driver -> `POST /jobs/driver-profile` -> Redirect `/jobs/dashboard` (`onboarding/page.tsx:137`).
  - Submit Employer -> `POST /jobs/employer-profile` -> Redirect `/jobs/new` (`onboarding/page.tsx:150`).

## 2. Job Creation Flow
- **Entry Point:** `/jobs/new`
- **Component:** `<JobFormShell mode="add" />` (`apps/web/src/app/[locale]/jobs/new/page.tsx:12`).
- **Flow:** Handled by a 4-step wizard `useFormSteps` (`apps/web/src/features/ads/components/forms/jobs/JobFormShell.tsx:76`).
  - Step 0: Job Type (`JobFormShell.tsx:159`).
  - Step 1: Details (`JobFormShell.tsx:160`).
  - Step 2: Requirements (`JobFormShell.tsx:161`).
  - Step 3: Location/Contact (`JobFormShell.tsx:163`).
- **Validation Check:** Step 1 requires jobType, Step 2 requires title/desc, etc. (`JobFormShell.tsx:78-82`).
- **Exit Point:** Submit -> `POST /jobs` -> Redirect `/jobs/:id` (`JobFormShell.tsx:123`).

## 3. Dashboard Flow
- **Entry Point:** `/jobs/dashboard`
- **Initial State Check:**
  - Loads profiles and data: `useMyEmployerProfile`, `useMyDriverProfile`, `useMyJobs`, `useMyApplications` (`apps/web/src/app/[locale]/jobs/dashboard/page.tsx:33-36`).
  - If neither profile exists, shows "No Profile" empty state with CTA to `/jobs/onboarding` (`dashboard/page.tsx:168-181`).
- **Interaction (Role Switcher):**
  - If user has both roles, role switcher tabs appear (`dashboard/page.tsx:214`).
  - Active role determines whether `MyPostsList` (Jobs) or `MyProposalsList` (Applications) is shown (`dashboard/page.tsx:324`).
- **Interaction (Status Filter):**
  - Filter tabs (ACTIVE, PENDING, etc) slice the local mapped array (`dashboard/page.tsx:286-308`).
- **Interaction (Verification Banner):**
  - If active role is Driver and `!driver.isVerified`, shows a banner linking to `/jobs/verification` (`dashboard/page.tsx:269-282`).

## 4. Verification Flow
- **Entry Point:** `/jobs/verification` (Linked from Dashboard Banner `dashboard/page.tsx:271`).
- **API Call:** `POST /jobs/verification/submit` (requires license and ID images).
- **Backend Flow:** Creates `DriverVerification` record with `PENDING` status (`apps/api/src/jobs/driver-verification.service.ts:30`).
- **Admin Review:** 
  - Admin calls `PATCH /admin/verifications/:id` with `APPROVED` or `REJECTED` (`apps/api/src/jobs/admin-jobs.controller.ts:57`).
  - Updates profile `isVerified = true` if approved (`driver-verification.service.ts:106`).
  - Triggers notification to the driver (`driver-verification.service.ts:115`).

## 5. Application Lifecycle Flow
- **Apply:** User submits `POST /jobs/:id/apply` -> Status `PENDING` (`apps/api/src/jobs/jobs.service.ts:414`).
- **Review:** Owner lists apps via `GET /jobs/:id/applications` (`jobs.service.ts:445`). Owner clicks Accept/Reject `PATCH /jobs/applications/:id` (`jobs.service.ts:484`).
- **Withdraw:** Applicant clicks Withdraw in Dashboard -> `POST /jobs/applications/:id/withdraw` -> Status `WITHDRAWN` (`jobs.service.ts:590`).
- **Auto-Reject:** Owner closes job -> All `PENDING` apps auto-rejected `REJECTED` (`jobs.service.ts:284`).

## UNVERIFIED Assumptions
None. All flows are extracted directly from React Router definitions, UI event handlers, and API Controller logic as cited by exact line numbers.
