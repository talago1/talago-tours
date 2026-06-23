import { PaymentScheme } from '@/types/checkout';

export interface PriceCalcParams {
  perPersonPrice: number;
  guestCount: number;
  zoneTransferFee: number;
}

/** Legacy single-tier calculation (still used by API fallback) */
export function calculateTotalPrice(params: PriceCalcParams): number {
  const total = (params.perPersonPrice * params.guestCount) + params.zoneTransferFee;
  return Math.round(total * 100) / 100;
}

export interface TieredPriceCalcParams {
  adultPrice: number;
  childPrice?: number | null;
  infantPrice?: number | null;
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  zoneTransferFee: number;
}

/** Per-tier calculation: adults × adultPrice + children × childPrice + infants × infantPrice + zone fee */
export function calculateTieredPrice(params: TieredPriceCalcParams): number {
  const adultTotal = params.adultPrice * params.adultsCount;
  const childTotal = (params.childPrice ?? 0) * params.childrenCount;
  const infantTotal = (params.infantPrice ?? 0) * params.infantsCount;
  const total = adultTotal + childTotal + infantTotal + params.zoneTransferFee;
  return Math.round(total * 100) / 100;
}

// ---------------------------------------------------------------------------
// Single-source-of-truth pricing for the checkout flow
// Used by both the client-side PriceSummarySidebar and the server-side
// checkout/initialize route — any pricing logic changes go here only.
// ---------------------------------------------------------------------------

export interface PromoInput {
  type: 'percentage' | 'fixed';
  value: number;
  minBookingValue: number;
}

export interface PriceBreakdownInput {
  adultsCount: number;
  childrenCount: number;
  infantsCount: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  zoneTransferFee: number;
  depositPercentage: number;
  scheme: PaymentScheme;
  promo: PromoInput | null;
}

export interface PriceBreakdown {
  baseSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  grandTotal: number;
  amountPaidOnline: number;
  amountDueOnArrival: number;
}

export function computePriceBreakdown(input: PriceBreakdownInput): PriceBreakdown {
  const {
    adultsCount, childrenCount, infantsCount,
    adultPrice, childPrice, infantPrice,
    zoneTransferFee, depositPercentage, scheme, promo,
  } = input;

  // Base subtotal
  const adultTotal = adultPrice * adultsCount;
  const childTotal = childPrice * childrenCount;
  const infantTotal = infantPrice * infantsCount;
  const baseSubtotal = adultTotal + childTotal + infantTotal;

  // Promo discount
  let discountAmount = 0;
  if (promo && baseSubtotal >= promo.minBookingValue) {
    discountAmount = promo.type === 'percentage'
      ? baseSubtotal * (promo.value / 100)
      : promo.value;
    discountAmount = Math.min(discountAmount, baseSubtotal);
  }

  const discountedSubtotal = baseSubtotal - discountAmount;
  const grandTotal = Math.round((discountedSubtotal + zoneTransferFee) * 100) / 100;

  // Payment split
  let amountPaidOnline: number;
  let amountDueOnArrival: number;

  switch (scheme) {
    case PaymentScheme.PAY_ON_ARRIVAL:
      amountPaidOnline = 0;
      amountDueOnArrival = grandTotal;
      break;
    case PaymentScheme.DEPOSIT_ONLINE: {
      const calculatedDeposit = (discountedSubtotal * (depositPercentage / 100)) + zoneTransferFee;
      amountPaidOnline = Math.round(calculatedDeposit * 100) / 100;
      amountDueOnArrival = Math.round((grandTotal - amountPaidOnline) * 100) / 100;
      break;
    }
    case PaymentScheme.FULL_ONLINE:
    default:
      amountPaidOnline = grandTotal;
      amountDueOnArrival = 0;
      break;
  }

  return {
    baseSubtotal,
    discountAmount,
    discountedSubtotal,
    grandTotal,
    amountPaidOnline,
    amountDueOnArrival,
  };
}
