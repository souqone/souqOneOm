# معمارية قسم الوظائف — SouqOne

> **Staff Software Architect Document**  
> تاريخ الإنشاء: 2026-05-30  
> النطاق: `apps/api/src/jobs/` + `apps/web/src/app/[locale]/jobs/` + `apps/web/src/features/jobs/`

---

## 1. الهدف من قسم الوظائف

قسم الوظائف هو سوق عمل متخصص في قطاع النقل والخدمات اللوجستية. يربط بين:

- **أصحاب العمل**: شركات وأفراد يبحثون عن سائقين أو طاقم نقل
- **السائقين**: مهنيون يبحثون عن فرص عمل أو يعرضون خدماتهم

يختلف عن منصات التوظيف التقليدية في أنه **ثنائي الاتجاه**: الوظيفة يمكن أن تُنشر من صاحب العمل أو من السائق نفسه.

---

## 2. أنواع المستخدمين

| النوع | الوصف | الملف الأساسي |
|-------|-------|---------------|
| **Driver (سائق)** | لديه `DriverProfile`، يتقدم على وظائف `HIRING`، ينشر وظائف `OFFERING` | `DriverProfile` |
| **Employer (صاحب عمل)** | لديه `EmployerProfile`، ينشر وظائف `HIRING`، يتقدم على وظائف `OFFERING` | `EmployerProfile` |
| **كلاهما (Dual Role)** | نفس المستخدم لديه كلا الملفين — يستخدم Role Switcher في الـ Dashboard | كلاهما |
| **Admin** | صلاحيات كاملة: تعطيل/تفعيل الوظائف، مراجعة التحقق من السائقين | JWT Role `ADMIN` |
| **زائر (Guest)** | يستعرض القوائم والتفاصيل فقط، بدون تسجيل | — |

### قاعدة الأدوار الثنائية
```
User ──┬── DriverProfile   (isDriver = true)
       └── EmployerProfile (isEmployer = true)
```
يمكن للمستخدم أن يكون سائقاً وصاحب عمل في نفس الوقت.  
الـ Dashboard يعرض **Role Switcher** فقط إذا كان لديه كلا الملفين.

---

## 3. نموذجا الوظائف (JobType)

```
JobType
  ├── HIRING   — صاحب العمل ينشر وظيفة، السائقون يتقدمون
  └── OFFERING — السائق ينشر خدماته، أصحاب العمل يتقدمون
```

| الجانب | HIRING | OFFERING |
|--------|--------|----------|
| من ينشر؟ | صاحب العمل | السائق |
| من يتقدم؟ | السائقون المتحققون (isVerified) | أصحاب العمل |
| القصد | "نريد سائقاً" | "أنا متاح للعمل" |

---

## 4. رحلة صاحب العمل (Employer Journey)

```
1. إنشاء ملف صاحب العمل
   POST /jobs/employer-profile
   → companyName, industry, governorate, contactPhone

2. نشر وظيفة (HIRING)
   POST /jobs
   body: { jobType: 'HIRING', title, description, employmentType,
           salary, licenseTypes[], governorate, ... }
   → يُرسَل للـ Meilisearch فوراً
   → يصبح ACTIVE تلقائياً

3. استقبال الطلبات
   GET /jobs/:id/applications
   → قائمة المتقدمين مع الرسائل والـ resumeUrl

4. مراجعة الطلب + القرار
   PATCH /jobs/applications/:appId
   body: { status: 'ACCEPTED' | 'REJECTED' }
   → يصلي المتقدم إشعار JOB_APPLICATION_ACCEPTED / JOB_APPLICATION_REJECTED

5. إغلاق الوظيفة (اختياري)
   PATCH /jobs/:id
   body: { status: 'CLOSED' }

6. الاستعراض عبر Dashboard
   GET /jobs/my → MyPostsList بفلتر status
   Role: Employer tab
```

---

## 5. رحلة المتقدم للوظيفة (Applicant Journey)

```
1. إنشاء ملف السائق
   POST /jobs/driver-profile
   → licenseTypes[], vehicleTypes[], experienceYears, governorate

2. التحقق من الهوية (اختياري لكن مُوصى به)
   POST /jobs/verification/submit
   → رفع licenseImageUrl + idImageUrl
   → الحالة: PENDING → APPROVED / REJECTED (من الـ Admin)
   → عند APPROVED: isVerified = true على DriverProfile
               + إشعار SYSTEM للمستخدم

3. البحث عن وظائف
   GET /jobs?jobType=HIRING&governorate=...&licenseType=...
   أو عبر صفحة /jobs/browse

4. التقديم على وظيفة
   POST /jobs/:id/apply
   body: { message (10-500 حرف), resumeUrl? (URL اختياري) }
   → يصل إشعار JOB_APPLICATION لصاحب الوظيفة
   → الحالة: PENDING

5. متابعة الطلبات
   GET /jobs/my-applications (عبر Dashboard → My Proposals)
   أو صفحة /jobs/my-proposals

6. سحب الطلب (إذا لا يزال PENDING)
   POST /jobs/applications/:id/withdraw
   → يصل إشعار JOB_APPLICATION_WITHDRAWN لصاحب الوظيفة
   → الحالة تصبح WITHDRAWN

7. استقبال الرد
   PATCH /jobs/applications/:id (من صاحب الوظيفة)
   → إشعار ACCEPTED أو REJECTED
```

---

## 6. جميع الصفحات (Frontend Pages)

### صفحات المستخدم العام

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/jobs` | `jobs/page.tsx` | الصفحة الرئيسية: Hero + 3 أقسام (أحدث HIRING، أبرز السائقين، أحدث OFFERING) + كيف يعمل + CTA |
| `/jobs/browse` | `jobs/browse/page.tsx` | تصفح كامل مع فلاتر Sidebar (jobType, employmentType, governorate, licenseType, sortBy)، بحث بـ debounce 300ms، pagination (max 7 صفحات) |
| `/jobs/[id]` | `jobs/[id]/page.tsx` + `job-detail-client.tsx` | تفاصيل الوظيفة: وصف + شروط + نموذج التقديم + قائمة Proposals (للمالك) + إحصائيات المالك |
| `/jobs/drivers` | `jobs/drivers/page.tsx` | دليل السائقين (بحث + فلترة) |
| `/jobs/drivers/[id]` | — | ملف سائق مع التقييمات |

### صفحات مُقيَّدة بالتسجيل

| المسار | الملف | الوصف |
|--------|-------|-------|
| `/jobs/dashboard` | `jobs/dashboard/page.tsx` | لوحة التحكم: Role Switcher + إحصائيات + قائمة وظائفي/طلباتي + بانر التحقق |
| `/jobs/onboarding` | `jobs/onboarding/page.tsx` | خطوتان: اختر DRIVER/EMPLOYER → ملء البيانات؛ يُعاد توجيه للـ Dashboard إذا كلا الملفين موجودان |
| `/jobs/verification` | `jobs/verification/page.tsx` | رفع صورة الرخصة + الهوية (drag-and-drop)؛ يعرض حالة التحقق الحالية |
| `/jobs/my-proposals` | `jobs/my-proposals/page.tsx` | يُعيد التوجيه إلى `/jobs/dashboard` (تمّ دمجه — لا تستخدم هذا المسار) |
| `/jobs/create` | — | نموذج إنشاء وظيفة |

---

## 7. جميع الـ APIs (Backend Endpoints)

### وظائف العامة (Public)

| Method | Path | الوصف |
|--------|------|-------|
| `GET` | `/jobs` | قائمة الوظائف مع فلاتر + pagination (cached Redis 300s) |
| `GET` | `/jobs/:id` | تفاصيل وظيفة (by id أو slug) + increment viewCount via Redis |
| `GET` | `/jobs/drivers` | دليل السائقين مع فلاتر |
| `GET` | `/jobs/drivers/:id` | ملف سائق بالتفاصيل |
| `GET` | `/jobs/drivers/:id/reviews` | تقييمات السائق |
| `GET` | `/jobs/employers/:id` | ملف صاحب عمل |

### وظائف تتطلب مصادقة (Auth Required)

| Method | Path | الوصف | من يستخدمه |
|--------|------|-------|-----------|
| `POST` | `/jobs` | إنشاء وظيفة | أي مستخدم |
| `PATCH` | `/jobs/:id` | تعديل وظيفة | المالك فقط |
| `DELETE` | `/jobs/:id` | حذف وظيفة | المالك فقط |
| `GET` | `/jobs/my` | وظائفي | المالك |
| `POST` | `/jobs/:id/apply` | التقديم على وظيفة | غير المالك |
| `GET` | `/jobs/:id/applications` | عرض الطلبات | المالك فقط |
| `PATCH` | `/jobs/applications/:id` | قبول/رفض طلب | مالك الوظيفة |
| `POST` | `/jobs/applications/:id/withdraw` | سحب الطلب | المتقدم فقط |
| `POST` | `/jobs/driver-profile` | إنشاء ملف سائق | المستخدم |
| `GET` | `/jobs/driver-profile/me` | عرض ملفي كسائق | المستخدم |
| `PATCH` | `/jobs/driver-profile` | تعديل ملف السائق | المستخدم |
| `POST` | `/jobs/employer-profile` | إنشاء ملف صاحب عمل | المستخدم |
| `GET` | `/jobs/employer-profile/me` | عرض ملفي كصاحب عمل | المستخدم |
| `PATCH` | `/jobs/employer-profile` | تعديل ملف صاحب العمل | المستخدم |
| `POST` | `/jobs/verification/submit` | رفع طلب تحقق | السائق |
| `GET` | `/jobs/verification/status` | حالة التحقق الخاصة بي | السائق |

### وظائف الـ Admin (ADMIN Role)

| Method | Path | الوصف |
|--------|------|-------|
| `GET` | `/admin/jobs` | قائمة كل الوظائف مع فلاتر |
| `GET` | `/admin/jobs/stats` | إحصائيات: jobs/apps/drivers/employers/verifications |
| `PATCH` | `/admin/jobs/:id` | تعطيل/تفعيل وظيفة |
| `DELETE` | `/admin/jobs/:id` | حذف وظيفة |
| `GET` | `/admin/jobs/drivers` | قائمة السائقين |
| `GET` | `/admin/jobs/employers` | قائمة أصحاب العمل |
| `GET` | `/admin/jobs/verifications` | طلبات التحقق المعلقة |
| `PATCH` | `/admin/jobs/verifications/:id` | مراجعة طلب تحقق (APPROVE/REJECT) |

### معامِلات الفلترة لـ `GET /jobs`

```
?status=ACTIVE|CLOSED|EXPIRED      (default: ACTIVE)
?jobType=HIRING|OFFERING
?employmentType=FULL_TIME|PART_TIME|TEMPORARY|CONTRACT
?governorate=string
?userId=string
?licenseType=LIGHT|HEAVY|TRANSPORT|BUS|MOTORCYCLE
?search=string                      (OR على title + description)
?sortBy=createdAt|salary|experienceYears|viewCount
?order=asc|desc
?page=1&limit=20
```

---

## 8. جميع الـ Statuses

### JobStatus — حالة الوظيفة

```
ACTIVE ──────► CLOSED     (يدوياً من المالك أو Admin)
ACTIVE ──────► EXPIRED    (تلقائياً بعد 30 يوم — Cron 4 صباحاً)
```

| الحالة | المعنى | الانتقال |
|--------|--------|---------|
| `ACTIVE` | الوظيفة مفعّلة، تقبل طلبات | → CLOSED (يدوي), → EXPIRED (تلقائي) |
| `CLOSED` | أُغلقت يدوياً | نهائية — لا تقبل طلبات |
| `EXPIRED` | انتهت تلقائياً بعد 30 يوم | نهائية — لا تقبل طلبات |

### ApplicationStatus — حالة الطلب

```
PENDING ──────► ACCEPTED
        ──────► REJECTED
        ──────► WITHDRAWN
```

| الحالة | من يغيّرها؟ | الإشعار المُرسَل |
|--------|------------|----------------|
| `PENDING` | الحالة الأولية عند التقديم | — |
| `ACCEPTED` | مالك الوظيفة | `JOB_APPLICATION_ACCEPTED` → للمتقدم |
| `REJECTED` | مالك الوظيفة | `JOB_APPLICATION_REJECTED` → للمتقدم |
| `WITHDRAWN` | المتقدم نفسه | `JOB_APPLICATION_WITHDRAWN` → للمالك |

**قاعدة صارمة**: لا يمكن الانتقال إلا من `PENDING`. طلب مقبول/مرفوض لا يمكن تعديله.

```typescript
const VALID_TRANSITIONS = { PENDING: ['ACCEPTED', 'REJECTED', 'WITHDRAWN'] };
```

### VerificationStatus — حالة التحقق من السائق

```
PENDING ──────► APPROVED  → isVerified = true على DriverProfile
        ──────► REJECTED  → يمكن إعادة التقديم
```

### الأنواع الأخرى (Enums)

```
EmploymentType: FULL_TIME | PART_TIME | TEMPORARY | CONTRACT
SalaryPeriod:   DAILY | MONTHLY | YEARLY | NEGOTIABLE
LicenseType:    LIGHT | HEAVY | TRANSPORT | BUS | MOTORCYCLE
JobType:        HIRING | OFFERING
```

---

## 9. جميع Business Rules

### قواعد إنشاء الوظيفة

1. يجب أن يكون المستخدم مسجلاً (JWT Guard)
2. الوظيفة تصبح `ACTIVE` فوراً عند الإنشاء
3. `slug` يُولَّد تلقائياً من العنوان (`generateSlug`)
4. يُفهرَس في Meilisearch فوراً بعد الإنشاء
5. Redis cache يُمسَح لضمان ظهور الوظيفة الجديدة

### قواعد التقديم

1. لا يمكن التقديم على وظيفة ليست `ACTIVE`
2. لا يمكن المالك التقديم على وظيفته (`self-apply guard`)
3. لا يمكن التقديم مرتين (`@@unique([jobId, applicantId])` + ConflictException)
4. **قاعدة النوع**:
   - وظيفة `HIRING` → يتقدم عليها **السائقون فقط** (`isDriver = true`)
   - وظيفة `OFFERING` → يتقدم عليها **أصحاب العمل فقط** (`isEmployer = true`)
5. السائق المُحقَّق منه (`isVerified = true`) يحظى بميزات إضافية في العرض

### قواعد تغيير حالة الطلب

1. فقط مالك الوظيفة يستطيع قبول/رفض
2. فقط المتقدم نفسه يستطيع السحب
3. التحولات المسموح بها: `PENDING → ACCEPTED | REJECTED | WITHDRAWN` فقط
4. محاولة تغيير حالة غير PENDING → استثناء (`BadRequestException`)

### قواعد التعديل والحذف

1. فقط مالك الوظيفة يستطيع التعديل (ownership check via `userId`)
2. يمكن تغيير Status عبر PATCH إلى `CLOSED` فقط (لا يمكن إعادتها لـ ACTIVE من المالك)
3. الحذف يُطلق `cleanupPolymorphicOrphans` لتنظيف البيانات المرتبطة
4. بعد الحذف: يُحذَف من Meilisearch + يُمسَح Redis cache

### قاعدة انتهاء الصلاحية التلقائية (Cron)

```typescript
@Cron(EVERY_DAY_AT_4AM)  // 4:00 صباحاً يومياً
expireOldJobs():
  UPDATE DriverJob
  SET status = 'EXPIRED'
  WHERE status = 'ACTIVE'
    AND createdAt < NOW() - 30 days
```

### قواعد التحقق (Verification)

1. السائق يرفع صورة رخصة القيادة + صورة الهوية
2. Admin يراجع ويقبل أو يرفض مع ملاحظات
3. عند القبول: `isVerified = true` على `DriverProfile` + إشعار `SYSTEM` للمستخدم
4. عند الرفض: يمكن للسائق إعادة التقديم (حالة REJECTED لا تمنع تقديماً جديداً)

### قواعد العرض (View Count)

```typescript
// Rate-limited per IP via Redis
incrementViewCount(listingId, ip):
  if not Redis.exists(`view:jobs:${listingId}:${ip}`)
    Redis.setEx(`view:jobs:${listingId}:${ip}`, 3600, '1')  // 1 ساعة
    DB.increment(viewCount)
```

---

## 10. العلاقات بين النماذج (Data Model)

```
User
 ├── DriverProfile (1:1, optional)
 │    ├── DriverVerification[] (1:N)
 │    └── licenseTypes[], vehicleTypes[], ...
 ├── EmployerProfile (1:1, optional)
 └── DriverJob[] (1:N) — الوظائف التي نشرها

DriverJob
 ├── userId → User
 ├── applications[] → JobApplication[]
 └── jobType: HIRING | OFFERING

JobApplication
 ├── jobId → DriverJob
 ├── applicantId → User
 └── @@unique([jobId, applicantId])
```

### علاقة User ↔ DriverJob
```
User (1) ──────── (N) DriverJob
    "المستخدم ينشر وظائف"
```

### علاقة DriverJob ↔ JobApplication
```
DriverJob (1) ──────── (N) JobApplication
    "الوظيفة تستقبل طلبات"
    @@unique([jobId, applicantId]) — طلب واحد لكل مستخدم/وظيفة
```

### علاقة User ↔ JobApplication
```
User (1) ──────── (N) JobApplication
    (as applicant)
```

### علاقة User ↔ DriverProfile
```
User (1) ──────── (1) DriverProfile (optional)
    DriverProfile (1) ──── (N) DriverVerification
```

### علاقة User ↔ EmployerProfile
```
User (1) ──────── (1) EmployerProfile (optional)
```

---

## 11. من يرى ماذا (Visibility Rules)

| المحتوى | زائر | مستخدم مسجل | مالك الوظيفة | Admin |
|---------|------|-------------|-------------|-------|
| قائمة الوظائف `GET /jobs` | ✅ | ✅ | ✅ | ✅ |
| تفاصيل الوظيفة `GET /jobs/:id` | ✅ | ✅ | ✅ | ✅ |
| دليل السائقين | ✅ | ✅ | ✅ | ✅ |
| ملف سائق عام | ✅ | ✅ | ✅ | ✅ |
| قائمة المتقدمين `GET /jobs/:id/applications` | ❌ | ❌ | ✅ | ✅ |
| ملف سائق خاص بي | ❌ | ✅ (صاحبه فقط) | — | ✅ |
| طلباتي `my-proposals` | ❌ | ✅ (صاحبه) | — | ✅ |
| Dashboard | ❌ | ✅ | ✅ | ✅ |
| حالة التحقق الخاصة | ❌ | ✅ (صاحبه) | — | ✅ |
| لوحة Admin | ❌ | ❌ | ❌ | ✅ |

### قاعدة canApply (Frontend)
```typescript
const canApply =
  isAuthenticated &&
  !isJobOwner &&            // ليس المالك
  !alreadyApplied &&        // لم يتقدم مسبقاً
  job.status === 'ACTIVE' && // الوظيفة مفعّلة
  (
    (job.jobType === 'HIRING'   && isDriver)   || // HIRING → سائق فقط
    (job.jobType === 'OFFERING' && isEmployer)    // OFFERING → صاحب عمل فقط
  )
```

---

## 12. من يعدّل ماذا (Edit Permissions)

| الإجراء | من يستطيع تنفيذه |
|---------|-----------------|
| إنشاء وظيفة | أي مستخدم مسجل |
| تعديل وظيفة (عنوان/وصف/...) | مالك الوظيفة فقط (`userId` check) |
| إغلاق وظيفة | مالك الوظيفة + Admin |
| حذف وظيفة | مالك الوظيفة + Admin |
| قبول/رفض طلب | مالك الوظيفة فقط |
| سحب طلب | المتقدم (صاحب الطلب) فقط |
| تعديل ملف السائق | صاحب الملف فقط |
| تعديل ملف صاحب العمل | صاحب الملف فقط |
| مراجعة التحقق | Admin فقط |
| تعطيل/تفعيل وظائف | Admin فقط |
| إنهاء الصلاحية تلقائياً | Cron Job (system) |

---

## 13. Flow كامل: من إنشاء الوظيفة حتى إغلاقها

### Scenario A: HIRING (صاحب العمل يبحث عن سائق)

```
[صاحب العمل]
    │
    ├─ 1. POST /jobs/employer-profile          → إنشاء ملف (مرة واحدة)
    │
    ├─ 2. POST /jobs                           → إنشاء وظيفة HIRING
    │       body: { jobType:'HIRING', title, licenseTypes:['HEAVY'], ... }
    │       ← status: ACTIVE, slug يُولَّد, Meilisearch يُفهرَس
    │
    │   [النظام]
    │   ├─ Redis cache يُمسَح (jobs:list:*)
    │   └─ Meilisearch: document يُضاف
    │
    ├─ 3. [السائقون يرون الوظيفة]
    │       GET /jobs?jobType=HIRING&licenseType=HEAVY
    │
    ├─ 4. [سائق يتقدم]
    │       POST /jobs/:id/apply
    │       body: { message:'...', resumeUrl:'...' }
    │       ← ApplicationStatus: PENDING
    │       ← إشعار JOB_APPLICATION → لصاحب العمل
    │
    ├─ 5. صاحب العمل يراجع الطلب
    │       GET /jobs/:id/applications
    │       ← قائمة المتقدمين
    │
    ├─ 6. صاحب العمل يقبل أو يرفض
    │       PATCH /jobs/applications/:appId
    │       body: { status: 'ACCEPTED' }
    │       ← إشعار JOB_APPLICATION_ACCEPTED → للسائق
    │
    └─ 7. إغلاق الوظيفة
            PATCH /jobs/:id
            body: { status: 'CLOSED' }
            ← Meilisearch يُحدَّث, Redis يُمسَح
```

### Scenario B: OFFERING (السائق يعرض خدماته)

```
[السائق]
    │
    ├─ 1. POST /jobs/driver-profile            → إنشاء ملف (مرة واحدة)
    │
    ├─ 2. POST /jobs/verification/submit       → رفع المستندات (اختياري)
    │       body: { licenseImageUrl, idImageUrl }
    │       ← VerificationStatus: PENDING
    │
    │   [Admin]
    │   └─ PATCH /admin/jobs/verifications/:id
    │           body: { status:'APPROVED' }
    │           ← isVerified = true على DriverProfile
    │           ← إشعار SYSTEM → للسائق
    │
    ├─ 3. POST /jobs                           → نشر عرض الخدمة
    │       body: { jobType:'OFFERING', title:'سائق مرسيدس متاح', ... }
    │       ← status: ACTIVE
    │
    ├─ 4. [أصحاب العمل يتقدمون]
    │       POST /jobs/:id/apply
    │       ← إشعار JOB_APPLICATION → للسائق
    │
    ├─ 5. السائق يختار صاحب عمل
    │       PATCH /jobs/applications/:appId
    │       body: { status: 'ACCEPTED' }
    │       ← إشعار JOB_APPLICATION_ACCEPTED → لصاحب العمل
    │
    └─ 6. إغلاق العرض
            PATCH /jobs/:id
            body: { status: 'CLOSED' }
```

### Scenario C: انتهاء الصلاحية التلقائية

```
[Cron — 4:00 AM يومياً]
    │
    └─ expireOldJobs()
           UPDATE DriverJob
           SET status = 'EXPIRED'
           WHERE status = 'ACTIVE'
             AND createdAt < NOW() - INTERVAL '30 days'
           ← لا إشعارات تُرسَل
           ← الوظيفة تختفي من نتائج البحث (default filter: ACTIVE)
```

### Scenario D: سحب الطلب

```
[المتقدم]
    │
    └─ POST /jobs/applications/:id/withdraw
           ← فحص: status === 'PENDING' (فقط PENDING يمكن سحبه)
           ← فحص: applicantId === currentUser.id
           ← ApplicationStatus: WITHDRAWN
           ← إشعار JOB_APPLICATION_WITHDRAWN → لمالك الوظيفة
```

---

## 14. التخزين المؤقت (Caching Strategy)

```
Redis Keys:
  jobs:list:{hash_of_params}    TTL: 300s  (5 دقائق)
  jobs:detail:{id}              TTL: 600s  (10 دقائق)
  view:jobs:{id}:{ip}           TTL: 3600s (ساعة — لمنع تكرار عدّ المشاهدات)

Invalidation:
  - POST /jobs              → delPattern('jobs:list:*')
  - PATCH /jobs/:id         → del('jobs:detail:{id}') + delPattern('jobs:list:*')
  - DELETE /jobs/:id        → del('jobs:detail:{id}') + delPattern('jobs:list:*')
```

---

## 15. البحث (Search — Meilisearch)

```
Index: 'jobs'

يُفهرَس عند:
  - إنشاء وظيفة (create)
  - تعديل وظيفة (update)

يُحذَف عند:
  - حذف وظيفة (remove)

حقول البحث:
  title, description (بحث نصي كامل)

فلاتر متاحة عبر Meilisearch:
  status, jobType, governorate, licenseTypes
```

---

## 16. الإشعارات المستخدمة في قسم الوظائف

| الحدث | نوع الإشعار | من يستقبله | data المرسلة |
|-------|------------|-----------|-------------|
| سائق يتقدم على وظيفة | `JOB_APPLICATION` | مالك الوظيفة | `{ jobId }` |
| قبول طلب | `JOB_APPLICATION_ACCEPTED` | المتقدم | `{ jobId }` |
| رفض طلب | `JOB_APPLICATION_REJECTED` | المتقدم | `{ jobId }` |
| سحب طلب | `JOB_APPLICATION_WITHDRAWN` | مالك الوظيفة | `{ jobId }` |
| توصية وظيفة | `JOB_RECOMMENDATION` | السائق | `{ jobId }` |
| قبول التحقق | `SYSTEM` | السائق | `{ jobId? }` |

### navigateTo للإشعارات

```typescript
JOB_APPLICATION           → /jobs/${d.jobId}
JOB_APPLICATION_ACCEPTED  → /jobs/${d.jobId}
JOB_APPLICATION_REJECTED  → /jobs/${d.jobId}
JOB_APPLICATION_WITHDRAWN → /jobs/${d.jobId} || '/jobs'
JOB_RECOMMENDATION        → /jobs/${d.jobId} || '/jobs'
SYSTEM (with jobId)        → /jobs/${d.jobId}  (fallback في SYSTEM.navigateTo)
```

---

## 17. هيكل الملفات

```
apps/api/src/jobs/
├── jobs.module.ts
├── jobs.controller.ts              ← User-facing endpoints
├── jobs.service.ts                 ← Core business logic
├── admin-jobs.controller.ts        ← Admin endpoints (/admin/jobs/*)
├── admin-jobs.service.ts           ← Admin business logic
├── driver-profile.service.ts       ← Driver profile CRUD
├── employer-profile.service.ts     ← Employer profile CRUD
├── driver-verification.service.ts  ← Verification flow
├── job-expiry.service.ts           ← Cron: auto-expire after 30 days
└── dto/
    ├── create-job.dto.ts
    ├── query-jobs.dto.ts
    └── ...

apps/web/src/app/[locale]/jobs/
├── page.tsx                        ← Landing page
├── browse/page.tsx                 ← Browse + filters
├── [id]/
│   ├── page.tsx
│   └── job-detail-client.tsx       ← Detail + apply form + owner panel
├── dashboard/page.tsx              ← My jobs + my proposals + role switcher
├── onboarding/page.tsx             ← Create driver/employer profile
├── verification/page.tsx           ← Submit + view verification status
├── my-proposals/page.tsx           ← Driver's applications list
└── create/page.tsx                 ← Create job form

apps/web/src/features/jobs/
├── types.ts                        ← TypeScript interfaces
└── components/
    ├── JobCard.tsx
    └── ...

apps/web/src/lib/api/
└── jobs.ts                         ← All React Query hooks
```

---

## 18. ملخص سريع (TL;DR)

| السؤال | الإجابة |
|--------|---------|
| ما نوعا الوظائف؟ | HIRING (يطلب عمالة) و OFFERING (يعرض خدمة) |
| من ينشر HIRING؟ | أصحاب العمل (EmployerProfile) |
| من ينشر OFFERING؟ | السائقون (DriverProfile) |
| متى تنتهي الوظيفة؟ | بعد 30 يوم تلقائياً أو يدوياً من المالك |
| هل يجب التحقق للتقديم؟ | لا (لكن isVerified = ميزة في العرض) |
| هل المستخدم يمكن أن يكون كلاهما؟ | نعم — يرى Role Switcher في Dashboard |
| ما حالات الطلب؟ | PENDING → ACCEPTED / REJECTED / WITHDRAWN |
| أين يُخزَّن cache؟ | Redis — TTL 300s للقوائم، 600s للتفاصيل |
| أين يُفهرَس البحث؟ | Meilisearch — فهرسة فورية عند الإنشاء/التعديل |
