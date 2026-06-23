'use client';

import Link from 'next/link';
import { Compass, MessageCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function FooterContent() {
  const { dict } = useLanguage();

  const FOOTER_SECTIONS = [
    {
      title: dict.footer.experiences,
      icon: Compass,
      links: [
        { label: dict.navbar.tours, href: '/tours' },
        { label: dict.navbar.destinations, href: '/destinations' },
        { label: dict.navbar.aboutUs, href: '/about' },
        { label: dict.navbar.faq, href: '/faq' },
      ],
    },
    {
      title: dict.footer.support,
      icon: MessageCircle,
      links: [
        { label: 'Contact Us', href: '/support' },
        { label: 'Concierge Help', href: '/concierge-help' },
        { label: 'Booking Terms', href: '/booking-terms' },
        { label: 'Safety Policies', href: '/safety-policies' },
      ],
    },
    {
      title: 'Policies',
      icon: ShieldCheck,
      links: [
        { label: dict.footer.privacy, href: '/cancellation' },
        { label: dict.footer.privacy, href: '/privacy' },
        { label: 'Flexible Protection', href: '/flexible-protection' },
        { label: dict.navbar.signInRegister, href: '/auth' },
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
