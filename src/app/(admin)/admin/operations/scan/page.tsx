import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import QRScannerTerminal from '@/components/admin/QRScannerTerminal';

export const metadata = {
  title: 'QR Check-In Scanner | Talago Tours',
  description: 'Scan passenger QR codes or enter booking references for instant check-in.',
};

export default function ScanPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <Link
          href="/admin/operations"
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Operations</span>
        </Link>
        <span className="rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#00E5FF]">
          Live Check-In
        </span>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-xl font-black tracking-tight text-white">QR Check-In Scanner</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          Point the camera at a passenger&apos;s boarding pass or enter their booking reference.
        </p>
      </div>

      <QRScannerTerminal />
    </div>
  );
}
