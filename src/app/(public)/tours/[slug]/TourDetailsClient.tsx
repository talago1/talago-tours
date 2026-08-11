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
  UserRound,
  Baby,
  Maximize2,
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
  const { dict } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (images.length <= 1 || lightboxOpen) return;
    intervalRef.current = setInterval(() => setCurrent((c) => (c + 1) % images.length), 5000);
  }, [images.length, lightboxOpen]);

  useEffect(() => {
    startInterval();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [startInterval]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    startInterval();
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev + 1) % images.length);
      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [lightboxOpen, images.length]);

  const goTo = (i: number) => { setCurrent(i); startInterval(); };
  const goPrev = () => goTo((current - 1 + images.length) % images.length);
  const goNext = () => goTo((current + 1) % images.length);

  if (images.length === 0) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="group relative h-[50vh] cursor-pointer md:h-[70vh]" onClick={() => openLightbox(current)}>
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-700 ${
              i === current ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          >
            <img src={img} alt={`${title} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070F1E] to-transparent" />

        {/* View All Photos Button Badge */}
        <div className="absolute bottom-6 right-6 z-10">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); openLightbox(current); }}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-[#0B1528]/90 px-4 py-2.5 text-xs font-bold text-white shadow-2xl backdrop-blur-md transition-all hover:bg-[#00E5FF] hover:text-[#070F1E] hover:scale-105"
          >
            <Maximize2 className="h-4 w-4 text-[#00E5FF]" />
            <span>{dict.tourDetails?.sameAsAdult ? (dict.tourDetails as any).viewAllPhotos || 'View Full Photos' : 'View Full Photos'} ({images.length})</span>
          </button>
        </div>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/50 p-2 text-white backdrop-blur-sm transition-all hover:bg-black/70 hover:scale-110"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
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
                onClick={(e) => { e.stopPropagation(); goTo(i); }}
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

      {/* ---------- Fullscreen Lightbox Modal ---------- */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-4 backdrop-blur-md animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Lightbox Header */}
          <div className="flex w-full items-center justify-between px-4 py-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-bold tracking-widest text-slate-300">
              {title} &mdash; <span className="text-[#00E5FF]">{lightboxIndex + 1} / {images.length}</span>
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              className="rounded-full border border-white/20 bg-white/10 p-2 text-white transition-colors hover:bg-red-500 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Main Uncropped Image Container */}
          <div className="relative flex max-h-[75vh] w-full flex-1 items-center justify-center py-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex]}
              alt={`${title} full size ${lightboxIndex + 1}`}
              className="max-h-[75vh] max-w-[95vw] rounded-lg object-contain shadow-2xl transition-all duration-300"
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-3 text-white transition-all hover:bg-[#00E5FF] hover:text-[#070F1E] hover:scale-110 md:left-6"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/70 p-3 text-white transition-all hover:bg-[#00E5FF] hover:text-[#070F1E] hover:scale-110 md:right-6"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {/* Lightbox Thumbnails Strip */}
          {images.length > 1 && (
            <div className="flex max-w-full gap-3 overflow-x-auto p-2" onClick={(e) => e.stopPropagation()}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    idx === lightboxIndex ? 'border-[#00E5FF] scale-105 opacity-100 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
// Inline stepper with click-to-type for the sidebar
function SidebarStepper({
  label,
  sublabel,
  priceLabel,
  icon: Icon,
  iconBg,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  sublabel?: string;
  priceLabel?: string;
  icon: React.ElementType;
  iconBg: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState('');
  const commit = () => {
    const n = parseInt(raw, 10);
    onChange(isNaN(n) ? value : Math.max(min, n));
    setEditing(false);
  };
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          {sublabel && <p className="text-xs text-slate-500">{sublabel}</p>}
          {priceLabel && <p className="text-xs font-medium text-[#00E5FF]">{priceLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" /></svg>
        </button>
        {editing ? (
          <input
            autoFocus
            type="number"
            min={min}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
            className="w-12 text-center text-base font-black text-white bg-white/10 border border-[#00E5FF] rounded-lg px-1 py-0.5 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => { setRaw(String(value)); setEditing(true); }}
            className="w-12 text-center text-xl font-black text-white hover:text-[#00E5FF] transition-colors cursor-pointer"
            title="Click to type"
          >{value}</button>
        )}
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function TourDetailsClient({ tour, reviews }: Props) {
  const { dict, language } = useLanguage();
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit' | 'arrival'>(
    tour.allowPayAtLocation ? 'arrival' : tour.allowDeposit ? 'deposit' : 'full'
  );

  // Resolve localized translations from parent
  const translations = tour.translations;
  const localizedTitle = translations?.[language]?.title ?? tour.title;
  const localizedDesc = translations?.[language]?.description ?? tour.description;

  const pricePerAdult = tour.adultPrice ?? tour.basePrice;
  const effectiveChildPrice = tour.childPrice ?? null;
  const effectiveInfantPrice = tour.infantPrice ?? null;

  const totalGuests = adultsCount + childrenCount + infantsCount;
  const totalPrice =
    pricePerAdult * adultsCount +
    (effectiveChildPrice ?? pricePerAdult) * childrenCount +
    (effectiveInfantPrice ?? 0) * infantsCount;
  const depositAmount = Math.round(totalPrice * (tour.depositPercentage / 100) * 100) / 100;
  const dueOnArrival = Math.round((totalPrice - depositAmount) * 100) / 100;
  const reserveHref = `/checkout/${tour.id}?adults=${adultsCount}&children=${childrenCount}&infants=${infantsCount}`;

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
                <h2 className="mb-4 text-xl font-black text-white">{dict.tourDetails.highlights}</h2>
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
                  <h3 className="text-lg font-black text-white">{dict.tourDetails.freeCancellation}</h3>
                  <p className="mt-1 text-sm leading-7 text-slate-300">
                    {dict.tourDetails.cancelUpTo}
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD700]">{dict.tourDetails.freeCancellation}</p>
                      <p className="mt-1 text-xs text-slate-400">{dict.tourDetails.upTo24h}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#00E5FF]">{dict.tourDetails.secureCheckout}</p>
                      <p className="mt-1 text-xs text-slate-400">{dict.tourDetails.encryptedPayment}</p>
                    </div>
                    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-400">{dict.tourDetails.premiumSupport}</p>
                      <p className="mt-1 text-xs text-slate-400">{dict.tourDetails.concierge247}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion Sections */}
            <div className="divide-y divide-white/10 border-t border-white/10">
              {/* Inclusions & Exclusions */}
              {(tour.inclusions.length > 0 || tour.exclusions.length > 0) && (
                <Accordion title={dict.tourDetails.whatsIncluded} defaultOpen>
                  <div className="space-y-6">
                    {tour.inclusions.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-bold text-emerald-400">{dict.tourDetails.included}</p>
                        <Checklist items={tour.inclusions} icon="check" />
                      </div>
                    )}
                    {tour.exclusions.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-bold text-red-400">{dict.tourDetails.excluded}</p>
                        <Checklist items={tour.exclusions} icon="x" />
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Itinerary */}
              {itineraryItems.length > 0 && (
                <Accordion title={dict.tourDetails.itinerary} defaultOpen>
                  <ItineraryTimeline itinerary={itineraryItems} />
                </Accordion>
              )}

              {/* What to Bring */}
              {whatToBringItems.length > 0 && (
                <Accordion title={dict.tourDetails.whatToBring}>
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
                <Accordion title={dict.tourDetails.pickupInfo}>
                  <div className="rounded-xl border border-[#00E5FF]/10 bg-[#00E5FF]/5 p-5">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#00E5FF]" />
                      <div>
                        {tour.hotelPickupIncluded && (
                          <p className="mb-2 text-sm font-bold text-emerald-400">{dict.tourDetails.hotelPickupIncluded}</p>
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
                <Accordion title={`${dict.tourDetails.reviews} (${reviews.ratingCount})`} defaultOpen>
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
                            {reviews.ratingCount} {dict.catalog.reviews}
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
                                    {review.customerName || dict.tourDetails.verifiedGuest}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    {dict.tourDetails.verified}
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
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">{dict.tourDetails.from}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">${pricePerAdult.toFixed(0)}</span>
                  <span className="text-sm text-slate-400">{dict.tourDetails.perPerson}</span>
                </div>
              </div>

              {/* Guest Selector */}
              <div className="mb-6">
                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Users className="h-4 w-4 text-[#00E5FF]" />
                  {dict.tourDetails.guests}
                </p>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4">
                  <SidebarStepper
                    label={dict.tourDetails.adults}
                    sublabel={dict.tourDetails.ageAdult}
                    priceLabel={`$${pricePerAdult.toFixed(0)} ${dict.tourDetails.perPerson}`}
                    icon={UserRound}
                    iconBg="bg-[#00E5FF]/10 text-[#00E5FF]"
                    value={adultsCount}
                    onChange={setAdultsCount}
                    min={1}
                  />
                  <SidebarStepper
                    label={dict.tourDetails.children}
                    sublabel={dict.tourDetails.ageChild}
                    priceLabel={
                      effectiveChildPrice
                        ? `$${effectiveChildPrice.toFixed(0)} ${dict.tourDetails.perChild}`
                        : dict.tourDetails.sameAsAdult
                    }
                    icon={Users}
                    iconBg="bg-blue-500/10 text-blue-400"
                    value={childrenCount}
                    onChange={setChildrenCount}
                  />
                  <SidebarStepper
                    label={dict.tourDetails.infants}
                    sublabel={dict.tourDetails.ageInfant}
                    priceLabel={
                      effectiveInfantPrice
                        ? `$${effectiveInfantPrice.toFixed(0)} ${dict.tourDetails.perInfant}`
                        : dict.tourDetails.free
                    }
                    icon={Baby}
                    iconBg="bg-purple-500/10 text-purple-400"
                    value={infantsCount}
                    onChange={setInfantsCount}
                  />
                </div>
              </div>

              {/* Payment Option Selector — Dynamic Action Drawer */}
              <div className="mb-6 space-y-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{dict.tourDetails.paymentMethod}</p>

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
                    <p className={`text-sm font-bold ${selectedPayment === 'full' ? 'text-emerald-300' : 'text-slate-300'}`}>{dict.tourDetails.fullOnlinePayment}</p>
                    <p className="text-xs text-slate-500">{dict.tourDetails.fullOnlineDesc}</p>
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
                        {dict.tourDetails.depositOnline} ({tour.depositPercentage}%)
                      </p>
                      <p className="text-xs text-slate-500">{dict.tourDetails.depositDesc}</p>
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
                      <p className={`text-sm font-bold ${selectedPayment === 'arrival' ? 'text-amber-300' : 'text-slate-300'}`}>{dict.tourDetails.payArrival}</p>
                      <p className="text-xs text-slate-500">{dict.tourDetails.payArrivalDesc}</p>
                    </div>
                    <div className="text-right">
                      {selectedPayment === 'arrival' && <p className="text-sm font-bold text-amber-400">$0</p>}
                    </div>
                  </button>
                )}
              </div>

              {/* Price breakdown */}
              <div className="mb-6 space-y-2 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">${pricePerAdult.toFixed(0)} × {adultsCount} {dict.tourDetails.adults?.toLowerCase()}</span>
                  <span className="font-bold text-white">${(pricePerAdult * adultsCount).toFixed(0)}</span>
                </div>
                {childrenCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">${(effectiveChildPrice ?? pricePerAdult).toFixed(0)} × {childrenCount} {dict.tourDetails.children?.toLowerCase()}</span>
                    <span className="font-bold text-white">${((effectiveChildPrice ?? pricePerAdult) * childrenCount).toFixed(0)}</span>
                  </div>
                )}
                {infantsCount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{effectiveInfantPrice ? `$${effectiveInfantPrice.toFixed(0)} × ${infantsCount} ${dict.tourDetails.infants?.toLowerCase()}` : `${infantsCount} ${dict.tourDetails.infants?.toLowerCase()} · ${dict.tourDetails.free}`}</span>
                    <span className="font-bold text-white">{effectiveInfantPrice ? `$${(effectiveInfantPrice * infantsCount).toFixed(0)}` : '$0'}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-sm">
                  <span className="text-slate-300 font-semibold">{dict.tourDetails.total} · {totalGuests} {dict.tourDetails.guests?.toLowerCase()}</span>
                  <span className="text-lg font-black text-white">${totalPrice.toFixed(0)}</span>
                </div>
                {selectedPayment === 'deposit' && tour.allowDeposit && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">{dict.tourDetails.dueOnArrival}</span>
                    <span className="font-bold text-amber-400">${dueOnArrival.toFixed(0)}</span>
                  </div>
                )}
              </div>

              {/* CTA */}
              <Link href={reserveHref}>
                <Button variant="primary" size="lg" fullWidth>{dict.tourDetails.reserveNow}</Button>
              </Link>

              {/* Trust footer */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                {dict.tourDetails.secureBooking}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0B1528]/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{dict.tourDetails.from}</p>
            <p className="text-2xl font-black text-white">
              ${pricePerAdult.toFixed(0)}
              <span className="ml-1 text-sm font-normal text-slate-400">{dict.tourDetails.perPerson}</span>
            </p>
          </div>
          <Link href={`/checkout/${tour.id}`}>
            <Button variant="primary" size="md">{dict.tourDetails.bookNow}</Button>
          </Link>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </>
  );
}
