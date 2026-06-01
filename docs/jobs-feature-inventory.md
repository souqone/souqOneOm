# Jobs Module Feature Inventory (Verified via Code)

## 1. Features
### 1.1 Job Creation
- **Evidence:** `apps/api/src/jobs/jobs.controller.ts:39`, `jobs.service.ts:80`
- **Roles:** Driver (for `OFFERING`), Employer (for `HIRING`)
- **APIs:** `POST /jobs`
- **Validation:** 
  - `minAge < maxAge` (`jobs.service.ts:82`)
  - Cross-profile validation: `HIRING` requires EmployerProfile (`jobs.service.ts:88`), `OFFERING` requires DriverProfile (`jobs.service.ts:91`).
  - Slug collision handling up to 5 attempts (`jobs.service.ts:126`).

### 1.2 View Jobs (List & Detail)
- **Evidence:** `apps/api/src/jobs/jobs.controller.ts:44` (findAll), `:180` (findOne)
- **Roles:** Public (Guest)
- **APIs:** `GET /jobs`, `GET /jobs/:id`
- **Details:** 
  - Cached via Redis (`jobs.service.ts:155` for list, `:217` for details).
  - View count incremented (`jobs.service.ts:231`).
  - Filters supported: `status`, `jobType`, `employmentType`, `governorate`, `licenseType`, `minSalary`, `maxSalary`, `search` (`jobs.service.ts:159`).

### 1.3 Apply to Job
- **Evidence:** `apps/api/src/jobs/jobs.controller.ts:202`, `jobs.service.ts:395`
- **Roles:** Driver (for `HIRING`), Employer (for `OFFERING`)
- **APIs:** `POST /jobs/:id/apply`
- **Permissions:** 
  - User cannot apply to own job (`jobs.service.ts:401`).
  - Must have matching profile for the `jobType` (`jobs.service.ts:405`, `409`).
  - Job status must be `ACTIVE` (`jobs.service.ts:400`).
- **Success Criteria:** Creates `JobApplication`, triggers `JOB_APPLICATION` notification to owner (`jobs.service.ts:433`).

### 1.4 Application Management (Accept/Reject)
- **Evidence:** `apps/api/src/jobs/jobs.controller.ts:165`, `jobs.service.ts:484`
- **Roles:** Job Owner
- **APIs:** `PATCH /jobs/applications/:id`
- **Permissions:** Job owner only (`jobs.service.ts:500`). Job must be `ACTIVE` (`jobs.service.ts:504`).
- **Validation:** Only transitions `PENDING` -> `ACCEPTED` or `REJECTED` (`jobs.service.ts:508`).
- **Data Safety:** Atomic Compare-And-Swap (CAS) update to prevent race conditions (`jobs.service.ts:516`).

### 1.5 Withdraw Application
- **Evidence:** `apps/api/src/jobs/jobs.controller.ts:175`, `jobs.service.ts:590`
- **Roles:** Applicant
- **APIs:** `POST /jobs/applications/:id/withdraw`
- **Permissions:** Applicant only (`jobs.service.ts:601`). Status must be `PENDING` (`jobs.service.ts:603`).

### 1.6 Job Update & Delete
- **Evidence:** `apps/api/src/jobs/jobs.service.ts:243` (Update), `:327` (Delete)
- **Roles:** Job Owner
- **Permissions:** Owner only (`jobs.service.ts:246`, `:330`).
- **Transitions:** `ACTIVE` -> `CLOSED`. Terminal state `EXPIRED` (`jobs.service.ts:250`).
- **Effects:** Closing a job auto-rejects all `PENDING` apps and notifies (`jobs.service.ts:284`). Deleting a job notifies both `PENDING` and `ACCEPTED` apps (`jobs.service.ts:333`).

### 1.7 Driver Profile Management
- **Evidence:** `apps/api/src/jobs/driver-profile.service.ts:33` (Create), `:67` (Update)
- **Roles:** Authenticated
- **Constraints:** Max 1 profile per user (`driver-profile.service.ts:35`).
- **Data Leak Prevention:** Phone number excluded from public profiles (`driver-profile.service.ts:13`, `:87`).

### 1.8 Employer Profile Management
- **Evidence:** `apps/api/src/jobs/employer-profile.service.ts:31` (Create)
- **Roles:** Authenticated
- **Constraints:** Max 1 profile per user (`employer-profile.service.ts:33`).

### 1.9 Driver Verification
- **Evidence:** `apps/api/src/jobs/driver-verification.service.ts:18` (Submit), `:80` (Admin Review)
- **Roles:** Driver, Admin
- **Constraints:** Driver must have unverified profile without pending verification (`driver-verification.service.ts:20-28`).
- **Admin Review:** Admin accepts (`isVerified: true`) or rejects with reason (`driver-verification.service.ts:106`).

## 2. Roles
- **Guest:** Can view public job listings and public profiles. Phone numbers are hidden.
- **Authenticated:** Can create driver or employer profiles.
- **Driver:** User with `DriverProfile`. Can create `OFFERING` jobs and apply to `HIRING` jobs.
- **Employer:** User with `EmployerProfile`. Can create `HIRING` jobs and apply to `OFFERING` jobs.
- **Admin:** User with `ADMIN` role. Can review driver verifications (`admin-jobs.controller.ts:15`).

## 3. UNVERIFIED Assumptions
None. Everything listed above is backed by exact file paths and line numbers from the API layer.
