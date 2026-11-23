import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { createClient, type User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromRequest } from '@/server/auth';

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

/**
 * Sets session cookies in the Next.js Server Cookie Store (next/headers).
 * Guarantees server-side cookie emission in Route Handlers and Server Actions.
 */
export function setServerSessionCookies(
  accessToken: string,
  refreshToken?: string | null,
) {
  try {
    const cookieStore = cookies();
    cookieStore.set('talago_session', accessToken, {
      ...COOKIE_BASE,
      maxAge: 60 * 60 * 24 * 7,
    });
    if (refreshToken) {
      cookieStore.set('talago_refresh', refreshToken, {
        ...COOKIE_BASE,
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  } catch {
    // Non-header context fallback
  }
}

/**
 * Creates a cryptographically random, short-lived (2 minutes) one-time handoff ticket.
 * Used during cross-site redirects (e.g. Telegram OAuth) so the destination page
 * can execute a 100% same-origin first-party sync and hydrate client state.
 */
export async function createAuthTicket(payload: {
  accessToken: string;
  refreshToken?: string | null;
  userId?: string | null;
}): Promise<string> {
  const ticket = crypto.randomBytes(32).toString('hex');
  const key = `auth_ticket_${ticket}`;
  await prisma.systemSetting.create({
    data: {
      key,
      value: JSON.stringify({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken || null,
        userId: payload.userId || null,
        expiresAt: Date.now() + 2 * 60 * 1000,
      }),
    },
  });
  return ticket;
}

/**
 * Consumes a one-time handoff ticket. Deletes it immediately to enforce single-use.
 */
export async function consumeAuthTicket(ticket: string): Promise<{
  accessToken: string;
  refreshToken: string | null;
  userId: string | null;
} | null> {
  if (!ticket || typeof ticket !== 'string' || ticket.length < 16) return null;
  const key = `auth_ticket_${ticket}`;
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    if (!setting?.value) return null;

    const parsed = JSON.parse(setting.value);
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      await prisma.systemSetting.delete({ where: { key } }).catch(() => {});
      return null;
    }

    // Allow a 15-second grace window for concurrent requests (StrictMode, parallel component mounts),
    // then purge the ticket so it cannot be reused.
    if (parsed.consumedAt) {
      if (Date.now() - parsed.consumedAt > 15000) {
        await prisma.systemSetting.delete({ where: { key } }).catch(() => {});
        return null;
      }
    } else {
      await prisma.systemSetting.update({
        where: { key },
        data: {
          value: JSON.stringify({
            ...parsed,
            consumedAt: Date.now(),
          }),
        },
      }).catch(() => {});
    }

    return {
      accessToken: parsed.accessToken as string,
      refreshToken: (parsed.refreshToken as string) || null,
      userId: (parsed.userId as string) || null,
    };
  } catch (err) {
    console.warn('[customerSession] ticket consumption error:', err);
    return null;
  }
}

export function applySessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string | null,
) {
  setServerSessionCookies(accessToken, refreshToken);
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
  // 1. Authoritative Talago session check (works universally for Telegram, Google, Email)
  const authSession = await getSessionFromRequest(request);
  if (authSession) {
    const syntheticEmail =
      authSession.email ||
      (authSession.telegramId
        ? `telegram-${authSession.telegramId}@noreply.talago.com`
        : `guest-${authSession.id}@noreply.talago.com`);

    return {
      user: {
        id: authSession.id,
        email: syntheticEmail,
        phone: authSession.phone || undefined,
        app_metadata: { provider: authSession.authProvider },
        user_metadata: {
          name: authSession.name,
          telegramUsername: authSession.telegramUsername,
        },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      } as any,
      accessToken: request.cookies.get('talago_session')?.value || '',
      refreshToken: null,
      persist: false,
    };
  }

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
