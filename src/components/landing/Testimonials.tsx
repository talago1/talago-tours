'use client';

import { ShieldCheck, Star } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export interface LandingReview {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  tourName?: string;
  createdAt?: string | Date;
  country?: string | null;
  source?: string | null;
}

interface TestimonialsProps {
  reviews?: LandingReview[];
}

export default function Testimonials({ reviews = [] }: TestimonialsProps) {
  const { dict } = useLanguage();

  if (!reviews || reviews.length === 0) {
    return null;
  }

  const averageRating =
    reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length;

  return (
    <section id="verified-reviews" className="bg-[#070F1E] px-5 py-20 text-[#F8FAFC] sm:px-8 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.04] to-[#06B6D4]/10 p-6 shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:scale-[1.01] hover:border-[#EAB308]/35 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">
                {dict.testimonials.section}
              </p>
              <h2 className="text-3xl font-black text-white sm:text-4xl">
                {dict.testimonials.heading}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-[#EAB308]">
                {averageRating.toFixed(1)}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    className={`h-5 w-5 ${
                      index < Math.round(averageRating)
                        ? 'fill-[#EAB308] text-[#EAB308]'
                        : 'text-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[98%] rounded-full bg-gradient-to-r from-[#EAB308] via-[#FACC15] to-[#06B6D4]" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {reviews.slice(0, 6).map((testimonial) => {
            const initials = (testimonial.customerName || 'VG')
              .split(' ')
              .map((n) => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            const dateStr = testimonial.createdAt
              ? new Date(testimonial.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '';

            return (
              <article
                key={testimonial.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/35 hover:shadow-[#06B6D4]/10"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 text-sm font-black text-[#EAB308]">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-black text-white">{testimonial.customerName}</h3>
                      {testimonial.country && (
                        <p className="text-xs text-slate-400">{testimonial.country}</p>
                      )}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#00473F]/50 px-2.5 py-1 text-xs font-bold text-[#A7F3D0]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {testimonial.source && testimonial.source !== 'TALAGO'
                      ? `${testimonial.source}`
                      : dict.testimonials.verified}
                  </div>
                </div>

                {testimonial.tourName && (
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#06B6D4]">
                    {testimonial.tourName}
                  </p>
                )}

                <div className="my-3 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < testimonial.rating
                          ? 'fill-[#EAB308] text-[#EAB308]'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <p className="text-sm leading-6 text-slate-300 line-clamp-4">
                  “{testimonial.comment}”
                </p>

                {dateStr && (
                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    {dateStr}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
