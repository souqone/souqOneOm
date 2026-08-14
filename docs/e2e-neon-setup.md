# إعادة تجهيز بيئة E2E (Neon Test Branch) — بعد انتهاء الصلاحية

> استخدم هذا الملف كـ prompt/checklist تبعته لـ Cascade أو تنفذه بنفسك خطوة بخطوة
> كل ما ينتهي الـ Neon branch (حد أقصى 30 يوم على الخطة الحالية).

---

## 0. السياق (اقرأه أو الصقه في أول رسالة لـ Cascade)

```
مشروع SouqOne — apps/api (NestJS + Prisma + PostGIS).
عندي Location Module (governorates/wilayas) + GeoService (syncLocation/clearLocation)
مختبرين بالكامل: Phase 1 (Unit) + Phase 2 (Security/Unit) + Phase 6 (Migration Data)
شغالين بدون DB بالفعل (90/90 ناجح، ملفات موجودة في:
  src/locations/__tests__/locations.service.spec.ts
  src/locations/__tests__/geo.service.spec.ts
  src/__tests__/migrate-data.spec.ts)

المطلوب الآن: إعادة تجهيز Neon test branch من الصفر لتشغيل Phase 3 (PostGIS Integration)
و Phase 5 (E2E API) الموجودين في test/locations.e2e-spec.ts، لأن آخر test branch
(test-e2e) انتهت صلاحيته.

نفّذ الخطوات التالية بالترتيب واعرض لي نتيجة كل أمر قبل الانتقال للي بعده.
```

---

## 1. إنشاء Neon Branch جديد

```bash
neonctl branches create --name test-e2e --parent main
# أو من الداشبورد: Neon Console → Project → Branches → Create Branch
```

- **مهم:** خُد الـ connection string الجديد اللي هيظهر (هيكون مختلف عن أي branch سابق).
- حدد expiration خلال حدود الخطة (30 يوم كحد أقصى على الخطة الحالية):
```bash
neonctl branches update test-e2e --expires-at <YYYY-MM-DD>
```

---

## 2. تحديث `.env.test`

الملف في: `apps/api/.env.test`

```env
DATABASE_URL="postgresql://<user>:<password>@<new-endpoint>.neon.tech/neondb?sslmode=require"
API_PORT=4001
NODE_ENV=test
```

> ⚠️ استخدم الـ **pooled connection string** (فيها `-pooler` في الـ hostname) لو حصلت مشاكل اتصال —
> ده اللي حل مشكلة الاتصال آخر مرة.

---

## 3. دفع الـ Schema (بدون shadow DB migration loop)

```bash
cd apps/api
npx prisma db push --schema=prisma/schema.prisma
```

> لا تستخدم `prisma migrate dev` على هذا الـ branch — بيحاول ينشئ shadow database
> ويشغل كل الـ migrations من البداية، وده سبب التعطل اللي حصل قبل كده.

---

## 4. تفعيل PostGIS + أعمدة الـ Geography

```bash
npx ts-node prisma/add-postgis.ts
```

يتأكد من:
- `CREATE EXTENSION IF NOT EXISTS postgis;`
- إنشاء أعمدة `geography(Point, 4326)` + GIST indexes على الجداول الـ 12
  (بما فيهم `fromLocation` / `toLocation` في `transport_requests`)

**تحقق يدوي (اختياري لكن مفيد لو فيه مشكلة):**
```sql
SELECT COUNT(*) FROM pg_extension WHERE extname = 'postgis';
-- المتوقع: 1
```

---

## 5. Seed بيانات المحافظات والولايات

```bash
npx ts-node prisma/seed-locations.ts
```

المتوقع: 11 محافظة + 63 ولاية.

---

## 6. تشغيل اختبارات E2E

```bash
npx jest --config jest-e2e.config.js test/locations.e2e-spec.ts --runInBand --no-coverage --verbose
```

**النتيجة المتوقعة:** 9/9 ناجح (5 E2E API + 4 PostGIS Integration).

لو فشل، أول حاجات تتأكد منها بالترتيب:
1. الـ connection string في `.env.test` هو الـ pooled واحد وصحيح.
2. `global-setup.ts` و `cleanup.ts` بيقروا من `.env.test` مش من `.env` العادي.
3. PostGIS extension فعلاً متفعلة (خطوة 4).
4. Seed اتنفذ بنجاح (خطوة 5) ومفيش duplicate key errors.

---

## 7. تشغيل كل الـ Suite مع بعض (Sanity check نهائي)

```bash
npx jest --testPathPattern="locations.service|geo.service|migrate-data" --no-coverage
npx jest --config jest-e2e.config.js test/locations.e2e-spec.ts --runInBand --no-coverage
```

**الإجمالي المتوقع: 100/100** (91 بدون DB + 9 مع DB).

---

## ملاحظات دائمة (لا تتغير مع كل branch جديد)

- **لا تستخدم أبداً** الـ connection string بتاع الـ production (`ep-lucky-violet-am7554ay...`)
  في `.env.test` — تأكد إن الـ hostname مختلف قبل ما تشغل أي أمر.
- `prisma.service.ts` بيقرأ `DATABASE_URL` ديناميكياً من الـ environment، فمفيش داعي لأي تعديل
  إضافي عليه غير تغيير `.env.test`.
- `cleanup.ts` بيستثني جداول الـ seed الثابتة (`governorates`, `wilayas`, `brands`, `car_models`)
  من الحذف — لو ضفت جدول seed جديد، ضيفه لقائمة الاستثناء برضو.
