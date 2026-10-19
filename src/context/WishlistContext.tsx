'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { WishlistItem } from '@/types/wishlist';

interface WishlistContextType {
  wishlist: WishlistItem[];
  count: number;
  isLoaded: boolean;
  isWishlisted: (idOrSlug: string) => boolean;
  toggleWishlist: (item: WishlistItem) => boolean;
  removeFromWishlist: (idOrSlug: string) => void;
  clearWishlist: () => void;
}

const STORAGE_KEY = 'talago_saved_wishlist';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setWishlist(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved wishlist from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Listen to cross-tab updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setWishlist(parsed);
          }
        } catch {
          // ignore corrupted data
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper to persist
  const persist = useCallback((newList: WishlistItem[]) => {
    setWishlist(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage:', e);
    }
  }, []);

  const isWishlisted = useCallback(
    (idOrSlug: string): boolean => {
      if (!idOrSlug) return false;
      return wishlist.some((item) => item.id === idOrSlug || item.slug === idOrSlug);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (item: WishlistItem): boolean => {
      const exists = wishlist.some((w) => w.id === item.id || w.slug === item.slug);
      let updated: WishlistItem[];
      if (exists) {
        updated = wishlist.filter((w) => w.id !== item.id && w.slug !== item.slug);
      } else {
        updated = [{ ...item, addedAt: Date.now() }, ...wishlist];
      }
      persist(updated);
      return !exists;
    },
    [wishlist, persist]
  );

  const removeFromWishlist = useCallback(
    (idOrSlug: string) => {
      const updated = wishlist.filter((w) => w.id !== idOrSlug && w.slug !== idOrSlug);
      persist(updated);
    },
    [wishlist, persist]
  );

  const clearWishlist = useCallback(() => {
    persist([]);
  }, [persist]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        count: wishlist.length,
        isLoaded,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
