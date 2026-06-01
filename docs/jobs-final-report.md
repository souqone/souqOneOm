# Jobs Module Final Report

## 1. Implemented Features
* نظام إنشاء الوظائف بنوعيها (HIRING / OFFERING).
* تصفح الوظائف وقائمة السائقين.
* نظام تقديم العروض (Job Applications) شامل (التقديم، القبول، الرفض، السحب).
* نظام الـ Onboarding المزدوج (Driver / Employer).
* لوحة تحكم (Dashboard) ذكية تدعم التبديل بين الأدوار في حال كان للمستخدم أكثر من ملف شخصي.
* تدفق لتوثيق السائقين (Verification Flow).

## 2. Broken Features
* نظام الترجمة مكسور (Broken Localization): عند تبديل لغة الموقع للإنجليزية، ستظل واجهة قسم الوظائف بالعربية بالكامل بسبب الاعتماد على نصوص ثابتة (Hardcoded) متجاوزة الـ `next-intl`.
  * **Evidence:** `apps/web/src/features/jobs/constants.ts` سطر `107` (`STRINGS`).
* لا توجد أخطاء برمجية قاتلة (Fatal Bugs) واضحة من الكود، لكن تجاهل نظام الترجمة يُعتبر Feature مكسورة.

## 3. Missing Features
* إمكانية حفظ أو تفضيل (Bookmark/Favorite) وظيفة أو سائق للعودة إليها لاحقاً (مقارنة بأنظمة التوظيف المعتادة).

## 4. UX Gaps
* **طول نموذج التسجيل:** نموذج الـ Onboarding الخاص بالسائق (`onboarding/page.tsx`) يعرض 4 أقسام دسمة في شاشة واحدة بدلاً من استخدام معالج خطوات حقيقي (Wizard) مما قد يسبب إرهاقاً بصرياً (Cognitive Load).
  * **Evidence:** `apps/web/src/app/[locale]/jobs/onboarding/page.tsx` الأسطر `297` وما بعدها (Form Rendering).

## 5. Accessibility Gaps
* أزرار الاختيار الكبيرة (Cards) في صفحة الـ Onboarding لتحديد نوع الحساب تفتقر إلى `aria-pressed` للإشارة بوضوح إلى العنصر المحدد لمستخدمي قارئات الشاشة.
  * **Evidence:** `apps/web/src/app/[locale]/jobs/onboarding/page.tsx` سطر `274` (`<button key={...} onClick={handleSelectType}>`).

## 6. Hardcoded Content
تم اكتشاف محتوى عربي ثابت بشكل واسع يخرق معايير العمارة في التطبيق:
* `apps/web/src/features/jobs/constants.ts`: سطر `107` (كائن `STRINGS` الضخم).
* `apps/web/src/features/jobs/constants.ts`: سطر `23` (`LICENSE_TYPE_LABELS`).
* `apps/web/src/app/[locale]/jobs/dashboard/page.tsx`: سطر `174` (`<h1 className="text-2xl...">لا يوجد بروفايل</h1>`).
* `apps/web/src/app/[locale]/jobs/onboarding/page.tsx`: سطر `311` (`{ n: 1, label: 'الرخصة' }`).

## 7. Code Smells
* **God Components:** ملف `onboarding/page.tsx` يمتد لـ 658 سطراً، ويقوم بإدارة الحالة للملفين (سائق وصاحب عمل) مع جميع الـ UI والـ Validations في مكان واحد.
  * **Evidence:** `apps/web/src/app/[locale]/jobs/onboarding/page.tsx` (كامل الملف).
* **UI Data Transformation:** داخل الـ `dashboard/page.tsx`، الأسطر من `56` إلى `138` تقوم بعمل Data Mapping ثقيل لتحويل استجابات الـ API لتطابق الواجهات. هذا خرق لمبدأ فصل الاهتمامات (Separation of Concerns).

## 8. Technical Debt
* ملف الـ `api.ts` (`apps/web/src/lib/api/jobs.ts`) يحتوي على 461 سطراً يجمع بين الـ Interfaces والـ React Query Hooks كلها في ملف واحد عملاق بدلاً من تقسيمها لمجلدات `/types` و `/hooks`.

## 9. Recommended Fixes
1. **Localization Fix:** تفريغ كل الـ Hardcoded Strings من `constants.ts` ومن مكونات الـ UI، وإضافتها لملفات الـ `messages/ar.json` و `messages/en.json` واستخدام `useTranslations('jobs')`.
2. **Component Splitting:** تقسيم `onboarding/page.tsx` إلى مكونات أصغر: `DriverProfileForm.tsx` و `EmployerProfileForm.tsx`.
3. **Custom Hooks:** استخراج الـ Data Mapping المعقد في الـ Dashboard إلى هوك مخصص `useDashboardData()` لتبسيط صفحة الـ Dashboard وجعلها قابلة للاختبار.
4. **Accessibility:** إضافة `aria-attributes` (مثل `aria-label`, `aria-pressed`) للعناصر التفاعلية المخصصة (Custom Buttons/Cards).
