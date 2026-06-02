'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback } from 'react';

type LoadingListener = (loading: boolean) => void;

// Module-level state for instant cross-component triggering
let _forcedLoading = false;
const _listeners = new Set<LoadingListener>();

function notifyListeners(value: boolean) {
  _forcedLoading = value;
  _listeners.forEach((fn) => fn(value));
}

function isNavLink(el: HTMLElement | null): boolean {
  while (el) {
    if (el.tagName === 'A') {
      const href = (el as HTMLAnchorElement).getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('//')) return true;
    }
    el = el.parentElement;
  }
  return false;
}

// Exported for imperative use if needed
export function triggerRouteLoader() {
  notifyListeners(true);
}

export default function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef(pathname);
  const listenerRef = useRef<LoadingListener | null>(null);

  // Sync from module-level state
  const handleForceLoad = useCallback((value: boolean) => {
    if (value) {
      setLoading(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, []);

  useEffect(() => {
    listenerRef.current = handleForceLoad;
    _listeners.add(handleForceLoad);
    return () => {
      _listeners.delete(handleForceLoad);
    };
  }, [handleForceLoad]);

  // Global click interceptor — fires BEFORE pathname changes
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey
      ) return;
      const target = e.target as HTMLElement;
      if (isNavLink(target)) {
        notifyListeners(true);
      }
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  // Detect actual route completion via pathname
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      if (_forcedLoading || loading) {
        setLoading(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        // Quick settle — route has already loaded, just ease out
        timerRef.current = setTimeout(() => {
          setLoading(false);
          notifyListeners(false);
        }, 200);
      }
    } else {
      prevPathRef.current = pathname;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] h-[3px]">
      <div
        className={`h-full bg-gradient-to-r from-[#00E5FF] via-[#06B6D4] to-[#00E5FF] ${
          loading ? 'w-full opacity-100' : 'w-0 opacity-0'
        }`}
        style={{
          boxShadow: loading ? '0 0 12px #00E5FF, 0 0 24px rgba(0,229,255,0.4)' : 'none',
          transition: loading
            ? 'width 1.2s cubic-bezier(0.08, 0.82, 0.17, 1), opacity 100ms ease-out'
            : 'width 300ms ease-in, opacity 300ms ease-in',
        }}
      />
    </div>
  );
}
