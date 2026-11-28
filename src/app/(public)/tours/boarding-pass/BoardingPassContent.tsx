'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useContactSettings } from '@/hooks/useContactSettings';
import { MessageSquare, Printer, CheckCircle2, Clock } from 'lucide-react';

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
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-white print:text-gray-900 break-words">{value}</p>
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
  const { getWhatsAppUrl } = useContactSettings();

  const whatsappMessage = `Hello Talago Concierge! I have a question regarding my boarding pass: ${bookingReference} for ${tourTitle} (${travelDate}).`;
  const whatsappHref = getWhatsAppUrl(whatsappMessage);

  return (
    <main className="min-h-screen bg-[#070F1E] py-8 px-4 print:bg-white print:py-2">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center print:mb-3">
          <div className="inline-flex items-center justify-center gap-2">
            <span className="text-2xl font-black uppercase tracking-[0.34em] text-white print:text-gray-900">
              TALAGO
            </span>
            <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
          </div>
          <p className="mt-1.5 text-xs font-bold uppercase tracking-widest text-[#00E5FF] print:text-emerald-700">
            {dict.voucherPage.boardingPassBadge}
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl print:rounded-2xl print:border-gray-300 print:bg-white print:shadow-none">
          <div className="h-1.5 bg-gradient-to-r from-[#00E5FF] via-[#0284C7] to-[#EAB308]" />

          <div className="p-6 print:p-4">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 print:border-gray-200">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 print:text-gray-500">
                  {dict.voucherPage.booking}
                </p>
                <p className="mt-0.5 font-mono text-lg font-black text-white print:text-gray-900">
                  {bookingReference}
                </p>
              </div>
              {isCheckedIn ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300 print:border-emerald-200 print:bg-emerald-100 print:text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {dict.voucherPage.checkedIn}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300 print:border-amber-200 print:bg-amber-100 print:text-amber-700">
                  <Clock className="h-3.5 w-3.5" />
                  {dict.voucherPage.notCheckedIn}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 py-5">
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
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-center text-xs font-semibold text-emerald-300 print:border-emerald-200 print:bg-emerald-50 print:text-emerald-800">
                ✓ {dict.voucherPage.checkedInOn}{' '}
                {new Date(checkedInAt).toLocaleString('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col items-center border-t border-dashed border-white/15 bg-white/[0.02] px-6 py-6 print:border-gray-300 print:bg-white print:py-3">
            <div
              className="rounded-2xl bg-white p-2.5 shadow-lg print:p-1 print:shadow-none"
              style={{ width: 196, height: 196 }}
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-3 text-center text-xs text-slate-400 print:text-gray-500">
              {dict.voucherPage.presentPass}
            </p>
          </div>
        </div>

        {/* Boarding Pass Action Strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp Concierge</span>
          </a>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs font-bold text-white transition active:scale-[0.98]"
          >
            <Printer className="h-4 w-4 text-[#00E5FF]" />
            <span>{dict.voucherPage.printPass}</span>
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
