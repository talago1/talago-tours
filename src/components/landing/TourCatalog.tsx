'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  MapPin,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';
import { categoryMatchesGroup } from '@/utils/tourCategory';

interface TourCatalogProps {
  tours: PublicTourCardData[];
  totalActiveCount?: number;
}

export default function TourCatalog({ tours, totalActiveCount }: TourCatalogProps) {
  const { dict } = useLanguage();

  const [activeDestination, setActiveDestination] = useState<string>('ALL');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [detectedLocation, setDetectedLocation] = useState<{ destination: string; name: string } | null>(null);

  // Auto-detect guest location and recommend nearest destination experiences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = sessionStorage.getItem('talago_active_dest');
    if (saved) {
      setActiveDestination(saved);
      return;
    }

    // 1. IP-based location check from Vercel edge
    fetch('/api/public/geo')
      .then((res) => res.json())
      .then((data) => {
        const ALL_DEST_SLUGS = [
          'hurghada', 'sharm-el-sheikh', 'marsa-alam', 'el-gouna', 'makadi-bay',
          'sahl-hasheesh', 'soma-bay', 'safaga', 'luxor', 'aswan', 'cairo',
          'alexandria', 'fayoum', 'siwa', 'el-alamein',
        ];
        if (data.destination && ALL_DEST_SLUGS.includes(data.destination)) {
          setDetectedLocation({
            destination: data.destination,
            name: data.destinationName || data.destination,
          });
        }
      })
      .catch(() => {});

    // 2. High-precision browser geolocation if allowed
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const dests = [
            { id: 'hurghada', name: 'Hurghada', lat: 27.2579, lng: 33.8116 },
            { id: 'sharm-el-sheikh', name: 'Sharm El Sheikh', lat: 27.9158, lng: 34.3299 },
            { id: 'marsa-alam', name: 'Marsa Alam', lat: 25.0676, lng: 34.8790 },
            { id: 'el-gouna', name: 'El Gouna', lat: 27.3918, lng: 33.6799 },
            { id: 'makadi-bay', name: 'Makadi Bay', lat: 26.9985, lng: 33.7804 },
            { id: 'sahl-hasheesh', name: 'Sahl Hasheesh', lat: 27.0706, lng: 33.8401 },
            { id: 'soma-bay', name: 'Soma Bay', lat: 26.8522, lng: 33.9438 },
            { id: 'safaga', name: 'Safaga', lat: 26.7337, lng: 33.9366 },
            { id: 'luxor', name: 'Luxor', lat: 25.6872, lng: 32.6396 },
            { id: 'aswan', name: 'Aswan', lat: 24.0889, lng: 32.8998 },
            { id: 'cairo', name: 'Cairo', lat: 30.0444, lng: 31.2357 },
            { id: 'alexandria', name: 'Alexandria', lat: 31.2001, lng: 29.9187 },
            { id: 'fayoum', name: 'Fayoum', lat: 29.3084, lng: 30.8428 },
            { id: 'siwa', name: 'Siwa', lat: 29.2031, lng: 25.5195 },
            { id: 'el-alamein', name: 'El Alamein', lat: 30.8418, lng: 28.9550 },
          ];
          let closest = dests[0];
          let minD = Infinity;
          dests.forEach((d) => {
            const dist = Math.hypot(d.lat - latitude, d.lng - longitude);
            if (dist < minD) {
              minD = dist;
              closest = d;
            }
          });
          if (minD < 2.5) {
            setDetectedLocation({ destination: closest.id, name: closest.name });
          }
        },
        () => {},
        { timeout: 4000, maximumAge: 600000 }
      );
    }
  }, []);

  const handleDestinationSelect = (id: string) => {
    setActiveDestination(id);
    setVisibleCount(12);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('talago_active_dest', id);
    }
  };

  // Destination options, derived from the tours actually present so a
  // destination added in the admin appears without a code change.
  const destinationTabs = useMemo(() => {
    const seen = new Map<string, string>();
    for (const tour of tours) {
      const slug = tour.destination?.slug?.toLowerCase();
      const name = tour.destination?.name;
      if (slug && name && !seen.has(slug)) seen.set(slug, name);
    }
    return [
      { id: 'ALL', label: dict.catalog.allDestinations },
      ...Array.from(seen, ([id, label]) => ({ id, label })),
    ];
  }, [tours, dict.catalog.allDestinations]);

  // Category options
  const categoryTabs = [
    { id: 'ALL', label: dict.catalog.all },
    { id: 'Sea', label: dict.catalog.sea },
    { id: 'Safari', label: dict.catalog.safari },
    { id: 'Cultural', label: dict.catalog.cultural },
    { id: 'Spa', label: dict.catalog.spa },
  ];

  // Filter & sort tours: best sellers first, then top rated
  const filteredTours = useMemo(() => {
    return tours
      .filter((t) => {
        // Destination filter
        if (activeDestination !== 'ALL') {
          const destSlug = t.destination?.slug?.toLowerCase() || '';
          if (destSlug !== activeDestination) return false;
        }
        // Category filter
        if (activeCategory !== 'ALL') {
          if (!categoryMatchesGroup(t.category, activeCategory)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Best sellers first
        if (a.isBestSeller && !b.isBestSeller) return -1;
        if (!a.isBestSeller && b.isBestSeller) return 1;
        // Featured next
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Highest rating
        return (b.ratingAverage || 0) - (a.ratingAverage || 0);
      });
  }, [tours, activeDestination, activeCategory]);

  const displayedTours = filteredTours.slice(0, visibleCount);

  return (
    <section id="explore-trips" className="bg-[#070F1E] px-5 py-16 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-[#00E5FF]">
              <Sparkles className="h-3.5 w-3.5 text-[#00E5FF]" />
              {dict.catalog.homeBadge}
            </p>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              {dict.catalog.homeHeading}
            </h2>
          </div>

          {/* Destination Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {destinationTabs.map((dest) => (
              <button
                key={dest.id}
                type="button"
                onClick={() => handleDestinationSelect(dest.id)}
                className={`rounded-full border px-4 py-2 text-xs font-black transition-all duration-300 ${
                  activeDestination === dest.id
                    ? 'border-[#00E5FF]/50 bg-[#00E5FF] text-[#070F1E] shadow-lg shadow-[#00E5FF]/20'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]'
                }`}
              >
                {dest.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detected Location Banner */}
        {detectedLocation && activeDestination === detectedLocation.destination && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-4 py-3 text-xs text-[#00E5FF] backdrop-blur-md">
            <span className="flex items-center gap-2 font-bold">
              <MapPin className="h-4 w-4 shrink-0 text-[#00E5FF]" />
              {dict.catalog.nearYou.replace('{name}', detectedLocation.name)}
            </span>
            <button
              type="button"
              onClick={() => handleDestinationSelect('ALL')}
              className="font-black underline transition-colors hover:text-white"
            >
              {dict.catalog.exploreAllDestinations}
            </button>
          </div>
        )}

        {/* Secondary Category Filters */}
        <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-white/10 pb-5">
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
            <SlidersHorizontal className="h-3 w-3 text-slate-400" />
            {dict.catalog.categoryLabel}
          </span>
          {categoryTabs.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setVisibleCount(9);
              }}
              className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeCategory === cat.id
                  ? 'border-[#FFD700] bg-[#FFD700]/15 text-[#FFD700]'
                  : 'border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-xs font-medium text-slate-500">
            {dict.catalog.xAvailable.replace(
              '{total}',
              String(activeDestination === 'ALL' && activeCategory === 'ALL' && totalActiveCount ? totalActiveCount : filteredTours.length)
            )}
          </span>
        </div>

        {/* Grid of Experiences */}
        {filteredTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] py-20 text-center">
            <p className="text-base font-bold text-slate-300">
              {dict.catalog.noResultsFilterTitle}
            </p>
            <p className="mt-2 text-xs text-slate-500">{dict.catalog.noResultsFilterDesc}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
{displayedTours.map((tour) => (
        <PublicTourCard key={tour.id} tour={tour} />
            ))}
          </div>
        )}

        {/* Load More / Explore All Experiences Button */}
        {filteredTours.length > visibleCount && (
          <div className="mt-12 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 9)}
              className="inline-flex items-center gap-2.5 rounded-2xl border border-white/15 bg-white/5 px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white backdrop-blur-md transition-all duration-300 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] hover:scale-105"
            >
              <span>{dict.catalog.showMore}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Link to Full Catalog */}
        <div className="mt-8 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-[#00E5FF]"
          >
            <span>{dict.catalog.browseAllTours}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
