'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface AuthUser {
  id: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramPhone?: string | null;
  telegramPhotoUrl?: string | null;
  role?: string;
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

  // Broadcast authentication changes to other open tabs
  const broadcastAuthChange = useCallback((action: 'SIGN_IN' | 'SIGN_OUT') => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
        channel.postMessage({ action, timestamp: Date.now() });
        channel.close();
      }
    } catch {}
  }, []);

  // Authoritative server-side session check
  const refreshAuth = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.authenticated && data.user) {
          const authUser = data.user as AuthUser;
          setUser(authUser);
          setIsAuthenticated(true);
          setSessionToken('active');
          setIsLoading(false);
          return authUser;
        }
      }
    } catch (e) {
      console.warn('[AuthContext] session check warning:', e);
    }

    setUser(null);
    setSessionToken(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    return null;
  }, []);

  // Universal sign out
  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
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

  // Initial load & listeners
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      refreshAuth();
    }

    // Refresh when tab gains focus (e.g. after returning from Telegram or Google)
    const handleFocus = () => {
      refreshAuth();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        refreshAuth();
      }
    });

    // Cross-tab sync
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
      window.removeEventListener('focus', handleFocus);
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
