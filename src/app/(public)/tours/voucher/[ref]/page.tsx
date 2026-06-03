import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import QrGeneratorCard from '@/components/vouchers/QrGeneratorCard';
import { hasExistingCheckIn, getExistingCheckInTimestamp } from '@/utils/voucherLogManager';
import type { TicketVoucherProps } from '@/types/voucher';
import { notFound } from 'next/navigation';

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
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">TALAGO TOURS</h1>
          <p className="mt-1 text-sm text-emerald-700">Digital Tour Voucher</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Booking Reference</p>
              <p className="mt-0.5 text-lg font-bold text-gray-900">{booking.bookingReference}</p>
            </div>
            {isCheckedIn ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                CHECKED IN
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                NOT CHECKED IN
              </span>
            )}
          </div>

          <div className="space-y-3 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tour</p>
              <p className="text-sm font-semibold text-gray-900">{tourTitle}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Travel Date</p>
              <p className="text-sm font-semibold text-gray-900">
                {booking.travelDate ? formatDate(new Date(booking.travelDate)) : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer</p>
              <p className="text-sm font-semibold text-gray-900">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Hotel</p>
              <p className="text-sm font-semibold text-gray-900">{booking.hotelName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total Guests</p>
              <p className="text-sm font-semibold text-gray-900">{booking.guestCount}</p>
            </div>
          </div>

          {isCheckedIn && checkedInAt && (
            <div className="rounded-lg bg-emerald-50 p-3 text-center text-sm text-emerald-800">
              Checked in on{' '}
              {new Date(checkedInAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <QrGeneratorCard url={verifyUrl} />
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Present this voucher to your tour guide.</p>
          <p className="mt-1">The guide will scan the QR code to verify your booking.</p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-block rounded-lg bg-emerald-700 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          main { background: white !important; }
          a { display: none !important; }
        }
      `}</style>
    </main>
  );
}
