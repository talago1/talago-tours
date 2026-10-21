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
  const effectiveChildPrice = params.childPrice != null ? params.childPrice : params.adultPrice;
  const childTotal = effectiveChildPrice * params.childrenCount;
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
  /** Only used when depositType is 'PERCENTAGE' (default) */
  depositPercentage: number;
  /** 'PERCENTAGE' (default) or 'FIXED' */
  depositType?: 'PERCENTAGE' | 'FIXED';
  /** Fixed deposit amount in USD — used when depositType is 'FIXED' */
  depositAmount?: number | null;
  /** Optional sum of selected tour add-ons */
  addonsTotal?: number;
  scheme: PaymentScheme;
  promo: PromoInput | null;
}

export interface PriceBreakdown {
  baseSubtotal: number;
  discountAmount: number;
  discountedSubtotal: number;
  addonsTotal: number;
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
  const effectiveAddonsTotal = Math.max(0, input.addonsTotal ?? 0);
  const grandTotal = Math.round((discountedSubtotal + zoneTransferFee + effectiveAddonsTotal) * 100) / 100;

  // Payment split
  let amountPaidOnline: number;
  let amountDueOnArrival: number;

  switch (scheme) {
    case PaymentScheme.PAY_ON_ARRIVAL:
      amountPaidOnline = 0;
      amountDueOnArrival = grandTotal;
      break;
    case PaymentScheme.DEPOSIT_ONLINE: {
      let depositDue: number;
      if (input.depositType === 'FIXED' && input.depositAmount != null && input.depositAmount > 0) {
        // Fixed-amount deposit: use depositAmount directly (capped at grandTotal)
        depositDue = Math.min(input.depositAmount, grandTotal);
      } else {
        // Percentage deposit (default): apply to discountedSubtotal + zoneTransferFee + addonsTotal
        depositDue = ((discountedSubtotal + effectiveAddonsTotal) * (input.depositPercentage / 100)) + zoneTransferFee;
      }
      amountPaidOnline = Math.round(depositDue * 100) / 100;
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
    addonsTotal: effectiveAddonsTotal,
    grandTotal,
    amountPaidOnline,
    amountDueOnArrival,
  };
}
