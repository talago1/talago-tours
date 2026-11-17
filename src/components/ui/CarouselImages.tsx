'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { isSupabaseStorageImage } from '@/utils/imageOptimization';

interface CarouselImagesProps {
  images: string[];
  /** Desktop: true when mouse is hovering the card */
  isHovered: boolean;
  /** Mobile: true when user has tapped the image to start auto-advance */
  isSlideshowActive: boolean;
  tourId: string;
  /**
   * Set on the single card that owns the page's LCP image (the first tour in the
   * list). `priority` implies eager loading, so marking every card's cover
   * would fetch a dozen covers before any of them are painted.
   */
  priority?: boolean;
}

export default function CarouselImages({
  images,
  isHovered,
  isSlideshowActive,
  tourId,
  priority = false,
}: CarouselImagesProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  // ── Reset slide index when the tour changes ────────────────────────────
  useEffect(() => {
    setIndex(0);
  }, [tourId]);

  // ── IntersectionObserver: pause when card scrolls out of view ─────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Document visibility: pause when browser tab is hidden ──────────────
  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // ── Autoplay: active when hovered/slideshow AND visible AND tab visible ─
  useEffect(() => {
    const shouldPlay =
      (isHovered || isSlideshowActive) &&
      isVisible &&
      isDocumentVisible &&
      images.length > 1;

    if (!shouldPlay) return;

    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    // 2.5 s interval for slideshow (mobile), 1.5 s for hover (desktop)
    const intervalMs = isSlideshowActive ? 2500 : 1500;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(interval);
  }, [isHovered, isSlideshowActive, isVisible, isDocumentVisible, images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return; // ignore tiny movements
    if (delta < 0) {
      setIndex((prev) => (prev + 1) % images.length);
    } else {
      setIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0EA5E9]/10 via-[#070F1E] to-[#EAB308]/10">
        <ImageIcon className="h-10 w-10 text-white/20" />
      </div>
    );
  }

  // Mount the active slide, its neighbours, and always keep slide 0 for fast
  // first-paint. Unmounting slides more than 1 step away avoids loading dozens
  // of images upfront while still allowing a seamless forward/back transition.
  const mounted = new Set<number>([
    0, // always keep the cover image mounted
    index,
    (index - 1 + images.length) % images.length,
    (index + 1) % images.length,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {images.map((url, i) =>
        mounted.has(i) ? (
          <Image
            key={i}
            src={url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority && i === 0}
            unoptimized={isSupabaseStorageImage(url)}
            loading={priority && i === 0 ? undefined : 'lazy'}
            className={`object-cover transition-opacity duration-500 ${
              i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{ position: 'absolute', inset: 0, zIndex: i === index ? 1 : 0 }}
          />
        ) : null
      )}

      {/* Slide indicator dots */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 z-10">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === index
                  ? 'w-3 bg-[#06B6D4]'
                  : 'w-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
