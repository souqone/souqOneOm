أنت Staff Software Architect وخبير Reverse Engineering للأنظمة.

مهمتك هي قراءة نظام النقل بالكامل (Frontend + Backend + Database + APIs + Types + Validation + Business Logic) ثم إنشاء ملف توثيق شامل باسم:

TRANSPORT_SYSTEM_ARCHITECTURE.md

لا تكتفِ بوصف الملفات أو المجلدات.
المطلوب فهم النظام فعلياً كما يعمل في الإنتاج.

---

# المطلوب بالتفصيل

## 1. Executive Summary

اشرح:

* ما هو نظام النقل؟
* ما هي المشكلة التي يحلها؟
* ما هي أنواع المستخدمين؟
* كيف تتفاعل الأطراف مع بعضها؟

---

## 2. Actors / Roles

استخرج كل الأدوار الموجودة.

لكل Role اشرح:

* الاسم
* الوصف
* الصلاحيات
* ما الذي يمكنه رؤيته
* ما الذي يمكنه تعديله
* ما الذي لا يمكنه الوصول إليه

مثال:

### Shipper

...

### Carrier

...

### Admin

...

---

## 3. Domain Model

استخرج جميع الكيانات الأساسية.

مثال:

* Transport Request
* Quote
* Booking
* Carrier Profile
* Review
* Vehicle Type
* Service Type

لكل كيان:

* الغرض منه
* الحقول المهمة
* العلاقات مع الكيانات الأخرى

---

## 4. Complete User Journeys

أنشئ Flow تفصيلي لكل رحلة مستخدم.

### Shipper Journey

من:

* التسجيل

حتى:

* إنشاء طلب

ثم:

* استقبال عروض

ثم:

* قبول عرض

ثم:

* إنشاء الحجز

ثم:

* اكتمال الرحلة

ثم:

* التقييم

اشرح كل خطوة.

---

### Carrier Journey

من:

* التسجيل

حتى:

* onboarding

ثم:

* تصفح الطلبات

ثم:

* تقديم عرض

ثم:

* متابعة الحجز

ثم:

* بدء النقل

ثم:

* انتهاء الرحلة

---

## 5. State Machines

استخرج جميع الـstatuses.

### Request Status Lifecycle

مثال:

DRAFT
→ OPEN
→ QUOTED
→ BOOKED
→ COMPLETED

أو أي Statuses حقيقية موجودة بالكود.

اشرح:

* من يغير الحالة
* متى تتغير
* ما هي الشروط

---

### Booking Status Lifecycle

اشرح نفس الشيء.

---

### Quote Status Lifecycle

اشرح نفس الشيء.

---

## 6. Page Inventory

راجع جميع الصفحات.

لكل صفحة اكتب:

### Route

مثال:
`/transport/requests/[id]`

### Purpose

### Allowed Roles

### APIs Called

### Actions Available

### Navigation Paths

### Dependencies

---

## 7. API Inventory

استخرج جميع API endpoints المستخدمة.

لكل Endpoint:

* Method
* URL
* Caller Pages
* Required Permissions
* Request Payload
* Response Shape
* Side Effects

---

## 8. Business Rules

استخرج جميع القواعد المخفية داخل الكود.

أمثلة:

* لا يمكن قبول أكثر من عرض.
* لا يمكن تعديل الطلب بعد إنشاء Booking.
* الشاحن فقط يستطيع إكمال الرحلة.
* الناقل لا يستطيع تقييم نفسه.

اكتب كل قاعدة مكتشفة.

---

## 9. Permissions Matrix

أنشئ جدولاً:

| Action | Shipper | Carrier | Admin |
| ------ | ------- | ------- | ----- |

مثل:

Create Request
Edit Request
Cancel Request
Submit Quote
Accept Quote
Start Booking
Complete Booking
Review Carrier

---

## 10. Data Flow Diagrams

اشرح تدفق البيانات:

Frontend
→ API
→ Service
→ Database

لكل عملية أساسية.

---

## 11. Sequence Diagrams

أنشئ Sequence Flow نصي لكل عملية رئيسية:

### Accept Quote

### Create Booking

### Cancel Request

### Complete Booking

---

## 12. Hidden Assumptions

استخرج الافتراضات غير الموثقة داخل الكود.

مثل:

* يفترض وجود Carrier Profile.
* يفترض وجود رقم واتساب صحيح.
* يفترض وجود Quote واحد مقبول فقط.

---

## 13. Dead Code & Unused Flows

حدد:

* الملفات غير المستخدمة
* hooks غير المستخدمة
* APIs غير المستخدمة
* routes المهجورة

---

## 14. Gaps & Risks

استخرج:

* Authorization Risks
* Data Integrity Risks
* UX Risks
* Scalability Risks

---

# قواعد مهمة

* لا تعتمد على أسماء الملفات فقط.
* تتبع الاستدعاءات الفعلية.
* تتبع الـimports والـroutes.
* تتبع الـAPI usage.
* تتبع الـstatus transitions.
* تتبع الـbusiness rules.

إذا وجدت تضارباً بين الواجهة والباك إند فاذكره.

إذا وجدت سلوكاً غير موثق فاذكره.

الهدف النهائي:
أن يتمكن مطور جديد من فهم نظام النقل بالكامل من هذا الملف فقط دون الحاجة لقراءة الكود.
