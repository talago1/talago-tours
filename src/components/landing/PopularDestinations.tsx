'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface DestinationData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count: { tours: number };
}

interface PopularDestinationsProps {
  destinations: DestinationData[];
}

function getGradient(index: number): string {
  const gradients = [
    'from-[#0EA5E9] via-[#0284C7] to-[#0C4A6E]',
    'from-[#EAB308] via-[#D97706] to-[#78350F]',
    'from-[#06B6D4] via-[#0891B2] to-[#164E63]',
    'from-[#8B5CF6] via-[#7C3AED] to-[#4C1D95]',
    'from-[#F43F5E] via-[#E11D48] to-[#881337]',
    'from-[#10B981] via-[#059669] to-[#065F46]',
  ];
  return gradients[index % gradients.length];
}

export default function PopularDestinations({ destinations }: PopularDestinationsProps) {
  const { dict } = useLanguage();

  if (destinations.length === 0) return null;

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
            {dict.catalog.viewAllDestinations}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {destinations.map((dest, index) => (
            <Link
              key={dest.id}
              href={`/tours?destination=${dest.slug}`}
              className="group relative overflow-hidden rounded-[2rem] shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-[#06B6D4]/10"
            >
              <div className={`aspect-[4/5] bg-gradient-to-br ${getGradient(index)} p-6 flex flex-col justify-end`}>
                {dest.imageUrl && (
                  <Image
                    src={dest.imageUrl}
                    alt={dest.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover opacity-60"
                  />
                )}
                <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[20px] border-white/5" />
                <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full border-[20px] border-white/5" />

                <div className="relative z-10">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                    <MapPin className="h-3 w-3" />
                    {dest.name}
                  </div>
                  {dest.description && (
                    <p className="mb-4 text-sm leading-6 text-white/80">
                      {dest.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60">
                      {dest._count.tours} tour{dest._count.tours !== 1 ? 's' : ''}
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
