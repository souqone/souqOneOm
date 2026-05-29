You are acting as a senior-level:

* Software Architect
* Staff Frontend Engineer
* Backend Systems Reviewer
* Product Manager
* Security Auditor
* UX Reviewer
* Marketplace Workflow Analyst
* QA Engineer

Your task is to deeply audit the entire Transport module of this application.

I do NOT want a shallow code review.
I want a professional production-grade audit covering:

# 1. Product & Workflow Review

Analyze the entire transport business flow end-to-end:

* Request creation
* Quote submission
* Quote acceptance/rejection
* Booking creation
* Booking lifecycle
* Cancellation flows
* Reposting flows
* Carrier dashboard
* User dashboards
* Reviews & ratings
* Notifications
* Ownership permissions

For every workflow:

* Explain the intended business logic
* Detect broken flows
* Detect missing states
* Detect contradictory states
* Detect UX inconsistencies
* Detect missing edge cases
* Detect invalid transitions
* Detect marketplace abuse scenarios
* Detect race conditions
* Detect stale state issues

Think like a Product Manager + System Designer.

---

# 2. Role & Permission Audit

Audit ALL roles and permissions.

Verify:

* Request owner permissions
* Carrier permissions
* Guest access
* AuthGuard correctness
* Unauthorized access paths
* Ownership validation
* Hidden privilege escalation risks
* Client-side-only protections
* Backend trust assumptions

Flag any:

* security weakness
* permission leak
* auth inconsistency
* business-rule bypass

---

# 3. Frontend Architecture Audit

Review the frontend architecture quality:

* state management
* async handling
* generation counters
* stale response protection
* optimistic updates
* loading states
* error boundaries
* page-level error handling
* derived state correctness
* pagination correctness
* query invalidation
* component responsibilities
* re-render risks
* hook correctness

Identify:

* anti-patterns
* duplicated logic
* unstable UI behavior
* scalability problems
* maintainability issues

---

# 4. UX & UI Review

Review every transport page as a UX expert.

Analyze:

* loading UX
* empty states
* error states
* destructive actions
* confirmation flows
* mobile usability
* dashboard clarity
* stats correctness
* user confusion risks
* navigation consistency
* feedback systems

Detect:

* confusing flows
* inconsistent statuses
* misleading UI
* broken feedback loops
* inaccessible actions

---

# 5. Backend/API Contract Validation

Review whether frontend assumptions match backend behavior.

Detect:

* stale local state
* missing refreshes
* invalid optimistic assumptions
* missing invalidation
* pagination mismatch
* inconsistent totals
* derived count bugs
* unsupported edge states

---

# 6. Performance & Scalability Review

Detect:

* unnecessary requests
* N+1 patterns
* overfetching
* large rerenders
* dashboard inefficiencies
* poor pagination logic
* expensive calculations
* missing memoization
* excessive client-side filtering

---

# 7. Reliability Review

Specifically look for:

* race conditions
* stale closures
* state desynchronization
* async overwrite bugs
* concurrent action bugs
* double-submit issues
* timeout leaks
* stale effects
* inconsistent optimistic updates

---

# 8. Code Quality Audit

Review:

* naming quality
* separation of concerns
* readability
* abstraction quality
* duplication
* file structure
* maintainability
* typing quality
* defensive coding

Flag:

* dangerous patterns
* fragile logic
* misleading naming
* shadowed variables
* hidden coupling

---

# 9. Required Output Format

For every issue found provide:

* Severity:

  * Critical
  * High
  * Medium
  * Low

* Category:

  * Security
  * Product Logic
  * UX
  * State Management
  * Performance
  * Reliability
  * Architecture
  * API Contract
  * Maintainability

* File

* Exact root cause

* Real-world user impact

* Technical impact

* Reproduction scenario

* Recommended fix

* Long-term architectural recommendation

---

# 10. Final Summary

Provide:

* Overall architecture score /10
* Product workflow score /10
* UX maturity score /10
* Security confidence score /10
* Reliability score /10
* Scalability score /10
* Maintainability score /10

Then provide:

* Top 10 highest-risk problems
* Top 10 architectural improvements
* Top 10 UX improvements
* Top 10 reliability fixes

Be brutally honest and production-oriented.

Think like this system is about to launch to 1 million users.
