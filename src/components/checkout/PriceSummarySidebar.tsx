import type { PaymentScheme } from '@/types/checkout';
import type { PromoDiscount } from '@/utils/promo';

export default function PriceSummarySidebar({
  tourTitle,
  guestCount,
  basePrice,
  scheme,
  onSchemeChange,
  promoDiscount,
  onPromoApplied,
}: {
  tourTitle: string;
  guestCount: number;
  basePrice: number;
  scheme: PaymentScheme;
  onSchemeChange: (s: PaymentScheme) => void;
  promoDiscount: PromoDiscount | null;
  onPromoApplied: (d: PromoDiscount | null) => void;
}) {
  return null;
}
