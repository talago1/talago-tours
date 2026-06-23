import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { encodeQr, qrMatrixToSvg } from '@/utils/qrEncoder';
import { generateToken } from '@/utils/qrTokenCrypto';
import { hasExistingCheckIn, getExistingCheckInTimestamp } from '@/utils/voucherLogManager';
import BoardingPassContent from '../BoardingPassContent';

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

export default async function BoardingPassPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
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
