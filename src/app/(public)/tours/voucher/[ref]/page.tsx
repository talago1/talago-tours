import { prisma } from '@/lib/prisma';
import { hasExistingCheckIn, getExistingCheckInTimestamp } from '@/utils/voucherLogManager';
import type { TicketVoucherProps } from '@/types/voucher';
import { notFound } from 'next/navigation';
import VoucherContent from '../VoucherContent';

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

async function getBooking(ref: string) {
  const booking = await prisma.booking.findUnique({
    where: { bookingReference: ref },
    include: { tour: true },
  });
  return booking;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function VoucherPage({ params }: TicketVoucherProps) {
  const booking = await getBooking(params.ref);
  if (!booking || !booking.tour) notFound();

  const tourTitle = getTourTitle(booking.tour.translations, booking.language);
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://talago.com'}/admin/bookings/verify/${params.ref}`;
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
