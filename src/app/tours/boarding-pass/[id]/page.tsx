import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { encodeQr, qrMatrixToSvg } from '@/utils/qrEncoder';
import { generateToken } from '@/utils/qrTokenCrypto';
import { hasExistingCheckIn, getExistingCheckInTimestamp } from '@/utils/voucherLogManager';

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
    <main className="min-h-screen bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-md p-4 print:p-2">
        <div className="mb-6 text-center print:mb-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">TALAGO TOURS</h1>
          <p className="mt-1 text-sm font-medium text-emerald-700">Boarding Pass</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg print:shadow-none print:border-gray-300">
          <div className="h-2 bg-[#FF5B00]" />

          <div className="p-6 print:p-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Booking</p>
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

            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem label="Tour" value={tourTitle} />
              <DetailItem label="Date" value={formatDate(new Date(booking.travelDate))} />
              <DetailItem label="Passenger" value={booking.customerName} />
              <DetailItem label="Hotel" value={booking.hotelName || '—'} />
              <DetailItem label="Guests" value={`${booking.guestCount}`} />
              <DetailItem label="Room" value={booking.roomNumber || '—'} />
            </div>

            {isCheckedIn && checkedInAt && (
              <div className="rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
                ✓ Checked in on{' '}
                {new Date(checkedInAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center border-t border-dashed border-gray-200 px-6 py-6 print:py-3">
            <div
              className="rounded-lg"
              style={{ width: 180, height: 180 }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-3 text-xs text-gray-500">Present this pass to your tour guide</p>
          </div>
        </div>

        <div className="mt-8 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-block rounded-lg bg-[#FF5B00] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e65200]"
          >
            Print Boarding Pass
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0.5cm; }
          body { background: white !important; }
          main { background: white !important; }
          button { display: none !important; }
          a { display: none !important; }
        }
      `}</style>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
