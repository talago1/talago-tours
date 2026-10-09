'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  type SupportedCurrency,
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  formatCurrencyAmount,
} from '@/utils/currency';

interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  rates: Record<SupportedCurrency, number>;
  convertFromUSD: (amountInUSD: number) => number;
  formatPrice: (amountInUSD: number, options?: { showCode?: boolean; round?: boolean }) => string;
  symbols: Record<SupportedCurrency, string>;
  supportedCurrencies: readonly SupportedCurrency[];
  isLoadingRates: boolean;
}

const DEFAULT_RATES: Record<SupportedCurrency, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  EGP: 48.5,
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const STORAGE_KEY = 'talago_user_currency';

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<SupportedCurrency>(DEFAULT_CURRENCY);
  const [rates, setRates] = useState<Record<SupportedCurrency, number>>(DEFAULT_RATES);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // Restore preferred currency from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_CURRENCIES.includes(stored as SupportedCurrency)) {
        setCurrencyState(stored as SupportedCurrency);
      }
    } catch {
      // LocalStorage access may fail in some environments
    }
  }, []);

  // Fetch latest rates from API
  useEffect(() => {
    let mounted = true;
    async function fetchRates() {
      setIsLoadingRates(true);
      try {
        const res = await fetch('/api/public/currency/rates');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.rates) {
            setRates(data.rates);
          }
        }
      } catch {
        // Fallback rates remain active
      } finally {
        if (mounted) setIsLoadingRates(false);
      }
    }
    fetchRates();
    return () => { mounted = false; };
  }, []);

  const setCurrency = useCallback((newCurrency: SupportedCurrency) => {
    setCurrencyState(newCurrency);
    try {
      localStorage.setItem(STORAGE_KEY, newCurrency);
    } catch {
      // Non-fatal
    }
  }, []);

  const convertFromUSD = useCallback(
    (amountInUSD: number): number => {
      const rate = rates[currency] || 1.0;
      return amountInUSD * rate;
    },
    [currency, rates]
  );

  const formatPrice = useCallback(
    (amountInUSD: number, options?: { showCode?: boolean; round?: boolean }): string => {
      if (amountInUSD == null || isNaN(amountInUSD)) return '';
      const converted = convertFromUSD(amountInUSD);
      const symbol = CURRENCY_SYMBOLS[currency] || currency;

      const round = options?.round ?? (currency === 'EGP' || converted >= 100);
      const numString = round
        ? Math.round(converted).toLocaleString('en-US')
        : converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      if (currency === 'EGP') {
        return `${numString} EGP`;
      }

      if (options?.showCode) {
        return `${symbol}${numString} ${currency}`;
      }

      return `${symbol}${numString}`;
    },
    [currency, convertFromUSD]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      setCurrency,
      rates,
      convertFromUSD,
      formatPrice,
      symbols: CURRENCY_SYMBOLS,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      isLoadingRates,
    }),
    [currency, setCurrency, rates, convertFromUSD, formatPrice, isLoadingRates]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Return graceful fallback when rendered outside provider
    return {
      currency: DEFAULT_CURRENCY,
      setCurrency: () => {},
      rates: DEFAULT_RATES,
      convertFromUSD: (amt) => amt,
      formatPrice: (amt) => `$${Math.round(amt)}`,
      symbols: CURRENCY_SYMBOLS,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      isLoadingRates: false,
    };
  }
  return ctx;
}
