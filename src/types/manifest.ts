import type { BookingChannel } from '@/types/analytics';

export interface ManifestItem {
  bookingId: string;
  passengerName: string;
  hotelName: string;
  roomNumber: string | null;
  paxCount: number;
  paymentStatus: string | null;
  channel: BookingChannel;
  isCheckedIn: boolean;
  pickupTime?: string;
}

export interface DailyTourManifest {
  tourId: string;
  tourTitle: string;
  tourType: 'SHARED' | 'PRIVATE';
  totalPassengers: number;
  maxCapacity?: number;
  availableSpots?: number;
  capacityPercent?: number;
  capacityStatus?: 'OPEN' | 'SELLING_FAST' | 'SOLD_OUT' | 'OVERBOOKED';
  manifestItems: ManifestItem[];
}

export interface ManifestResponse {
  success: true;
  date: string;
  totalBookings: number;
  totalPassengers: number;
  groups: DailyTourManifest[];
}

export interface ManifestQuery {
  date: string;
}
