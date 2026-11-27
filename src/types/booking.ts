export type BookingStatus = 'INTERESTED' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface BookingTourDetails {
  description?: string | null;
  durationHours?: number | null;
  durationDisplay?: string | null;
  inclusions?: string[];
  exclusions?: string[];
  highlights?: string[];
  hasGuide?: boolean;
  guideLanguages?: string[];
  freeCancellationHours?: number | null;
  instantConfirmation?: boolean;
  fitnessLevel?: string | null;
  wheelchairAccessible?: boolean;
  strollerAccessible?: boolean;
  accessibilityNotes?: string | null;
  safetyGuidelines?: string[];
  routeStops?: any;
  itinerary?: any;
  meetingPoint?: string | null;
  requirements?: string | null;
  operatorName?: string | null;
  operatorPhone?: string | null;
}

export interface ActiveQueueTicket {
  id: string;
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerProfileId?: string | null;
  travelDate: string;
  guestCount: number;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  totalPriceUSD: number;
  currency?: string;
  paymentStatus?: string | null;
  whatsappOptIn?: boolean;
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
  source?: string | null;
  notes?: string | null;
  conversationId?: string | null;
  unreadMessageCount?: number;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  updatedAt?: string;
  tourDetails?: BookingTourDetails | null;
}

export interface CheckoutFormData {
  tourId: string;
  zoneId?: string;
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
  zoneId?: string;
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
  accessToken: string;
}

export interface CheckoutError {
  error: string;
  field?: string;
}

export const BOOKING_STATUS_VALUES: BookingStatus[] = ['INTERESTED', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  INTERESTED: ['PENDING', 'CONFIRMED', 'CANCELLED'],
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};
