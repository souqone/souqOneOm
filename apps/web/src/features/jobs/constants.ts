export const OMAN_GOVERNORATES = [
  'مسقط', 'ظفار', 'مسندم', 'البريمي', 'الداخلية',
  'شمال الباطنة', 'جنوب الباطنة', 'شمال الشرقية',
  'جنوب الشرقية', 'الظاهرة', 'الوسطى',
]

export const OMAN_WILAYAT_BY_GOVERNORATE: Record<string, string[]> = {
  'مسقط':          ['مسقط', 'مطرح', 'بوشر', 'العامرات', 'قريات', 'السيب'],
  'ظفار':           ['صلالة', 'طاقة', 'سدح', 'ميربط', 'رخيوت', 'مرباط', 'شليم وحلانيات', 'المزيونة', 'ضلكوت'],
  'مسندم':          ['خصب', 'بخاء', 'دبا', 'مدحاء', 'لوى'],
  'البريمي':         ['البريمي', 'محضة', 'المحلب'],
  'الداخلية':        ['نزوى', 'بهلاء', 'منح', 'إزكي', 'سمائل', 'الحمراء', 'الجبل الأخضر', 'أدم', 'المضيبي'],
  'شمال الباطنة':    ['صحار', 'شناص', 'خابورة', 'صحم', 'السويق', 'نخل', 'وادي المعاول', 'لوى'],
  'جنوب الباطنة':    ['الرستاق', 'البويب', 'عوابي', 'المصنعة', 'بركاء'],
  'شمال الشرقية':    ['إبراء', 'المضيبي', 'دماء والطائيين', 'البدية', 'العقر', 'المنيب'],
  'جنوب الشرقية':    ['صور', 'مصيرة', 'بلهاء', 'الكامل والوافي', 'جعلان بني بوعلي', 'جعلان بني بوحسن'],
  'الظاهرة':         ['عبري', 'ينقل', 'ضنك'],
  'الوسطى':          ['هيماء', 'الدقم', 'محوت', 'الجازر'],
}

export const OMAN_WILAYAT: string[] = Object.values(OMAN_WILAYAT_BY_GOVERNORATE).flat()

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
  // Apply form
  PROPOSAL_SENT_SUCCESS: 'تم إرسال عرضك بنجاح!',
  EMPLOYER_WILL_CONTACT: 'سيتواصل معك صاحب الإعلان قريباً',
  INTRO_MESSAGE_LABEL: 'رسالتك التعريفية',
  RESUME_URL_LABEL: 'رابط السيرة الذاتية (اختياري)',
  APPLY_LOGIN_PROMPT: 'سجّل دخولك لتقديم عرض',
  YOUR_PROPOSAL: 'عرضك المقدم',
  YOUR_MESSAGE: 'رسالتك:',
  SENDING: 'جاري الإرسال...',
  // Role restriction
  DRIVER_ONLY: 'مخصص للسائقين فقط',
  EMPLOYER_ONLY: 'مخصص لأصحاب العمل فقط',
  DRIVER_PROFILE_REQUIRED: 'يجب أن يكون لديك بروفايل سائق للتقديم',
  EMPLOYER_PROFILE_REQUIRED: 'يجب أن يكون لديك بروفايل صاحب عمل للتقديم',
  // Job detail labels
  EXPECTED_SALARY: 'الراتب المتوقع',
  JOB_DETAILS: 'تفاصيل الإعلان',
  CONTACT_INFO: 'معلومات التواصل',
  JOB_MANAGEMENT: 'إدارة الإعلان',
  NEGOTIABLE: 'قابل للتفاوض',
  VIEWS_LABEL: 'مشاهدة',
  PROPOSALS_LABEL: 'عرض',
  PUBLISHED_LABEL: 'نُشر',
  LOAD_ERROR_TITLE: 'خطأ في التحميل',
  LOAD_ERROR_DESC: 'تعذّر تحميل الوظيفة. تحقق من الاتصال وحاول مرة أخرى.',
  BACK_TO_JOBS: 'العودة للوظائف',
  CLOSE_JOB_CONFIRM_DESC: (title: string) =>
    `هل تريد إغلاق إعلان "${title}"؟ لن يتمكن المتقدمون من إرسال عروض جديدة بعد الإغلاق.`,
  // Salary filter
  SALARY_RANGE_LABEL: 'نطاق الراتب (ر.ع)',
  SALARY_MIN_LABEL: 'الحد الأدنى',
  SALARY_MAX_LABEL: 'الحد الأقصى',
  SALARY_ANY: 'أي راتب',
  SALARY_UNSET: 'غير محدد',
  SORT_BY_LABEL: 'ترتيب حسب',
  // Verification
  VERIFICATION_UPLOAD_ERROR: 'يرجى رفع صورة الرخصة وصورة الهوية',
  VERIFICATION_SUBMIT_SUCCESS: 'تم إرسال طلب التوثيق بنجاح',
  NO_DRIVER_PROFILE_TITLE: 'لا يوجد بروفايل سائق',
  NO_DRIVER_PROFILE_DESC: 'يجب إنشاء بروفايل سائق أولاً لطلب التوثيق',
  CREATE_PROFILE: 'إنشاء بروفايل',
  APPLY_NOW: 'قدّم عرضك الآن',
  NO_PROPOSALS_YET: 'لم يصل أي عرض لهذا الإعلان بعد',
}
