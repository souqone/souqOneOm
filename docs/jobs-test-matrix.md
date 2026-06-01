# Jobs Module Playwright Test Matrix (Verified via Code)

## 1. Profile Creation (Onboarding)
* **Code Reference:** `apps/web/src/app/[locale]/jobs/onboarding/page.tsx:64-156`
* **Role:** Authenticated User (Guest must be redirected)
* **Happy Path:**
  - Submit Driver form -> verify API call to `POST /jobs/driver-profile` -> Expect redirect to `/jobs/dashboard`.
  - Submit Employer form -> verify API call to `POST /jobs/employer-profile` -> Expect redirect to `/jobs/new`.
* **Edge Cases & Validations:**
  - Submit Driver form without `governorate` -> Assert Zod validation error appears (`onboarding/page.tsx:42`).
  - Access `/jobs/onboarding` when both profiles already exist -> Verify immediate redirect to `/jobs/dashboard` (`onboarding/page.tsx:119-122`).

## 2. Job Creation (Hiring / Offering)
* **Code Reference:** `apps/api/src/jobs/jobs.service.ts:80-93`, `apps/web/src/features/ads/components/forms/jobs/JobFormShell.tsx:78-82`
* **Role:** Driver / Employer
* **Happy Path:**
  - Complete 4-step wizard for `HIRING` -> Submit -> Verify `POST /jobs` succeeds -> Redirect to `/jobs/:id`.
* **Permission Cases (Backend enforced):**
  - Driver profile attempts to submit `jobType: 'HIRING'` -> Verify API throws `ForbiddenException` (`jobs.service.ts:88-89`).
* **Validation Cases:**
  - `minAge` > `maxAge` -> Verify backend throws `BadRequestException` (`jobs.service.ts:82`).

## 3. Applying to a Job
* **Code Reference:** `apps/api/src/jobs/jobs.service.ts:395-442`
* **Role:** Authenticated with matching profile
* **Happy Path:**
  - Valid user clicks apply -> Fills message -> Verifies `POST /jobs/:id/apply` succeeds -> Application appears as `PENDING`.
* **Permission Cases:**
  - Job owner attempts to apply to their own job -> Verify `ForbiddenException` ("لا يمكنك التقديم على وظيفتك الخاصة") (`jobs.service.ts:401`).
  - Attempting to apply to a closed job -> Verify `ForbiddenException` (`jobs.service.ts:400`).
* **Conflict Cases:**
  - Attempting to apply twice -> Verify `ConflictException` (`jobs.service.ts:427`).

## 4. Application Status Updates
* **Code Reference:** `apps/api/src/jobs/jobs.service.ts:484-552`
* **Role:** Job Owner
* **Happy Path:**
  - Owner accepts application -> Verify `PATCH /jobs/applications/:id` -> Status becomes `ACCEPTED`.
* **Permission Cases:**
  - Non-owner attempts to update application status -> Verify `ForbiddenException` (`jobs.service.ts:500`).
  - Owner attempts to set status to `WITHDRAWN` -> Verify `ForbiddenException` (`jobs.service.ts:486`).

## 5. Withdraw Application
* **Code Reference:** `apps/api/src/jobs/jobs.service.ts:590-624`
* **Role:** Applicant
* **Happy Path:**
  - Applicant clicks Withdraw on a `PENDING` application -> Verify `POST /jobs/applications/:id/withdraw`.
* **Validation Cases:**
  - Attempt to withdraw an `ACCEPTED` application -> Verify `BadRequestException` (`jobs.service.ts:604`).

## 6. Job Deletion and State Management
* **Code Reference:** `apps/api/src/jobs/jobs.service.ts:243-367`
* **Role:** Job Owner
* **Regression Cases:**
  - Owner updates job status to `CLOSED` -> Verify all `PENDING` applications are automatically transitioned to `REJECTED` (`jobs.service.ts:294`).
  - Owner deletes job -> Verify `DELETE /jobs/:id` succeeds and related applications cascade delete (`jobs.service.ts:355`).

## UNVERIFIED Assumptions
None. All tests are mapped directly to specific backend checks, error classes, and UI conditions found in the source code.
