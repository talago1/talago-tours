const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_REGEX = /^\+[1-9]\d{6,14}$/;

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
  if (!E164_REGEX.test(value.trim())) return 'Please enter a valid phone number including country code (e.g. +201234567890)';
  return null;
}

export function validateCheckoutForm(data: {
  tourId: string;
  zoneId: string;
  hotelName: string;
  travelDate: string;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  maxGuestCount?: number;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.tourId) errors.tourId = 'Tour ID is required';
  if (!data.zoneId) errors.zoneId = 'Pickup zone is required';

  const dateErr = validateTravelDate(data.travelDate);
  if (dateErr) errors.travelDate = dateErr;

  const guestErr = validateGuestCount(data.guestCount, data.maxGuestCount);
  if (guestErr) errors.guestCount = guestErr;

  const hotelErr = validateHotelName(data.hotelName);
  if (hotelErr) errors.hotelName = hotelErr;

  const nameErr = validateCustomerName(data.customerName);
  if (nameErr) errors.customerName = nameErr;

  const emailErr = validateCustomerEmail(data.customerEmail);
  if (emailErr) errors.customerEmail = emailErr;

  const phoneErr = validateCustomerPhone(data.customerPhone);
  if (phoneErr) errors.customerPhone = phoneErr;

  return errors;
}
