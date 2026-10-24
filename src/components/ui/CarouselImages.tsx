'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { isSupabaseStorageImage } from '@/utils/imageOptimization';

interface CarouselImagesProps {
  images: string[];
  isHovered: boolean;
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
  tourId,
  priority = false,
}: CarouselImagesProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  useEffect(() => {
    setIndex(0);
  }, [tourId]);

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0EA5E9]/10 via-[#070F1E] to-[#EAB308]/10">
        <ImageIcon className="h-10 w-10 text-white/20" />
      </div>
    );
  }

  // A tour can carry dozens of gallery images, and rendering all of them as
  // stacked <Image> elements produced hundreds of optimized variants in the DOM
  // per page while only ever showing one. Mount just the visible slide and its
  // immediate neighbours: during the fade between two slides both are needed,
  // and the neighbour is already decoded when the carousel reaches it.
  const mounted = new Set<number>([
    index,
    (index - 1 + images.length) % images.length,
    (index + 1) % images.length,
  ]);

  return (
    <div className="relative h-full w-full">
      {images.map((url, i) =>
        mounted.has(i) ? (
          <Image
            key={i}
            src={url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority && i === 0}
            unoptimized={isSupabaseStorageImage(url)}
            // Slides other than the first are only revealed on hover, so they
            // must not compete with the rest of the page for bandwidth.
            loading={priority && i === 0 ? undefined : 'lazy'}
            className={`object-cover transition-opacity duration-500 ${
              i === index ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : null
      )}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 z-10">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-4 bg-[#06B6D4]' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
