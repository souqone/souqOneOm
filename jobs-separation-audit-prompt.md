# Agent Prompt — Jobs Separation Audit
# اقرأ وأجب — لا تعدل أي كود

---

## المهمة

أنا محتاج أفهم كيف Jobs متضمنة حالياً في الـ ListingShellPage
قبل ما أفصلها لـ domain مستقل.

اقرأ الملفات التالية وأجب على كل سؤال بدقة.
**لا تعدل أي كود — audit فقط.**

---

## الملفات اللي هتقرأها

```
# 1. الشيل الرئيسي
apps/web/src/features/listings/
  ← اقرأ كل الملفات في المجلد ده

# 2. الراوتينج
apps/web/src/app/[locale]/browse/
  ← اقرأ كل الملفات

# 3. الكونفيج
apps/web/src/lib/constants/
  ← ابحث عن أي ملف فيه category config أو listing types

# 4. الـ Jobs الحالية
apps/web/src/app/[locale]/jobs/
  ← اقرأ كل الملفات

# 5. الـ Navigation
apps/web/src/components/layout/navbar.tsx
apps/web/src/app/[locale]/page.tsx  (home page)

# 6. الـ i18n
apps/web/src/messages/ar.json
  ← ابحث عن كل keys بتبدأ بـ "job" أو "jobs"
```

---

## الأسئلة — أجب على كل واحدة

### Section A — البنية الحالية

```
A1. إيه المسار الكامل لملف ListingShellPage؟
    (مثال: apps/web/src/features/listings/components/ListingShellPage.tsx)

A2. إيه الـ props بتاعة ListingShellPage؟
    اكتب الـ interface أو type بالكامل.

A3. إزاي jobs بتتعرف جوا الـ ShellPage؟
    - في case 'jobs' في switch؟
    - في CATEGORIES_CONFIG؟
    - في props من الـ page.tsx؟
    اكتب الكود المحدد مع رقم السطر.

A4. إيه الـ URL الحالي لصفحة الوظائف؟
    - /browse/jobs ؟
    - /jobs ؟
    - حاجة تانية؟
```

---

### Section B — الـ Config

```
B1. في فين الـ CATEGORIES_CONFIG أو ما يعادله؟
    اكتب المسار الكامل للملف.

B2. إيه الـ config الخاص بـ jobs بالكامل؟
    انسخ الكود كما هو.

B3. في فين الـ filters الخاصة بـ jobs متعرفة؟
    - في نفس الـ config؟
    - في ملف منفصل؟
    اكتب المسار + الكود.

B4. في فين الـ JobCard أو الكارد اللي بيعرض الوظيفة في القائمة؟
    اكتب المسار الكامل.
    لو مفيش كارد خاص — قول ده.
```

---

### Section C — الـ API والـ Hooks

```
C1. إيه الـ hook اللي بتجيب الوظائف في القائمة؟
    - useJobs() ؟
    - useListings({ category: 'jobs' }) ؟
    اكتب الاسم + المسار.

C2. إيه الـ API endpoint اللي بيتكلم فيه؟
    - /api/v1/jobs ؟
    - /api/v1/listings?category=jobs ؟

C3. إيه شكل الـ response؟ (الـ fields المهمة)
    title, salary, jobType, employmentType, licenseTypes...
    اكتب الـ type أو interface لو موجود.
```

---

### Section D — الـ Navigation

```
D1. في الـ Navbar — فيه link لـ jobs؟
    اكتب الكود المحدد.

D2. في الـ Home page — فيه section للوظائف؟
    اكتب المسار والكود.

D3. في أي صفحة تانية فيها link بيروح لـ /browse/jobs أو /jobs؟
    اعمل grep وأجب:

    grep -r "browse/jobs\|/jobs" apps/web/src --include="*.tsx" --include="*.ts" -l
```

---

### Section E — الـ Job Detail

```
E1. صفحة تفاصيل الوظيفة — مسارها الكامل؟

E2. من أين بتيجي على صفحة التفاصيل؟
    - من /browse/jobs ؟
    - من /jobs ؟
    - من الـ Navbar مباشرة؟

E3. الـ breadcrumb في صفحة التفاصيل بيقول إيه؟
    اكتب النص الحالي.
```

---

### Section F — الـ i18n

```
F1. اعمل grep واجب:
    grep -n "jobs\|job" apps/web/src/messages/ar.json | head -50

F2. في navigation keys خاصة بـ jobs؟
    مثال: "navJobs", "menuJobs", etc.

F3. في category label key لـ jobs في الـ config؟
    مثال: "categoryJobs", "jobsTitle", etc.
```

---

### Section G — الـ Role Awareness

```
G1. هل الـ jobs listing page حالياً بتعرف role المستخدم؟
    (يعني بتعرف لو هو driver ولا employer ولا visitor؟)

G2. في الكارد الحالي للوظيفة — في أي action buttons؟
    اكتب الـ JSX.

G3. في فين useAuth() بيتاستخدم في الـ jobs flow؟
```

---

### Section H — الملفات اللي المفروض تتحذف

```
H1. لو هنعمل /jobs domain مستقل —
    إيه الملفات اللي هتبقى مش محتاجينها في الـ browse shell؟
    (اذكر المسارات الكاملة)

H2. في أي redirects محتاج نعملها؟
    من إيه لإيه؟

H3. في tests بتغطي jobs في الـ browse page؟
    grep -r "jobs\|browse" apps/web --include="*.test.*" --include="*.spec.*" -l
```

---

## Format الإجابة

```
# Jobs Separation Audit

## A — البنية الحالية
A1: [إجابتك]
A2: [إجابتك]
...

## B — الـ Config
B1: [إجابتك]
...

## ملخص — أهم 5 حاجات لازم تتعمل عشان الفصل
1. ...
2. ...
3. ...
4. ...
5. ...

## تحذيرات — حاجات ممكن تتكسر
- ...
```

---

## Hard Rules

- ❌ لا تعدل أي كود
- ❌ لا تحذف أي ملف
- ❌ لا تفترض — اقرأ الكود الفعلي وأجب
- ✅ لو ملف مش موجود — قول ده صراحة
- ✅ لو سؤال مش واضح من الكود — قول "غير واضح + السبب"
- ✅ اذكر رقم السطر لكل كود بتنقله
