/**
 * ExposePhone Policy Allowlist
 *
 * Single source of truth for all API routes allowed to expose the user `phone` field.
 * Any route returning `phone` without being explicitly decorated with `@ExposePhone()`
 * and registered in this allowlist will have `phone` stripped recursively by SanitizeInterceptor.
 *
 * Legacy fields (`contactPhone`, `whatsapp`, `phoneE164`) are ALWAYS stripped from all
 * public and private responses without exception.
 */

export interface ExposePhoneEntry {
  routeKey: string;
  controller: string;
  handler: string;
  justification: string;
}

export const EXPOSE_PHONE_ALLOWLIST: readonly ExposePhoneEntry[] = [
  // ─── Contact Gateway ───
  {
    routeKey: 'GET /contact/:entityType/:entityId',
    controller: 'ContactController',
    handler: 'getContact',
    justification: 'بوابة الاتصال الرسمية للمشترين بعد تسجيل الدخول وفحص الحد اليومي (50 كشف/يوم)',
  },

  // ─── Users Profile Self ───
  {
    routeKey: 'GET /users/me',
    controller: 'UsersController',
    handler: 'getProfile',
    justification: 'عرض الملف الشخصي للمستخدم صاحب الحساب نفسه',
  },
  {
    routeKey: 'PATCH /users/me',
    controller: 'UsersController',
    handler: 'updateProfile',
    justification: 'تحديث واسترجاع الملف الشخصي للمستخدم صاحب الحساب نفسه',
  },

  // ─── Auth Endpoints ───
  {
    routeKey: 'POST /auth/signup',
    controller: 'AuthController',
    handler: 'signup',
    justification: 'إرجاع بيانات الحساب المنشأ حديثاً للمستخدم نفسه عند التسجيل',
  },
  {
    routeKey: 'POST /auth/register',
    controller: 'AuthController',
    handler: 'signup',
    justification: 'مسار بديل للتسجيل يرجع بيانات المستخدم لنفسه',
  },
  {
    routeKey: 'POST /auth/login',
    controller: 'AuthController',
    handler: 'login',
    justification: 'إرجاع بيانات الحساب للمستخدم نفسه عند تسجيل الدخول',
  },
  {
    routeKey: 'POST /auth/google',
    controller: 'AuthController',
    handler: 'googleAuth',
    justification: 'إرجاع بيانات الحساب للمستخدم نفسه عند تسجيل الدخول عبر Google',
  },
  {
    routeKey: 'POST /auth/refresh',
    controller: 'AuthController',
    handler: 'refresh',
    justification: 'تجديد جلسة المستخدم المسجل وإرجاع بيانات الجلسة',
  },

  // ─── Jobs & Driver/Employer Profiles Self & Owner ───
  {
    routeKey: 'GET /jobs/driver-profile/me',
    controller: 'JobsController',
    handler: 'getMyDriverProfile',
    justification: 'عرض ملف السائق الخاص بالمستخدم صاحب الحساب نفسه',
  },
  {
    routeKey: 'GET /jobs/employer-profile/me',
    controller: 'JobsController',
    handler: 'getMyEmployerProfile',
    justification: 'عرض ملف صاحب العمل الخاص بالمستخدم صاحب الحساب نفسه',
  },
  {
    routeKey: 'GET /jobs/admin/verifications',
    controller: 'JobsController',
    handler: 'adminListVerifications',
    justification: 'مراجعة تراخيص وهويات السائقين من قبل مسؤولي النظام',
  },
  {
    routeKey: 'PATCH /jobs/admin/verifications/:id',
    controller: 'JobsController',
    handler: 'adminReviewVerification',
    justification: 'اتخاذ القرار الإداري بشأن التحقق من السائقين ومراجعة بياناتهم',
  },
  {
    routeKey: 'GET /jobs/:id/applications',
    controller: 'JobsController',
    handler: 'getApplications',
    justification: 'تمكين صاحب الوظيفة حصراً من الاتصال بالمتقدمين لوظيفته (قرار محمود المعتمد)',
  },

  // ─── Transport Carrier Self & Bookings Contract ───
  {
    routeKey: 'GET /transport/carrier-profile/me',
    controller: 'TransportController',
    handler: 'getMyCarrierProfile',
    justification: 'عرض ملف الناقل الخاص بالمستخدم صاحب الحساب نفسه',
  },
  {
    routeKey: 'GET /transport/bookings/:id',
    controller: 'TransportController',
    handler: 'getBooking',
    justification: 'تمكين طرفي الحجز (الشاحن والناقل) فقط من رؤية هاتف الآخر بعد قبول الحجز (قرار محمود المعتمد)',
  },

  // ─── Admin Controllers (Full Class Level) ───
  // AdminJobsController
  {
    routeKey: 'GET /admin/jobs',
    controller: 'AdminJobsController',
    handler: 'listJobs',
    justification: 'لوحة تحكم الإدارة لمراجعة وإدارة الوظائف',
  },
  {
    routeKey: 'GET /admin/jobs/stats',
    controller: 'AdminJobsController',
    handler: 'getStats',
    justification: 'لوحة تحكم الإدارة لإحصائيات الوظائف',
  },
  {
    routeKey: 'PATCH /admin/jobs/:id',
    controller: 'AdminJobsController',
    handler: 'updateJob',
    justification: 'لوحة تحكم الإدارة لتعديل بيانات الوظائف',
  },
  {
    routeKey: 'DELETE /admin/jobs/:id',
    controller: 'AdminJobsController',
    handler: 'deleteJob',
    justification: 'لوحة تحكم الإدارة لحذف الوظائف المخالفة',
  },
  {
    routeKey: 'GET /admin/jobs/drivers',
    controller: 'AdminJobsController',
    handler: 'listDrivers',
    justification: 'لوحة تحكم الإدارة لمراجعة السائقين المسجلين والتواصل معهم',
  },
  {
    routeKey: 'GET /admin/jobs/employers',
    controller: 'AdminJobsController',
    handler: 'listEmployers',
    justification: 'لوحة تحكم الإدارة لمراجعة أصحاب الأعمال المسجلين',
  },
  {
    routeKey: 'GET /admin/jobs/verifications',
    controller: 'AdminJobsController',
    handler: 'listVerifications',
    justification: 'لوحة تحكم الإدارة لمراجعة وثائق وتراخيص السائقين',
  },
  {
    routeKey: 'PATCH /admin/jobs/verifications/:id',
    controller: 'AdminJobsController',
    handler: 'reviewVerification',
    justification: 'لوحة تحكم الإدارة لاتخاذ قرار توثيق السائق',
  },

  // AdminOperatorsController
  {
    routeKey: 'GET /admin/operators/deletion-requests',
    controller: 'AdminOperatorsController',
    handler: 'listDeletionRequests',
    justification: 'لوحة تحكم الإدارة لمراجعة طلبات حذف مشغلي المعدات',
  },
  {
    routeKey: 'PATCH /admin/operators/deletion-requests/:id',
    controller: 'AdminOperatorsController',
    handler: 'reviewDeletion',
    justification: 'لوحة تحكم الإدارة للبت في طلبات حذف مشغلي المعدات',
  },

  // AdminPaymentsController
  {
    routeKey: 'GET /admin/payments',
    controller: 'AdminPaymentsController',
    handler: 'findAll',
    justification: 'لوحة تحكم الإدارة لمراجعة سجلات المدفوعات والعملاء',
  },
  {
    routeKey: 'GET /admin/payments/stats',
    controller: 'AdminPaymentsController',
    handler: 'getStats',
    justification: 'لوحة تحكم العمليات المالية للإيرادات ومؤشرات الاحتيال',
  },
  {
    routeKey: 'GET /admin/payments/metrics',
    controller: 'AdminPaymentsController',
    handler: 'getMetrics',
    justification: 'مؤشرات الأداء المالي ومعالجة بوابات الدفع',
  },
  {
    routeKey: 'GET /admin/payments/dlq',
    controller: 'AdminPaymentsController',
    handler: 'getDlqJobs',
    justification: 'طابور المهام المعلقة والفاشلة لبوابة الدفع',
  },
  {
    routeKey: 'GET /admin/payments/:paymentId/events',
    controller: 'AdminPaymentsController',
    handler: 'getPaymentEvents',
    justification: 'سجل الأحداث التفصيلي لعملية دفع محددة',
  },

  // AdminTransportController
  {
    routeKey: 'GET /admin/transport/requests',
    controller: 'AdminTransportController',
    handler: 'listRequests',
    justification: 'لوحة تحكم الإدارة لمراجعة طلبات النقل والتدخل عند النزاعات',
  },
  {
    routeKey: 'GET /admin/transport/carriers',
    controller: 'AdminTransportController',
    handler: 'listCarriers',
    justification: 'لوحة تحكم الإدارة لمراجعة الناقلين والتأكد من تراخيصهم',
  },
  {
    routeKey: 'GET /admin/transport/stats',
    controller: 'AdminTransportController',
    handler: 'getStats',
    justification: 'لوحة تحكم الإدارة لإحصائيات منظومة النقل',
  },
  {
    routeKey: 'PATCH /admin/transport/requests/:id',
    controller: 'AdminTransportController',
    handler: 'updateRequestStatus',
    justification: 'لوحة تحكم الإدارة لتحديث حالة طلب نقل متعثر',
  },
  {
    routeKey: 'DELETE /admin/transport/requests/:id',
    controller: 'AdminTransportController',
    handler: 'deleteRequest',
    justification: 'لوحة تحكم الإدارة لحذف طلب نقل مخالف',
  },
  {
    routeKey: 'PATCH /admin/transport/carriers/:id',
    controller: 'AdminTransportController',
    handler: 'updateCarrier',
    justification: 'لوحة تحكم الإدارة لتوثيق وتعديل حالة الناقل',
  },
  {
    routeKey: 'DELETE /admin/transport/carriers/:id',
    controller: 'AdminTransportController',
    handler: 'deleteCarrier',
    justification: 'لوحة تحكم الإدارة لحذف ناقل مخالف',
  },

  // ─── Admin Users Controller ───
  {
    routeKey: 'GET /admin/users',
    controller: 'AdminUsersController',
    handler: 'listUsers',
    justification: 'لوحة تحكم الإدارة لمراجعة المستخدمين مع إخفاء بيانات الاتصال جزئياً (Masked)',
  },
  {
    routeKey: 'GET /admin/users/:id',
    controller: 'AdminUsersController',
    handler: 'getUserDetail',
    justification: 'لوحة تحكم الإدارة لمراجعة تفاصيل المستخدم مع إخفاء بيانات الاتصال جزئياً (Masked)',
  },
] as const;

export const EXPOSE_PHONE_ROUTE_KEYS: readonly string[] = EXPOSE_PHONE_ALLOWLIST.map(
  (entry) => entry.routeKey,
);
