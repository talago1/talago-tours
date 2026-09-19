'use client';

import Link from 'next/link';
import { Compass, MessageCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function FooterBrandColumn() {
  const { dict } = useLanguage();
  return (
    <div className="sm:col-span-2 lg:col-span-2">
      <Link href="/" className="inline-flex items-center gap-2.5">
        <span className="text-2xl font-black uppercase tracking-[0.34em] text-white">TALAGO</span>
        <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
      </Link>
      <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
        {dict.footer.tagline}
      </p>
      {/* Contact info */}
      <div className="mt-6 space-y-2 text-sm text-slate-500">
        <p>Hurghada, Red Sea, Egypt</p>
        <p>+20 102 224 34602</p>
        <p>tala.tour@outlook.com</p>
      </div>
    </div>
  );
}

export default function FooterContent() {
  const { dict } = useLanguage();

  const FOOTER_SECTIONS = [
    {
      title: dict.footer.experiences || 'Experiences',
      icon: Compass,
      links: [
        { label: dict.navbar.tours, href: '/tours' },
        { label: dict.navbar.destinations, href: '/destinations' },
        { label: dict.navbar.aboutUs, href: '/about' },
        { label: dict.navbar.faq, href: '/faq' },
      ],
    },
    {
      title: dict.footer.support || 'Support',
      icon: MessageCircle,
      links: [
        { label: dict.footer.contactUs || 'Contact Concierge', href: '/support' },
        { label: dict.navbar.myBookings || 'My Bookings', href: '/my-bookings' },
        { label: dict.navbar.signInRegister || 'Guest Portal', href: '/auth' },
      ],
    },
    {
      title: dict.footer.policies || 'Policies',
      icon: ShieldCheck,
      links: [
        { label: dict.footer.bookingTerms || 'Booking Terms', href: '/booking-terms' },
        { label: dict.footer.cancellationPolicy || dict.cancellationPage?.badge || 'Cancellation Policy', href: '/cancellation' },
        { label: dict.footer.privacyPolicy || dict.privacyPage?.title || 'Privacy Policy', href: '/privacy' },
      ],
    },
  ];

  return (
    <>
      {FOOTER_SECTIONS.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title}>
            <h4 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#00E5FF]">
              <Icon className="h-3.5 w-3.5" />
              {section.title}
            </h4>
            <ul className="space-y-3">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-400 transition-colors hover:text-[#FFD700]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}
