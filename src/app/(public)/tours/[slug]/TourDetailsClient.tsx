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
  Sparkles,
  Heart,
  Smartphone,
  Languages,
  Ban,
  AlertTriangle,
  CalendarDays,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { isSupabaseStorageImage } from '@/utils/imageOptimization';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { saveBookingDraft } from '@/utils/bookingDraftStorage';
import { getLocalizedDestinationName, getLocalizedCategoryName } from '@/utils/destinationTranslations';
import { DEFAULT_TOUR_SERVICES } from '@/types/services';
import TourCard from '@/components/public/TourCard';
import dynamic from 'next/dynamic';

const DirectBookingDetailsModal = dynamic(() => import('@/components/tours/DirectBookingDetailsModal'), {
  ssr: false,
});
const AskQuestionModal = dynamic(() => import('@/components/modals/AskQuestionModal'), {
  ssr: false,
});
const WriteReviewModal = dynamic(() => import('@/components/modals/WriteReviewModal'), {
  ssr: false,
});
import type { PublicTour } from '@/types/publicTour';
import { useRouter } from 'next/navigation';

const GUIDE_LANGUAGE_NAMES: Record<string, Record<string, string>> = {
  en: { en: 'English', de: 'German', ru: 'Russian', fr: 'French', it: 'Italian', pl: 'Polish', es: 'Spanish', uk: 'Ukrainian' },
  de: { en: 'Englisch', de: 'Deutsch', ru: 'Russisch', fr: 'Französisch', it: 'Italienisch', pl: 'Polnisch', es: 'Spanisch', uk: 'Ukrainisch' },
  fr: { en: 'Anglais', de: 'Allemand', ru: 'Russe', fr: 'Français', it: 'Italien', pl: 'Polonais', es: 'Espagnol', uk: 'Ukrainien' },
  es: { en: 'Inglés', de: 'Alemán', ru: 'Ruso', fr: 'Francés', it: 'Italiano', pl: 'Polaco', es: 'Español', uk: 'Ucraniano' },
  it: { en: 'Inglese', de: 'Tedesco', ru: 'Russo', fr: 'Francese', it: 'Italiano', pl: 'Polacco', es: 'Spagnolo', uk: 'Ucraino' },
  pl: { en: 'Angielski', de: 'Niemiecki', ru: 'Rosyjski', fr: 'Francuski', it: 'Włoski', pl: 'Polski', es: 'Hiszpański', uk: 'Ukraiński' },
  ru: { en: 'Английский', de: 'Немецкий', ru: 'Русский', fr: 'Французский', it: 'Итальянский', pl: 'Польский', es: 'Испанский', uk: 'Украинский' },
  uk: { en: 'Англійська', de: 'Німецька', ru: 'Російська', fr: 'Французька', it: 'Італійська', pl: 'Польська', es: 'Іспанська', uk: 'Українська' },
};

function formatGuideLanguages(langs: string[] | undefined, currentLang: string): string {
  if (!langs || langs.length === 0) return '';
  const langDict = GUIDE_LANGUAGE_NAMES[currentLang] || GUIDE_LANGUAGE_NAMES.en;
  return langs.map((code) => langDict[code] || code.toUpperCase()).join(', ');
}

interface TourData {
  id: string;
  slug: string;
  title: string;
  description: string;
  basePrice: number;
  duration: string;
  durationHours?: number | null;
  cutoffHours?: number | null;
  maxCapacity: number;
  ratingAverage: number;
  ratingCount: number;
  category: string | null;
  destination: { name: string; slug: string };
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: any[];
  routeStops?: Array<{ id: string; name: string; description?: string; order: number; durationMinutes?: number }>;
  whatToBring: string;
  pickupDescription: string | null;
  pickupTime?: string | null;
  pickupTimes?: string[];
  cancellationPolicy?: string | null;
  freeCancellationHours?: number | null;
  hotelPickupIncluded: boolean | null;
  pickupType?: string | null;
  meetingPointName?: string | null;
  meetingPointAddress?: string | null;
  meetingPointLat?: number | null;
  meetingPointLng?: number | null;
  meetingPointLandmark?: string | null;
  meetingPointInstructions?: string | null;
  meetingPointMapUrl?: string | null;
  meetingPointImageUrl?: string | null;
  images: string[];
  adultPrice: number;
  originalPrice?: number | null;
  childPrice: number | null;
  infantPrice: number | null;
  allowDeposit: boolean;
  depositPercentage: number;
  allowPayAtLocation: boolean;
  allowFullOnline?: boolean;
  translations: Record<string, { title?: string; description?: string }>;
  requirements?: string | null;
  accessibilityNotes?: string | null;
  wheelchairAccessible?: boolean | null;
  strollerAccessible?: boolean | null;
  safetyGuidelines?: string[];
  insuranceIncluded?: boolean | null;
  faqItems?: Array<{ question: string; answer: string }>;
  tourOptions?: Array<{
    id: string;
    title?: string;
    name?: string;
    description?: string;
    price: number;
    priceType?: string;
    enabled?: boolean;
    labels?: Record<string, string>;
    descriptions?: Record<string, string>;
  }>;
  ageRestrictionsNotes?: string | null;
  instantConfirmation?: boolean | null;
  hasGuide?: boolean | null;
  guideLanguages?: string[];
  isNew?: boolean;
  bookingQuestions?: Array<Record<string, unknown>>;
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
  relatedTours?: PublicTour[];
  modules?: {
    wishlist?: boolean;
    showWishlistInNav?: boolean;
    stickyMobileBookingBar?: boolean;
    activityAtAGlance?: boolean;
    facetedFilters?: boolean;
  };
}

function HeroSlider({
  images,
  title,
  destinationName,
  destinationSlug,
  category,
}: {
  images: string[];
  title: string;
  destinationName: string;
  destinationSlug?: string;
  category: string | null;
}) {
  const { dict, language } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

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

  const closeLightbox = useCallback(() => {
    // The autoplay interval is (re)started by the effect above, which reacts to
    // `startInterval`'s identity changing as `lightboxOpen` flips. Calling it
    // directly here would read the stale `lightboxOpen === true` and bail out.
    setLightboxOpen(false);
  }, []);

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
  }, [lightboxOpen, images.length, closeLightbox]);

  const goTo = (i: number) => { setCurrent(i); startInterval(); };
  const goPrev = () => goTo((current - 1 + images.length) % images.length);
  const goNext = () => goTo((current + 1) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) goNext();
    if (distance < -minSwipeDistance) goPrev();
  };

  const onLightboxTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) setLightboxIndex((prev) => (prev + 1) % images.length);
    if (distance < -minSwipeDistance) setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (images.length === 0) return null;

  return (
    <section className="relative overflow-hidden">
      <div
        className="group relative h-[50vh] cursor-pointer md:h-[70vh]"
        onClick={() => openLightbox(current)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {images.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-700 ${
              i === current ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
            }`}
          >
            <Image
              src={img}
              alt={`${title} ${i + 1}`}
              fill
              sizes="100vw"
              priority={i === 0}
              loading={i === 0 ? undefined : 'lazy'}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized={isSupabaseStorageImage(img)}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E] via-[#070F1E]/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070F1E] to-transparent" />

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

        {/* Interactive Taxonomy Tags (Destination + Category) */}
        <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2.5">
          {destinationSlug ? (
            <Link
              href={`/destinations/${destinationSlug}`}
              onClick={(e) => e.stopPropagation()}
              className="group/badge inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/30 bg-[#0B1528]/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#00E5FF] shadow-2xl backdrop-blur-md transition-all hover:bg-[#00E5FF] hover:text-[#070F1E] hover:scale-105"
            >
              <MapPin className="h-3.5 w-3.5 text-[#00E5FF] group-hover/badge:text-[#070F1E] transition-colors" />
              <span>{getLocalizedDestinationName(destinationSlug, language, destinationName)}</span>
            </Link>
          ) : (
            <span className="rounded-full border border-[#00E5FF]/20 bg-[#0B1528]/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#00E5FF] shadow-xl backdrop-blur-md">
              {getLocalizedDestinationName(destinationSlug, language, destinationName)}
            </span>
          )}

          {category && (
            <Link
              href={`/tours?category=${encodeURIComponent(category.toLowerCase())}`}
              onClick={(e) => e.stopPropagation()}
              className="group/badge inline-flex items-center gap-1.5 rounded-full border border-[#FFD700]/30 bg-[#0B1528]/85 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#FFD700] shadow-2xl backdrop-blur-md transition-all hover:bg-[#FFD700] hover:text-[#070F1E] hover:scale-105"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#FFD700] group-hover/badge:text-[#070F1E] transition-colors" />
              <span>{getLocalizedCategoryName(category, language, dict)}</span>
            </Link>
          )}
        </div>
      </div>

      {/* ---------- Fullscreen Lightbox Modal ---------- */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black/95 p-4 backdrop-blur-md animate-fadeIn"
          onClick={closeLightbox}
        >
          {/* Lightbox Header — always above the sticky navbar (z-[200]) */}
          <div className="flex w-full items-center justify-between px-2 py-2 pt-safe" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-bold tracking-widest text-slate-300 truncate max-w-[70vw]">
              {title} &mdash; <span className="text-[#00E5FF]">{lightboxIndex + 1} / {images.length}</span>
            </span>
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close image viewer"
              className="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:bg-red-500 hover:text-white active:scale-95"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Lightbox Main Uncropped Image Container with Touch Swipe */}
          <div
            className="relative flex max-h-[75vh] w-full flex-1 items-center justify-center py-2"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onLightboxTouchEnd}
          >
            <Image
              src={images[lightboxIndex]}
              alt={`${title} full size ${lightboxIndex + 1}`}
              fill
              sizes="95vw"
              className="rounded-lg object-contain shadow-2xl transition-all duration-300"
              unoptimized={isSupabaseStorageImage(images[lightboxIndex])}
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
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill sizes="80px" className="object-cover" unoptimized={isSupabaseStorageImage(img)} />
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
function ItineraryTimeline({ itinerary, language = 'en' }: { itinerary: any[]; language?: string }) {
  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="relative space-y-8 pl-8 before:absolute before:left-[11px] before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-gradient-to-b before:from-[#00E5FF] before:to-[#00473F]">
      {itinerary.map((item: any, i: number) => {
        const time = item.timeTag || item.time || `Step ${i + 1}`;
        
        let title = '';
        if (item.title && typeof item.title === 'object') {
          title = item.title[language] || item.title.en || Object.values(item.title)[0] || '';
        } else if (typeof item.title === 'string') {
          title = item.title;
        }

        let description = '';
        if (item.description && typeof item.description === 'object') {
          description = item.description[language] || item.description.en || Object.values(item.description)[0] || '';
        } else if (typeof item.description === 'string') {
          description = item.description;
        }

        const displayText = description || title || item.activity || '';
        const checklist = Array.isArray(item.checklist) ? item.checklist : [];
        const location = typeof item.location === 'object' ? (item.location[language] || item.location.en || '') : (item.location || '');

        const chips: { label: string; tone: string }[] = [];
        if (item.durationMinutes) chips.push({ label: `${item.durationMinutes} min`, tone: 'border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF]' });
        if (item.freeTimeMinutes) chips.push({ label: `Free time ${item.freeTimeMinutes} min`, tone: 'border-cyan-400/20 bg-cyan-400/5 text-cyan-300' });
        if (item.transport) chips.push({ label: String(item.transport), tone: 'border-slate-400/20 bg-slate-400/5 text-slate-300' });
        if (item.guideIncluded) chips.push({ label: 'Local guide', tone: 'border-emerald-400/20 bg-emerald-400/5 text-emerald-300' });
        if (item.entranceFee) chips.push({ label: `Entrance: ${item.entranceFee}`, tone: 'border-amber-400/20 bg-amber-400/5 text-amber-300' });
        if (item.meal) chips.push({ label: String(item.meal), tone: 'border-orange-400/20 bg-orange-400/5 text-orange-300' });
        if (item.optionalActivity) chips.push({ label: `Optional: ${item.optionalActivity}`, tone: 'border-violet-400/20 bg-violet-400/5 text-violet-300' });
        if (item.included === false) chips.push({ label: 'Not included', tone: 'border-rose-400/20 bg-rose-400/5 text-rose-300' });

        return (
          <div key={i} className="relative">
            <div className="absolute -left-8 top-0 flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-[#00E5FF] bg-[#070F1E]">
              <span className="text-[10px] font-black text-[#00E5FF]">{i + 1}</span>
            </div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-3 py-1">
              <Clock className="h-3 w-3 text-[#00E5FF]" />
              <span className="text-xs font-bold text-[#00E5FF]">{time}</span>
            </div>
            {title && displayText !== title && (
              <h4 className="text-base font-bold text-white mb-1">{title}</h4>
            )}
            {location && (<p className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{location}</p>)}
            <p className="text-sm leading-7 text-slate-300">{displayText}</p>
            {chips.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {chips.map((chip, ci) => (
                  <span
                    key={ci}
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${chip.tone}`}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>
            )}
            {item.notes && (
              <p className="mt-2 text-xs italic text-slate-400">{item.notes}</p>
            )}
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

function RouteStops({ stops, itineraryTitles = [] }: { stops: NonNullable<TourData['routeStops']>; itineraryTitles?: string[] }) {
  if (!stops.length) return null;
  // Deduplicate stops whose name matches an itinerary milestone
  const filteredStops = stops.filter(
    (s) => !itineraryTitles.some((t) => t.toLowerCase().trim() === s.name.toLowerCase().trim())
  );
  if (!filteredStops.length) return null;
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <h3 className="mb-3 text-sm font-bold text-white">Geographical Route Stops</h3>
      <ol className="space-y-3">
        {filteredStops.map((stop, index) => (
          <li key={stop.id} className="flex gap-3 text-sm text-slate-300">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-bold text-cyan-200">{index + 1}</span>
            <div>
              <p className="font-semibold text-white">{stop.name}</p>
              {stop.description && <p className="mt-0.5 leading-6 text-slate-400">{stop.description}</p>}
            </div>
          </li>
        ))}
      </ol>
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

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function InPageBookingSection({
  tour,
  dict,
  language,
  formatPrice,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  adultsCount,
  setAdultsCount,
  childrenCount,
  setChildrenCount,
  infantsCount,
  setInfantsCount,
  selectedAddons,
  toggleAddon,
  onBook,
  onAsk,
  pricePerAdult,
  effectiveChildPrice,
  effectiveInfantPrice,
  totalPrice,
  dateAvailability,
  dateAvailLoading,
  monthAvailability,
  onMonthChange,
  stripStartDay,
  setStripStartDay,
}: {
  tour: TourData;
  dict: any;
  language: string;
  formatPrice: (val: number, opts?: any) => string;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  selectedTime: string;
  setSelectedTime: (t: string) => void;
  adultsCount: number;
  setAdultsCount: (n: number) => void;
  childrenCount: number;
  setChildrenCount: (n: number) => void;
  infantsCount: number;
  setInfantsCount: (n: number) => void;
  selectedAddons: Record<string, boolean>;
  toggleAddon: (id: string) => void;
  onBook: () => void;
  onAsk: () => void;
  pricePerAdult: number;
  effectiveChildPrice: number | null;
  effectiveInfantPrice: number | null;
  totalPrice: number;
  dateAvailability: { status: string; remaining: number; adultPrice?: number } | null;
  dateAvailLoading: boolean;
  monthAvailability: Record<string, { status: string; remaining: number }>;
  onMonthChange: (year: number, month: number) => void;
  stripStartDay: Date;
  setStripStartDay: (d: Date) => void;
}) {
  const cutoffMs = (tour.cutoffHours ?? 12) * 3_600_000;
  const minDateObj = new Date(Date.now() + cutoffMs);
  minDateObj.setHours(0, 0, 0, 0);
  const minDateStr = toLocalDateStr(minDateObj);
  const payingGuests = adultsCount + childrenCount;
  const addonsTotal = (tour.tourOptions || []).reduce((sum, opt) => {
    if (!selectedAddons[opt.id]) return sum;
    return sum + (opt.priceType === 'per_person' ? opt.price * payingGuests : opt.price);
  }, 0);
  const totalGuests = adultsCount + childrenCount + infantsCount;
  const avStatus = dateAvailability?.status;

  // Build 6 rectangular date tiles (5 visible on narrow mobile, 6 on sm+)
  const tiles: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(stripStartDay);
    d.setDate(d.getDate() + i);
    tiles.push(d);
  }

  const canGoBack = toLocalDateStr(stripStartDay) > minDateStr;

  const goBack = () => {
    if (!canGoBack) return;
    const prev = new Date(stripStartDay);
    prev.setDate(prev.getDate() - 5);
    if (prev < minDateObj) {
      setStripStartDay(new Date(minDateObj));
      onMonthChange(minDateObj.getFullYear(), minDateObj.getMonth() + 1);
      return;
    }
    setStripStartDay(prev);
    onMonthChange(prev.getFullYear(), prev.getMonth() + 1);
  };

  const goForward = () => {
    const next = new Date(stripStartDay);
    next.setDate(next.getDate() + 5);
    setStripStartDay(next);
    onMonthChange(next.getFullYear(), next.getMonth() + 1);
    const last = new Date(next);
    last.setDate(last.getDate() + 5);
    onMonthChange(last.getFullYear(), last.getMonth() + 1);
  };

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const [dateError, setDateError] = useState(false);

  const handleBookClick = () => {
    if (!selectedDate) {
      setDateError(true);
      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setDateError(false);
    onBook();
  };

  return (
    <section
      id="booking-section"
      aria-label="Tour Booking"
      className="my-12 scroll-mt-24 rounded-3xl border border-[#00E5FF]/20 bg-gradient-to-b from-[#0D1B35]/95 to-[#081224]/95 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8"
    >
      {/* Section Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00E5FF]">
            {(dict.tourDetails as any)?.bookExperience || 'Book This Experience'}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-white">
            <CalendarDays className="h-6 w-6 text-[#00E5FF]" />
            {(dict.tourDetails as any)?.selectDate || 'Select Date & Guests'}
          </h2>
        </div>
        {pricePerAdult > 0 ? (
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{dict.tourDetails.from}</span>
            <p className="text-2xl font-black text-white">
              {formatPrice(pricePerAdult, { round: true })}
              <span className="ml-1.5 text-xs font-normal text-slate-400">{dict.tourDetails.perPerson}</span>
            </p>
          </div>
        ) : (
          <span className="text-base font-black text-amber-400">Price on request</span>
        )}
      </div>

      {/* A. Horizontal Date Selector (5–6 rectangular tiles + prev/next) */}
      <div className="mb-7">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-200">
            {dict.checkout?.departureDate || 'Choose a Date'}
          </p>
          {selectedDate && (
            <span className="text-xs font-bold text-[#00E5FF]">{selectedDate}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            aria-label="Previous dates"
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] disabled:cursor-not-allowed disabled:opacity-30 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="grid flex-1 grid-cols-5 gap-1.5 sm:grid-cols-6 sm:gap-2">
            {tiles.map((date, i) => {
              const dateStr = toLocalDateStr(date);
              const isPast = dateStr < minDateStr;
              const avData = monthAvailability[dateStr];
              const isUnavailable = !isPast && avData && avData.status !== 'AVAILABLE';
              const isAvailable = !isPast && avData && avData.status === 'AVAILABLE';
              const isSelected = dateStr === selectedDate;
              const showMonth = i === 0 || date.getDate() === 1;

              return (
                <button
                  key={dateStr}
                  type="button"
                  data-date-tile={dateStr}
                  aria-pressed={isSelected}
                  onClick={() => {
                    if (!isPast && !isUnavailable) {
                      setDateError(false);
                      setSelectedDate(dateStr);
                    }
                  }}
                  disabled={isPast || !!isUnavailable}
                  className={`${i === 5 ? 'hidden sm:flex' : 'flex'} min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-3 text-center transition-all ${
                    isSelected
                      ? 'border-[#00E5FF] bg-[#00E5FF]/20 text-[#00E5FF] ring-2 ring-[#00E5FF]/30 shadow-lg shadow-[#00E5FF]/15'
                      : isPast
                      ? 'cursor-not-allowed border-white/5 bg-white/[0.01] text-slate-600 opacity-30'
                      : isUnavailable
                      ? 'cursor-not-allowed border-white/5 bg-white/[0.01] text-slate-500 opacity-40 line-through'
                      : 'cursor-pointer border-white/15 bg-white/[0.04] text-slate-100 hover:border-[#00E5FF]/50 hover:bg-[#00E5FF]/10'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                    {DAY_NAMES[date.getDay()]}
                  </span>
                  <span className="my-0.5 text-lg font-black leading-none sm:text-xl">
                    {date.getDate()}
                  </span>
                  <span className="h-3.5 text-[10px] font-semibold uppercase opacity-70">
                    {showMonth ? MONTH_NAMES[date.getMonth()] : ''}
                  </span>
                  {isAvailable && avData.remaining !== undefined && avData.remaining <= 5 && avData.remaining > 0 && !isSelected && (
                    <span className="mt-0.5 text-[9px] font-bold text-amber-400">{avData.remaining} left</span>
                  )}
                  {isAvailable && !isSelected && (avData.remaining === undefined || avData.remaining > 5) && (
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  )}
                  {isUnavailable && (
                    <span className="mt-0.5 text-[9px] font-bold text-rose-400">Full</span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goForward}
            aria-label="Next dates"
            className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] sm:w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Availability status for selected date */}
        {selectedDate && !dateAvailLoading && dateAvailability && (
          <div
            className={`mt-3 flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold ${
              avStatus === 'AVAILABLE'
                ? dateAvailability.remaining !== null && dateAvailability.remaining <= 5
                  ? 'border border-amber-500/30 bg-amber-900/20 text-amber-300'
                  : 'border border-emerald-500/30 bg-emerald-900/20 text-emerald-300'
                : 'border border-rose-500/30 bg-rose-900/20 text-rose-300'
            }`}
          >
            {avStatus === 'AVAILABLE' ? (
              dateAvailability.remaining !== null && dateAvailability.remaining <= 5 ? (
                <><AlertCircle className="h-3.5 w-3.5 shrink-0" /> Only {dateAvailability.remaining} spot{dateAvailability.remaining === 1 ? '' : 's'} left!</>
              ) : (
                <><CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Available — {dateAvailability.remaining !== null ? `${dateAvailability.remaining} spots` : 'open'}</>
              )
            ) : avStatus === 'SOLD_OUT' ? (
              <><AlertCircle className="h-3.5 w-3.5 shrink-0" /> Fully booked on this date</>
            ) : (
              <><AlertCircle className="h-3.5 w-3.5 shrink-0" /> Not available on this date</>
            )}
          </div>
        )}
        {dateAvailLoading && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00E5FF]" /> Checking availability…
          </div>
        )}
      </div>

      {/* B. Booking Options */}
      {/* B1. Departure Times (only if configured for this tour) */}
      {tour.pickupTimes && tour.pickupTimes.length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
            <Clock className="h-4 w-4 text-[#00E5FF]" />
            {dict.checkout?.pickupTime || 'Departure Time'}
          </p>
          <div className="flex flex-wrap gap-2">
            {tour.pickupTimes.map((timeSlot) => (
              <button
                key={timeSlot}
                type="button"
                onClick={() => setSelectedTime(timeSlot)}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all ${
                  selectedTime === timeSlot
                    ? 'border-[#00E5FF] bg-[#00E5FF]/15 text-[#00E5FF] shadow-sm shadow-[#00E5FF]/20'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#00E5FF]/30 hover:bg-[#00E5FF]/5'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                {timeSlot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* B2. Participants */}
      <div className="mb-6">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
          <Users className="h-4 w-4 text-[#00E5FF]" />
          {dict.tourDetails.guests}
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4">
          <SidebarStepper
            label={dict.tourDetails.adults}
            sublabel={dict.tourDetails.ageAdult}
            priceLabel={`${formatPrice(pricePerAdult, { round: true })} ${dict.tourDetails.perPerson}`}
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
                ? `${formatPrice(effectiveChildPrice, { round: true })} ${dict.tourDetails.perChild}`
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
                ? `${formatPrice(effectiveInfantPrice, { round: true })} ${dict.tourDetails.perInfant}`
                : dict.tourDetails.free
            }
            icon={Baby}
            iconBg="bg-purple-500/10 text-purple-400"
            value={infantsCount}
            onChange={setInfantsCount}
          />
        </div>
      </div>

      {/* B3. Tour-specific Add-ons (only if configured) */}
      {tour.tourOptions && tour.tourOptions.filter((o) => o.enabled !== false).length > 0 && (
        <div className="mb-6">
          <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-200">
            <Sparkles className="h-4 w-4 text-[#FFD700]" />
            Add-ons &amp; Upgrades
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {tour.tourOptions
              .filter((o) => o.enabled !== false)
              .map((opt) => {
                const isSelected = !!selectedAddons[opt.id];
                const label = opt.labels?.[language] || opt.labels?.['en'] || opt.title || opt.name || 'Option';
                const desc = opt.descriptions?.[language] || opt.descriptions?.['en'] || opt.description || '';
                const addonPrice = opt.priceType === 'per_person' ? opt.price * payingGuests : opt.price;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleAddon(opt.id)}
                    className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                      isSelected ? 'border-[#00E5FF]/50 bg-[#00E5FF]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all ${isSelected ? 'border-[#00E5FF] bg-[#00E5FF]' : 'border-white/20 bg-white/5'}`}>
                      {isSelected && <Check className="h-3 w-3 text-[#070F1E]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold ${isSelected ? 'text-[#00E5FF]' : 'text-slate-200'}`}>{label}</p>
                      {desc && <p className="mt-0.5 line-clamp-2 text-xs text-slate-400">{desc}</p>}
                      <p className="mt-1 text-[10px] text-slate-500">
                        {opt.priceType === 'per_person' ? `Per guest × ${payingGuests}` : 'Per booking'}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-bold ${isSelected ? 'text-[#00E5FF]' : 'text-white'}`}>
                      {addonPrice > 0 ? `+${formatPrice(addonPrice, { round: true })}` : 'Included'}
                    </p>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* C. Live Price Calculation */}
      <div className="mb-6 space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">
            {formatPrice(pricePerAdult, { round: true })} × {adultsCount} {dict.tourDetails.adults?.toLowerCase()}
          </span>
          <span className="font-bold text-white">{formatPrice(pricePerAdult * adultsCount, { round: true })}</span>
        </div>
        {childrenCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">
              {formatPrice(effectiveChildPrice ?? pricePerAdult, { round: true })} × {childrenCount} {dict.tourDetails.children?.toLowerCase()}
            </span>
            <span className="font-bold text-white">{formatPrice((effectiveChildPrice ?? pricePerAdult) * childrenCount, { round: true })}</span>
          </div>
        )}
        {infantsCount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">
              {infantsCount} {dict.tourDetails.infants?.toLowerCase()} · {effectiveInfantPrice ? formatPrice(effectiveInfantPrice, { round: true }) : dict.tourDetails.free}
            </span>
            <span className="font-bold text-white">
              {effectiveInfantPrice ? formatPrice(effectiveInfantPrice * infantsCount, { round: true }) : formatPrice(0, { round: true })}
            </span>
          </div>
        )}
        {addonsTotal > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Add-ons</span>
            <span className="font-bold text-white">+{formatPrice(addonsTotal, { round: true })}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-base font-black text-white">
            {dict.tourDetails.total} · {totalGuests} {dict.tourDetails.guests?.toLowerCase()}
          </span>
          <span data-testid="booking-total-price" className="text-2xl font-black text-[#00E5FF]">
            {formatPrice(totalPrice, { round: true })}
          </span>
        </div>
      </div>

      {/* D. Book Button + Separate Ask a Question */}
      {dateError && !selectedDate && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs font-bold text-amber-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Please select an available date above to continue.</span>
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleBookClick}
          disabled={!pricePerAdult || pricePerAdult <= 0}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-4 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/25 transition hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pricePerAdult > 0
            ? dict.tourDetails.bookNow || 'Book Now'
            : 'Pricing Confirmation Required'} <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          onClick={onAsk}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-4 text-xs font-bold text-slate-200 transition hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] sm:w-auto"
        >
          <MessageSquare className="h-4 w-4 text-[#00E5FF]" />
          <span>Ask a Question</span>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
        {dict.tourDetails.secureBooking}
      </div>
    </section>
  );
}

export default function TourDetailsClient({ tour, reviews, relatedTours = [], modules }: Props) {
  const router = useRouter();
  const { dict, language } = useLanguage();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState<'full' | 'deposit' | 'arrival'>(
    tour.allowPayAtLocation ? 'arrival' : (tour.allowFullOnline !== false ? 'full' : 'deposit')
  );
  const [selectedTime, setSelectedTime] = useState<string>(tour.pickupTimes?.[0] || '');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dateAvailability, setDateAvailability] = useState<{
    status: string;
    remaining: number;
    adultPrice?: number;
  } | null>(null);
  const [dateAvailLoading, setDateAvailLoading] = useState(false);
  const [monthAvailability, setMonthAvailability] = useState<Record<string, { status: string; remaining: number }>>({});
  const loadedMonthsRef = useRef<Set<string>>(new Set());
  const [stripStartDay, setStripStartDay] = useState<Date>(() => {
    const cutoffMs = (tour.cutoffHours ?? 12) * 3_600_000;
    const minDate = new Date(Date.now() + cutoffMs);
    minDate.setHours(0, 0, 0, 0);
    return minDate;
  });

  const loadMonthAvailability = useCallback((year: number, month: number) => {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (loadedMonthsRef.current.has(key) || !tour.id) return;
    loadedMonthsRef.current.add(key);
    fetch(`/api/public/tours/${tour.id}/availability?month=${key}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === 'object') {
          setMonthAvailability((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
  }, [tour.id]);

  useEffect(() => {
    const now = new Date();
    loadMonthAvailability(now.getFullYear(), now.getMonth() + 1);
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    loadMonthAvailability(next.getFullYear(), next.getMonth() + 1);
  }, [loadMonthAvailability]);

  useEffect(() => {
    if (!selectedDate || !tour.id) {
      setDateAvailability(null);
      return;
    }
    const [year, month] = selectedDate.split('-');
    setDateAvailLoading(true);
    fetch(`/api/public/tours/${tour.id}/availability?month=${year}-${month}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data[selectedDate]) {
          setDateAvailability(data[selectedDate]);
        } else {
          setDateAvailability(null);
        }
      })
      .catch(() => setDateAvailability(null))
      .finally(() => setDateAvailLoading(false));
  }, [selectedDate, tour.id]);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [resumeData, setResumeData] = useState<{
    leadId: string;
    attemptId: string;
    departureDate?: string | null;
    adultsCount?: number;
    childrenCount?: number;
    leadName?: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [wishAnim, setWishAnim] = useState(false);

  // Resume preliminary request / incomplete attempt if ?resumeLead= or ?attemptId= is in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const resumeLead = params.get('resumeLead');
    const attemptIdParam = params.get('attemptId');
    if (!resumeLead && !attemptIdParam) return;

    const query = resumeLead
      ? `leadId=${encodeURIComponent(resumeLead)}`
      : `attemptId=${encodeURIComponent(attemptIdParam!)}`;

    fetch(`/api/public/bookings/resume?${query}`, { credentials: 'same-origin', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.type === 'lead') {
          if (data.travelDate) setSelectedDate(data.travelDate);
          if (data.adultsCount) setAdultsCount(data.adultsCount);
          if (typeof data.childrenCount === 'number') setChildrenCount(data.childrenCount);
          setResumeData({
            leadId: data.leadId,
            attemptId: data.attemptId,
            departureDate: data.travelDate,
            adultsCount: data.adultsCount,
            childrenCount: data.childrenCount,
            leadName: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhone,
          });
          setBookingModalOpen(true);
        } else if (data && data.type === 'converted' && data.accessToken) {
          window.location.href = `/booking/${data.accessToken}`;
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('talago_funnel_event', {
            detail: {
              event: 'tour_page_viewed',
              tourId: tour.id,
              tourSlug: tour.slug,
              timestamp: Date.now(),
            },
          })
        );
      }
    } catch {}
  }, [tour.id, tour.slug]);
  // Resolve localized translations from parent with fallback cascade
  const translations = tour.translations;
  const langTranslation = (translations?.[language] as any) || {};
  const enTranslation = (translations?.en as any) || {};

  const localizedTitle = langTranslation.title ?? enTranslation.title ?? tour.title;
  const localizedDesc = langTranslation.description ?? enTranslation.description ?? tour.description;
  const localizedCancelPolicy = langTranslation.cancellationPolicies?.[0] ?? enTranslation.cancellationPolicies?.[0] ?? tour.cancellationPolicy ?? dict.tourDetails.cancelUpTo;

  const localizedHighlights: string[] = (() => {
    if (Array.isArray(langTranslation.highlights) && langTranslation.highlights.length > 0) return langTranslation.highlights;
    if (Array.isArray(enTranslation.highlights) && enTranslation.highlights.length > 0) return enTranslation.highlights;
    return Array.isArray(tour.highlights) ? tour.highlights : [];
  })();

  const localizedInclusions: string[] = (() => {
    if (Array.isArray(langTranslation.inclusions) && langTranslation.inclusions.length > 0) return langTranslation.inclusions;
    if (Array.isArray(enTranslation.inclusions) && enTranslation.inclusions.length > 0) return enTranslation.inclusions;
    return Array.isArray(tour.inclusions) ? tour.inclusions : [];
  })();

  const localizedExclusions: string[] = (() => {
    if (Array.isArray(langTranslation.exclusions) && langTranslation.exclusions.length > 0) return langTranslation.exclusions;
    if (Array.isArray(enTranslation.exclusions) && enTranslation.exclusions.length > 0) return enTranslation.exclusions;
    return Array.isArray(tour.exclusions) ? tour.exclusions : [];
  })();

  const guideLangs: string[] = (() => {
    if (Array.isArray(tour.guideLanguages) && tour.guideLanguages.length > 0) return tour.guideLanguages;
    if (Array.isArray((langTranslation as any).guideLanguages) && (langTranslation as any).guideLanguages.length > 0) return (langTranslation as any).guideLanguages;
    if (Array.isArray((enTranslation as any).guideLanguages) && (enTranslation as any).guideLanguages.length > 0) return (enTranslation as any).guideLanguages;
    return [];
  })();

  const hasGuide: boolean = Boolean(
    tour.hasGuide ??
    (langTranslation as any).hasGuide ??
    (enTranslation as any).hasGuide ??
    (guideLangs.length > 0)
  );

  const localizedKeyActivityDetails: Array<{ id: string; title: string; value: string; description?: string; icon?: string }> = (() => {
    let rawList: Array<{ id: string; title: string; value: string; description?: string; icon?: string }> = [];
    if (Array.isArray(langTranslation.keyActivityDetails) && langTranslation.keyActivityDetails.length > 0) {
      rawList = langTranslation.keyActivityDetails;
    } else if (Array.isArray(enTranslation.keyActivityDetails) && enTranslation.keyActivityDetails.length > 0) {
      rawList = enTranslation.keyActivityDetails;
    } else if (Array.isArray((tour as any).keyActivityDetails) && (tour as any).keyActivityDetails.length > 0) {
      rawList = (tour as any).keyActivityDetails;
    }

    if (rawList.length > 0) {
      return rawList
        .filter((item) => {
          const idLower = (item.id || '').toLowerCase();
          const titleLower = (item.title || '').toLowerCase();
          if (idLower === 'duration' || titleLower === 'duration') return false;
          const isGuideItem = idLower === 'guide' || titleLower.includes('guide');
          if (isGuideItem && !hasGuide) return false;
          return true;
        })
        .map((item) => {
          const idLower = (item.id || '').toLowerCase();
          const titleLower = (item.title || '').toLowerCase();
          const isGuideItem = idLower === 'guide' || titleLower.includes('guide');
          if (isGuideItem && guideLangs.length > 0) {
            return {
              ...item,
              description: formatGuideLanguages(guideLangs, language),
            };
          }
          return item;
        });
    }
    return [];
  })();

  const assignedServicesIds: string[] = (() => {
    if (Array.isArray(langTranslation.assignedServices) && langTranslation.assignedServices.length > 0) return langTranslation.assignedServices;
    if (Array.isArray(enTranslation.assignedServices) && enTranslation.assignedServices.length > 0) return enTranslation.assignedServices;
    if (Array.isArray((tour as any).assignedServices) && (tour as any).assignedServices.length > 0) return (tour as any).assignedServices;
    return [];
  })();

  const localizedWhatToBringItems: string[] = (() => {
    const raw = langTranslation.whatToBring || enTranslation.whatToBring || tour.whatToBring;
    if (Array.isArray(raw) && raw.length > 0) return raw.map(String).map((s) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    if (typeof raw === 'string' && raw) {
      return raw.split(/[\r\n,]+/).map((s: string) => s.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);
    }
    return [];
  })();

  const localizedItineraryItems: any[] = (() => {
    if (Array.isArray(langTranslation.itinerary) && langTranslation.itinerary.length > 0) return langTranslation.itinerary;
    if (Array.isArray(enTranslation.itinerary) && enTranslation.itinerary.length > 0) return enTranslation.itinerary;
    return Array.isArray(tour.itinerary) ? tour.itinerary : [];
  })();

  const localizedPickupDescription = langTranslation.pickupDescription || enTranslation.pickupDescription || tour.pickupDescription;

  const localizedRequirements = (langTranslation as any).requirements || (enTranslation as any).requirements || tour.requirements || null;
  const localizedAccessibilityNotes = (langTranslation as any).accessibilityNotes || (enTranslation as any).accessibilityNotes || tour.accessibilityNotes || null;
  const localizedSafetyGuidelines = (Array.isArray((langTranslation as any).safetyGuidelines) && (langTranslation as any).safetyGuidelines.length > 0)
    ? (langTranslation as any).safetyGuidelines
    : (Array.isArray((enTranslation as any).safetyGuidelines) && (enTranslation as any).safetyGuidelines.length > 0)
    ? (enTranslation as any).safetyGuidelines
    : (Array.isArray(tour.safetyGuidelines) && tour.safetyGuidelines.length > 0)
    ? tour.safetyGuidelines
    : [];
  const localizedFaqItems = (Array.isArray((langTranslation as any).faqItems) && (langTranslation as any).faqItems.length > 0)
    ? (langTranslation as any).faqItems
    : (Array.isArray((enTranslation as any).faqItems) && (enTranslation as any).faqItems.length > 0)
    ? (enTranslation as any).faqItems
    : (Array.isArray(tour.faqItems) && tour.faqItems.length > 0)
    ? tour.faqItems
    : [];

  const rawLangImportantInfo = (langTranslation as any)?.importantInfo;
  const rawEnImportantInfo = (enTranslation as any)?.importantInfo;
  const localizedImportantInfo: string =
    typeof rawLangImportantInfo === 'string' && rawLangImportantInfo.trim().length > 0
      ? rawLangImportantInfo.trim()
      : typeof rawEnImportantInfo === 'string' && rawEnImportantInfo.trim().length > 0
      ? rawEnImportantInfo.trim()
      : '';

  const pricePerAdult = tour.adultPrice ?? tour.basePrice;
  const effectiveChildPrice = tour.childPrice ?? null;
  const effectiveInfantPrice = tour.infantPrice ?? null;

  const { formatPrice } = useCurrency();

  const [selectedAddons, setSelectedAddons] = useState<Record<string, boolean>>({});

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (typeof window !== 'undefined') {
        const activeIds = Object.keys(next).filter((k) => next[k]);
        sessionStorage.setItem('talago_selected_addons', JSON.stringify(activeIds));
      }
      return next;
    });
  };

  const totalGuests = adultsCount + childrenCount + infantsCount;
  const payingGuests = adultsCount + childrenCount;
  const baseToursPrice =
    pricePerAdult * adultsCount +
    (effectiveChildPrice ?? pricePerAdult) * childrenCount +
    (effectiveInfantPrice ?? 0) * infantsCount;

  const addonsTotal = (tour.tourOptions || []).reduce((sum, opt) => {
    if (!selectedAddons[opt.id]) return sum;
    return sum + (opt.priceType === 'per_person' ? opt.price * payingGuests : opt.price);
  }, 0);

  const totalPrice = baseToursPrice + addonsTotal;
  const depositAmount = Math.round(totalPrice * (tour.depositPercentage / 100) * 100) / 100;
  const dueOnArrival = Math.round((totalPrice - depositAmount) * 100) / 100;

  const selectedAddonIds = Object.keys(selectedAddons).filter((k) => selectedAddons[k]);
  const addonsQuery = selectedAddonIds.length > 0 ? `&addons=${encodeURIComponent(selectedAddonIds.join(','))}` : '';
  const dateQuery = selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : '';
  const reserveHref = `/checkout/${tour.id}?adults=${adultsCount}&children=${childrenCount}&infants=${infantsCount}${selectedTime ? `&time=${encodeURIComponent(selectedTime)}` : ''}${dateQuery}${addonsQuery}`;

  // Open the booking modal immediately after persisting the user's current draft selections.
  // The ContinuousBookingModal handles the booking-interest hold on mount.
  const startReservation = useCallback((_source: string = 'BOOK_BUTTON') => {
    saveBookingDraft(tour.id, {
      departureDate: selectedDate || undefined,
      selectedTime: selectedTime || undefined,
      adultsCount,
      childrenCount,
      infantsCount,
      selectedAddons,
    });
    setBookingModalOpen(true);
  }, [tour.id, selectedDate, selectedTime, adultsCount, childrenCount, infantsCount, selectedAddons]);

  const cancelHours = tour.freeCancellationHours ?? 24;
  const cancelHoursText = cancelHours > 0
    ? ((dict.tourDetails as any)?.cancelUpToHours || 'Up to {{n}} hours before start').replace('{{n}}', String(cancelHours))
    : ((dict.tourDetails as any)?.nonRefundable || 'Non-refundable');
  const whatToBringItems = localizedWhatToBringItems;
  const itineraryItems = localizedItineraryItems;

  return (
    <>
      {/* Hero Slider */}
      <HeroSlider
        images={tour.images}
        title={localizedTitle}
        destinationName={tour.destination.name}
        destinationSlug={tour.destination.slug}
        category={tour.category}
      />

      {/* Main Content Grid (Content + Single Sticky Side Availability Card) */}
      <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-10">
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-10 lg:-mt-28 lg:grid-cols-[1fr_340px]">
          {/* ----- LEFT: Main Content ----- */}
          <div className="min-w-0">
            {/* Title & Meta */}
            <div className="mb-8">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                {tour.ratingCount > 0 ? (
                  <>
                    <div className="flex items-center gap-1.5">
                      <StarRating rating={tour.ratingAverage} />
                      <span className="text-sm font-semibold text-slate-300">
                        {tour.ratingAverage.toFixed(1)} ({tour.ratingCount} {dict.catalog.reviews})
                      </span>
                    </div>
                    <span className="text-slate-600">·</span>
                  </>
                ) : tour.isNew ? (
                  <>
                    <div className="flex items-center gap-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{(dict.catalog as any)?.newExperience || 'New Experience'}</span>
                    </div>
                    <span className="text-slate-600">·</span>
                  </>
                ) : null}
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
              {/* ── Wishlist Save Button ── */}
              {modules?.wishlist !== false && (
                <button
                  type="button"
                  onClick={() => {
                    toggleWishlist({
                      id: tour.id,
                      slug: tour.slug,
                      title: localizedTitle,
                      coverImage: tour.images?.[0] || '',
                      priceUSD: tour.adultPrice ?? tour.basePrice,
                      ratingAverage: tour.ratingAverage,
                      ratingCount: tour.ratingCount,
                      duration: tour.duration,
                      durationHours: null,
                      destinationName: tour.destination.name,
                      category: tour.category,
                      addedAt: Date.now(),
                    });
                    setWishAnim(true);
                    setTimeout(() => setWishAnim(false), 400);
                  }}
                  className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-all duration-200 ${
                    isWishlisted(tour.id)
                      ? 'border-rose-500/60 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
                      : 'border-white/15 bg-white/[0.04] text-slate-300 hover:border-rose-400/40 hover:text-rose-300'
                  } ${wishAnim ? 'scale-110' : 'scale-100'}`}
                >
                  <Heart
                    className={`h-4 w-4 transition-all ${
                      isWishlisted(tour.id) ? 'fill-rose-400 text-rose-400' : ''
                    }`}
                  />
                  {isWishlisted(tour.id) ? 'Saved to Wishlist' : 'Save Experience'}
                </button>
              )}
            </div>

            {/* ── Tier-1 OTA: Activity At-a-Glance Matrix (GetYourGuide / Viator Standard) ── */}
            {modules?.activityAtAGlance !== false && (
              <div className="mb-10 rounded-3xl border border-white/10 bg-[#0B1528]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.22em] text-[#00E5FF] flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {(dict.tourDetails as any)?.keyActivityDetails || 'Key Activity Details'}
                  </h3>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-400">
                    {(dict.tourDetails as any)?.instantOverview || 'Instant Overview'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {localizedKeyActivityDetails.length > 0 ? (
                    localizedKeyActivityDetails.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-[#00E5FF]/30 hover:bg-white/[0.04]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{item.title}</h4>
                          <p className="mt-0.5 text-xs font-bold text-white">{item.value}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      {/* 1. Free Cancellation */}
                      <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-emerald-500/30 hover:bg-white/[0.04]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {(dict.tourDetails as any)?.cancellation || 'Cancellation'}
                          </h4>
                          <p className={`mt-0.5 text-xs font-bold ${cancelHours > 0 ? 'text-emerald-400' : 'text-slate-300'}`}>
                            {cancelHours > 0 ? ((dict.tourDetails as any)?.freeCancellation || 'Free cancellation') : ((dict.tourDetails as any)?.nonRefundable || 'Non-refundable')}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{cancelHoursText}</p>
                        </div>
                      </div>

                      {/* 2. Confirmation status */}
                      <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-[#00E5FF]/30 hover:bg-white/[0.04]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {(dict.tourDetails as any)?.confirmation || 'Confirmation'}
                          </h4>
                          <p className="mt-0.5 text-xs font-bold text-white">
                            {tour.instantConfirmation !== false
                              ? ((dict.tourDetails as any)?.instantConfirmation || 'Instant confirmation')
                              : ((dict.tourDetails as any)?.bookingOnRequest || 'Booking on request')}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tour.instantConfirmation !== false
                              ? ((dict.tourDetails as any)?.instantDigitalDelivery || 'Instant digital ticket delivery')
                              : ((dict.tourDetails as any)?.teamWillConfirm || 'Our team will confirm within 24h')}
                          </p>
                        </div>
                      </div>

                      {/* 3. Mobile Voucher */}
                      <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-violet-500/30 hover:bg-white/[0.04]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {(dict.tourDetails as any)?.voucherTicket || 'Voucher / Ticket'}
                          </h4>
                          <p className="mt-0.5 text-xs font-bold text-white">
                            {(dict.tourDetails as any)?.mobileTicketAccepted || 'Mobile ticket accepted'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {(dict.tourDetails as any)?.showOnSmartphone || 'Show on smartphone / no print'}
                          </p>
                        </div>
                      </div>

                      {/* 4. Live Guide (ONLY if hasGuide) */}
                      {hasGuide && (
                        <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-sky-500/30 hover:bg-white/[0.04]">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                            <Languages className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              {(dict.tourDetails as any)?.liveTourGuide || 'Live Tour Guide'}
                            </h4>
                            <p className="mt-0.5 text-xs font-bold text-white">
                              {(dict.tourDetails as any)?.guideSpoken || 'Live Guide Included'}
                            </p>
                            {guideLangs.length > 0 && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {formatGuideLanguages(guideLangs, language)}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 5. Pickup Service */}
                      <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-[#00E5FF]/30 hover:bg-white/[0.04]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF]">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {(dict.tourDetails as any)?.pickupService || 'Pickup Service'}
                          </h4>
                          <p className="mt-0.5 text-xs font-bold text-white">
                            {tour.hotelPickupIncluded
                              ? ((dict.tourDetails as any)?.hotelPickupIncluded || 'Hotel pickup included')
                              : (tour.meetingPointName ? ((dict.tourDetails as any)?.meetingPointCheckin || 'Meeting point check-in') : ((dict.tourDetails as any)?.pickupOptional || 'Pickup optional / included'))}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {tour.hotelPickupIncluded
                              ? ((dict.tourDetails as any)?.roundtripHotelTransport || 'Roundtrip hotel transport')
                              : ((dict.tourDetails as any)?.convenientMeetingPoint || 'Convenient designated point')}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Tier-1 OTA: Verified Services & On-Trip Support ── */}
            {assignedServicesIds.length > 0 && (
              <div className="mb-10 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0B1528] to-[#0A2035]/80 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-[0.22em] text-emerald-400 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    {(dict.tourDetails as any)?.servicesOnTrip || 'Services & On-Trip Support'}
                  </h3>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                    {(dict.tourDetails as any)?.talagoVerified || 'TALAGO Verified Inclusions'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  {assignedServicesIds.map((svcId) => {
                    const def = DEFAULT_TOUR_SERVICES.find((s) => s.id === svcId);
                    const name = def?.translations?.[language]?.name || def?.name || svcId;
                    const desc = def?.translations?.[language]?.description || def?.description || '';
                    const badge = def?.translations?.[language]?.badgeText || def?.badgeText;

                    return (
                      <div
                        key={svcId}
                        className="flex items-start gap-3.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-emerald-500/30 hover:bg-white/[0.04]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white">{name}</h4>
                            {badge && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                                {badge}
                              </span>
                            )}
                          </div>
                          {desc && <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{desc}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Highlights */}
            {localizedHighlights.length > 0 && (
              <div className="mb-10">
                <h2 className="mb-4 text-xl font-black text-white">{dict.tourDetails.highlights}</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {localizedHighlights.map((h, i) => (
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

            {/* Tour Add-ons / Upgrades (Phase 10) */}
            {tour.tourOptions && tour.tourOptions.length > 0 && (
              <div className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#00E5FF]" />
                    Available Add-ons & Upgrades
                  </h2>
                  <span className="text-xs text-slate-400">Selectable during checkout</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {tour.tourOptions.map((addon) => {
                    const optTitle = addon.labels?.[language] || addon.labels?.['en'] || addon.title || addon.name || 'Optional Upgrade';
                    const optDesc = addon.descriptions?.[language] || addon.descriptions?.['en'] || addon.description;
                    const priceBadge = addon.price > 0 ? `+$${addon.price}` : 'Included';
                    const typeLabel = addon.priceType === 'per_booking' || addon.priceType === 'flat' ? 'Per booking' : 'Per guest';
                    const statusLabel = addon.price > 0 ? 'Optional Upgrade' : 'Standard Option';

                    return (
                      <div
                        key={addon.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col justify-between hover:border-[#00E5FF]/30 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-bold text-white">{optTitle}</h4>
                            <span className="rounded-full bg-[#00E5FF]/10 px-2.5 py-0.5 text-xs font-black text-[#00E5FF]">
                              {priceBadge}
                            </span>
                          </div>
                          {optDesc && (
                            <p className="mt-2 text-xs text-slate-400 leading-relaxed">{optDesc}</p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-2">
                          <span>{typeLabel}</span>
                          <span className="text-[#00E5FF] font-semibold">{statusLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Accordion Sections */}
            <div className="divide-y divide-white/10 border-t border-white/10">
              {/* Inclusions & Exclusions */}
              {(localizedInclusions.length > 0 || localizedExclusions.length > 0) && (
                <Accordion title={dict.tourDetails.whatsIncluded} defaultOpen>
                  <div className="space-y-6">
                    {localizedInclusions.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-bold text-emerald-400">{dict.tourDetails.included}</p>
                        <Checklist items={localizedInclusions} icon="check" />
                      </div>
                    )}
                    {localizedExclusions.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm font-bold text-red-400">{dict.tourDetails.excluded}</p>
                        <Checklist items={localizedExclusions} icon="x" />
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Itinerary & Geographical Route */}
              {(localizedItineraryItems.length > 0 || (tour.routeStops && tour.routeStops.length > 0)) && (
                <Accordion title={dict.tourDetails.itinerary || 'Itinerary'} defaultOpen>
                  {localizedItineraryItems.length > 0 && (
                    <ItineraryTimeline itinerary={localizedItineraryItems} language={language} />
                  )}
                  <RouteStops
                    stops={tour.routeStops || []}
                    itineraryTitles={localizedItineraryItems.map((item) => {
                      if (item.title && typeof item.title === 'object') {
                        return item.title[language] || item.title.en || Object.values(item.title)[0] || '';
                      }
                      return typeof item.title === 'string' ? item.title : '';
                    })}
                  />
                </Accordion>
              )}

              {/* ── Know Before You Go (Tour-Driven Content) ── */}
              {(localizedWhatToBringItems.length > 0 || Boolean(localizedImportantInfo)) && (
              <Accordion
                title={
                  localizedWhatToBringItems.length > 0 && !localizedImportantInfo
                    ? (dict.tourDetails.whatToBring || 'What to Bring')
                    : dict.tourDetails.whatToBring
                    ? `Know Before You Go (${dict.tourDetails.whatToBring})`
                    : 'Know Before You Go'
                }
                defaultOpen
              >
                <div className="space-y-6">
                  {/* Subsection 1: What to Bring */}
                  {localizedWhatToBringItems.length > 0 && (
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#FFD700]/15 text-[#FFD700]">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">{dict.tourDetails.whatToBring || 'What to bring'}</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {localizedWhatToBringItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
                          <Check className="h-4 w-4 shrink-0 text-[#FFD700]" />
                          <span className="text-xs text-slate-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Subsection 2: Custom Traveler Advisory (ONLY rendered if text entered by admin) */}
                  {localizedImportantInfo ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                        <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
                          <p className="font-bold text-amber-300">Important Traveler Guidelines</p>
                          <p className="whitespace-pre-line text-slate-200">{localizedImportantInfo}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Accordion>
              )}

              {/* Pickup & Meeting Point Info */}
              {(localizedPickupDescription || tour.hotelPickupIncluded || tour.meetingPointName || tour.pickupType) && (
                <Accordion title={dict.tourDetails.pickupInfo || 'Pickup & Meeting Point'}>
                  <div className="space-y-4">
                    {/* Hotel Pickup Included Badge */}
                    {tour.hotelPickupIncluded && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
                        <Check className="h-4 w-4" />
                        <span>{dict.tourDetails.hotelPickupIncluded}</span>
                      </div>
                    )}

                    {/* Meeting Point Details */}
                    {tour.meetingPointName && (
                      <div className="rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-5 space-y-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 shrink-0 text-[#00E5FF] mt-0.5" />
                          <div className="flex-1">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#00E5FF]">
                              Designated Meeting Point
                            </span>
                            <h4 className="text-base font-bold text-white mt-0.5">{tour.meetingPointName}</h4>
                            {tour.meetingPointAddress && (
                              <p className="text-xs text-slate-300 mt-1">{tour.meetingPointAddress}</p>
                            )}
                            {tour.meetingPointLandmark && (
                              <p className="text-xs text-amber-300/90 mt-1 flex items-center gap-1 font-medium">
                                <span>📍 Landmark:</span>
                                <span>{tour.meetingPointLandmark}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {tour.meetingPointInstructions && (
                          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300 leading-relaxed">
                            <strong className="text-white block mb-0.5">Directions:</strong>
                            {tour.meetingPointInstructions}
                          </div>
                        )}

                        {tour.meetingPointMapUrl && (
                          <a
                            href={tour.meetingPointMapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:underline"
                          >
                            View location on Google Maps ↗
                          </a>
                        )}
                      </div>
                    )}

                    {/* General Logistics / Pickup Description */}
                    {localizedPickupDescription && (
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-start gap-3">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                        <p className="text-sm leading-7 text-slate-300">{localizedPickupDescription}</p>
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Requirements & Fitness (Phase 10) */}
              {(localizedRequirements || tour.ageRestrictionsNotes) && (
                <Accordion title="Requirements & What to Expect">
                  <div className="space-y-4">
                    {localizedRequirements && (
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">Participant Guidelines</p>
                        <p className="text-sm leading-7 text-slate-300 whitespace-pre-line">{localizedRequirements}</p>
                      </div>
                    )}
                    {tour.ageRestrictionsNotes && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold uppercase text-amber-400">Age & Health Notice</p>
                          <p className="text-xs text-slate-300 mt-1">{tour.ageRestrictionsNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Accessibility & Accommodations (Phase 10) */}
              {(localizedAccessibilityNotes || tour.wheelchairAccessible !== null || tour.strollerAccessible !== null) && (
                <Accordion title="Accessibility & Special Accommodations">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className={`rounded-xl border p-4 flex items-center gap-3 ${tour.wheelchairAccessible ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-slate-400'}`}>
                        {tour.wheelchairAccessible ? <Check className="h-5 w-5 text-emerald-400 shrink-0" /> : <X className="h-5 w-5 text-slate-500 shrink-0" />}
                        <div>
                          <p className="text-sm font-bold text-white">Wheelchair Accessible</p>
                          <p className="text-xs text-slate-400">{tour.wheelchairAccessible ? 'Accessible routes and vehicles supported' : 'Not recommended for wheelchairs'}</p>
                        </div>
                      </div>
                      <div className={`rounded-xl border p-4 flex items-center gap-3 ${tour.strollerAccessible ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-white/5 bg-white/[0.02] text-slate-400'}`}>
                        {tour.strollerAccessible ? <Check className="h-5 w-5 text-emerald-400 shrink-0" /> : <X className="h-5 w-5 text-slate-500 shrink-0" />}
                        <div>
                          <p className="text-sm font-bold text-white">Stroller / Pram Accessible</p>
                          <p className="text-xs text-slate-400">{tour.strollerAccessible ? 'Stroller-friendly tour surfaces' : 'Not suitable for strollers'}</p>
                        </div>
                      </div>
                    </div>
                    {localizedAccessibilityNotes && (
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-slate-300 leading-relaxed">
                        {localizedAccessibilityNotes}
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Safety Guidelines & Insurance (Phase 10) */}
              {(localizedSafetyGuidelines.length > 0 || tour.insuranceIncluded === true) && (
                <Accordion title="Safety Guidelines & Insurance">
                  <div className="space-y-4">
                    {tour.insuranceIncluded === true && (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-400">
                        <ShieldCheck className="h-4 w-4" />
                        <span>Comprehensive Passenger & Activity Insurance Included</span>
                      </div>
                    )}
                    {localizedSafetyGuidelines.length > 0 && (
                      <div className="space-y-2">
                        {localizedSafetyGuidelines.map((guideline: string, i: number) => (
                          <div key={i} className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs text-slate-300">
                            <Check className="h-4 w-4 text-[#00E5FF] shrink-0 mt-0.5" />
                            <span>{guideline}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

            </div>

            {/* ── In-Page Booking Section (Natural mid-page position after tour details & inclusions) ── */}
            <InPageBookingSection
              tour={tour}
              dict={dict}
              language={language}
              formatPrice={formatPrice}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              adultsCount={adultsCount}
              setAdultsCount={setAdultsCount}
              childrenCount={childrenCount}
              setChildrenCount={setChildrenCount}
              infantsCount={infantsCount}
              setInfantsCount={setInfantsCount}
              selectedAddons={selectedAddons}
              toggleAddon={toggleAddon}
              onBook={() => void startReservation('IN_PAGE_BOOKING_SECTION')}
              onAsk={() => setQuestionModalOpen(true)}
              pricePerAdult={pricePerAdult}
              effectiveChildPrice={effectiveChildPrice}
              effectiveInfantPrice={effectiveInfantPrice}
              totalPrice={totalPrice}
              dateAvailability={dateAvailability}
              dateAvailLoading={dateAvailLoading}
              monthAvailability={monthAvailability}
              onMonthChange={loadMonthAvailability}
              stripStartDay={stripStartDay}
              setStripStartDay={setStripStartDay}
            />

            <div className="divide-y divide-white/10 border-t border-white/10">
              {/* Cancellation & Refund Policy */}
              <Accordion title={dict.tourDetails.freeCancellation ? `${dict.tourDetails.freeCancellation} & Policy` : 'Cancellation & Refund Policy'} defaultOpen>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#FFD700]/25 bg-gradient-to-br from-[#FFD700]/10 via-[#070F1E] to-transparent p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFD700]/15 text-[#FFD700]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white">{dict.tourDetails.freeCancellation}</h4>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">{localizedCancelPolicy}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/5">
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase text-[#FFD700]">{dict.tourDetails.freeCancellation}</p>
                        <p className="mt-0.5 text-xs text-slate-300">{cancelHoursText}</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase text-[#00E5FF]">{dict.tourDetails.secureCheckout}</p>
                        <p className="mt-0.5 text-xs text-slate-300">{dict.tourDetails.encryptedPayment}</p>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
                        <p className="text-[10px] font-black uppercase text-emerald-400">{dict.tourDetails.premiumSupport}</p>
                        <p className="mt-0.5 text-xs text-slate-300">{dict.tourDetails.concierge247}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Accordion>

              {/* FAQ (Phase 10) */}
              {localizedFaqItems.length > 0 && (
                <Accordion title="Frequently Asked Questions">
                  <div className="space-y-3">
                    {localizedFaqItems.map((item: any, i: number) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                        <p className="text-sm font-bold text-white mb-1.5 flex items-center gap-2">
                          <span className="text-[#00E5FF] font-black">Q:</span>
                          {item.question}
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed pl-5">
                          {item.answer}
                        </p>
                      </div>
                    ))}
                  </div>
                </Accordion>
              )}

              {/* Verified Reviews */}
              <Accordion title={`${dict.tourDetails.reviews} (${reviews.reviews.length})`} defaultOpen>
                <div className="space-y-6">
                  {/* Reviews Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
                    <div>
                      <p className="text-sm font-bold text-white">Verified Guest Experiences</p>
                      <p className="text-xs text-slate-400">Authentic reviews from confirmed bookings</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReviewModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-2 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 hover:scale-[1.02]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Write a Review
                    </button>
                  </div>

                  {reviews.reviews.length === 0 && (
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center">
                      <p className="text-sm text-slate-300">No verified reviews published yet for this experience.</p>
                      <p className="mt-1 text-xs text-slate-500">Were you on this tour? Be the first to share your experience!</p>
                      <button
                        type="button"
                        onClick={() => setReviewModalOpen(true)}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-xs font-black uppercase text-[#070F1E] transition-all hover:scale-105"
                      >
                        Write the First Review
                      </button>
                    </div>
                  )}

                  {reviews.reviews.length > 0 && (
                    <>
                      {/* Rating Summary */}
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                        <div className="text-center">
                          <span className="text-5xl font-black text-white">{reviews.ratingAverage.toFixed(1)}</span>
                          <div className="mt-2 flex justify-center">
                            <StarRating rating={reviews.ratingAverage} size="md" />
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {reviews.reviews.length} {dict.catalog.reviews}
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
                  </>
                )}
              </div>
            </Accordion>
          </div>
        </div>

          {/* ----- RIGHT: Single Sputnik8-style Sticky Side Card (Desktop, One Button Only) ----- */}
          <aside className="hidden lg:block">
            <div
              data-testid="side-availability-card"
              className="lg:sticky lg:top-28 rounded-3xl border border-white/10 bg-gradient-to-b from-[#0D1B35]/95 to-[#081224]/95 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <div className="mb-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {dict.tourDetails.from}
                </p>
                {pricePerAdult > 0 ? (
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-black text-white">
                      {formatPrice(pricePerAdult, { round: true })}
                    </span>
                    {tour.originalPrice && tour.originalPrice > pricePerAdult && (
                      <span className="text-sm font-bold text-slate-500 line-through">
                        {formatPrice(tour.originalPrice, { round: true })}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{dict.tourDetails.perPerson}</span>
                  </div>
                ) : (
                  <span className="mt-1 block text-xl font-black text-amber-400">Price on request</span>
                )}
              </div>

              {tour.ratingCount > 0 && (
                <div className="mb-5 flex items-center gap-2 text-xs text-slate-300">
                  <StarRating rating={tour.ratingAverage} />
                  <span className="font-bold text-white">{tour.ratingAverage.toFixed(1)}</span>
                  <span className="text-slate-500">({tour.ratingCount})</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/25 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <CalendarDays className="h-4 w-4" />
                <span>{(dict.tourDetails as any)?.checkAvailability || 'Check Availability'}</span>
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>{dict.tourDetails.secureBooking}</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Tours Section (Phase 10) */}
        {relatedTours && relatedTours.length > 0 && (
          <section className="mt-16 border-t border-white/10 pt-12">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00E5FF]">{(dict.tourDetails as any)?.discoverMore || 'Discover More'}</p>
                <h2 className="text-2xl font-black text-white sm:text-3xl mt-1">{(dict.tourDetails as any)?.youMayAlsoLike || 'You May Also Like'}</h2>
              </div>
              <Link href="/tours" className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1">
                {(dict.tourDetails as any)?.viewAllTours || 'View All Tours'} <span>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedTours.map((rTour) => (
                <TourCard key={rTour.id} tour={rTour as any} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar (One Button: Check Availability -> scrolls to #booking-section) */}
      <div
        data-testid="mobile-availability-bar"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0B1528]/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-2xl shadow-2xl shadow-black lg:hidden"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#00E5FF]">
              {dict.tourDetails.from}
            </span>
            {pricePerAdult > 0 ? (
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-white">
                  {formatPrice(pricePerAdult, { round: true })}
                </span>
                <span className="text-[11px] text-slate-400">{dict.tourDetails.perPerson}</span>
              </div>
            ) : (
              <span className="text-sm font-black text-amber-400">Price on request</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/25 transition active:scale-95"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{(dict.tourDetails as any)?.checkAvailability || 'Check Availability'}</span>
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" />

      {/* Direct Single-Form Customer Details Modal (replaces old multi-step wizard) */}
      <DirectBookingDetailsModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        tour={{
          id: tour.id,
          slug: tour.slug,
          title: localizedTitle,
          coverImage: tour.images?.[0] || null,
          adultPrice: pricePerAdult,
          childPrice: tour.childPrice,
          infantPrice: tour.infantPrice,
          depositPercentage: tour.depositPercentage,
          allowPayAtLocation: tour.allowPayAtLocation,
          allowFullOnline: tour.allowFullOnline,
          allowDeposit: tour.allowDeposit,
          pickupType: tour.pickupType,
          hotelPickupIncluded: tour.hotelPickupIncluded ?? false,
          meetingPointName: tour.meetingPointName,
          addons: tour.tourOptions,
          bookingQuestions: (tour as any).bookingQuestions,
        }}
        departureDate={selectedDate}
        selectedTime={selectedTime}
        adultsCount={adultsCount}
        childrenCount={childrenCount}
        infantsCount={infantsCount}
        selectedAddons={selectedAddons}
        initialResumeData={resumeData}
      />

      <AskQuestionModal
        tourId={tour.id}
        tourSlug={tour.slug}
        tourTitle={localizedTitle}
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        initialDate={selectedDate}
      />

      {/* Write a Review Modal */}
      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        tourId={tour.id}
        tourTitle={localizedTitle}
      />
    </>
  );
}
