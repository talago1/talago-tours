export interface PriceCalcParams {
  perPersonPrice: number;
  guestCount: number;
  zoneTransferFee: number;
}

export function calculateTotalPrice(params: PriceCalcParams): number {
  const total = (params.perPersonPrice * params.guestCount) + params.zoneTransferFee;
  return Math.round(total * 100) / 100;
}
