'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const NAV_LINKS = [
  { key: 'tours' as const, href: '/tours' },
  { key: 'destinations' as const, href: '/destinations' },
  { key: 'aboutUs' as const, href: '/about' },
  { key: 'faq' as const, href: '/faq' },
];

export default function NavLinks() {
  const { dict } = useLanguage();

  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl px-4 py-2 text-sm font-semibold tracking-wide text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
        >
          {dict.navbar[link.key]}
        </Link>
      ))}
    </>
  );
}
