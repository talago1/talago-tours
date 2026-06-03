export async function initiatePaymobSession(amount: number, bookingId: string): Promise<string> {
  return '';
}

export async function initiateFawrySession(amount: number, bookingId: string): Promise<string> {
  return '';
}

export type PaymentProvider = 'PAYMOB' | 'FAWRY';

export function getDefaultProvider(): PaymentProvider {
  return 'PAYMOB';
}

export async function createPaymentIntent(amount: number, currency: string) {
  return { clientSecret: null, error: 'Payment system not configured' };
}
