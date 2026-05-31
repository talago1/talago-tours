'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'decoding' }
  | {
      status: 'success';
      data: {
        passengerName: string;
        tourTitle: string;
        paxCount: number;
        hotelName: string;
        roomNumber: string | null;
      };
    }
  | { status: 'error'; error: string };

export default function QRScannerTerminal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScanState>({ status: 'idle' });
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const verifyToken = useCallback(async (token: string) => {
    setState({ status: 'decoding' });
    stopCamera();

    try {
      const res = await fetch('/api/admin/operations/verify-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (data.success) {
        setState({
          status: 'success',
          data: {
            passengerName: data.passengerName,
            tourTitle: data.tourTitle,
            paxCount: data.paxCount,
            hotelName: data.hotelName,
            roomNumber: data.roomNumber ?? null,
          },
        });
      } else {
        const errorMsg = data.error || 'Verification failed';
        setState({ status: 'error', error: errorMsg });
      }
    } catch {
      setState({ status: 'error', error: 'Network error. Please try again.' });
    }
  }, [stopCamera]);

  const startDecodeLoop = useCallback(() => {
    const loop = async () => {
      if (!videoRef.current || !videoRef.current.videoWidth) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      try {
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          const detector = new BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(videoRef.current);
          if (barcodes.length > 0) {
            navigator.vibrate?.(200);
            await verifyToken(barcodes[0].rawValue);
            return;
          }
        }
      } catch {
        // BarcodeDetector unavailable or error - continue scanning
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [verifyToken]);

  const startCamera = useCallback(async () => {
    setState({ status: 'scanning' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        startDecodeLoop();
      }
    } catch {
      setState({
        status: 'error',
        error: 'Camera access denied. Please allow camera permissions and try again.',
      });
    }
  }, [startDecodeLoop]);

  const reset = useCallback(() => {
    stopCamera();
    setState({ status: 'idle' });
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (state.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12">
        <svg className="mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <p className="mb-4 text-sm text-gray-500">Tap below to start scanning QR codes</p>
        <button
          onClick={startCamera}
          className="rounded-lg bg-[#FF5B00] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e65200]"
        >
          Start Scanner
        </button>
      </div>
    );
  }

  if (state.status === 'scanning') {
    return (
      <div className="relative mx-auto overflow-hidden rounded-2xl bg-black" style={{ maxWidth: 400, aspectRatio: '3/4' }}>
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
        />

        {/* Targeting Reticle */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-48 w-48">
            {/* Corner brackets */}
            <div className="absolute left-0 top-0 h-8 w-8 border-l-3 border-t-3 border-[#FF5B00] rounded-tl-md" />
            <div className="absolute right-0 top-0 h-8 w-8 border-r-3 border-t-3 border-[#FF5B00] rounded-tr-md" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-3 border-l-3 border-[#FF5B00] rounded-bl-md" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-3 border-r-3 border-[#FF5B00] rounded-br-md" />

            {/* Animated Scan Line */}
            <div className="absolute left-2 right-2 h-0.5 bg-[#FF5B00] shadow-[0_0_8px_#FF5B00] animate-scan" />
          </div>
        </div>

        {/* Overlay top/bottom gradients */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent" />

        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-sm font-medium text-white/80">Point camera at QR code</p>
        </div>

        <button
          onClick={reset}
          className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
          aria-label="Cancel"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  if (state.status === 'decoding') {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-50 p-12">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-[#FF5B00] border-t-transparent" />
        <p className="text-sm font-medium text-gray-700">Verifying booking...</p>
      </div>
    );
  }

  if (state.status === 'success') {
    const { data } = state;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-lg">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-emerald-800">Check-In Successful</h2>
        </div>

        <div className="space-y-3 border-t border-gray-100 pt-4">
          <DetailRow label="Passenger" value={data.passengerName} />
          <DetailRow label="Tour" value={data.tourTitle} />
          <DetailRow label="Guests" value={`${data.paxCount}`} />
          <DetailRow label="Hotel" value={data.hotelName} />
          {data.roomNumber && <DetailRow label="Room" value={data.roomNumber} />}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[#FF5B00] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e65200]"
          >
            Scan Next
          </button>
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-lg">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-red-800">Scan Failed</h2>
          <p className="mt-2 text-sm text-gray-600">{state.error}</p>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#FF5B00] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e65200]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}
