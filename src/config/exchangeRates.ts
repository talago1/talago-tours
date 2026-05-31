export const EXCHANGE_RATES = {
  USD_TO_EGP: 48.50,
} as const;

export function convertUsdToEgp(usdAmount: number): number {
  return Math.round(usdAmount * EXCHANGE_RATES.USD_TO_EGP * 100) / 100;
}
