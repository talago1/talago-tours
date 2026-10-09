import { NextResponse } from 'next/server';
import { getExchangeRates, SUPPORTED_CURRENCIES, CURRENCY_SYMBOLS, DEFAULT_CURRENCY, SupportedCurrency } from '@/utils/currency';
import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache 1 hour

export async function GET() {
  try {
    const liveRates = await getExchangeRates();
    const mergedRates: Record<SupportedCurrency, number> = { ...liveRates };

    // Check if admin configured custom exchange rates in system settings
    try {
      const financialSetting = await prisma.systemSetting.findUnique({
        where: { key: 'financial' },
      });

      if (financialSetting) {
        const parsed = parseSettingValue<{ exchangeRates?: Record<string, number> }>(
          financialSetting.value,
          {}
        );
        if (parsed.exchangeRates && typeof parsed.exchangeRates === 'object') {
          for (const curr of SUPPORTED_CURRENCIES) {
            const custom = Number(parsed.exchangeRates[curr]);
            if (custom && custom > 0) {
              mergedRates[curr] = custom;
            }
          }
        }
      }
    } catch {
      // Fallback silently to live/default rates if database is unreachable
    }

    return NextResponse.json({
      base: 'USD',
      rates: mergedRates,
      currencies: SUPPORTED_CURRENCIES,
      symbols: CURRENCY_SYMBOLS,
      defaultCurrency: DEFAULT_CURRENCY,
    });
  } catch (err) {
    console.error('[currency/rates] Error fetching exchange rates:', err);
    return NextResponse.json(
      {
        base: 'USD',
        rates: { USD: 1.0, EUR: 0.92, GBP: 0.78, EGP: 48.5 },
        currencies: SUPPORTED_CURRENCIES,
        symbols: CURRENCY_SYMBOLS,
        defaultCurrency: DEFAULT_CURRENCY,
      },
      { status: 200 }
    );
  }
}
