'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Star,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Check,
  X,
  ShieldCheck,
  Users,
  Info,
  CreditCard,
  Wallet,
  Building2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface TourData {
  id: string;
  slug: string;
  title: string;
  description: string;
  basePrice: number;
  duration: string;
  maxCapacity: number;
  ratingAverage: number;
  ratingCount: number;
  category: string | null;
  destination: { name: string; slug: string };
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: any[];
  whatToBring: string;
  pickupDescription: string | null;
  pickupTime?: string | null;
  cancellationPolicy?: string | null;
  hotelPickupIncluded: boolean | null;
  images: string[];
  adultPrice: number;
  childPrice: number | null;
  infantPrice: number | null;
  allowDeposit: boolean;
  depositPercentage: number;
  allowPayAtLocation: boolean;
  translations: Record<string, { title?: string; description?: string }>;
}

interface ReviewsData {
  distribution: { star: number; count: number; percentage: number }[];
  reviews: { id: string; customerName: string; rating: number; comment: string; createdAt: string }[];
  ratingAverage: number;
  ratingCount: number;
}

interface Props {
  tour: TourData;
  reviews: ReviewsData;
}

// ---------- Hero Slider ----------
function HeroSlider({ images, title, destinationName, category }: { images: string[]; title: string; destinationName: string; category: string | null }) {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (images.length <= 1) return;
    intervalRef.current = setInterval(() => setCurrent((c) => (c + 1) % images.length), 5000);
  }, [images.length]);

  useEffect(() => {
    startInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startInterval]);

  const goTo = (i: number) => { setCurrent(i); startInterval(); };
  const goPrev = () => goTo((current - 1 + images.length) % images.length);
  const goNext = () => goTo((current + 1) % images.length);

  if (images.length === 0) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="relative h-[50vh] md:h-[70vh]">
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-700 ${
              i === current ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          >
            <img src={img} alt={`${title} ${i + 1}`} className="h-full w-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070F1E] to-transparent" />

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-[#00E5FF]' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* Destination + category badges */}
        <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
          <span className="rounded-full border border-[#00E5FF]/20 bg-[#0B1528]/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#00E5FF] shadow-xl backdrop-blur-md">
            {destinationName}
          </span>
          {category && (
            <span className="rounded-full border border-[#FFD700]/20 bg-[#0B1528]/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#FFD700] shadow-xl backdrop-blur-md">
              {category.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------- Accordion ----------
function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left text-lg font-black text-white transition-colors hover:text-[#00E5FF]"
      >
        {title}
        <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[2000px] pb-5' : 'max-h-0'}`}>
        <div className="text-sm leading-7 text-slate-300">{children}</div>
      </div>
    </div>
  );
}

// ---------- Itinerary Timeline ----------
function ItineraryTimeline({ itinerary }: { itinerary: any[] }) {
  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-gradient-to-b before:from-[#00E5FF] before:to-[#00473F]">
      {itinerary.map((item: any, i: number) => {
        const time = item.time || `Step ${i + 1}`;
        const description = item.description || item.title || item.activity || '';
        const checklist = Array.isArray(item.checklist) ? item.checklist : [];
        const location = item.location || '';
        return (
          <div key={i} className="relative">
            <div className="absolute -left-8 top-0 flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-[#00E5FF] bg-[#070F1E]">
              <span className="text-[10px] font-black text-[#00E5FF]">{i + 1}</span>
            </div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-3 py-1">
              <Clock className="h-3 w-3 text-[#00E5FF]" />
              <span className="text-xs font-bold text-[#00E5FF]">{time}</span>
            </div>
            {location && (<p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{location}</p>)}
            <p className="text-sm leading-7 text-slate-300">{description}</p>
            {checklist.length > 0 && (
              <div className="mt-2 space-y-1">
                {checklist.map((ci: string, cj: number) => (
                  <div key={cj} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    <span className="text-xs text-slate-400">{ci}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------- Checklist ----------
function Checklist({ items, icon }: { items: string[]; icon: 'check' | 'x' }) {
  if (!items || items.length === 0) return null;
  const Icon = icon === 'check' ? Check : X;
  const colorClasses = icon === 'check'
    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    : 'text-red-400 bg-red-500/10 border-red-500/20';

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 rounded-xl border p-4 ${
            icon === 'check' ? 'border-emerald-500/10 bg-emerald-500/[0.04]' : 'border-white/5 bg-white/[0.02]'
          }`}
        >
          <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colorClasses}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm leading-6 text-slate-300">{item}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Star Rating ----------
function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const stars = [];
  const rounded = Math.round(rating);
  const cls = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star key={i} className={`${cls} ${i <= rounded ? 'fill-[#FFD700] text-[#FFD700]' : 'text-slate-600'}`} />
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

// ========== MAIN EXPORT ==========
export default function TourDetailsClient({ tour, reviews }: Props) {
  const { dict, language } = useLanguage();
  const [guestCount, setGuestCount] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit' | 'arrival'>(
    tour.allowPayAtLocation ? 'arrival' : tour.allowDeposit ? 'deposit' : 'full'
  );

  // Resolve localized translations from parent
  const translations = tour.translations;
  const localizedTitle = translations?.[language]?.title ?? tour.title;
  const localizedDesc = translations?.[language]?.description ?? tour.description;

  const pricePerAdult = tour.adultPrice ?? tour.basePrice;
  const totalPrice = pricePerAdult * guestCount;
  const depositAmount = Math.round(totalPrice * (tour.depositPercentage / 100) * 100) / 100;
  const dueOnArrival = Math.round((totalPrice - depositAmount) * 100) / 100;

  const whatToBringItems: string[] = (() => {
    if (Array.isArray(tour.whatToBring)) return tour.whatToBring as string[];
    if (typeof tour.whatToBring === 'string' && tour.whatToBring) {
      return tour.whatToBring.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  })();

  const itineraryItems = Array.isArray(tour.itinerary) ? tour.itinerary : [];

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider images={tour.images} title={localizedTitle} destinationName={tour.destination.name} category={tour.category} />

      {/* Main Content Grid */}
      <div className="mx-auto max-w-7xl px-5 pb-24 lg:px-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_420px] -mt-32 relative z-10">
          {/* ----- LEFT: Main Content ----- */}
          <div>
            {/* Title & Meta */}
            <div className="mb-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={tour.ratingAverage} />
                  <span className="text-sm font-semibold text-slate-300">
                    {tour.ratingAverage.toFixed(1)} ({tour.ratingCount} {dict.catalog.reviews})
                  </span>
                </div>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin className="h-4 w-4 text-[#00E5FF]" />
                  {tour.destination.name}
                </span>
                <span className="text-slate-600">·</span>
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Clock className="h-4 w-4 text-[#FFD700]" />
                  {tour.duration}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white lg:text-5xl">{localizedTitle}</h1>
              {localizedDesc && (
                <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{localizedDesc}</p>
              )}
            </div>

            {/* Highlights */}
            {tour.highlights.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-xl font-black text-white">Highlights</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tour.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 rounded-xl border border-[#00E5FF]/10 bg-[#00E5FF]/5 p-4 transition-all duration-300 hover:border-[#00E5FF]/30">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00E5FF]/20 text-[#00E5FF]">
                        <Star className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-sm leading-6 text-slate-300">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cancellation Policy Card — Gold-bordered */}
            <div className="mb-8 mt-6 rounded-[2rem] border border-[#FFD700]/20 bg-gradient-to-br from-[#FFD700]/5 to-transparent p-6 shadow-lg shadow-[#FFD700]/5 lg:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                  <ShieldCheck className="h-6 w-6 text-[#FFD700]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Free Cancellation</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-300">
                    Cancel up to <span className="font-bold text-[#FFD700]">24 hours</span> in advance
                    for a full refund. No questions asked — because plans change.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD700]">Free Cancellation</p>
                      <p className="mt-1 text-xs text-slate-400">Up to 24h before departure</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#00E5FF]">Secure Checkout</p>
                      <p className="mt-1 text-xs text-slate-400">Encrypted payment processing</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-400">Premium Support</p>
                      <p className="mt-1 text-xs text-slate-400">24/7 concierge assistance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="divide-y divide-white/10 border-t border-white/10">
              {/* Inclusions & Exclusions */}
              {(tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
                <Accordion title="What's Included" defaultOpen>
                  <div className="space-y-6">
                    {tour.inclusions.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-bold text-emerald-400">Included</p>
                        <Checklist items={tour.inclusions} icon="check" />
                      </div>
                    )}
                    {tour.exclusions.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-bold text-red-400">Excluded</p>
                        <Checklist items={tour.exclusions} icon="x" />
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Itinerary */}
              {itineraryItems.length > 0 && (
                <Accordion title="Itinerary" defaultOpen>
                  <ItineraryTimeline itinerary={itineraryItems} />
                </Accordion>
              )}

              {/* What to Bring */}
              {whatToBringItems.length > 0 && (
                <Accordion title="What to Bring">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {whatToBringItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <Check className="h-4 w-4 shrink-0 text-[#FFD700]" />
                        <span className="text-sm text-slate-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Pickup Info */}
              {(tour.pickupDescription || tour.hotelPickupIncluded) && (
                <Accordion title="Pickup Information">
                  <div className="rounded-xl border border-[#00E5FF]/10 bg-[#00E5FF]/5 p-5">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#00E5FF]" />
                      <div>
                        {tour.hotelPickupIncluded && (
                          <p className="mb-2 text-sm font-bold text-emerald-400">Hotel Pickup Included</p>
                        )}
                        {tour.pickupDescription && (
                          <p className="text-sm leading-7 text-slate-300">{tour.pickupDescription}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </Accordion>
              )}

              {/* Verified Reviews */}
              {reviews.reviews.length > 0 && (
                <Accordion title={`Verified Reviews (${reviews.ratingCount})`} defaultOpen>
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                        <div className="text-center">
                          <span className="text-5xl font-black text-white">{reviews.ratingAverage.toFixed(1)}</span>
                          <div className="mt-2 flex justify-center">
                            <StarRating rating={reviews.ratingAverage} size="md" />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {reviews.ratingCount} review{reviews.ratingCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          {[...reviews.distribution].sort((a, b) => b.star - a.star).map((d) => (
                            <div key={d.star} className="flex items-center gap-2">
                              <span className="w-3 text-right text-xs font-bold text-slate-400">{d.star}</span>
                              <Star className="h-3 w-3 text-[#FFD700]" fill="#FFD700" />
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                                <div className="h-full rounded-full bg-[#FFD700]" style={{ width: `${d.percentage}%` }} />
                              </div>
                              <span className="w-8 text-right text-xs text-slate-500">{d.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Review Cards */}
                    <div className="space-y-4">
                      {reviews.reviews.map((review) => (
                        <article
                          key={review.id}
                          className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-white/10 hover:bg-white/[0.03]"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 text-sm font-black text-[#00E5FF]">
                                {(review.customerName || 'G').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-white">
                                    {review.customerName || 'Verified Guest'}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Verified
                                  </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  <StarRating rating={review.rating} />
                                  <span className="text-[11px] text-slate-500">
                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                      year: 'numeric', month: 'short', day: 'numeric',
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="mt-3 text-sm leading-7 text-slate-300">&ldquo;{review.comment}&rdquo;</p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                </Accordion>
              )}
            </div>
          </div>

          {/* ----- RIGHT: Desktop Booking Widget + Payment Action Drawer ----- */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
              {/* Price */}
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">From</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">${pricePerAdult.toFixed(0)}</span>
                  <span className="text-sm text-slate-400">/ person</span>
                </div>
              </div>

              {/* Guest Selector */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Users className="h-4 w-4 text-[#00E5FF]" />
                  Number of Guests
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    disabled={guestCount <= 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center text-xl font-black text-white">{guestCount}</span>
                  <button
                    type="button"
                    onClick={() => setGuestCount((c) => Math.min(tour.maxCapacity, c + 1))}
                    disabled={guestCount >= tour.maxCapacity}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Payment Option Selector — Dynamic Action Drawer */}
              <div className="mb-6 space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Payment Method</p>

                {/* Full Online */}
                <button
                  type="button"
                  onClick={() => setSelectedPayment('full')}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    selectedPayment === 'full' ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                  }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedPayment === 'full' ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                    <CreditCard className={`h-5 w-5 ${selectedPayment === 'full' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${selectedPayment === 'full' ? 'text-emerald-300' : 'text-slate-300'}`}>Full Online Payment</p>
                    <p className="text-xs text-slate-500">Pay 100% now — nothing due on tour day</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${totalPrice.toFixed(0)}</p>
                  </div>
                </button>

                {/* Deposit */}
                {tour.allowDeposit && (
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('deposit')}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      selectedPayment === 'deposit' ? 'border-purple-500/40 bg-purple-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedPayment === 'deposit' ? 'bg-purple-500/20' : 'bg-white/5'}`}>
                      <Wallet className={`h-5 w-5 ${selectedPayment === 'deposit' ? 'text-purple-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${selectedPayment === 'deposit' ? 'text-purple-300' : 'text-slate-300'}`}>
                        Deposit Online ({tour.depositPercentage}%)
                      </p>
                      <p className="text-xs text-slate-500">Pay {tour.depositPercentage}% now, remaining on arrival</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${depositAmount.toFixed(0)}</p>
                    </div>
                  </button>
                )}

                {/* Cash on Arrival */}
                {tour.allowPayAtLocation && (
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('arrival')}
                    className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                      selectedPayment === 'arrival' ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedPayment === 'arrival' ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                      <Building2 className={`h-5 w-5 ${selectedPayment === 'arrival' ? 'text-amber-400' : 'text-slate-500'}`} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${selectedPayment === 'arrival' ? 'text-amber-300' : 'text-slate-300'}`}>Cash on Arrival</p>
                      <p className="text-xs text-slate-500">Zero advance fee — pay cash upon pickup</p>
                    </div>
                    <div className="text-right">
                      {selectedPayment === 'arrival' && <p className="text-sm font-bold text-amber-400">$0</p>}
                    </div>
                  </button>
                )}
              </div>

              {/* Price breakdown */}
              <div className="mb-6 space-y-3 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">${pricePerAdult.toFixed(0)} x {guestCount} guest{guestCount > 1 ? 's' : ''}</span>
                  <span className="font-bold text-white">${totalPrice.toFixed(0)}</span>
                </div>
                {selectedPayment === 'deposit' && tour.allowDeposit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Due on arrival</span>
                    <span className="font-bold text-amber-400">${dueOnArrival.toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link href={`/checkout/${tour.id}`}>
                <Button variant="primary" size="lg" fullWidth>Reserve Now</Button>
              </Link>

              {/* Trust footer */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Secure booking — Free cancellation
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B1528]/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">From</p>
            <p className="text-2xl font-black text-white">
              ${pricePerAdult.toFixed(0)}
              <span className="ml-1 text-sm font-normal text-slate-400">/ person</span>
            </p>
          </div>
          <Link href={`/checkout/${tour.id}`}>
            <Button variant="primary" size="md">Book Now</Button>
          </Link>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
