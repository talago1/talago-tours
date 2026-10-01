'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';

interface BookingDetail {
  id: string;
  bookingReference: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  hotelName: string;
  roomNumber: string | null;
  travelDate: string;
  guestCount: number;
  currency: string;
  paymentScheme: string | null;
  amountPaidOnline: number | null;
  amountDueOnArrival: number | null;
  selectedPickupTime: string | null;
  collectionDue: boolean;
  transaction: {
    id: string;
    status: string;
    provider: string;
    gatewayReference: string | null;
    amountPaidOnline: number;
    amountDueOnArrival: number;
    scheme: string;
  } | null;
}

type PageState = 'loading' | 'found' | 'notfound' | 'error';

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { dict } = useLanguage();
  // The route segment is [token], so useParams() keys it as "token", not "id".
  // Reading params.id here yields undefined and every lookup 401s.
  const token = params.token as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/public/bookings?token=${encodeURIComponent(token)}`);
        if (res.status === 404 || res.status === 401) {
          setPageState('notfound');
          return;
        }
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setBooking(data);
        setPageState('found');

        if (data.status === 'CONFIRMED') {
          sessionStorage.removeItem('pendingBookingAccessToken');
        }
      } catch {
        setPageState('error');
      }
    }
    loadBooking();
  }, [token]);

  // Retry re-enters the payment flow. It deliberately no longer POSTs to
  // /api/checkout/initialize with the id: that endpoint creates a booking, so
  // a retry would create a duplicate, and the id is not a credential.
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      window.location.href = `/tours/checkout/pay?token=${encodeURIComponent(token)}`;
    } catch {
      setRetrying(false);
    }
  }, [token]);

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070F1E]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-[#00E5FF]" />
      </div>
    );
  }

  if (pageState === 'notfound') {
    return (
      <main className="min-h-screen bg-[#070F1E]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">{dict.bookingPage.notFoundTitle}</h1>
          <p className="mt-2 text-slate-400">{dict.bookingPage.notFoundDesc}</p>
          <a href="/tours" className="mt-4 inline-block text-[#00E5FF] underline">{dict.bookingPage.browseTours}</a>
        </div>
      </main>
    );
  }

  if (pageState === 'error' || !booking) {
    return (
      <main className="min-h-screen bg-[#070F1E]">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-white">{dict.bookingPage.errorTitle}</h1>
          <p className="mt-2 text-slate-400">{dict.bookingPage.errorDesc}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-block text-[#00E5FF] underline"
          >
            {dict.bookingPage.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isFailed = booking.status === 'CANCELLED';

  const currencySymbol = booking.currency === 'EGP' ? 'EGP ' : booking.currency === 'EUR' ? '€' : booking.currency === 'GBP' ? '£' : '$';

  return (
    <main className="min-h-screen bg-[#070F1E] py-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-4">
            {isConfirmed && (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20">
                <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {isPending && (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-500/20">
                <svg className="h-7 w-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            {isFailed && (
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
                <svg className="h-7 w-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isConfirmed && dict.bookingPage.bookingConfirmed}
                {isPending && dict.bookingPage.paymentPending}
                {isFailed && dict.bookingPage.paymentFailed}
              </h1>
              <p className="text-sm text-slate-400">
                {dict.bookingPage.reference} <strong className="text-slate-200">{booking.bookingReference}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-sm">
            <div>
              <p className="text-slate-500">{dict.bookingPage.leadTraveler}</p>
              <p className="font-medium text-white">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-slate-500">{dict.bookingPage.email}</p>
              <p className="font-medium text-white">{booking.customerEmail}</p>
            </div>
            <div>
              <p className="text-slate-500">{dict.bookingPage.phone}</p>
              <p className="font-medium text-white">{booking.customerPhone}</p>
            </div>
            <div>
              <p className="text-slate-500">{dict.bookingPage.guests}</p>
              <p className="font-medium text-white">{booking.guestCount}</p>
            </div>
            <div>
              <p className="text-slate-500">{dict.bookingPage.hotel}</p>
              <p className="font-medium text-white">{booking.hotelName}{booking.roomNumber ? ` (${dict.bookingPage.room} ${booking.roomNumber})` : ''}</p>
            </div>
            <div>
              <p className="text-slate-500">{dict.bookingPage.travelDate}</p>
              <p className="font-medium text-white">{new Date(booking.travelDate).toLocaleDateString()}</p>
            </div>
            {booking.selectedPickupTime && (
              <div>
                <p className="text-slate-500">{dict.bookingPage.pickupTime}</p>
                <p className="font-medium text-white">{booking.selectedPickupTime}</p>
              </div>
            )}
          </div>

          {booking.paymentScheme && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h2 className="text-sm font-medium text-slate-300">{dict.bookingPage.paymentDetails}</h2>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">{dict.bookingPage.paymentScheme}</p>
                  <p className="font-medium text-white">{booking.paymentScheme.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-slate-500">{dict.bookingPage.status}</p>
                  <p className={`font-medium ${isConfirmed ? 'text-emerald-400' : isPending ? 'text-yellow-400' : 'text-red-400'}`}>
                    {booking.status}
                  </p>
                </div>
                {booking.amountPaidOnline != null && Number(booking.amountPaidOnline) > 0 && (
                  <div>
                    <p className="text-slate-500">{dict.bookingPage.amountPaidOnline}</p>
                    <p className="font-medium text-white">{currencySymbol}{Number(booking.amountPaidOnline).toFixed(2)}</p>
                  </div>
                )}
                {booking.amountDueOnArrival != null && Number(booking.amountDueOnArrival) > 0 && (
                  <div>
                    <p className="text-slate-500">{dict.bookingPage.dueOnArrival}</p>
                    <p className="font-bold text-[#00E5FF]">{currencySymbol}{Number(booking.amountDueOnArrival).toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {booking.transaction?.gatewayReference && (
            <div className="mt-4 text-xs text-slate-500">
              {dict.bookingPage.gatewayRef} {booking.transaction.gatewayReference}
            </div>
          )}

          {isPending && (
            <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-300">
                {dict.bookingPage.processingPayment}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="mt-3 rounded-lg bg-[#00E5FF] px-4 py-2 text-sm font-medium text-[#070F1E] hover:bg-[#00D4F0] disabled:opacity-50"
              >
                {retrying ? dict.bookingPage.redirecting : dict.bookingPage.retryPayment}
              </button>
            </div>
          )}

          {isFailed && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4">
              <p className="text-sm text-red-300">
                {dict.bookingPage.paymentFailedMsg}
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={retrying}
                  className="rounded-lg bg-[#00E5FF] px-4 py-2 text-sm font-medium text-[#070F1E] hover:bg-[#00D4F0] disabled:opacity-50"
                >
                  {retrying ? dict.bookingPage.redirecting : dict.bookingPage.retryPayment}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/tours')}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5"
                >
                  {dict.bookingPage.browseTours}
                </button>
              </div>
            </div>
          )}

          {isConfirmed && (
            <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-sm text-emerald-300">
                {dict.bookingPage.confirmedMsg}
              </p>
              {Number(booking.amountDueOnArrival ?? 0) > 0 && (
                <p className="mt-2 text-sm font-medium text-[#00E5FF]">
                  {dict.bookingPage.bringCash} {currencySymbol}{Number(booking.amountDueOnArrival).toFixed(2)} {dict.bookingPage.inCash}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
