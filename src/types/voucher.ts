export interface TicketVoucherProps {
  params: {
    ref: string;
  };
}

export interface VerifiedVoucherPayload {
  bookingReference: string;
  tourTitle: string;
  customerName: string;
  travelDate: string;
  hotelName: string;
  pickupTime: string;
  totalGuests: number;
  isCheckedIn: boolean;
}

export interface CheckInLogEntry {
  event: 'QR_CHECK_IN';
  timestamp: string;
  scanStatus: 'SUCCESS';
}

export type VerifyResponse =
  | { success: true; checkedInAt: string; message: string; isCheckedIn?: boolean }
  | { success: false; checkedInAt?: string; error: string; isCheckedIn?: boolean };

export interface QRTokenPayload {
  bookingId: string;
  timestamp: number;
}

export interface ScanVerificationResult {
  success: boolean;
  passengerName?: string;
  tourTitle?: string;
  paxCount?: number;
  hotelName?: string;
  roomNumber?: string | null;
  error?: string;
}
