'use client';

import { useState } from 'react';
import Image from 'next/image';
import { isSupabaseStorageImage } from '@/utils/imageOptimization';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { MapPin, Compass, ChevronRight, Star, Search } from 'lucide-react';
import type { SystemSettings } from '@/types/settings';

interface DestData {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  countryCode?: string;
  region?: string | null;
  city?: string | null;
  ownedCover: string | null;
  translations: Record<string, { name?: string; description?: string }> | null;
  tourCount: number;
}

interface Props {
  destinations: DestData[];
  banners: SystemSettings['banners'];
}

const DESTINATION_COVERS: Record<string, string[]> = {
  hurghada: [
    'https://images.unsplash.com/photo-1590510429865-63e7c80896c6?w=1200&q=80',
    'https://images.unsplash.com/photo-1537956965359-7575e8ff6cf3?w=800&q=80',
    'https://images.unsplash.com/photo-1588412079929-791b9f8ecf0d?w=800&q=80',
  ],
  'sharm-el-sheikh': [
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',
  ],
  sharm: [
    'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200&q=80',
    'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',
  ],
  'marsa-alam': [
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80',
    'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80',
  ],
  cairo: [
    'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200&q=80',
    'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?w=800&q=80',
  ],
  dahab: [
    'https://images.unsplash.com/photo-1588412079929-791b9f8ecf0d?w=1200&q=80',
    'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800&q=80',
  ],
  luxor: [
    'https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=1200&q=80',
    'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80',
  ],
  aswan: [
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=1200&q=80',
    'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=800&q=80',
  ],
};

const FALLBACK_COVER = 'https://images.unsplash.com/photo-1590510429865-63e7c80896c6?w=1200&q=80';

// Several of the curated Unsplash ids above have since 404'd, and a destination
// without an imageUrl falls through to the covers. Swap to the local branded
// placeholder when the remote image fails so a dead id never renders as a
// broken image. The placeholder is an SVG, which the optimizer rejects, hence
// unoptimized on that branch only.
const PLACEHOLDER_COVER = '/images/placeholder.svg';

interface CoverImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  'aria-hidden'?: boolean;
}

function CoverImage({ src, alt, sizes, className, loading, ...rest }: CoverImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Image
        src={PLACEHOLDER_COVER}
        alt={alt}
        fill
        unoptimized
        sizes={sizes}
        className={className}
        loading={loading}
        {...rest}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      loading={loading}
      unoptimized={isSupabaseStorageImage(src)}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}

function getLocalized(d: DestData, lang: string, field: 'name' | 'description'): string {
  if (d.translations && d.translations[lang] && d.translations[lang][field]) {
    return d.translations[lang][field]!;
  }
  if (d.translations && d.translations.en && d.translations.en[field]) {
    return d.translations.en[field]!;
  }
  return field === 'name' ? d.name : d.description;
}

export default function DestinationsClient({ destinations, banners }: Props) {
  const { dict, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = destinations.filter(
    (d) =>
      getLocalized(d, language, 'name').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getLocalized(d, language, 'description').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#070F1E]">
      {/* Hero Banner */}
      <section 
        className="relative overflow-hidden bg-gradient-to-b from-[#0B1528] to-[#070F1E] pb-16 pt-24 lg:pb-24 lg:pt-32 bg-cover bg-center"
        style={banners.destinationsBackground ? { backgroundImage: `linear-gradient(rgba(7, 15, 30, 0.85), rgba(7, 15, 30, 0.95)), url(${banners.destinationsBackground})` } : undefined}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#00E5FF]/5 blur-[120px]" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#FFD700]/5 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 text-center lg:px-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-5 py-2">
            <Compass className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5FF]">
              {dict.destinationsPage?.title ?? 'All Destinations'}
            </span>
            <span className="ml-1 rounded-full bg-[#00E5FF]/10 px-2 py-0.5 text-[11px] font-bold text-[#00E5FF]">
              {destinations.length}
            </span>
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight text-white lg:text-6xl">
            {dict.destinationsPage?.title ?? 'All Destinations'}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-400 lg:text-lg">
            {dict.destinationsPage?.subtitle ?? 'Explore our complete collection of hand-picked Red Sea and desert destinations'}
          </p>

          {/* Search */}
          <div className="mx-auto mt-10 max-w-md">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="w-full rounded-2xl border border-white/10 bg-[#0B1528] py-4 pl-12 pr-4 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Destination Grid */}
      <section className="relative -mt-10 pb-24 lg:-mt-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-10">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/5 bg-white/[0.02] py-24 text-center">
              <Compass className="mb-4 h-12 w-12 text-slate-600" />
              <h3 className="text-xl font-black text-white">
                {dict.destinationsPage?.noDestinations ?? 'No destinations found'}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((dest, index) => {
                // Resolution order: the destination's own image, then a tour
                // photo the site owns for that destination, then the curated
                // Unsplash cover, and finally the local placeholder via the
                // CoverImage error handler below.
                const covers = dest.imageUrl
                  ? [dest.imageUrl]
                  : dest.ownedCover
                    ? [dest.ownedCover]
                    : (DESTINATION_COVERS[dest.slug] ?? [FALLBACK_COVER]);
                const localizedName = getLocalized(dest, language, 'name');
                const localizedDesc = getLocalized(dest, language, 'description');

                return (
                  <Link
                    key={dest.id}
                    href={`/destinations/${dest.slug}`}
                    className={`group relative overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#0B1528] transition-all duration-500 hover:border-[#00E5FF]/20 hover:shadow-2xl hover:shadow-[#00E5FF]/5 ${
                      index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                    }`}
                  >
                    {/* Image area */}
                    <div className={`relative overflow-hidden ${index === 0 ? 'h-72 md:h-80' : 'h-56'}`}>
                      {/* Primary image */}
                      <CoverImage
                        key={`primary-${covers[0]}`}
                        src={covers[0]}
                        alt={localizedName}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-all duration-700 group-hover:scale-110"
                      />
                      {/* Secondary overlay image on hover */}
                      {covers[1] && (
                        <CoverImage
                          key={`secondary-${covers[1]}`}
                          src={covers[1]}
                          alt=""
                          aria-hidden
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                          className="object-cover opacity-0 transition-all duration-700 group-hover:opacity-100"
                        />
                      )}
                      {/* Gradient overlays */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528] via-[#0B1528]/30 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1528]/20 via-transparent to-[#0B1528]/80" />

                      {/* Tour count badge */}
                      <div className="absolute right-4 top-4 z-10">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/20 bg-[#0B1528]/90 px-3 py-1.5 text-xs font-bold text-[#00E5FF] shadow-lg shadow-black/30 backdrop-blur-md">
                          <Star className="h-3 w-3" />
                          {dest.tourCount} {dict.destinationsPage?.toursAvailable ?? 'Tours Available'}
                        </span>
                      </div>

                      {/* Destination name on image bottom */}
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        {dest.countryCode && (
                          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-[#EAB308]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span>
                              {dest.city ? `${dest.city}, ` : ''}
                              {dest.countryCode === 'EG' ? 'Egypt' : dest.countryCode}
                            </span>
                          </div>
                        )}
                        <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-lg">
                          {localizedName}
                        </h3>
                      </div>
                    </div>

                    {/* Content area */}
                    <div className="p-5">
                      <p className="line-clamp-2 text-sm leading-6 text-slate-400">
                        {localizedDesc}
                      </p>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#00E5FF] transition-all group-hover:gap-3">
                        <span>{dict.destinationsPage?.exploreButton ?? 'Explore Destinations'}</span>
                        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
