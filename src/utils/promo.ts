export interface PromoDiscount {
  type: 'percentage' | 'fixed';
  value: number;
  code: string;
}

export async function validatePromoCode(code: string): Promise<PromoDiscount | null> {
  return null;
}
