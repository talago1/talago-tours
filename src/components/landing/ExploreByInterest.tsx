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
  Sun,
  Crown,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

const INTERESTS = [
  {
    id: 'sea',
    labelKey: 'boatTrips',
    defaultLabel: 'Boat & Yacht Cruises',
    icon: Ship,
    link: '/tours?type=sea',
    accent: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    id: 'snorkeling',
    labelKey: 'snorkeling',
    defaultLabel: 'Snorkeling & Coral Reefs',
    icon: Fish,
    link: '/tours?type=snorkeling',
    accent: 'from-teal-500/20 to-emerald-500/20 text-teal-400 border-teal-500/30',
  },
  {
    id: 'safari',
    labelKey: 'safari',
    defaultLabel: 'Desert Safari & Quads',
    icon: Mountain,
    link: '/tours?type=safari',
    accent: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  },
  {
    id: 'cultural',
    labelKey: 'cultural',
    defaultLabel: 'Pyramids & Ancient Sights',
    icon: Landmark,
    link: '/tours?type=cultural',
    accent: 'from-purple-500/20 to-indigo-500/20 text-purple-400 border-purple-500/30',
  },
  {
    id: 'day-trips',
    labelKey: 'dayTrips',
    defaultLabel: 'Full-Day Excursions',
    icon: Compass,
    link: '/tours?type=day-trips',
    accent: 'from-sky-500/20 to-cyan-500/20 text-sky-400 border-sky-500/30',
  },
  {
    id: 'diving',
    labelKey: 'diving',
    defaultLabel: 'Scuba Diving',
    icon: Waves,
    link: '/tours?type=diving',
    accent: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/30',
  },
  {
    id: 'private',
    labelKey: 'private',
    defaultLabel: 'Private Charters & VIP',
    icon: Crown,
    link: '/tours?type=private',
    accent: 'from-[#00E5FF]/20 to-[#FFD700]/20 text-[#00E5FF] border-[#00E5FF]/30',
  },
];

export default function ExploreByInterest() {
  const { language } = useLanguage();

  return (
    <section className="relative z-20 -mt-6 sm:-mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-white/10 bg-[#0B1528]/90 p-4 sm:p-5 shadow-2xl backdrop-blur-2xl">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#00E5FF]" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]">
              Explore by Experience
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            Direct access to verified activities
          </span>
        </div>

        {/* Horizontal scroll chips */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {INTERESTS.map((interest) => {
            const Icon = interest.icon;
            return (
              <Link
                key={interest.id}
                href={interest.link}
                className={`group flex shrink-0 items-center gap-2.5 rounded-2xl border bg-gradient-to-r px-4 py-2.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg snap-start ${interest.accent}`}
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 transition-transform group-hover:scale-110">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-bold text-white whitespace-nowrap">
                  {interest.defaultLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
