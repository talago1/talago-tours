import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('@/components/layout/Navbar'), { ssr: false });
const FooterContent = dynamic(() => import('@/components/layout/FooterContent'), { ssr: false });
const FooterBrandColumn = dynamic(() => import('@/components/layout/FooterContent').then(m => m.FooterBrandColumn), { ssr: false });
const FloatingConciergeWidget = dynamic(() => import('@/components/layout/FloatingConciergeWidget'), { ssr: false });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  description:
    'Discover and book vetted Egypt tours and experiences across the Red Sea, Nile and desert — Hurghada, Sharm El Sheikh, Marsa Alam, Cairo and Luxor. Instant confirmation and local support.',
  keywords: [
    'Egypt tours', 'Egypt excursions', 'Red Sea excursions', 'Hurghada tours',
    'Sharm El Sheikh tours', 'Marsa Alam tours', 'Cairo tours', 'Luxor tours',
    'TALAGO', 'Red Sea diving', 'desert safari Egypt',
  ],
  alternates: {
    canonical: baseUrl,
    languages: {
      'en': `${baseUrl}?lang=en`,
      'de': `${baseUrl}?lang=de`,
      'ru': `${baseUrl}?lang=ru`,
      'it': `${baseUrl}?lang=it`,
      'fr': `${baseUrl}?lang=fr`,
      'pl': `${baseUrl}?lang=pl`,
      'es': `${baseUrl}?lang=es`,
      'x-default': baseUrl,
    },
  },
  // openGraph / twitter are inherited from the root layout so the branded
  // site-wide OpenGraph image stays consistent across every public page.
};

export default function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#070F1E] text-[#F8FAFC]">
      {/* ─── Sticky Glassmorphism Navbar ─── */}
      <Navbar />

      {/* ─── Main Content ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── Floating VIP Concierge WhatsApp Widget ─── */}
      <FloatingConciergeWidget />

      {/* ─── Premium Footer ─── */}
      <footer className="border-t border-white/[0.06] bg-gradient-to-b from-[#0B1528] to-[#070F1E]">

        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-10">
          {/* Top: Brand + Link Columns */}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand Column (spans 2 cols) */}
            <FooterBrandColumn />

            <FooterContent />
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 sm:flex-row">
            <p className="text-xs text-slate-500">
              &copy; 2016 TALAGO. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-slate-500 transition-colors hover:text-[#00E5FF]">Instagram</a>
              <a href="#" className="text-xs text-slate-500 transition-colors hover:text-[#00E5FF]">Facebook</a>
              <a href="#" className="text-xs text-slate-500 transition-colors hover:text-[#00E5FF]">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
