/**
 * Multi-Currency Conversion & Validation Utility (Server & Client Safe)
 * Base reference: USD & EGP
 * Supported currencies: USD, EUR, GBP, EGP
 */

export type SupportedCurrency = 'USD' | 'EUR' | 'GBP' | 'EGP';

export const SUPPORTED_CURRENCIES: readonly SupportedCurrency[] = ['USD', 'EUR', 'GBP', 'EGP'] as const;

export const DEFAULT_CURRENCY: SupportedCurrency = 'USD';

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  EGP: 'EGP',
};

// Defensive fallback exchange rates against USD (1 USD =)
// Updated with realistic Egyptian market benchmarks
const FALLBACK_RATES_FROM_USD: Record<SupportedCurrency, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  EGP: 48.5,
};

let cachedRates: { rates: Record<SupportedCurrency, number>; timestamp: number } | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Returns latest rates relative to USD.
 * Tries free exchangerate-api if available, otherwise falls back gracefully.
 */
export async function getExchangeRates(): Promise<Record<SupportedCurrency, number>> {
  const now = Date.now();
  if (cachedRates && (now - cachedRates.timestamp) < CACHE_TTL_MS) {
    return cachedRates.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 3600 },
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.rates && typeof data.rates === 'object') {
        const liveRates: Record<SupportedCurrency, number> = {
          USD: 1.0,
          EUR: Number(data.rates.EUR) || FALLBACK_RATES_FROM_USD.EUR,
          GBP: Number(data.rates.GBP) || FALLBACK_RATES_FROM_USD.GBP,
          EGP: Number(data.rates.EGP) || FALLBACK_RATES_FROM_USD.EGP,
        };
        cachedRates = { rates: liveRates, timestamp: now };
        return liveRates;
      }
    }
  } catch (err) {
    console.warn('[currency] Unable to fetch live rates, using fallback rates:', err);
  }

  return FALLBACK_RATES_FROM_USD;
}

/**
 * Normalizes and validates incoming currency string.
 */
export function normalizeCurrency(input?: string | null): SupportedCurrency {
  if (!input) return DEFAULT_CURRENCY;
  const upper = input.trim().toUpperCase() as SupportedCurrency;
  return SUPPORTED_CURRENCIES.includes(upper) ? upper : DEFAULT_CURRENCY;
}

/**
 * Converts an amount from one currency to another using authoritative server rates.
 */
export async function convertCurrency(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
): Promise<{ convertedAmount: number; rate: number }> {
  if (from === to) {
    return { convertedAmount: Math.round(amount * 100) / 100, rate: 1.0 };
  }

  const rates = await getExchangeRates();
  const rateFrom = rates[from] || 1.0;
  const rateTo = rates[to] || 1.0;

  // Amount in USD = amount / rateFrom
  // Amount in target currency = (amount / rateFrom) * rateTo
  const usdAmount = amount / rateFrom;
  const targetAmount = usdAmount * rateTo;
  const effectiveRate = rateTo / rateFrom;

  return {
    convertedAmount: Math.round(targetAmount * 100) / 100,
    rate: effectiveRate,
  };
}

/**
 * Format currency amount with symbol.
 */
export function formatCurrencyAmount(amount: number, currency: SupportedCurrency = 'USD'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (currency === 'EGP') {
    return `${formatted} EGP`;
  }
  return `${symbol}${formatted}`;
}
