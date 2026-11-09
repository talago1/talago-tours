import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/server';

export type SessionUser = User & { phone?: string | null };

export type ResolvedSession = {
  user: SessionUser;
  accessToken: string;
  refreshToken: string | null;
  /** True when the browser cookie should be rewritten to this session. */
  persist: boolean;
};

const COOKIE_BASE = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export function applySessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string | null,
) {
  response.cookies.set('talago_session', accessToken, {
    ...COOKIE_BASE,
    maxAge: 60 * 60 * 24 * 7,
  });
  if (refreshToken) {
    response.cookies.set('talago_refresh', refreshToken, {
      ...COOKIE_BASE,
      maxAge: 60 * 60 * 24 * 30,
    });
  }
}

async function userFromAccessToken(token: string): Promise<SessionUser | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user?.email) return null;
    return data.user as SessionUser;
  } catch {
    return null;
  }
}

/**
 * The httpOnly talago_session cookie is the account identity.
 * A stale Supabase client bearer must not override it.
 */
export async function resolveRequestUser(request: NextRequest): Promise<ResolvedSession | null> {
  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length).trim()
    : '';
  const cookieToken = request.cookies.get('talago_session')?.value || '';
  const refreshToken = request.cookies.get('talago_refresh')?.value || '';

  if (cookieToken) {
    const cookieUser = await userFromAccessToken(cookieToken);
    if (cookieUser) {
      return {
        user: cookieUser,
        accessToken: cookieToken,
        refreshToken: refreshToken || null,
        persist: false,
      };
    }
  }

  if (bearer && bearer !== cookieToken) {
    const bearerUser = await userFromAccessToken(bearer);
    if (bearerUser) {
      return {
        user: bearerUser,
        accessToken: bearer,
        refreshToken: refreshToken || null,
        persist: true,
      };
    }
  }

  if (!refreshToken) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  try {
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session?.user?.email || !data.session.access_token) return null;
    return {
      user: data.session.user as SessionUser,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token || refreshToken,
      persist: true,
    };
  } catch {
    return null;
  }
}
