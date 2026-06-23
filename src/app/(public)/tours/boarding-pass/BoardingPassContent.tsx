'use client';

import { useLanguage } from '@/context/LanguageContext';

interface BoardingPassContentProps {
  bookingReference: string;
  tourTitle: string;
  travelDate: string;
  customerName: string;
  hotelName: string;
  guestCount: number;
  roomNumber: string | null;
  selectedPickupTime: string | null;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  qrSvg: string;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function BoardingPassContent({
  bookingReference,
  tourTitle,
  travelDate,
  customerName,
  hotelName,
  guestCount,
  roomNumber,
  selectedPickupTime,
  isCheckedIn,
  checkedInAt,
  qrSvg,
}: BoardingPassContentProps) {
  const { dict } = useLanguage();

  return (
    <main className="min-h-screen bg-gray-50 print:bg-white">
      <div className="mx-auto max-w-md p-4 print:p-2">
        <div className="mb-6 text-center print:mb-3">
          <span className="text-2xl font-black uppercase tracking-[0.34em] text-white">TALAGO</span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
          <p className="mt-1 text-sm font-medium text-emerald-700">{dict.voucherPage.boardingPassBadge}</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg print:shadow-none print:border-gray-300">
          <div className="h-2 bg-[#FF5B00]" />

          <div className="p-6 print:p-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.booking}</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900">{bookingReference}</p>
              </div>
              {isCheckedIn ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {dict.voucherPage.checkedIn}
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {dict.voucherPage.notCheckedIn}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <DetailItem label={dict.voucherPage.tour} value={tourTitle} />
              <DetailItem label={dict.voucherPage.date} value={travelDate} />
              <DetailItem label={dict.voucherPage.passenger} value={customerName} />
              <DetailItem label={dict.voucherPage.hotel} value={hotelName || '—'} />
              <DetailItem label={dict.voucherPage.guests} value={`${guestCount}`} />
              <DetailItem label={dict.voucherPage.room} value={roomNumber || '—'} />
              {selectedPickupTime && (
                <DetailItem label={dict.voucherPage.pickupTime} value={selectedPickupTime} />
              )}
            </div>

            {isCheckedIn && checkedInAt && (
              <div className="rounded-lg bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-800">
                ✓ {dict.voucherPage.checkedInOn}{' '}
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
            <p className="mt-3 text-xs text-gray-500">{dict.voucherPage.presentPass}</p>
          </div>
        </div>

        <div className="mt-8 text-center print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-block rounded-lg bg-[#FF5B00] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e65200]"
          >
            {dict.voucherPage.printPass}
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
