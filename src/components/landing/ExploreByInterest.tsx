'use client';

import Link from 'next/link';
import {
  Compass,
  Waves,
  Mountain,
  Landmark,
  Sparkles,
  Ship,
  Fish,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface InterestItem {
  id: string;
  defaultLabel: string;
  translations?: Record<string, string>;
  icon: typeof Ship;
  link: string;
  accent: string;
}

const INTERESTS: InterestItem[] = [
  {
    id: 'sea',
    defaultLabel: 'Boat & Yacht Cruises',
    translations: {
      de: 'Boot- & Yachtfahrten',
      ru: 'Морские прогулки и яхты',
      fr: 'Croisières en bateau et yacht',
      it: 'Gite in barca e yacht',
      pl: 'Rejsy łodzią i jachtem',
      es: 'Cruceros en barco y yate',
    },
    icon: Ship,
    link: '/tours?type=sea',
    accent: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30 hover:border-cyan-400/60',
  },
  {
    id: 'snorkeling',
    defaultLabel: 'Snorkeling & Coral Reefs',
    translations: {
      de: 'Schnorcheln & Riffe',
      ru: 'Снорклинг и рифы',
      fr: 'Snorkeling & récifs',
      it: 'Snorkeling e barriere',
      pl: 'Snurkowanie i rafy',
      es: 'Esnórquel y arrecifes',
    },
    icon: Fish,
    link: '/tours?type=snorkeling',
    accent: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30 hover:border-teal-400/60',
  },
  {
    id: 'safari',
    defaultLabel: 'Desert Safari & Quads',
    translations: {
      de: 'Wüstensafari & Quads',
      ru: 'Сафари и квадроциклы',
      fr: 'Safari dans le désert & quads',
      it: 'Safari e quad',
      pl: 'Safari na pustyni i quady',
      es: 'Safari y quads',
    },
    icon: Mountain,
    link: '/tours?type=safari',
    accent: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30 hover:border-amber-400/60',
  },
  {
    id: 'cultural',
    defaultLabel: 'Pyramids & Ancient Sights',
    translations: {
      de: 'Pyramiden & Historisches',
      ru: 'Пирамиды и древности',
      fr: 'Pyramides & monuments',
      it: 'Piramidi e antichità',
      pl: 'Piramidy i zabytki',
      es: 'Pirámides y monumentos',
    },
    icon: Landmark,
    link: '/tours?type=cultural',
    accent: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30 hover:border-purple-400/60',
  },
  {
    id: 'day-trips',
    defaultLabel: 'Full-Day Excursions',
    translations: {
      de: 'Ganztagesausflüge',
      ru: 'Однодневные туры',
      fr: 'Excursions d\'une journée',
      it: 'Escursioni giornaliere',
      pl: 'Wycieczki całodniowe',
      es: 'Excursiones de día',
    },
    icon: Compass,
    link: '/tours?type=day-trips',
    accent: 'from-sky-500/20 to-cyan-500/20 text-sky-400 border-sky-500/30 hover:border-sky-400/60',
  },
  {
    id: 'diving',
    defaultLabel: 'Scuba Diving',
    translations: {
      de: 'Gerätetauchen',
      ru: 'Дайвинг',
      fr: 'Plongée sous-marine',
      it: 'Immersioni subacquee',
      pl: 'Nurkowanie z akwalungiem',
      es: 'Buceo con botella',
    },
    icon: Waves,
    link: '/tours?type=diving',
    accent: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30 hover:border-blue-400/60',
  },
  {
    id: 'private',
    defaultLabel: 'Private Charters & VIP',
    translations: {
      de: 'Private Charter & VIP',
      ru: 'Индивидуальные туры & VIP',
      fr: 'Charters privés & VIP',
      it: 'Charter privati & VIP',
      pl: 'Prywatne czartery & VIP',
      es: 'Chárteres privados & VIP',
    },
    icon: Crown,
    link: '/tours?type=private',
    accent: 'from-[#00E5FF]/20 to-[#FFD700]/20 text-[#00E5FF] border-[#00E5FF]/30 hover:border-[#00E5FF]/60',
  },
];

export default function ExploreByInterest() {
  const { language } = useLanguage();

  return (
    <section className="relative z-10 my-4 sm:my-6 lg:my-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-[#0B1528]/95 p-3.5 sm:p-5 shadow-2xl backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00E5FF]" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]">
              Explore by Experience
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <span className="hidden sm:inline">Direct access to verified activities</span>
            <span className="sm:hidden flex items-center gap-1 text-[10px] text-slate-500">
              Scroll <ChevronRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Horizontal scroll chips with touch-momentum support */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 px-0.5 scrollbar-none snap-x snap-mandatory scroll-smooth -webkit-overflow-scrolling-touch">
          {INTERESTS.map((interest) => {
            const Icon = interest.icon;
            const label = interest.translations?.[language] || interest.defaultLabel;

            return (
              <Link
                key={interest.id}
                href={interest.link}
                className={`group flex shrink-0 items-center gap-2.5 rounded-2xl border bg-gradient-to-r px-4 py-2.5 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-95 snap-start ${interest.accent}`}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-transform group-hover:scale-110">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
