import { verifyPaymobEnv } from '@/lib/env';
import type { PaymobOrderResponse, PaymobPaymentKeyResponse } from '@/types/payment';

interface BillingData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

async function getAuthToken(): Promise<string> {
  const { PAYMOB_API_KEY } = verifyPaymobEnv();
  const res = await fetch('https://accept.paymob.com/api/auth/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: PAYMOB_API_KEY }),
  });

  if (!res.ok) {
    throw new Error(`Paymob auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.token as string;
}

async function registerOrder(
  token: string,
  amountCents: number,
  merchantOrderId: string
): Promise<PaymobOrderResponse> {
  const res = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_token: token,
      delivery_needed: 'false',
      amount_cents: amountCents,
      currency: 'EGP',
      merchant_order_id: merchantOrderId,
    }),
  });

  if (!res.ok) {
    throw new Error(`Paymob order registration failed: ${res.status}`);
  }

  return res.json();
}

async function getPaymentKey(
  token: string,
  orderId: number,
  amountCents: number,
  billingData: BillingData
): Promise<PaymobPaymentKeyResponse> {
  const { PAYMOB_INTEGRATION_ID } = verifyPaymobEnv();

  const res = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        apartment: 'NA',
        email: billingData.email,
        floor: 'NA',
        first_name: billingData.firstName,
        street: 'NA',
        building: 'NA',
        phone_number: billingData.phoneNumber,
        shipping_method: 'NA',
        postal_code: 'NA',
        city: 'NA',
        country: 'EG',
        last_name: billingData.lastName,
        state: 'NA',
      },
      currency: 'EGP',
      integration_id: Number(PAYMOB_INTEGRATION_ID),
      lock_order_when_paid: 'true',
    }),
  });

  if (!res.ok) {
    throw new Error(`Paymob payment key generation failed: ${res.status}`);
  }

  return res.json();
}

function buildRedirectUrl(paymentKey: string): string {
  const { PAYMOB_INTEGRATION_ID } = verifyPaymobEnv();
  return `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_INTEGRATION_ID}?payment_token=${paymentKey}`;
}

export interface InitiatePaymentParams {
  amountCents: number;
  merchantOrderId: string;
  billingData: BillingData;
}

export async function initiatePaymobSession(params: InitiatePaymentParams): Promise<string> {
  const token = await getAuthToken();
  const order = await registerOrder(token, params.amountCents, params.merchantOrderId);
  const paymentKey = await getPaymentKey(token, order.id, params.amountCents, params.billingData);
  return buildRedirectUrl(paymentKey.token);
}
