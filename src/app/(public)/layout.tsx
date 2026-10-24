import type { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';

const Navbar = dynamic(() => import('@/components/layout/Navbar'), { ssr: false });
const FooterContent = dynamic(() => import('@/components/layout/FooterContent'), { ssr: false });
const FooterBrandColumn = dynamic(() => import('@/components/layout/FooterContent').then(m => m.FooterBrandColumn), { ssr: false });
const FloatingConciergeWidget = dynamic(() => import('@/components/layout/FloatingConciergeWidget'), { ssr: false });
const LiveChatWidget = dynamic(() => import('@/components/layout/LiveChatWidget'), { ssr: false });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  description:
    'Discover and book top-rated tours, activities, and experiences worldwide with instant confirmation and flexible cancellation. Egypt, Red Sea, Nile Valley, and beyond.',
  keywords: [
    'TALAGO', 'tours and activities', 'book experiences', 'Egypt tours',
    'Red Sea excursions', 'Hurghada tours', 'Sharm El Sheikh tours',
    'Cairo tours', 'Luxor tours', 'desert safari', 'Red Sea diving',
    'travel experiences', 'tour booking platform',
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

export default async function PublicRouteLayout({ children }: { children: React.ReactNode }) {
  let socialLinks: { instagram?: string; facebook?: string; tiktok?: string; telegram?: string; twitter?: string } = {};
  try {
    const contactSetting = await prisma.systemSetting.findUnique({ where: { key: 'contact' } });
    if (contactSetting?.value) {
      const parsed = JSON.parse(contactSetting.value);
      if (parsed?.socialLinks) {
        socialLinks = parsed.socialLinks;
      }
    }
  } catch {
    // fallback to empty
  }

  const validLinks = [
    { label: 'Instagram', href: socialLinks.instagram },
    { label: 'Facebook', href: socialLinks.facebook },
    { label: 'TikTok', href: socialLinks.tiktok },
    { label: 'Telegram', href: socialLinks.telegram },
  ].filter((l): l is { label: string; href: string } => typeof l.href === 'string' && l.href.trim().length > 0 && l.href.startsWith('http'));

  return (
    <div className="flex min-h-screen flex-col bg-[#070F1E] text-[#F8FAFC]">
      {/* ─── Sticky Glassmorphism Navbar ─── */}
      <Navbar />

      {/* ─── Main Content ─── */}
      <main className="flex-1">{children}</main>

      {/* ─── Floating VIP Concierge WhatsApp Widget ─── */}
      <FloatingConciergeWidget />
      <LiveChatWidget />

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
              &copy; {new Date().getFullYear()} TALAGO Experiences Ltd. All rights reserved.
            </p>
            {validLinks.length > 0 && (
              <div className="flex items-center gap-6">
                {validLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 transition-colors hover:text-[#00E5FF]"
                    aria-label={link.label}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
