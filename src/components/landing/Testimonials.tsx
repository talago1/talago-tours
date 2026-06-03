'use client';

import { ShieldCheck, Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Testimonial {
  name: string;
  initials: string;
  tourName: string;
  feedback: string;
  date: string;
}

const testimonials: Testimonial[] = [
  {
    name: 'Amelia Hart',
    initials: 'AH',
    tourName: 'VIP Private Yacht Cruise & Giftun Island',
    feedback:
      'The yacht crew anticipated everything before we asked. Towels were warm, the reef guide was superb, and the lunch felt like a private club at sea.',
    date: 'May 28, 2026',
  },
  {
    name: 'Karim El-Nour',
    initials: 'KE',
    tourName: 'Sunset Desert VIP Quad Safari & Bedouin Oasis',
    feedback:
      'This was not a typical safari. The convoy pacing, sunset stop, private Bedouin dinner, and chilled transfer made the whole evening feel cinematic.',
    date: 'May 21, 2026',
  },
  {
    name: 'Sophie Laurent',
    initials: 'SL',
    tourName: 'Deep Sea Dolphin House Snorkeling & Diving',
    feedback:
      'Impeccable luxury treatment from hotel pickup to return. The captain found quiet water, and the dive team made the dolphin encounter feel respectful and rare.',
    date: 'May 16, 2026',
  },
];

export default function Testimonials() {
  const { dict } = useLanguage();

  return (
    <section id="verified-reviews" className="bg-[#070F1E] px-5 py-20 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-[#06B6D4]/10 p-6 shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-[#EAB308]/35 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">
                {dict.testimonials.section}
              </p>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {dict.testimonials.heading}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-6 w-6 fill-[#EAB308] text-[#EAB308]" />
              ))}
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#06B6D4]" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 text-sm font-black text-[#EAB308]">
                  {testimonial.initials}
                </div>
                <div>
                  <h3 className="font-black text-white">{testimonial.name}</h3>
                  <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#00473F]/50 px-2 py-1 text-xs font-bold text-[#A7F3D0]">
                    <ShieldCheck className="h-3 w-3" />
                    {dict.testimonials.verified}
                  </div>
                </div>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#06B6D4]">
                {testimonial.tourName}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                “{testimonial.feedback}”
              </p>
              <p className="mt-6 text-sm font-semibold text-slate-500">
                {testimonial.date}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
