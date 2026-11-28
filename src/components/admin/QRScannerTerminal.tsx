'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { QrCode, Camera, CheckCircle2, XCircle, RotateCcw, Users, Building2, Search } from 'lucide-react';

interface CheckedInGuest {
  passengerName: string;
  tourTitle: string;
  paxCount: number;
  hotelName?: string;
  roomNumber: string | null;
  checkedInAt: string;
}

type ScanState =
  | { status: 'idle' }
  | { status: 'scanning' }
  | { status: 'decoding' }
  | { status: 'success'; data: CheckedInGuest }
  | { status: 'error'; error: string };

export default function QRScannerTerminal() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<ScanState>({ status: 'idle' });
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [manualRef, setManualRef] = useState('');
  const [recentScans, setRecentScans] = useState<CheckedInGuest[]>([]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  const verifyCheckIn = useCallback(
    async (opts: { token?: string; reference?: string }) => {
      const payloadToken = opts.token || opts.reference || '';
      if (!payloadToken.trim()) return;

      setState({ status: 'decoding' });
      stopCamera();

      try {
        const res = await fetch('/api/admin/operations/verify-qr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: payloadToken.trim() }),
        });
        const data = await res.json();

        if (data.success) {
          const guest: CheckedInGuest = {
            passengerName: data.passengerName,
            tourTitle: data.tourTitle,
            paxCount: data.paxCount,
            hotelName: data.hotelName,
            roomNumber: data.roomNumber ?? null,
            checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          setState({ status: 'success', data: guest });
          setRecentScans((prev) => [guest, ...prev].slice(0, 6));
          setManualRef('');
        } else {
          setState({ status: 'error', error: data.error || 'Verification failed' });
        }
      } catch {
        setState({ status: 'error', error: 'Network error. Please try again.' });
      }
    },
    [stopCamera]
  );

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
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            navigator.vibrate?.(200);
            await verifyCheckIn({ token: barcodes[0].rawValue });
            return;
          }
        }
      } catch {
        // BarcodeDetector unavailable or error — continue scanning
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [verifyCheckIn]);

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
        error: 'Camera access denied. Please allow camera permissions or enter the booking reference manually.',
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

  return (
    <div className="space-y-6">
      {state.status === 'idle' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0B1528] p-6 sm:p-10 shadow-xl">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/10 text-[#00E5FF]">
            <QrCode className="h-7 w-7" />
          </div>
          <p className="mb-5 text-center text-xs sm:text-sm text-slate-400">
            Scan the boarding pass QR code or enter the booking reference below.
          </p>

          <button
            type="button"
            onClick={startCamera}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-7 py-3 text-sm font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 transition hover:bg-[#00D4F0] active:scale-[0.99]"
          >
            <Camera className="h-4 w-4" />
            <span>Start Camera Scanner</span>
          </button>

          <div className="mt-8 w-full border-t border-white/10 pt-6">
            <p className="mb-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Or Enter Booking Reference
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (manualRef.trim()) {
                  verifyCheckIn({ reference: manualRef.trim() });
                }
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value.toUpperCase())}
                  placeholder="TLG-ABC123"
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 text-sm font-mono uppercase text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]"
                />
              </div>
              <button
                type="submit"
                disabled={!manualRef.trim()}
                className="rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-40"
              >
                Check In
              </button>
            </form>
          </div>
        </div>
      )}

      {state.status === 'scanning' && (
        <div className="relative mx-auto overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl" style={{ maxWidth: 420, aspectRatio: '3/4' }}>
          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-52 w-52">
              <div className="absolute left-0 top-0 h-8 w-8 rounded-tl-md border-l-4 border-t-4 border-[#00E5FF]" />
              <div className="absolute right-0 top-0 h-8 w-8 rounded-tr-md border-r-4 border-t-4 border-[#00E5FF]" />
              <div className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-md border-b-4 border-l-4 border-[#00E5FF]" />
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-br-md border-b-4 border-r-4 border-[#00E5FF]" />
              <div className="animate-pulse absolute left-2 right-2 top-1/2 h-0.5 bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/70 to-transparent" />

          <div className="absolute bottom-4 inset-x-0 text-center">
            <p className="text-xs font-semibold text-white/90">Align QR code inside the frame</p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="absolute right-3 top-3 rounded-full bg-black/60 border border-white/15 p-2 text-white transition hover:bg-black/80"
            aria-label="Cancel scanning"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      )}

      {state.status === 'decoding' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0B1528] p-12">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#00E5FF] border-t-transparent" />
          <p className="text-sm font-semibold text-slate-300">Verifying boarding pass...</p>
        </div>
      )}

      {state.status === 'success' && (
        <div className="rounded-2xl border border-emerald-500/30 bg-[#0B1528] p-6 shadow-xl">
          <div className="mb-5 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-lg font-black text-emerald-300">Check-In Confirmed</h2>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-4">
            <DetailRow label="Passenger" value={state.data.passengerName} />
            <DetailRow label="Tour" value={state.data.tourTitle} />
            <DetailRow label="Guests" value={`${state.data.paxCount} pax`} />
            {state.data.hotelName && <DetailRow label="Hotel" value={state.data.hotelName} />}
            {state.data.roomNumber && <DetailRow label="Room" value={state.data.roomNumber} />}
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5 justify-center">
            <button
              type="button"
              onClick={startCamera}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-xs font-black text-[#070F1E] transition hover:bg-[#00D4F0]"
            >
              <Camera className="h-4 w-4" />
              <span>Scan Next QR</span>
            </button>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Manual Entry</span>
            </button>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="rounded-2xl border border-red-500/30 bg-[#0B1528] p-6 shadow-xl">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-lg font-black text-red-300">Check-In Failed</h2>
            <p className="mt-1.5 text-sm text-slate-400">{state.error}</p>
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-2.5 text-xs font-black text-[#070F1E] transition hover:bg-[#00D4F0]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      )}

      {/* Session Scan History */}
      {recentScans.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Recent Check-Ins ({recentScans.length})
            </h3>
            <span className="text-[11px] text-emerald-400 font-semibold">This session</span>
          </div>
          <div className="divide-y divide-white/5">
            {recentScans.map((scan, idx) => (
              <div key={`${scan.passengerName}-${idx}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{scan.passengerName}</p>
                  <p className="truncate text-xs text-slate-400 flex items-center gap-2">
                    <span>{scan.tourTitle}</span>
                    {scan.hotelName && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {scan.hotelName}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                    <Users className="h-3 w-3" />
                    {scan.paxCount}
                  </span>
                  <p className="mt-0.5 text-[10px] text-slate-500">{scan.checkedInAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm font-bold text-white text-right">{value}</span>
    </div>
  );
}
