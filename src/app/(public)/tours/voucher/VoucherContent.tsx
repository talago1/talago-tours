'use client';

import Link from 'next/link';
import { MessageSquare, Printer } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useContactSettings } from '@/hooks/useContactSettings';
import QrGeneratorCard from '@/components/vouchers/QrGeneratorCard';

interface VoucherContentProps {
  bookingReference: string;
  tourTitle: string;
  travelDate: string;
  customerName: string;
  hotelName: string;
  guestCount: number;
  selectedPickupTime: string | null;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  verifyUrl: string;
}

export default function VoucherContent({
  bookingReference,
  tourTitle,
  travelDate,
  customerName,
  hotelName,
  guestCount,
  selectedPickupTime,
  isCheckedIn,
  checkedInAt,
  verifyUrl,
}: VoucherContentProps) {
  const { dict } = useLanguage();
  const { getWhatsAppUrl } = useContactSettings();

  const whatsappMessage = `Hello Talago Concierge! I have a question regarding my booking reference: ${bookingReference} for ${tourTitle} (${travelDate}).`;
  const whatsappHref = getWhatsAppUrl(whatsappMessage);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <span className="text-2xl font-black uppercase tracking-[0.34em] text-emerald-900">TALAGO</span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40 ml-1 inline-block" />
          <p className="mt-1 text-sm text-emerald-700">{dict.voucherPage.badge}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.bookingRef}</p>
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

          <div className="space-y-3 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.tour}</p>
              <p className="text-sm font-semibold text-gray-900">{tourTitle}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.travelDate}</p>
              <p className="text-sm font-semibold text-gray-900">{travelDate}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.customer}</p>
              <p className="text-sm font-semibold text-gray-900">{customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.hotel}</p>
              <p className="text-sm font-semibold text-gray-900">{hotelName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.totalGuests}</p>
              <p className="text-sm font-semibold text-gray-900">{guestCount}</p>
            </div>
            {selectedPickupTime && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{dict.voucherPage.pickupTime}</p>
                <p className="text-sm font-semibold text-gray-900">{selectedPickupTime}</p>
              </div>
            )}
          </div>

          {isCheckedIn && checkedInAt && (
            <div className="rounded-lg bg-emerald-50 p-3 text-center text-sm text-emerald-800">
              {dict.voucherPage.checkedInOn}{' '}
              {new Date(checkedInAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </div>
          )}
        </div>

        {/* Voucher Action Strip */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition active:scale-[0.98]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp Concierge</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 px-4 py-3 text-xs font-bold text-gray-800 shadow-sm transition active:scale-[0.98]"
          >
            <Printer className="h-4 w-4 text-gray-600" />
            <span>Download / Print PDF</span>
          </button>
        </div>

        <div className="mt-6 flex justify-center">
          <QrGeneratorCard url={verifyUrl} />
        </div>

        <div className="mt-6 text-center text-xs text-gray-400 print:hidden">
          <p>{dict.voucherPage.presentVoucher}</p>
          <p className="mt-1">{dict.voucherPage.guideScan}</p>
        </div>

        <div className="mt-8 text-center print:hidden">
          <Link
            href="/"
            className="inline-block rounded-lg bg-emerald-700 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
          >
            {dict.voucherPage.backToHome}
          </Link>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          main { background: white !important; padding: 0 !important; }
          .print\\:hidden { display: none !important; }
          a { display: none !important; }
        }
      `}</style>
    </main>
  );
}
