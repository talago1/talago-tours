export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ActiveQueueTicket {
  id: string;
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  travelDate: string;
  guestCount: number;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  totalPriceUSD: number;
  hotelName: string | null;
  pickupTime: string | null;
  status: BookingStatus;
  language: string;
  voucherUrl?: string;
  roomNumber?: string | null;
  pickupDirectives?: string | null;
  flightNumbers?: string | null;
  bedConfiguration?: string | null;
  bedConfig?: string | null;
  specialRequirements?: string | null;
  tourId?: string;
  paymentScheme?: string;
  amountPaidOnline?: number;
  amountDueOnArrival?: number;
  zoneName?: string;
  destinationName?: string;
  category?: string | null;
  createdAt?: string;
  pickupType?: string | null;
  pickupLocationName?: string | null;
  pickupAddress?: string | null;
  selectedAddons?: any;
  bookingAnswers?: any;
}

export interface CheckoutFormData {
  tourId: string;
  zoneId: string;
  hotelName: string | null;
  travelDate: string;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface Booking {
  id: string;
  bookingReference: string;
  tourId: string;
  zoneId: string;
  hotelName: string;
  travelDate: Date;
  guestCount: number;
  totalPriceUSD: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: BookingStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneOption {
  id: string;
  name: string;
  transferFee: number;
}

export interface CheckoutResponse {
  bookingReference: string;
}

export interface CheckoutError {
  error: string;
  field?: string;
}

export const BOOKING_STATUS_VALUES: BookingStatus[] = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
