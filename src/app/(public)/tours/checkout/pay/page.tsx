'use client';

import { Suspense } from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { PaymentInitiationResponse } from '@/types/payment';

type PageState = 'loading' | 'redirecting' | 'error';

function PaymentFlow() {
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
      <main className="min-h-screen bg-neutral-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <svg className="animate-spin w-16 h-16 text-primary-coral" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-secondary-forest text-lg font-medium">
            Securing your transaction connection...
          </p>
          {redirectUrl && (
            <button
              type="button"
              onClick={() => { window.location.href = redirectUrl; }}
              className="mt-8 px-8 py-3 bg-primary-coral text-white font-semibold rounded-lg hover:bg-primary-coral/90 transition-colors"
            >
              Continue to Payment
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-light flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Error</h2>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        <button
          type="button"
          onClick={initiatePayment}
          className="px-8 py-3 bg-primary-coral text-white font-semibold rounded-lg hover:bg-primary-coral/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-light flex items-center justify-center">
          <p className="text-secondary-forest text-lg font-medium">Preparing secure payment...</p>
        </main>
      }
    >
      <PaymentFlow />
    </Suspense>
  );
}
