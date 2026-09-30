'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const NAV_LINKS = [
  { key: 'tours' as const, href: '/tours', fallback: 'Tours' },
  { key: 'destinations' as const, href: '/destinations', fallback: 'Destinations' },
  { key: 'blog' as const, href: '/blog', fallback: 'Travel Blog' },
  { key: 'aboutUs' as const, href: '/about', fallback: 'About Us' },
  { key: 'faq' as const, href: '/faq', fallback: 'FAQ' },
];

export default function NavLinks() {
  const { dict } = useLanguage();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const label = (dict?.navbar as any)?.[link.key] || link.fallback;

        return (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold tracking-wide text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
