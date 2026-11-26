export enum PaymentScheme {
  FULL_ONLINE = 'FULL_ONLINE',
  DEPOSIT_ONLINE = 'DEPOSIT_ONLINE',
  PAY_ON_ARRIVAL = 'PAY_ON_ARRIVAL',
}

export type PaymentSchemeType = `${PaymentScheme}`;

export type PickupType = 'HOTEL' | 'MEETING_POINT' | 'AIRPORT' | 'PORT' | 'STATION' | 'PRIVATE_ADDRESS' | 'NONE';

export interface SelectedAddonPayload {
  id: string;
  title: string;
  price: number;
  priceType: 'per_person' | 'flat';
  quantity: number;
  total: number;
}

export interface CheckoutFormData {
  leadName: string;
  email: string;
  phone: string;
  pickupType?: PickupType | string;
  hotelName?: string;
  pickupLocationName?: string;
  pickupAddress?: string;
  roomNumber?: string;
  pickupTime?: string;
  currency?: string;
  pickupDirectives?: string;
  flightNumbers?: string;
  bedConfiguration?: string;
  specialRequirements?: string;
  selectedAddons?: SelectedAddonPayload[];
  bookingAnswers?: Record<string, any>;
  whatsappOptIn?: boolean;
  paymentScheme: PaymentScheme;
}

export interface InitializeRequest {
  tourId: string;
  // The INTERESTED booking id created by /api/public/booking-interest
  // (or, for pre-unification attempts, a legacy lead id). When present
  // and INTERESTED, initialize resumes that booking instead of creating
  // a second one.
  reservationId?: string;
  attemptId?: string;
  idempotencyKey?: string;
  departureDate: string;
  guestCount: number;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  formData: CheckoutFormData;
  promoCode?: string | null;
  selectedAddons?: SelectedAddonPayload[];
  bookingAnswers?: Record<string, any>;
}

export interface InitializeResponse {
  bookingId: string;
  bookingReference?: string;
  accessToken: string;
  status?: string;
  isExisting?: boolean;
  isResumed?: boolean;
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
