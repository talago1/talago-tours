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
  title: { template: '%s — TALAGO', default: 'TALAGO — Luxury Tours & Experiences ' },
  description: 'Hand-curated luxury yacht charters, private island escapes, and premium desert quad safaris in Hurghada, Red Sea, Egypt.',
  keywords: [
    'Hurghada tours', 'Red Sea excursions', 'Luxury yacht charter', 'Desert safari Hurghada',
    'Talago tours', 'Egypt excursions', 'Hurghada boat trip', 'Hurghada Ausflüge', 'Экскурсии Хургада'
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
  openGraph: {
    title: 'TALAGO — Luxury Tours & Experiences in Hurghada',
    description: 'Hand-curated luxury yacht charters, private island escapes, and premium desert quad safaris in Hurghada, Egypt.',
    url: baseUrl,
    siteName: 'TALAGO Tours',
    locale: 'en_US',
    type: 'website',
    // Declared explicitly because this layout's openGraph replaces the root
    // layout's rather than merging with it, so an inherited image is not
    // guaranteed here.
    images: [
      {
        url: `${baseUrl}/og/default.png`,
        width: 1200,
        height: 630,
        alt: 'TALAGO Tours — luxury yacht charters and desert safaris in Hurghada',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TALAGO — Luxury Tours & Experiences in Hurghada',
    description:
      'Hand-curated luxury yacht charters, private island escapes, and premium desert quad safaris in Hurghada, Egypt.',
    images: [`${baseUrl}/og/default.png`],
  },
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
