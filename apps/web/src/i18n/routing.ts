import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ar'], // 'en' temporarily disabled — re-add to restore
  defaultLocale: 'ar',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
