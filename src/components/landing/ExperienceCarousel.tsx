'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
import PublicTourCard, { type PublicTourCardData } from '@/components/tours/PublicTourCard';

interface ExperienceCarouselProps {
  id: string;
  title: string;
  subtitle?: string;
  tours: PublicTourCardData[];
  viewAllLink?: string;
  viewAllText?: string;
}

export default function ExperienceCarousel({
  id,
  title,
  subtitle,
  tours,
  viewAllLink,
  viewAllText = 'View all',
}: ExperienceCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // If no eligible tours, hide section cleanly (per visibility rules)
  if (!tours || tours.length === 0) {
    return null;
  }

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tours]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative py-8 sm:py-12" id={`section-${id}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{title}</span>
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {viewAllLink && (
              <Link
                href={viewAllLink}
                className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:text-[#70EEFF] transition-colors"
              >
                <span>{viewAllText}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0B1528] text-white transition-all ${
                  canScrollLeft
                    ? 'hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 active:scale-95'
                    : 'opacity-40 cursor-not-allowed text-slate-500'
                }`}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#0B1528] text-white transition-all ${
                  canScrollRight
                    ? 'hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 active:scale-95'
                    : 'opacity-40 cursor-not-allowed text-slate-500'
                }`}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {tours.map((tour) => (
            <div
              key={tour.id}
              className="w-[285px] sm:w-[320px] md:w-[340px] shrink-0 snap-start"
            >
              <PublicTourCard tour={tour} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
