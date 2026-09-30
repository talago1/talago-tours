import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminToken } from '@/utils/adminAuth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname.startsWith('/admin');
  // These prefixes are admin-only too: notifications expose/rewrite the
  // customer-facing templates + delivery logs (PII), and media/sign-upload
  // mints service-role signed upload URLs. They live outside /api/admin, so
  // they must be named here explicitly or they fall through unprotected.
  const isAdminApi  = pathname.startsWith('/api/admin')
    || pathname.startsWith('/api/notifications')
    || pathname.startsWith('/api/media');

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  // Allow public admin login page and login API
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const configuredToken = getAdminToken();
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (configuredToken && sessionToken === configuredToken) {
    return NextResponse.next();
  }

  // Admin API routes return 401 JSON instead of redirect
  if (isAdminApi) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path((?!login).*)',
    '/admin',
    '/api/admin/:path*',
    '/api/notifications/:path*',
    '/api/media/:path*',
  ],
};
