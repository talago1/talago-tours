const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Accept any number: local, E164, with spaces/dashes
const PHONE_REGEX = /^\+?[\d\s\-().]{7,20}$/;

export function validateTravelDate(value: string): string | null {
  if (!value) return 'Travel date is required';
  const date = new Date(value + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (isNaN(date.getTime())) return 'Invalid date format';
  if (date <= today) return 'Please select a future date';
  return null;
}

export function validateGuestCount(value: number, max?: number): string | null {
  if (!Number.isInteger(value) || value < 1) return 'Guest count must be at least 1';
  if (max && value > max) return `Maximum ${max} guests allowed for this tour`;
  return null;
}

/** Validate that at least 1 adult is selected */
export function validateGuestTiers(
  adultsCount: number,
  childrenCount: number,
  infantsCount: number,
): string | null {
  if (adultsCount < 1) return 'At least 1 adult is required';
  if (adultsCount < 0 || childrenCount < 0 || infantsCount < 0) return 'Guest counts cannot be negative';
  return null;
}

export function validateHotelName(value: string): string | null {
  if (!value || value.trim().length === 0) return 'Hotel name is required';
  if (value.length > 200) return 'Hotel name cannot exceed 200 characters';
  return null;
}

export function validateCustomerName(value: string): string | null {
  if (!value || value.trim().length < 2) return 'Name is required (minimum 2 characters)';
  return null;
}

export function validateCustomerEmail(value: string): string | null {
  if (!value || value.trim().length === 0) return 'Email is required';
  if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address';
  return null;
}

export function validateCustomerPhone(value: string): string | null {
  if (!value || value.trim().length === 0) return 'Phone number is required';
  const cleaned = value.trim();
  if (!PHONE_REGEX.test(cleaned)) return 'Please enter a valid phone number';
  return null;
}

/**
 * Derives a stable synthetic guest email from a phone number.
 * Used when a guest books with phone-only (no email provided).
 * Format: guest-<normalized_phone>@noreply.talago.com
 */
export function deriveGuestEmail(phone: string): string {
  const normalized = phone.replace(/[^\d]/g, '');
  return `guest-${normalized}@noreply.talago.com`;
}

export function validateCheckoutForm(data: {
  tourId: string;
  zoneId?: string | null;
  hotelName?: string | null;
  travelDate: string;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  maxGuestCount?: number;
  pickupType?: string | null;
  requiresHotelPickup?: boolean;
  /** If true, email is optional — will be derived from phone number */
  allowPhoneOnly?: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.tourId) errors.tourId = 'Tour ID is required';

  const dateErr = validateTravelDate(data.travelDate);
  if (dateErr) errors.travelDate = dateErr;

  const guestErr = validateGuestCount(data.guestCount, data.maxGuestCount);
  if (guestErr) errors.guestCount = guestErr;

  // Determine if hotel name is required
  const isNoPickup =
    data.requiresHotelPickup === false ||
    data.pickupType === 'none' ||
    data.pickupType === 'no_pickup' ||
    data.pickupType === 'NONE' ||
    data.pickupType === 'NO_PICKUP' ||
    data.pickupType === 'meeting_point' ||
    data.pickupType === 'MEETING_POINT';

  if (!isNoPickup) {
    const hotelErr = validateHotelName(data.hotelName || '');
    if (hotelErr) errors.hotelName = hotelErr;
  }

  const nameErr = validateCustomerName(data.customerName);
  if (nameErr) errors.customerName = nameErr;

  // Email is optional when phone-only mode is enabled and a phone is provided
  const phoneProvided = !!data.customerPhone?.trim();
  if (!data.allowPhoneOnly || !phoneProvided) {
    const emailErr = validateCustomerEmail(data.customerEmail);
    if (emailErr) errors.customerEmail = emailErr;
  }

  const phoneErr = validateCustomerPhone(data.customerPhone);
  if (phoneErr) errors.customerPhone = phoneErr;

  return errors;
}
