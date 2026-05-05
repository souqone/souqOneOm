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

vi.mock('next-intl', () => ({
  useLocale: () => 'ar',
  useTranslations: () => (key: string) => key,
}))

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
