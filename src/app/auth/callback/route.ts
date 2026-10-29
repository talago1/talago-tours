import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/my-bookings';
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    requestUrl.origin;

  if (errorParam || errorDescription) {
    console.error('[auth-callback] OAuth provider error:', errorParam, errorDescription);
    const redirectUrl = new URL('/auth', appUrl);
    redirectUrl.searchParams.set('error', errorDescription || errorParam || 'OAuth error');
    return NextResponse.redirect(redirectUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth', appUrl));
  }

  try {
    const supabaseAnon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabaseAnon.auth.exchangeCodeForSession(code);
    const session = data?.session;
    const user = session?.user;

    if (error || !session || !user || !user.email) {
      console.error('[auth-callback] Code exchange failed:', error?.message);
      const redirectUrl = new URL('/auth', appUrl);
      redirectUrl.searchParams.set('error', 'Session exchange failed. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }

    const email = user.email.toLowerCase();
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      email.split('@')[0];

    // Upsert CustomerProfile in Prisma
    const existingProfile = await prisma.customerProfile.findUnique({
      where: { email },
    });

    if (!existingProfile) {
      await prisma.customerProfile.create({
        data: {
          email,
          name: fullName,
          isShadow: false,
        },
      });
    } else if (existingProfile.isShadow) {
      await prisma.customerProfile.update({
        where: { id: existingProfile.id },
        data: { isShadow: false, name: existingProfile.name || fullName },
      });
    }

    // Redirect to requested next page or default
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/my-bookings';
    const redirectUrl = new URL(safeNext, appUrl);
    const response = NextResponse.redirect(redirectUrl);

    // Set authoritative talago_session cookie
    response.cookies.set('talago_session', session.access_token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('[auth-callback] Unexpected error:', err);
    const redirectUrl = new URL('/auth', appUrl);
    redirectUrl.searchParams.set('error', 'Authentication failed unexpectedly.');
    return NextResponse.redirect(redirectUrl);
  }
}
