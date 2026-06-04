export enum PaymentScheme {
  FULL_ONLINE = 'FULL_ONLINE',
  DEPOSIT_ONLINE = 'DEPOSIT_ONLINE',
  PAY_ON_ARRIVAL = 'PAY_ON_ARRIVAL',
}

export type PaymentSchemeType = `${PaymentScheme}`;

export interface CheckoutFormData {
  leadName: string;
  email: string;
  phone: string;
  hotelName: string;
  roomNumber?: string;
  pickupTime: string;
  pickupDirectives?: string;
  flightNumbers?: string;
  bedConfiguration?: string;
  specialRequirements?: string;
  paymentScheme: PaymentScheme;
}

export interface InitializeRequest {
  tourId: string;
  departureDate: string;
  guestCount: number;
  formData: CheckoutFormData;
}

export interface InitializeResponse {
  bookingId: string;
  transactionId: string;
  amountPaidOnline: number;
  amountDueOnArrival: number;
  scheme: PaymentScheme;
  gatewayIframeUrl?: string;
  confirmationUrl?: string;
}

export interface PriceBreakdown {
  total: number;
  amountPaidOnline: number;
  amountDueOnArrival: number;
  scheme: PaymentScheme;
}
