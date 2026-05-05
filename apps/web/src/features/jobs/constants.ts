export const OMAN_GOVERNORATES = [
  'مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية',
  'شمال الباطنة', 'جنوب الباطنة', 'شمال الشرقية',
  'جنوب الشرقية', 'الظاهرة', 'الوسطى',
]

export const LICENSE_TYPE_LABELS: Record<string, string> = {
  LIGHT: 'رخصة خفيفة',
  HEAVY: 'رخصة ثقيلة',
  TRANSPORT: 'رخصة نقل',
  BUS: 'رخصة حافلات',
  MOTORCYCLE: 'رخصة دراجة',
}

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'دوام كامل',
  PART_TIME: 'دوام جزئي',
  TEMPORARY: 'مؤقت',
  CONTRACT: 'عقد',
}

export const SALARY_PERIOD_LABELS: Record<string, string> = {
  DAILY: 'يومي',
  MONTHLY: 'شهري',
  YEARLY: 'سنوي',
  NEGOTIABLE: 'قابل للتفاوض',
}

export const JOB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'نشط',
  CLOSED: 'مغلق',
  EXPIRED: 'منتهي',
  DRAFT: 'مسودة',
}

export const JOB_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#16a34a',
  CLOSED: '#9ca3af',
  EXPIRED: '#6b7280',
  DRAFT: '#f59e0b',
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'بانتظار الرد',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب',
}

export const APPLICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#16a34a',
  REJECTED: '#dc2626',
  WITHDRAWN: '#9ca3af',
}

export const NATIONALITY_LABELS: Record<string, string> = {
  Omani: 'عُماني',
  omani: 'عُماني',
  OMANI: 'عُماني',
  Expat: 'وافد',
  expat: 'وافد',
  EXPAT: 'وافد',
  Any: 'أي جنسية',
  any: 'أي جنسية',
  ANY: 'أي جنسية',
}

export const LANGUAGE_LABELS: Record<string, string> = {
  ARABIC: 'العربية',
  ENGLISH: 'الإنجليزية',
  URDU: 'الأردية',
  HINDI: 'الهندية',
  FILIPINO: 'الفلبينية',
}

export const VEHICLE_TYPE_OPTIONS = [
  'سيارة خاصة', 'بيك أب', 'فان', 'دينا', 'شاحنة كبيرة',
  'تريلا', 'قلاب', 'حفار', 'رافعة',
]

export const LANGUAGE_OPTIONS = ['العربية', 'الإنجليزية', 'الأردية', 'الهندية', 'الفلبينية']

export const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'الأحدث' },
  { value: 'createdAt_asc', label: 'الأقدم' },
  { value: 'salary_desc', label: 'الراتب الأعلى' },
  { value: 'viewCount_desc', label: 'الأكثر مشاهدة' },
]

export const STRINGS = {
  APP_NAME: 'سوق ون',
  APP_TAGLINE: 'بورصة الوظائف للسائقين في عُمان',
  HIRING: 'طلب سائق',
  OFFERING: 'عرض خدمة',
  BROWSE_JOBS: 'الوظائف',
  BROWSE_DRIVERS: 'السائقون',
  POST_JOB: 'أنشئ إعلان',
  MY_POSTS: 'إعلاناتي',
  MY_PROPOSALS: 'عروضي',
  DASHBOARD: 'لوحة التحكم',
  LOGIN: 'تسجيل الدخول',
  LOGOUT: 'تسجيل الخروج',
  PROFILE: 'الملف الشخصي',
  VERIFIED: 'موثّق',
  AVAILABLE: 'متاح الآن',
  UNAVAILABLE: 'غير متاح',
  APPLY: 'قدّم عرضك',
  SUBMIT_PROPOSAL: 'قدّم العرض',
  ACCEPT: 'قبول العرض',
  REJECT: 'رفض',
  WITHDRAW: 'سحب العرض',
  CLOSE_JOB: 'إغلاق الإعلان',
  DELETE: 'حذف',
  EDIT: 'تعديل',
  VIEW_PROPOSALS: 'عرض العروض',
  VIEW_PROFILE: 'عرض الملف الشخصي',
  LOADING: 'جاري التحميل...',
  ERROR_GENERIC: 'حدث خطأ ما، حاول مرة أخرى',
  EMPTY_JOBS: 'لا توجد وظائف متاحة',
  EMPTY_PROPOSALS: 'لا توجد عروض بعد',
  EMPTY_POSTS: 'لم تنشر أي إعلانات بعد',
  CURRENCY: 'ر.ع.',
  REVIEWS: 'تقييم',
  COMPLETED_JOBS: 'عمل مكتمل',
  COMPLETION_RATE: 'إتمام',
  RESPONSE_TIME_PREFIX: 'يرد خلال',
  RESPONSE_TIME_HOUR: 'ساعة',
  RESPONSE_TIME_HOURS: 'ساعات',
  RESPONSE_TIME_DAY: 'يوم',
  SEARCH_PLACEHOLDER: 'ابحث عن وظيفة أو سائق...',
  FILTER_TITLE: 'تصفية النتائج',
  CLEAR_FILTERS: 'مسح الفلاتر',
  RESULTS_COUNT: (n: number) => `${n} إعلان`,
  TIME_AGO_MINUTES: (n: number) => `منذ ${n} دقيقة`,
  TIME_AGO_HOURS: (n: number) => `منذ ${n} ساعة`,
  TIME_AGO_DAYS: (n: number) => `منذ ${n} يوم`,
  TIME_AGO_WEEKS: (n: number) => `منذ ${n} أسبوع`,
  APPLICATIONS_COUNT: (n: number) => `${n} عرض`,
  SALARY_RANGE: (min: number, max: number, currency: string, period: string) =>
    `${min} – ${max} ${currency}/${period}`,
  EMPTY_MY_POSTS: 'لم تنشر أي إعلان وظيفة بعد',
  CONFIRM_DELETE: 'هل تريد حذف هذا الإعلان؟',
  LOGIN_REQUIRED: 'يجب تسجيل الدخول للمتابعة',
}
