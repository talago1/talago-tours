export type PaymentStatus = 'PROCESSING' | 'PAID' | 'FAILED';

export interface PaymentInitiationRequest {
  bookingReference: string;
}

export interface PaymentInitiationResponse {
  redirectUrl: string;
  bookingReference: string;
  paymentStatus: PaymentStatus;
}

export interface PaymobOrderResponse {
  id: number;
}

export interface PaymobPaymentKeyResponse {
  token: string;
}

export interface WebhookPayload {
  obj: {
    id: number;
    pending: boolean;
    success: boolean;
    amount_cents: number;
    currency: string;
    order: {
      id: number;
      merchant_order_id: string;
    };
  };
  hmac: string;
}

export interface PaymentGatewayLog {
  transactionId: number;
  amountCents: number;
  currency: string;
  success: boolean;
  pending: boolean;
  merchantOrderId: string;
  hmacValidated: boolean;
  timestamp: string;
  rawResponse?: object;
}

export interface WebhookResponse {
  status: string;
  bookingReference?: string;
  paymentStatus?: string;
  reason?: string;
}
