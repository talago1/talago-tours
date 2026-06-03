'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

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
  paymentScheme: string | null;
  amountPaidOnline: number | null;
  amountDueOnArrival: number | null;
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
  const id = params.id as string;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/public/bookings?id=${id}`);
        if (res.status === 404) {
          setPageState('notfound');
          return;
        }
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setBooking(data);
        setPageState('found');

        if (data.status === 'CONFIRMED') {
          sessionStorage.removeItem('pendingBookingId');
        }
      } catch {
        setPageState('error');
      }
    }
    loadBooking();
  }, [id]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch('/api/checkout/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: id }),
      });
      const data = await res.json();
      if (data.gatewayIframeUrl) {
        window.location.href = data.gatewayIframeUrl;
      } else {
        setRetrying(false);
      }
    } catch {
      setRetrying(false);
    }
  }, [id]);

  if (pageState === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#FF5B00]" />
      </div>
    );
  }

  if (pageState === 'notfound') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Booking Not Found</h1>
        <p className="mt-2 text-gray-600">No booking matches this reference.</p>
        <a href="/tours" className="mt-4 inline-block text-[#FF5B00] underline">Browse tours</a>
      </div>
    );
  }

  if (pageState === 'error' || !booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-gray-600">Unable to load your booking details.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-block text-[#FF5B00] underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const isConfirmed = booking.status === 'CONFIRMED';
  const isPending = booking.status === 'PENDING';
  const isFailed = booking.status === 'CANCELLED';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          {isConfirmed && (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {isPending && (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-7 w-7 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {isFailed && (
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isConfirmed && 'Booking Confirmed'}
              {isPending && 'Payment Pending'}
              {isFailed && 'Payment Failed'}
            </h1>
            <p className="text-sm text-gray-500">
              Reference: <strong>{booking.bookingReference}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-6 text-sm">
          <div>
            <p className="text-gray-500">Lead Traveler</p>
            <p className="font-medium text-gray-900">{booking.customerName}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{booking.customerEmail}</p>
          </div>
          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{booking.customerPhone}</p>
          </div>
          <div>
            <p className="text-gray-500">Guests</p>
            <p className="font-medium text-gray-900">{booking.guestCount}</p>
          </div>
          <div>
            <p className="text-gray-500">Hotel</p>
            <p className="font-medium text-gray-900">{booking.hotelName}{booking.roomNumber ? ` (Room ${booking.roomNumber})` : ''}</p>
          </div>
          <div>
            <p className="text-gray-500">Travel Date</p>
            <p className="font-medium text-gray-900">{new Date(booking.travelDate).toLocaleDateString()}</p>
          </div>
        </div>

        {booking.paymentScheme && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-sm font-medium text-gray-700">Payment Details</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Payment Scheme</p>
                <p className="font-medium text-gray-900">{booking.paymentScheme.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className={`font-medium ${isConfirmed ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-red-600'}`}>
                  {booking.status}
                </p>
              </div>
              {booking.amountPaidOnline != null && Number(booking.amountPaidOnline) > 0 && (
                <div>
                  <p className="text-gray-500">Amount Paid Online</p>
                  <p className="font-medium text-gray-900">EGP {Number(booking.amountPaidOnline).toFixed(2)}</p>
                </div>
              )}
              {booking.amountDueOnArrival != null && Number(booking.amountDueOnArrival) > 0 && (
                <div>
                  <p className="text-gray-500">Due on Arrival</p>
                  <p className="font-bold text-[#FF5B00]">EGP {Number(booking.amountDueOnArrival).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {booking.transaction?.gatewayReference && (
          <div className="mt-4 text-xs text-gray-400">
            Gateway Ref: {booking.transaction.gatewayReference}
          </div>
        )}

        {isPending && (
          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Your payment is being processed. This page will update automatically once confirmed.
            </p>
            <button
              type="button"
              onClick={handleRetry}
              disabled={retrying}
              className="mt-3 rounded-lg bg-[#FF5B00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E55200] disabled:opacity-50"
            >
              {retrying ? 'Redirecting...' : 'Retry Payment'}
            </button>
          </div>
        )}

        {isFailed && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              Your payment was not successful. Please try again or choose a different payment method.
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={handleRetry}
                disabled={retrying}
                className="rounded-lg bg-[#FF5B00] px-4 py-2 text-sm font-medium text-white hover:bg-[#E55200] disabled:opacity-50"
              >
                {retrying ? 'Redirecting...' : 'Retry Payment'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/tours')}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Browse Tours
              </button>
            </div>
          </div>
        )}

        {isConfirmed && (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Your booking is confirmed. You will receive a voucher and further instructions shortly.
            </p>
            {Number(booking.amountDueOnArrival ?? 0) > 0 && (
              <p className="mt-2 text-sm font-medium text-[#FF5B00]">
                Please remember to bring EGP {Number(booking.amountDueOnArrival).toFixed(2)} in cash on the tour day.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
