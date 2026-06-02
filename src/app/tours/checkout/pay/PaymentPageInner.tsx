'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PaymentInitiationResponse } from '@/types/payment';

type PageState = 'loading' | 'redirecting' | 'error';

export default function PaymentPageInner() {
  const searchParams = useSearchParams();
  const bookingReference = searchParams.get('reference');
  const [state, setState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [redirectUrl, setRedirectUrl] = useState('');

  const initiatePayment = useCallback(async () => {
    if (!bookingReference) {
      setState('error');
      setErrorMessage('Missing booking reference');
      return;
    }

    setState('loading');

    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingReference }),
      });

      if (!res.ok) {
        const err = await res.json();
        setState('error');
        setErrorMessage(err.error || 'Failed to initialize payment');
        return;
      }

      const data: PaymentInitiationResponse = await res.json();
      setRedirectUrl(data.redirectUrl);
      setState('redirecting');
      window.location.href = data.redirectUrl;
    } catch {
      setState('error');
      setErrorMessage('Network error. Please try again.');
    }
  }, [bookingReference]);

  useEffect(() => {
    initiatePayment();
  }, [initiatePayment]);

  if (state === 'loading' || state === 'redirecting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-light">
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16">
            <svg className="h-16 w-16 animate-spin text-primary-coral" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-secondary-forest">
            Securing your transaction connection...
          </p>
          {redirectUrl && (
            <button
              type="button"
              onClick={() => { window.location.href = redirectUrl; }}
              className="mt-8 rounded-lg bg-primary-coral px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-coral/90"
            >
              Continue to Payment
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-light">
      <div className="mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-800">Payment Error</h2>
        <p className="mb-6 text-gray-600">{errorMessage}</p>
        <button
          type="button"
          onClick={initiatePayment}
          className="rounded-lg bg-primary-coral px-8 py-3 font-semibold text-white transition-colors hover:bg-primary-coral/90"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}
