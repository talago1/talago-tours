'use client';

import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function PrivacyContent() {
  const { dict } = useLanguage();

  return (
    <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#0EA5E9/8,transparent_50%),radial-gradient(circle_at_70%_70%,#EAB308/8,transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#00E5FF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            {dict.privacyPage.badge}
          </div>
          <h1 className="mb-8 text-4xl font-black tracking-tight text-white lg:text-5xl">{dict.privacyPage.title}</h1>

          <div className="space-y-8 text-sm leading-7 text-slate-300">
            <p><strong className="text-white">{dict.privacyPage.lastUpdated}</strong></p>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec1Title}</h2>
              <p>When you book a tour or interact with TALAGO, we may collect the following information:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Full name, email address, phone number, and language preference</li>
                <li>Booking details including travel dates, guest count, and special requests</li>
                <li>Payment information processed through our secure payment gateway (Paymob/Fawry)</li>
                <li>Device information and browsing behavior on our website</li>
                <li>WhatsApp opt-in status for booking notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec2Title}</h2>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Process and confirm your tour bookings</li>
                <li>Send booking confirmations, reminders, and updates via WhatsApp or email</li>
                <li>Provide customer support and concierge services</li>
                <li>Improve our services and personalize your experience</li>
                <li>Comply with legal and regulatory obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec3Title}</h2>
              <p>We do not sell your personal data. We may share necessary information with:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Payment processors (Paymob, Fawry) for transaction processing</li>
                <li>WhatsApp/Green API for booking notifications (with your opt-in consent)</li>
                <li>Local tour operators and transport providers for operational coordination</li>
                <li>Regulatory authorities if required by Egyptian law</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec4Title}</h2>
              <p>We retain your personal data for as long as necessary to provide our services and comply with legal obligations. Booking records are typically retained for 5 years.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec5Title}</h2>
              <p>You have the right to:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Withdraw WhatsApp consent at any time</li>
                <li>Request a copy of your data in a portable format</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec6Title}</h2>
              <p>We implement industry-standard security measures including SSL encryption, secure payment gateways, and restricted data access. However, no method of electronic storage is 100% secure.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec7Title}</h2>
              <p>For privacy-related inquiries, contact us at <span className="text-[#00E5FF]">tala.tour@outlook.com</span> or visit our <a href="/support" className="text-[#00E5FF] underline">Support page</a>.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.privacyPage.sec8Title}</h2>
              <p>We may update this policy from time to time. Significant changes will be notified via email or a notice on our website.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
