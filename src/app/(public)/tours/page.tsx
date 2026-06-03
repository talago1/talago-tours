import type { Metadata } from 'next';
import { Suspense } from 'react';
import TourGrid from '@/components/public/TourGrid';
import TourSearchHeaderWrapper from '@/components/public/TourSearchHeaderWrapper';

export const metadata: Metadata = {
  title: 'Tours & Journeys — TALAGO',
  description: 'Explore our hand-curated portfolio of luxury yachts, private island charters, and premium desert quad safaris in Hurghada.',
};

async function CatalogShell() {
  let destinations: { name: string; slug: string }[] = [];

  try {
    const { prisma } = await import('@/lib/prisma');
    const dests = await prisma.destination.findMany({
      orderBy: { name: 'asc' },
      select: { name: true, slug: true },
    });
    destinations = dests;
  } catch {
    destinations = [];
  }

  return (
    <div>
      <TourSearchHeaderWrapper destinations={destinations} />
      <div className="mt-8">
        <TourGrid />
      </div>
    </div>
  );
}

export default function ToursPage() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-5 py-12 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">Signature Journeys</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">
            Experience Library
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
            Filter through our custom-designed sea charters and desert quad bike routes, configured to premium hospitality standards.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-white/5 bg-white/[0.04]">
                  <div className="aspect-[4/3] rounded-t-2xl bg-white/10" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-3/4 rounded bg-white/10" />
                    <div className="h-3 w-1/2 rounded bg-white/10" />
                    <div className="h-8 w-full rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <CatalogShell />
        </Suspense>
      </div>
    </main>
  );
}
