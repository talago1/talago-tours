'use client';

import { CalendarClock, ChefHat, ShieldCheck, ShipWheel } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BentoCard {
  titleKey: 'captains' | 'fleet' | 'dining' | 'flexibility';
  icon: typeof ShipWheel;
  spanClassName: string;
  accentClassName: string;
}

const cards: BentoCard[] = [
  {
    titleKey: 'captains',
    icon: ShipWheel,
    spanClassName: 'md:col-span-2',
    accentClassName: 'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/20',
  },
  {
    titleKey: 'fleet',
    icon: ShieldCheck,
    spanClassName: 'md:col-span-1',
    accentClassName: 'text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20',
  },
  {
    titleKey: 'dining',
    icon: ChefHat,
    spanClassName: 'md:col-span-1',
    accentClassName: 'text-[#EAB308] bg-[#EAB308]/10 border-[#EAB308]/20',
  },
  {
    titleKey: 'flexibility',
    icon: CalendarClock,
    spanClassName: 'md:col-span-2',
    accentClassName: 'text-[#06B6D4] bg-[#06B6D4]/10 border-[#06B6D4]/20',
  },
];

export default function BentoGridUSPs() {
  const { dict } = useLanguage();

  return (
    <section id="about-talago" className="bg-[#070F1E] px-5 py-20 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">
            {dict.bento.section}
          </p>
          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            {dict.bento.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            const content = dict.bento.cards[card.titleKey];
            return (
              <article
                key={card.titleKey}
                className={`${card.spanClassName} group rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.035] to-transparent p-7 shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10 lg:p-9`}
              >
                <div className={`mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl border ${card.accentClassName} transition-all duration-300 ease-in-out group-hover:scale-[1.02]`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="max-w-2xl text-2xl font-black text-white">
                  {content.title}
                </h3>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                  {content.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
