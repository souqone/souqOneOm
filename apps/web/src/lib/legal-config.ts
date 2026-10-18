/**
 * Legal & Platform Operator Configuration
 * Centralized constants for legal pages (Privacy, Terms, Account Deletion)
 */

export const LEGAL_CONFIG = {
  brandName: {
    ar: 'سوق ون',
    en: 'Souqone',
  },
  supportEmail: 'support@souqoneom.com',
  websiteUrl: 'https://souqoneom.com',
  country: {
    ar: 'سلطنة عُمان',
    en: 'Sultanate of Oman',
  },
  lastUpdated: {
    ar: 'أكتوبر 2026',
    en: 'October 2026',
  },
  operatorNotice: {
    ar: 'سوق ون هو الاسم التجاري للمنصة، وسيتم تحديث بيانات الكيان القانوني بعد استكمال السجل التجاري لدى الجهات المختصة في سلطنة عُمان.',
    en: 'Souqone is the trade name of the platform; legal entity details will be updated once the commercial registration is completed with the competent authorities in the Sultanate of Oman.',
  },
} as const;
