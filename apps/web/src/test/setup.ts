import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, className, ...rest }: any) =>
    React.createElement('a', { href, className, ...rest }, children),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...rest }: any) =>
    React.createElement('img', { src, alt, ...rest }),
}))

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'test-id', locale: 'ar' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/ar/jobs',
  useSearchParams: () => new URLSearchParams(),
}))

let currentTestLocale = 'ar';
export const setTestLocale = (loc: string) => { currentTestLocale = loc; };

vi.mock('next-intl', async () => {
  const ar = (await import('../messages/ar.json')).default;
  const en = (await import('../messages/en.json')).default;
  const messagesMap: Record<string, any> = { ar, en };

  return {
    useLocale: () => currentTestLocale,
    useTranslations: (namespace?: string) => {
      const messages = messagesMap[currentTestLocale] || ar;
      const getNested = (obj: any, path: string) => {
        if (!path) return obj;
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };
      const nsObj = namespace ? getNested(messages, namespace) : messages;

      const t = (key: string, values?: Record<string, any>) => {
        const val = getNested(nsObj, key);
        if (typeof val === 'string') {
          if (values) {
            return Object.entries(values).reduce(
              (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v)),
              val,
            );
          }
          return val;
        }
        return key;
      };

      t.raw = (key: string) => {
        return getNested(nsObj, key);
      };

      return t;
    },
  };
});

vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className, ...rest }: any) =>
    React.createElement('a', { href, className, ...rest }, children),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ user: null, isAuthenticated: false }),
  AuthProvider: ({ children }: any) => children,
}))

vi.mock('@/components/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
  ToastProvider: ({ children }: any) => children,
}))
