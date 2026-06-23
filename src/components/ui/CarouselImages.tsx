'use client';

import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';

interface CarouselImagesProps {
  images: string[];
  isHovered: boolean;
  tourId: string;
}

export default function CarouselImages({
  images,
  isHovered,
  tourId,
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

  return (
    <div className="relative h-full w-full">
      {images.map((url, i) => (
        <img
          key={i}
          src={url}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
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
