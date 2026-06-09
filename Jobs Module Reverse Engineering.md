# Jobs Module Reverse Engineering + Playwright Audit Mission

ممنوع كتابة أي Playwright Test أو إصدار أي حكم أو Audit قبل تنفيذ المراحل التالية بالكامل.

## Phase 1 — System Discovery

اقرأ قسم Jobs بالكامل من البداية للنهاية.

يشمل:

* routes
* pages
* layouts
* guards
* permissions
* API endpoints
* DTOs
* hooks
* services
* mutations
* queries
* shared components
* onboarding flow
* dashboard flow
* browse flow
* job detail flow
* proposals flow
* verification flow

ممنوع افتراض أي شيء.

يجب استخراج الحقيقة من الكود فقط.

---

## Phase 2 — Feature Inventory

أنشئ ملف:

docs/jobs-feature-inventory.md

واكتب فيه:

### Roles

لكل Role:

* Guest
* Authenticated User
* Driver
* Employer
* Verified Driver
* Verified Employer
* Admin (إذا موجود)

حدد:

* ماذا يستطيع أن يفعل
* ماذا لا يستطيع أن يفعل
* الصفحات المسموح بها
* الصفحات الممنوعة
* الredirects

---

### Features

استخرج جميع Features الموجودة فعلاً في النظام.

مثال:

* Browse Jobs
* Browse Drivers
* Create Hiring Job
* Create Offering Job
* Apply To Job
* Accept Proposal
* Reject Proposal
* Withdraw Proposal
* Verification
* Driver Onboarding
* Employer Onboarding
* Dashboard
* Search
* Filtering
* Pagination

لكل Feature اكتب:

* الهدف
* نقطة البداية
* نقطة النهاية
* المستخدم المستهدف
* Dependencies
* Success Criteria

---

## Phase 3 — UX Flow Mapping

أنشئ ملف:

docs/jobs-user-flows.md

لكل Feature:

ارسم Flow كامل:

Start
↓
Page A
↓
Action
↓
API
↓
Result
↓
Next Page

حدد:

* Dead Ends
* Confusing Steps
* Missing Feedback
* Missing CTA
* Missing Empty States

---

## Phase 4 — Architecture Audit

أنشئ ملف:

docs/jobs-architecture-audit.md

وابحث عن:

### Hardcoded Content

* strings
* labels
* urls
* status names
* role names

---

### Duplicated Logic

* duplicate pages
* duplicate hooks
* duplicate components
* duplicate queries

---

### Missing Abstractions

* repeated UI
* repeated mutations
* repeated API calls

---

### Code Quality

قيّم:

* maintainability
* readability
* scalability
* separation of concerns

مع أمثلة من الكود.

---

## Phase 5 — UX/UI Audit

أنشئ ملف:

docs/jobs-ui-ux-audit.md

راجع:

### UX

* discoverability
* conversion
* onboarding
* navigation
* error recovery
* loading states
* empty states

### Accessibility

* aria
* keyboard navigation
* focus management
* color contrast
* screen reader support

### Mobile UX

* responsive layouts
* touch targets
* sticky actions
* drawers
* bottom navigation interactions

---

## Phase 6 — Playwright Test Design

بعد فهم النظام بالكامل فقط.

أنشئ:

docs/jobs-test-matrix.md

ويحتوي على:

Feature
Role
Happy Path
Edge Cases
Permission Cases
Validation Cases
Regression Cases

لا تكتب أي Test قبل اكتمال هذا الملف.

---

## Phase 7 — Playwright Implementation

أنشئ:

e2e/jobs/

واكتب:

1. feature tests
2. permission tests
3. onboarding tests
4. verification tests
5. dashboard tests
6. accessibility tests
7. mobile tests
8. regression tests

كل Test يجب أن يتحقق من:

* feature works
* role permissions correct
* UX feedback exists
* loading states exist
* errors displayed correctly
* redirects correct

---

## Phase 8 — Final Verdict

أنشئ:

docs/jobs-final-report.md

ويحتوي على:

### Implemented Features

### Broken Features

### Missing Features

### UX Gaps

### Accessibility Gaps

### Hardcoded Content

### Code Smells

### Technical Debt

### Recommended Fixes

ممنوع إصدار أي حكم أو استنتاج أو Bug Report قبل انتهاء جميع المراحل السابقة.
أي استنتاج يجب أن يحتوي على:

* file path
* line number
* code evidence
* screenshot evidence (إذا كان متعلقاً بالـ UI)

إذا لم يوجد دليل من الكود أو من تشغيل التطبيق فلا تعتبره Bug.
