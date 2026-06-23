import { prisma } from '@/lib/prisma';

export interface PromoDiscount {
  id: string;
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
  currency: string;
  minBookingValue: number;
}

export type PromoValidationError =
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'USAGE_LIMIT_REACHED'
  | 'MIN_BOOKING_VALUE_NOT_MET'
  | 'CURRENCY_MISMATCH';

export interface PromoValidationResult {
  valid: boolean;
  discount?: PromoDiscount;
  error?: PromoValidationError;
  /** Human-readable description of the error */
  message?: string;
}

/**
 * Validates a promo code and returns a typed result with detailed error
 * reasons. Use this from API routes that need descriptive feedback.
 */
export async function validatePromoConstraints(
  code: string,
  options: {
    bookingValue?: number;
    currency?: string;
  } = {}
): Promise<PromoValidationResult> {
  if (!code || code.trim() === '') {
    return { valid: false, error: 'NOT_FOUND', message: 'Promo code is required' };
  }

  const normalizedCode = code.trim().toUpperCase();

  const promo = await prisma.promoCode.findFirst({
    where: {
      code: { equals: normalizedCode, mode: 'insensitive' },
    },
  });

  if (!promo) {
    return { valid: false, error: 'NOT_FOUND', message: 'Promo code not found' };
  }

  if (!promo.isActive) {
    return { valid: false, error: 'INACTIVE', message: 'This promo code is no longer active' };
  }

  if (new Date(promo.expiresAt) < new Date()) {
    return { valid: false, error: 'EXPIRED', message: 'This promo code has expired' };
  }

  if (promo.usedCount >= promo.maxUses) {
    return {
      valid: false,
      error: 'USAGE_LIMIT_REACHED',
      message: 'This promo code has reached its maximum number of uses',
    };
  }

  // Currency match — only enforced when caller provides a booking currency
  if (options.currency && promo.discountType === 'FIXED_AMOUNT') {
    if (promo.currency !== options.currency) {
      return {
        valid: false,
        error: 'CURRENCY_MISMATCH',
        message: `This promo code is only valid for ${promo.currency} bookings`,
      };
    }
  }

  // Minimum booking value — only enforced when caller provides a value
  if (options.bookingValue !== undefined) {
    const minValue = Number(promo.minBookingValue);
    if (minValue > 0 && options.bookingValue < minValue) {
      return {
        valid: false,
        error: 'MIN_BOOKING_VALUE_NOT_MET',
        message: `A minimum booking value of ${promo.currency} ${minValue} is required to use this code`,
      };
    }
  }

  return {
    valid: true,
    discount: {
      id: promo.id,
      type: promo.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
      value: Number(promo.discountValue),
      code: promo.code,
      currency: promo.currency,
      minBookingValue: Number(promo.minBookingValue),
    },
  };
}

/**
 * Calculates the discount amount for a given subtotal.
 * Clamps the result so it never exceeds the subtotal (no negative totals).
 */
export function calculateDiscount(
  discount: Pick<PromoDiscount, 'type' | 'value'>,
  subtotal: number
): number {
  const raw =
    discount.type === 'percentage'
      ? subtotal * (discount.value / 100)
      : discount.value;
  return Math.max(0, Math.min(raw, subtotal));
}

/**
 * Legacy helper — looks up a promo code and returns a simplified discount
 * object if valid, or null if invalid/expired/exhausted.
 * Used by the checkout/initialize route where currency & booking value
 * are already validated separately.
 */
export async function validatePromoCode(code: string): Promise<PromoDiscount | null> {
  const result = await validatePromoConstraints(code);
  return result.valid && result.discount ? result.discount : null;
}
