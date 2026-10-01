'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { VerifiedVoucherPayload, VerifyResponse } from '@/types/voucher';

async function readStatus(ref: string): Promise<VerifyResponse> {
  const res = await fetch(`/api/admin/verify/${ref}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { success: false, error: body?.error || `HTTP ${res.status}` };
  }
  return res.json();
}

// The check-in itself is a POST: it is a one-way mutation, so it must only
// happen on a deliberate staff action and never from a plain page load.
async function confirmCheckIn(ref: string): Promise<VerifyResponse> {
  const res = await fetch(`/api/admin/verify/${ref}`, { method: 'POST' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    return { success: false, error: body?.error || `HTTP ${res.status}` };
  }
  return res.json();
}

export default function AdminVerifyPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = use(params);
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [payload, setPayload] = useState<VerifiedVoucherPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadDetails = useCallback(async () => {
    const detailsRes = await fetch(`/api/admin/bookings/${ref}`).then((r) =>
      r.ok ? r.json() : null
    );
    setPayload(detailsRes);
  }, [ref]);

  // Read-only on mount: report the state, change nothing.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [statusRes, detailsRes] = await Promise.all([
          readStatus(ref),
          fetch(`/api/admin/bookings/${ref}`).then((r) => (r.ok ? r.json() : null)),
        ]);
        if (cancelled) return;
        setResult(statusRes);
        setPayload(detailsRes);
      } catch {
        if (!cancelled) setResult({ success: false, error: 'Network error' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ref]);

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      const res = await confirmCheckIn(ref);
      setResult(res);
      if (res.success) await loadDetails();
    } catch {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setSubmitting(false);
    }
  }, [ref, loadDetails]);

  const alreadyCheckedIn = result?.isCheckedIn === true;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Verifying booking...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">Booking Verification</h1>
          <p className="mt-1 text-sm text-gray-500">Reference: {ref}</p>
        </div>

        {result && result.success ? (
          <div className={`rounded-2xl border bg-white p-6 shadow-lg ${alreadyCheckedIn ? 'border-emerald-200' : 'border-amber-200'}`}>
            <div className="mb-4 text-center">
              <div className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full ${alreadyCheckedIn ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                {alreadyCheckedIn ? (
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                )}
              </div>
              <h2 className={`text-lg font-bold ${alreadyCheckedIn ? 'text-emerald-800' : 'text-amber-800'}`}>
                {alreadyCheckedIn ? 'Already Checked In' : 'Ready to Check In'}
              </h2>
              {alreadyCheckedIn && result.checkedInAt && (
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(result.checkedInAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
              {!alreadyCheckedIn && (
                <p className="mt-1 text-sm text-gray-500">
                  Confirm below to check this passenger in.
                </p>
              )}
            </div>

            {payload && (
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <DetailRow label="Customer" value={payload.customerName} />
                <DetailRow label="Tour" value={payload.tourTitle} />
                <DetailRow label="Travel Date" value={payload.travelDate} />
                <DetailRow label="Hotel" value={payload.hotelName} />
                <DetailRow label="Pickup Time" value={payload.pickupTime} />
                <DetailRow label="Total Guests" value={String(payload.totalGuests)} />
              </div>
            )}

            {!alreadyCheckedIn && (
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="mt-5 w-full rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Checking in...' : 'Confirm Check-In'}
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-red-800">Verification Failed</h2>
              <p className="mt-1 text-sm text-gray-600">
                {result?.error || 'An unknown error occurred'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/admin"
            className="rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
