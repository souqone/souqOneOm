import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Legal paths that are permitted in English
const ALLOWED_ENGLISH_LEGAL_PATHS = [
  '/en/privacy',
  '/en/terms',
  '/en/delete-account',
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Temporarily redirect /en/* → /ar/* EXCEPT for allowed legal pages
  if (pathname.startsWith('/en')) {
    const isAllowed = ALLOWED_ENGLISH_LEGAL_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
    if (!isAllowed) {
      const url = req.nextUrl.clone();
      url.pathname = pathname.replace(/^\/en/, '/ar');
      return NextResponse.redirect(url, 308);
    }
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: [
    // Match all pathnames except:
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_vercel (Vercel internals)
    // - /monitoring (Sentry)
    // - Common static file extensions
    '/((?!api|_next|_vercel|monitoring|.*\\..*).*)',
  ],
};
