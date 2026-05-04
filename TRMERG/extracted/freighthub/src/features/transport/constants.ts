import type { TransportServiceType, VehicleType, RequestStatus, QuoteStatus, BookingStatus } from './types';

export const OMAN_GOVERNORATES: readonly string[] = [
  'مسقط',
  'مطرح',
  'صلالة',
  'صحار',
  'نزوى',
  'صور',
  'الدقم',
  'عبري',
  'البريمي',
  'خصب',
  'الرستاق',
  'السيب',
  'بهلاء',
  'إبراء',
  'آدم',
  'سمائل',
  'المضيبي',
  'بركاء',
];

export const SERVICE_TYPE_LABELS: Record<TransportServiceType, string> = {
  GOODS: 'بضائع عامة',
  FURNITURE: 'أثاث ومنزليات',
  CONSTRUCTION: 'مواد البناء',
  HEAVY: 'شحن ثقيل',
  BACKLOAD: 'عودة فارغة',
  EQUIPMENT: 'معدات وآليات',
};

export const SERVICE_TYPE_ICONS: Record<TransportServiceType, string> = {
  GOODS: 'Package',
  FURNITURE: 'Sofa',
  CONSTRUCTION: 'HardHat',
  HEAVY: 'Container',
  BACKLOAD: 'ArrowLeftRight',
  EQUIPMENT: 'Wrench',
};

export const SERVICE_TYPE_COLORS: Record<TransportServiceType, string> = {
  GOODS: '#2563eb',
  FURNITURE: '#7c3aed',
  CONSTRUCTION: '#d97706',
  HEAVY: '#dc2626',
  BACKLOAD: '#16a34a',
  EQUIPMENT: '#0891b2',
};

export const SERVICE_TYPE_BG_COLORS: Record<TransportServiceType, string> = {
  GOODS: 'rgba(37, 99, 235, 0.1)',
  FURNITURE: 'rgba(124, 58, 237, 0.1)',
  CONSTRUCTION: 'rgba(217, 119, 6, 0.1)',
  HEAVY: 'rgba(220, 38, 38, 0.1)',
  BACKLOAD: 'rgba(22, 163, 74, 0.1)',
  EQUIPMENT: 'rgba(8, 145, 178, 0.1)',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  OPEN: 'مفتوح',
  QUOTED: 'وصلت عروض',
  ACCEPTED: 'مقبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
  EXPIRED: 'منتهي الصلاحية',
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  PENDING: 'بانتظار الرد',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  ACCEPTED: 'تم القبول',
  IN_PROGRESS: 'جارٍ التنفيذ',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  PICKUP: 'بيك أب',
  VAN: 'فان',
  TRUCK_SMALL: 'شاحنة صغيرة',
  TRUCK_LARGE: 'شاحنة كبيرة',
  TRAILER: 'مقطورة',
  EXCAVATOR: 'حفار',
  TIPPER: 'قلابة',
  CRANE: 'رافعة',
  OTHER: 'أخرى',
};

export const VEHICLE_TYPE_ICONS: Record<VehicleType, string> = {
  PICKUP: 'Truck',
  VAN: 'Van',
  TRUCK_SMALL: 'Truck',
  TRUCK_LARGE: 'Truck',
  TRAILER: 'Container',
  EXCAVATOR: 'Construction',
  TIPPER: 'Dump',
  CRANE: 'Crane',
  OTHER: 'Package',
};

export const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'الأحدث أولاً' },
  { value: 'createdAt_asc', label: 'الأقدم أولاً' },
  { value: 'budgetMax_desc', label: 'الميزانية الأعلى' },
  { value: 'budgetMax_asc', label: 'الميزانية الأدنى' },
  { value: 'scheduledAt_asc', label: 'أقرب موعد' },
] as const;

export const CURRENCY_LABEL = 'ر.ع.';

export const STATS = {
  activeRequests: 1247,
  verifiedCarriers: 389,
  governoratesServed: 18,
  completedTrips: 8432,
};

export const NAV_LINKS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/browse-transport-requests', label: 'تصفح الطلبات' },
  { href: '/create-transport-request', label: 'أنشئ طلباً' },
  { href: '/my-requests', label: 'طلباتي' },
  { href: '/my-quotes', label: 'عروضي' },
  { href: '/carriers/dashboard', label: 'لوحة الناقل' },
] as const;