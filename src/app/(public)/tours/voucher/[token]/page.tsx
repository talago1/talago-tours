import { isPlausibleAccessToken } from '@/utils/bookingToken';
import { prisma } from '@/lib/prisma';
import { hasExistingCheckIn, getExistingCheckInTimestamp } from '@/utils/voucherLogManager';
import type { TicketVoucherProps } from '@/types/voucher';
import { notFound } from 'next/navigation';
import VoucherContent from '../VoucherContent';

// A voucher is customer-specific and behind a secret; keep it out of indexes.
export const metadata = { robots: { index: false, follow: false } };

function getTourTitle(translations: unknown, lang: string): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en', 'de', 'ru', 'fr', 'it', 'tr']) {
      const entry = t[key];
      if (entry && typeof entry.title === 'string') return entry.title;
    }
  }
  return 'Tour';
}

// The voucher carries the customer's name, hotel and travel date, so it is
// reachable with the 256-bit accessToken only. A bookingReference is not enough:
// it is a display identifier with 4 random characters.
async function getBooking(token: string) {
  if (!isPlausibleAccessToken(token)) return null;
  return prisma.booking.findFirst({
    where: { accessToken: token },
    include: { tour: true },
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function VoucherPage({ params }: { params: { token: string } }) {
  const booking = await getBooking(params.token);
  if (!booking || !booking.tour) notFound();

  const tourTitle = getTourTitle(booking.tour.translations, booking.language);
  // Admin-only verification endpoint, so the display reference is correct here.
  // The access token must never be placed in a URL the guest might share.
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com'}/admin/bookings/verify/${booking.bookingReference}`;
  const isCheckedIn = hasExistingCheckIn(booking.checkInLog);
  const checkedInAt = isCheckedIn ? getExistingCheckInTimestamp(booking.checkInLog) : null;

  return (
    <VoucherContent
      bookingReference={booking.bookingReference}
      tourTitle={tourTitle}
      travelDate={booking.travelDate ? formatDate(new Date(booking.travelDate)) : '—'}
      customerName={booking.customerName}
      hotelName={booking.hotelName || '—'}
      guestCount={booking.guestCount}
      selectedPickupTime={booking.selectedPickupTime}
      isCheckedIn={isCheckedIn}
      checkedInAt={checkedInAt}
      verifyUrl={verifyUrl}
    />
  );
}
