/**
 * Safe, short-lived client-side booking draft storage.
 * - Stores non-sensitive traveler draft information (name, email, phone, pickup, participants).
 * - Never stores payment methods, credit card details, or auth tokens.
 * - Auto-expires after 24 hours.
 * - Cleans up automatically upon successful booking or cancellation.
 */

export interface BookingDraft {
  tourId: string;
  departureDate?: string;
  selectedTime?: string;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  leadName?: string;
  email?: string;
  phone?: string;
  pickupType?: string;
  hotelName?: string;
  roomNumber?: string;
  specialRequirements?: string;
  selectedAddons?: Record<string, boolean>;
  selectedZoneId?: string;
  savedAt: number;
}

const STORAGE_KEY_PREFIX = 'talago_booking_draft_';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export function saveBookingDraft(tourId: string, draft: Partial<Omit<BookingDraft, 'tourId' | 'savedAt'>>): void {
  if (typeof window === 'undefined' || !tourId) return;
  try {
    const payload: BookingDraft = {
      ...draft,
      tourId,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${tourId}`, JSON.stringify(payload));
  } catch (err) {
    // Non-fatal if storage quota exceeded or disabled in private browsing
    console.warn('[DraftStorage] Failed to save booking draft:', err);
  }
}

export function loadBookingDraft(tourId: string): BookingDraft | null {
  if (typeof window === 'undefined' || !tourId) return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${tourId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingDraft;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearBookingDraft(tourId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingDraft(tourId: string): void {
  if (typeof window === 'undefined' || !tourId) return;
  try {
    sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${tourId}`);
  } catch {}
}

