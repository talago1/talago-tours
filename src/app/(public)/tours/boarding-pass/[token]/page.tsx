import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { isPlausibleAccessToken } from '@/utils/bookingToken';
import { encodeQr, qrMatrixToSvg } from '@/utils/qrEncoder';
import { generateToken } from '@/utils/qrTokenCrypto';
import { hasExistingCheckIn, getExistingCheckInTimestamp } from '@/utils/voucherLogManager';
import BoardingPassContent from '../BoardingPassContent';

// A boarding pass shows the customer's name, hotel, room number and travel
// date. It must require the 256-bit accessToken, not the internal id.
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

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default async function BoardingPassPage({ params }: { params: { token: string } }) {
  const accessToken = params.token;
  if (!isPlausibleAccessToken(accessToken)) return notFound();

  const booking = await prisma.booking.findFirst({
    where: { accessToken },
    include: { tour: true },
  });

  if (!booking || !booking.tour) notFound();
  if (booking.status !== 'CONFIRMED') notFound();

  const tourTitle = getTourTitle(booking.tour.translations, booking.language);
  const token = generateToken(booking.id);
  const qrResult = encodeQr(token);
  const qrSvg = qrMatrixToSvg(qrResult, '#1a1a1a');
  const isCheckedIn = hasExistingCheckIn(booking.checkInLog);
  const checkedInAt = isCheckedIn ? getExistingCheckInTimestamp(booking.checkInLog) : null;

  return (
    <BoardingPassContent
      bookingReference={booking.bookingReference}
      tourTitle={tourTitle}
      travelDate={formatDate(new Date(booking.travelDate))}
      customerName={booking.customerName}
      hotelName={booking.hotelName || '—'}
      guestCount={booking.guestCount}
      roomNumber={booking.roomNumber}
      selectedPickupTime={booking.selectedPickupTime}
      isCheckedIn={isCheckedIn}
      checkedInAt={checkedInAt}
      qrSvg={qrSvg}
    />
  );
}
