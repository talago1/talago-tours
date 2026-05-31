export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface ActiveQueueTicket {
  id: string;
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  customerPhone: string;
  travelDate: string;
  guestCount: number;
  totalPriceUSD: number;
  hotelName: string;
  pickupTime: string | null;
  status: BookingStatus;
  language: string;
  voucherUrl?: string;
  roomNumber?: string | null;
}

export interface CheckoutFormData {
  tourId: string;
  zoneId: string;
  hotelName: string;
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
