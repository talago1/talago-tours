'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import type { VerifiedVoucherPayload, VerifyResponse } from '@/types/voucher';

async function verifyBooking(ref: string): Promise<VerifyResponse> {
  const res = await fetch(`/api/admin/verify/${ref}`);
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

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const [verifyRes, detailsRes] = await Promise.all([
        verifyBooking(ref),
        fetch(`/api/admin/bookings/${ref}`).then((r) =>
          r.ok ? r.json() : null
        ),
      ]);
      setResult(verifyRes);
      setPayload(detailsRes);
    } catch {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setLoading(false);
    }
  }, [ref]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

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
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-emerald-800">
                {result.message === 'Already checked in' ? 'Already Checked In' : 'Check-In Successful'}
              </h2>
              {result.checkedInAt && (
                <p className="mt-1 text-sm text-gray-500">
                  {new Date(result.checkedInAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
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
          <button
            onClick={fetchDetails}
            className="rounded-lg bg-emerald-700 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
          >
            Scan Again
          </button>
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
