'use client';

import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DestinationCard {
  name: string;
  description: string;
  tourCount: number;
  gradient: string;
  accentColor: string;
}

const destinations: DestinationCard[] = [
  {
    name: 'Giftun Island',
    description: 'Crystal-clear waters, vibrant coral reefs, and pristine white sand beaches.',
    tourCount: 8,
    gradient: 'from-[#0EA5E9] via-[#0284C7] to-[#0C4A6E]',
    accentColor: 'text-[#0EA5E9]',
  },
  {
    name: 'Eastern Desert',
    description: 'Golden dunes, Bedouin camps, and dramatic sunset safari trails.',
    tourCount: 6,
    gradient: 'from-[#EAB308] via-[#D97706] to-[#78350F]',
    accentColor: 'text-[#EAB308]',
  },
  {
    name: 'Dolphin House',
    description: 'Open-water dolphin encounters and world-class snorkeling reefs.',
    tourCount: 4,
    gradient: 'from-[#06B6D4] via-[#0891B2] to-[#164E63]',
    accentColor: 'text-[#06B6D4]',
  },
  {
    name: 'Hurghada Marina',
    description: 'Vibrant waterfront dining, luxury yachts, and bustling bazaars.',
    tourCount: 5,
    gradient: 'from-[#8B5CF6] via-[#7C3AED] to-[#4C1D95]',
    accentColor: 'text-[#8B5CF6]',
  },
];

export default function PopularDestinations() {
  const { dict } = useLanguage();

  return (
    <section className="bg-[#070F1E] px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">
              {dict.navbar.destinations}
            </p>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Popular Destinations
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Explore the most sought-after locations along the Red Sea coast.
            </p>
          </div>
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition-all duration-300 hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10 hover:text-[#EAB308]"
          >
            View all destinations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {destinations.map((dest) => (
            <Link
              key={dest.name}
              href={`/tours?destination=${dest.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="group relative overflow-hidden rounded-[2rem] shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[#06B6D4]/10"
            >
              <div className={`aspect-[4/5] bg-gradient-to-br ${dest.gradient} p-6 flex flex-col justify-end`}>
                {/* Decorative ring */}
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[20px] border-white/5" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full border-[20px] border-white/5" />

                <div className="relative">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                    <MapPin className="h-3 w-3" />
                    {dest.name}
                  </div>
                  <p className="mb-4 text-sm leading-6 text-white/80">
                    {dest.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60">
                      {dest.tourCount} tour{dest.tourCount > 1 ? 's' : ''}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
