'use client';

import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function CancellationContent() {
  const { dict } = useLanguage();

  return (
    <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#0EA5E9/8,transparent_50%),radial-gradient(circle_at_70%_70%,#EAB308/8,transparent_50%)]" />
        <div className="relative mx-auto max-w-3xl px-5 sm:px-8 lg:px-10">
          <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/20 bg-[#FFD700]/5 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-[#FFD700]">
            <RotateCcw className="h-3.5 w-3.5" />
            {dict.cancellationPage.badge}
          </div>
          <h1 className="mb-8 text-4xl font-black tracking-tight text-white lg:text-5xl">{dict.cancellationPage.title}</h1>

          <div className="space-y-8 text-sm leading-7 text-slate-300">
            <p><strong className="text-white">{dict.cancellationPage.lastUpdated}</strong></p>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec1Title}</h2>
              <p>You may cancel your booking free of charge up to <strong className="text-[#FFD700]">24 hours</strong> before the scheduled departure time. Cancellations within this window receive a full refund to the original payment method.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec2Title}</h2>
              <p>Cancellations made less than 24 hours before departure are subject to a <strong className="text-[#FFD700]">50% cancellation fee</strong>. The remaining 50% will be refunded or credited toward a future booking at your discretion.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec3Title}</h2>
              <p>If you do not arrive at the designated pickup location at the scheduled time, the booking is considered a no-show and no refund will be issued.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec4Title}</h2>
              <p>For bookings made with a deposit:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>The deposit portion is refundable only if cancelled within the free cancellation window</li>
                <li>If cancelled after the free window, the deposit is forfeited</li>
                <li>The remaining balance due on arrival is cancelled with no further obligation</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec5Title}</h2>
              <p>Date or guest count modifications are free up to 24 hours before departure, subject to availability. Price differences may apply.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec6Title}</h2>
              <p>In the rare event that TALAGO cancels a tour due to weather, safety concerns, or operational issues:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>You receive an <strong className="text-emerald-400">immediate full refund</strong></li>
                <li>Alternative dates or experiences will be offered</li>
                <li>Complimentary rebooking with no additional fees</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec7Title}</h2>
              <p>Refunds are processed within <strong className="text-[#FFD700]">5–10 business days</strong> depending on your payment method and financial institution. Paymob and Fawry payments typically reflect within 3–5 business days.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec8Title}</h2>
              <p>To cancel or modify a booking:</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Contact our concierge team via the <a href="/support" className="text-[#00E5FF] underline">Support page</a></li>
                <li>WhatsApp your dedicated concierge directly</li>
                <li>Call us at +20 102 224 34602</li>
              </ul>
              <p className="mt-3">Please have your booking reference number ready.</p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-white">{dict.cancellationPage.sec9Title}</h2>
              <p>For complete peace of mind, learn about our <a href="/flexible-protection" className="text-[#00E5FF] underline">Flexible Protection</a> plan offering enhanced cancellation coverage.</p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
