'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, BookOpen, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1528]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00E5FF] text-xs font-black text-[#070F1E]">
                T
              </div>
              <span className="text-xl font-black tracking-wider text-white">TALAGO</span>
              <span className="rounded-md border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[#00E5FF]">
                Partner Portal
              </span>
            </Link>

            {/* Navigation */}
            <nav className="hidden items-center gap-1 sm:flex">
              <Link
                href="/partner/dashboard"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  pathname === '/partner/dashboard'
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>

              <Link
                href="/partner/tours/new"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  pathname === '/partner/tours/new'
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <PlusCircle className="h-4 w-4" />
                Submit Tour
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 md:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Operator
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Storefront
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
