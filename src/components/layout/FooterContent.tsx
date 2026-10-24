'use client';

import Link from 'next/link';
import { Compass, MessageCircle, ShieldCheck, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
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
        {dict.footer?.tagline ||
          'Discover and book top-rated tours, unique activities, and unforgettable experiences worldwide with instant confirmation and flexible cancellation.'}
      </p>

      {/* Global Platform Value Pillars */}
      <div className="mt-6 space-y-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-[#00E5FF]" />
          <span>Curated Global Destinations &amp; Local Guides</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#FFD700]" />
          <span>Instant Digital Confirmation &amp; QR E-Tickets</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span>Flexible Cancellation &amp; 24/7 Concierge Support</span>
        </div>
      </div>
    </div>
  );
}

export default function FooterContent() {
  const { dict } = useLanguage();

  const FOOTER_SECTIONS = [
    {
      title: dict.footer?.experiences || 'Experiences',
      icon: Compass,
      links: [
        { label: dict.navbar?.tours || 'All Tours', href: '/tours' },
        { label: dict.navbar?.destinations || 'Destinations', href: '/destinations' },
        { label: dict.catalog?.bestSeller || 'Top Rated', href: '/tours?sort=rating_desc' },
        { label: dict.navbar?.blog || 'Travel Journal', href: '/blog' },
        { label: dict.navbar?.faq || 'FAQ', href: '/faq' },
      ],
    },
    {
      title: dict.footer?.company || 'Company',
      icon: Globe,
      links: [
        { label: dict.navbar?.aboutUs || 'About Us', href: '/about' },
        { label: dict.footer?.becomePartner || 'Partner with Us', href: '/partners' },
        { label: dict.footer?.safetyPolicies || 'Safety & Standards', href: '/safety-policies' },
        { label: dict.footer?.flexibleProtection || 'Flexible Protection', href: '/flexible-protection' },
      ],
    },
    {
      title: dict.footer?.support || 'Support & Legal',
      icon: ShieldCheck,
      links: [
        { label: dict.footer?.contactUs || 'Contact Concierge', href: '/support' },
        { label: dict.navbar?.myBookings || 'My Bookings & Tickets', href: '/my-bookings' },
        { label: dict.footer?.cancellationPolicy || dict.cancellationPage?.badge || 'Cancellation Policy', href: '/cancellation' },
        { label: dict.footer?.bookingTerms || 'Booking Terms', href: '/booking-terms' },
        { label: dict.footer?.privacyPolicy || dict.privacyPage?.title || 'Privacy Policy', href: '/privacy' },
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

