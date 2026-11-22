'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabaseClient } from '@/lib/supabase/client';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramPhone?: string | null;
  telegramPhotoUrl?: string | null;
  role?: string;
  isShadow?: boolean;
  profileLoaded?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshAuth: () => Promise<AuthUser | null>;
  signOut: () => Promise<void>;
  updateUserLocally: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_SYNC_CHANNEL = 'talago_auth_sync';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const initialLoadDone = useRef(false);

  // Broadcast auth state changes to other tabs / windows
  const broadcastAuthChange = useCallback((action: 'SIGN_IN' | 'SIGN_OUT') => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        channel.postMessage({ action, timestamp: Date.now() });
        channel.close();
      }
    } catch {}
  }, []);

  // Authoritative session fetcher
  const refreshAuth = useCallback(async (): Promise<AuthUser | null> => {
    try {
      // 0. Check for one-time auth handoff ticket in URL query
      let ticketParam: string | null = null;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        ticketParam = urlParams.get('auth_ticket');
        if (ticketParam) {
          // Clean URL immediately without page reload so ticket is never exposed
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('auth_ticket');
          window.history.replaceState({}, '', cleanUrl.toString());
        }
      }

      if (ticketParam) {
        const ticketRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket: ticketParam }),
          credentials: 'same-origin',
        });
        if (ticketRes.ok) {
          const ticketData = await ticketRes.json();
          if (ticketData?.authenticated && ticketData.user) {
            const authUser = ticketData.user as AuthUser;
            setUser(authUser);
            setIsAuthenticated(true);
            setSessionToken(ticketData.accessToken || null);

            if (ticketData.accessToken && ticketData.refreshToken) {
              supabaseClient.auth.setSession({
                access_token: ticketData.accessToken,
                refresh_token: ticketData.refreshToken,
              }).catch(() => {});
            }

            try {
              const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
              document.cookie = `talago_session=${encodeURIComponent(ticketData.accessToken)}; Path=/; Max-Age=604800; SameSite=Lax${secureFlag}`;
            } catch {}

            setIsLoading(false);
            broadcastAuthChange('SIGN_IN');
            return authUser;
          }
        }
      }

      // 1. Check client-side Supabase token
      let clientBearer: string | null = null;
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token) {
          clientBearer = session.access_token;
        }
      } catch {}

      const headers: Record<string, string> = {};
      if (clientBearer) headers['Authorization'] = `Bearer ${clientBearer}`;

      const res = await fetch('/api/auth/session', {
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated && data.user) {
          const authUser = data.user as AuthUser;
          setUser(authUser);
          setIsAuthenticated(true);
          const tok = data.accessToken || clientBearer;
          setSessionToken(tok || null);

          // Keep client Supabase storage hydrated if server provided fresh tokens
          if (data.accessToken && data.refreshToken) {
            supabaseClient.auth.setSession({
              access_token: data.accessToken,
              refresh_token: data.refreshToken,
            }).catch(() => {});
          }

          setIsLoading(false);
          return authUser;
        } else if (clientBearer) {
          // If server confirmed unauthenticated but client still held stale bearer, evict it
          supabaseClient.auth.signOut().catch(() => {});
        }
      }
    } catch (e) {
      console.warn('[AuthContext] session check exception:', e);
    }

    // Definitively unauthenticated
    setUser(null);
    setSessionToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    return null;
  }, [broadcastAuthChange]);

  // Sign out cleanly everywhere
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      await supabaseClient.auth.signOut();
    } catch {}

    setUser(null);
    setSessionToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    broadcastAuthChange('SIGN_OUT');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [broadcastAuthChange]);

  const updateUserLocally = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  // Initial mount: run single authoritative session resolution
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      refreshAuth();
    }

    // Listen to Supabase client auth state changes
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          setSessionToken(session.access_token);
        }
        refreshAuth();
      } else if (event === 'SIGNED_OUT') {
        // Confirm with server before clearing in case of client-only timeout
        refreshAuth();
      }
    });

    // Listen to multi-tab sync
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        bc.onmessage = () => {
          refreshAuth();
        };
      }
    } catch {}

    return () => {
      subscription.unsubscribe();
      if (bc) bc.close();
    };
  }, [refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        sessionToken,
        isAuthenticated,
        isLoading,
        refreshAuth,
        signOut,
        updateUserLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
