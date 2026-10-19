/**
 * Legal & Platform Operator Configuration
 * Centralized constants for legal pages (Privacy, Terms, Account Deletion)
 */

export const INSTAGRAM_URL = 'https://www.instagram.com/souqone.om/';

export const LEGAL_CONFIG = {
  brandName: {
    ar: 'سوق ون',
    en: 'Souqone',
  },
  supportEmail: 'support@souqoneom.com',
  websiteUrl: 'https://souqoneom.com',
  instagramUrl: INSTAGRAM_URL,
  country: {
    ar: 'سلطنة عُمان',
    en: 'Sultanate of Oman',
  },
  lastUpdated: {
    ar: 'أكتوبر 2026',
    en: 'October 2026',
  },
  operatorNotice: {
    ar: 'سوق ون هو الاسم التجاري للمنصة، وتشغّلها «هامة المجد الوطنية للتجارة» (تاجر فرد، سجل تجاري رقم 1373251، الخابورة، محافظة شمال الباطنة، سلطنة عُمان).',
    en: 'Souqone is the trade name of the platform, operated by «هامة المجد الوطنية للتجارة» (individual firm, Commercial Registration No. 1373251, Al Khabura, North Al Batinah Governorate, Sultanate of Oman).',
  },
} as const;
