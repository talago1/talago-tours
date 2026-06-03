import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE, getAdminToken } from '@/utils/adminAuth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') || pathname === '/admin/login') {
    return NextResponse.next();
  }

  const configuredToken = getAdminToken();
  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (configuredToken && sessionToken === configuredToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/admin/login';
  loginUrl.searchParams.set('next', pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
