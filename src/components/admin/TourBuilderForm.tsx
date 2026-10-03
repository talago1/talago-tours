'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, ChevronRight, ChevronLeft, Star, Settings, MessageCircle, Layers, Globe } from 'lucide-react';
import type { LanguageCode, ItineraryMilestone } from '@/types/itinerary';
import type {
  TourFormState,
  ValidationError,
  TourCreateResponse,
  ApiError,
  MediaFields,
  MarketingFields,
  LogisticsFields,
  PricingFields,
  TourAddon,
} from '@/types/tourBuilder';
import { createInitialFormState, createEmptyTranslations, LANGUAGE_CODES, LANGUAGE_LABELS } from '@/types/tourBuilder';
import { validateTourForm } from '@/utils/tourValidation';
import { validateItinerary } from '@/utils/itineraryValidator';
import GlobalFields from './GlobalFields';
import MediaSection from './MediaSection';
import HighlightsSection from './HighlightsSection';
import ItineraryBuilder from './ItineraryBuilder';
import PricingSection from './PricingSection';
import TourAddonsBuilder from './TourAddonsBuilder';

export interface InitialTourData {
  id: string;
  slug: string;
  type: 'SHARED' | 'PRIVATE';
  basePriceUSD: number;
  durationHours: number;
  maxCapacity: number;
  zoneId: string;
  status?: string | null;
  category?: string | null;
  translations: Record<string, { title: string; description: string; cancellationPolicies: string[] }>;
  coverImage: string;
  galleryImages: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  itinerary: Record<string, unknown>[];
  whatToBring: string;
  pickupDescription: string;
  hotelPickupIncluded: boolean;
  pickupTime: string;
  cancellationPolicy: string;
  adultPrice: number;
  originalPrice?: number | null;
  childPrice: number;
  childMinAge: number;
  childMaxAge: number;
  infantPrice: number;
  infantMinAge: number;
  infantMaxAge: number;
  ageRestrictionsNotes: string;
  cardExcerpt: string;
  showExcerptOnCard: boolean;
  tourOptions: Record<string, unknown>[];
  allowDeposit: boolean;
  depositPercentage: number;
  allowPayAtLocation: boolean;
}

interface TourBuilderFormProps {
  zones: { id: string; name: string }[];
  initialData?: InitialTourData;
}

function buildInitialState(d?: InitialTourData): TourFormState {
  if (!d) return createInitialFormState();
  const langs = ['en', 'de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'] as const;
  const translations: TourFormState['translations'] = createEmptyTranslations();
  for (const lang of langs) {
    const t = (d.translations && typeof d.translations === 'object') ? (d.translations[lang] as unknown as Record<string, unknown> | undefined) : undefined;
    if (t) {
      translations[lang] = {
        title: (t.title as string) || '',
        description: (t.description as string) || '',
        cardExcerpt: (t.cardExcerpt as string) || (lang === 'en' ? d.cardExcerpt : ''),
        highlights: Array.isArray(t.highlights) && t.highlights.length > 0 ? (t.highlights as string[]) : (lang === 'en' ? d.highlights : []),
        inclusions: Array.isArray(t.inclusions) && t.inclusions.length > 0 ? (t.inclusions as string[]) : (lang === 'en' ? d.inclusions : []),
        exclusions: Array.isArray(t.exclusions) && t.exclusions.length > 0 ? (t.exclusions as string[]) : (lang === 'en' ? d.exclusions : []),
        whatToBring: (t.whatToBring as string) || (lang === 'en' ? d.whatToBring : ''),
        pickupDescription: (t.pickupDescription as string) || (lang === 'en' ? d.pickupDescription : ''),
        cancellationPolicy: (t.cancellationPolicy as string) || (lang === 'en' ? d.cancellationPolicy : ''),
        cancellationPolicies: Array.isArray(t.cancellationPolicies) ? (t.cancellationPolicies as string[]) : [],
      };
    } else if (lang === 'en') {
      translations.en = {
        title: '',
        description: '',
        cardExcerpt: d.cardExcerpt || '',
        highlights: d.highlights || [],
        inclusions: d.inclusions || [],
        exclusions: d.exclusions || [],
        whatToBring: d.whatToBring || '',
        pickupDescription: d.pickupDescription || '',
        cancellationPolicy: d.cancellationPolicy || '',
        cancellationPolicies: [],
      };
    }
  }
  const childEnabled = d.childPrice > 0;
  const infantEnabled = d.infantPrice > 0;
  return {
    globalFields: { slug: d.slug, durationHours: d.durationHours, maxCapacity: d.maxCapacity, tourType: d.type, zoneId: d.zoneId, basePriceUSD: d.basePriceUSD },
    media: { coverImage: d.coverImage, galleryImages: d.galleryImages },
    marketing: {
      highlights: (translations.en.highlights && translations.en.highlights.length > 0) ? translations.en.highlights : d.highlights,
      inclusions: (translations.en.inclusions && translations.en.inclusions.length > 0) ? translations.en.inclusions : d.inclusions,
      exclusions: (translations.en.exclusions && translations.en.exclusions.length > 0) ? translations.en.exclusions : d.exclusions,
    },
    itinerary: (d.itinerary as unknown as import('@/types/itinerary').ItineraryMilestone[]) || [],
    logistics: { whatToBring: d.whatToBring, pickupDescription: d.pickupDescription, hotelPickupIncluded: d.hotelPickupIncluded, pickupTime: d.pickupTime, pickupTimes: [], cancellationPolicy: d.cancellationPolicy },
    pricing: { adultPrice: d.adultPrice, originalPrice: d.originalPrice || 0, childEnabled, childPrice: d.childPrice, childMinAge: d.childMinAge, childMaxAge: d.childMaxAge, infantEnabled, infantPrice: d.infantPrice, infantMinAge: d.infantMinAge, infantMaxAge: d.infantMaxAge, ageRestrictionsNotes: d.ageRestrictionsNotes },
    addons: (d.tourOptions as unknown as import('@/types/tourBuilder').TourAddon[]) || [],
    translations,
    activeLanguage: 'en',
    activeStep: 0,
    cardExcerpt: d.cardExcerpt,
    showExcerptOnCard: d.showExcerptOnCard,
    seededReviews: [],
    isSubmitting: false,
    isDirty: false,
    editingTourId: d.id,
  };
}

const STEPS = [
  { num: 0, label: 'Overview & Media', icon: Star },
  { num: 1, label: 'Options & Upgrades', icon: Layers },
  { num: 2, label: 'Highlights & Program', icon: Settings },
  { num: 3, label: 'Pricing & Capacity', icon: Star },
  { num: 4, label: 'Reviews & Launch', icon: MessageCircle },
];

const LANG_FLAGS: Record<LanguageCode, string> = {
  en: '🇬🇧', de: '🇩🇪', ru: '🇷🇺', fr: '🇫🇷', it: '🇮🇹', pl: '🇵🇱', es: '🇪🇸', uk: '🇺🇦',
};

const LANG_NAMES: Record<LanguageCode, string> = {
  en: 'English', de: 'German', ru: 'Russian', fr: 'French', it: 'Italian', pl: 'Polish', es: 'Spanish', uk: 'Ukrainian',
};

export default function TourBuilderForm({ zones, initialData }: TourBuilderFormProps) {
  const [state, setState] = useState<TourFormState>(() => buildInitialState(initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toursCreated, setToursCreated] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const { globalFields, media, marketing, itinerary, logistics, pricing, addons, translations, activeLanguage, activeStep, cardExcerpt, showExcerptOnCard, seededReviews, isSubmitting } = state;

  const errorsArray = Object.values(errors);

  const markDirty = useCallback(() => {
    setState((prev) => (prev.isDirty ? prev : { ...prev, isDirty: true }));
  }, []);

  const handleGlobalChange = useCallback(
    (values: typeof globalFields) => {
      setState((prev) => ({ ...prev, globalFields: values }));
      markDirty();
    },
    [markDirty]
  );

  const handleMediaChange = useCallback(
    (values: MediaFields) => {
      setState((prev) => ({ ...prev, media: values }));
      markDirty();
    },
    [markDirty]
  );

  const handleMarketingChange = useCallback(
    (values: MarketingFields) => {
      setState((prev) => ({
        ...prev,
        marketing: values,
        translations: {
          ...prev.translations,
          [prev.activeLanguage]: {
            ...prev.translations[prev.activeLanguage],
            highlights: values.highlights,
            inclusions: values.inclusions,
            exclusions: values.exclusions,
          },
        },
      }));
      markDirty();
    },
    [markDirty]
  );

  const handleItineraryChange = useCallback(
    (items: ItineraryMilestone[]) => {
      setState((prev) => ({ ...prev, itinerary: items }));
      markDirty();
    },
    [markDirty]
  );

  const handlePricingChange = useCallback(
    (values: PricingFields) => {
      setState((prev) => ({ ...prev, pricing: values }));
      markDirty();
    },
    [markDirty]
  );

  const handleAddonsChange = useCallback(
    (values: TourAddon[]) => {
      setState((prev) => ({ ...prev, addons: values }));
      markDirty();
    },
    [markDirty]
  );

  const handleLanguageChange = useCallback((language: LanguageCode) => {
    setState((prev) => ({
      ...prev,
      activeLanguage: language,
    }));
  }, []);

  const handleStepChange = useCallback((step: number) => {
    setState((prev) => ({ ...prev, activeStep: step }));
  }, []);

  const goNext = useCallback(() => {
    if (activeStep < STEPS.length - 1) {
      setState((prev) => ({ ...prev, activeStep: prev.activeStep + 1 }));
    }
  }, [activeStep]);

  const goPrev = useCallback(() => {
    if (activeStep > 0) {
      setState((prev) => ({ ...prev, activeStep: prev.activeStep - 1 }));
    }
  }, [activeStep]);

  // Helpers for current language entry
  const currentTranslation = translations[activeLanguage] || {
    title: '',
    description: '',
    cardExcerpt: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    whatToBring: '',
    pickupDescription: '',
    cancellationPolicy: '',
    cancellationPolicies: [],
  };

  const updateCurrentTranslation = (partial: Partial<typeof currentTranslation>) => {
    setState((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeLanguage]: {
          ...prev.translations[activeLanguage],
          ...partial,
        },
      },
    }));
    markDirty();
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const validationErrors = validateTourForm(state);
      const itineraryErrors = itinerary.length > 0 ? validateItinerary(itinerary) : {};
      const itineraryErrorsArray: ValidationError[] = Object.entries(itineraryErrors).map(
        ([field, message]) => ({ field, message })
      );
      const allErrors = [...validationErrors, ...itineraryErrorsArray];
      if (allErrors.length > 0) {
        setErrors(arrayToErrors(allErrors));
        return;
      }
      setErrors({});
      setSubmitError(null);

      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const isEditing = Boolean(state.editingTourId);

        const enHighlights = (translations.en?.highlights && translations.en.highlights.length > 0)
          ? translations.en.highlights.filter(Boolean)
          : marketing.highlights.filter(Boolean);
        const enInclusions = (translations.en?.inclusions && translations.en.inclusions.length > 0)
          ? translations.en.inclusions.filter(Boolean)
          : marketing.inclusions.filter(Boolean);
        const enExclusions = (translations.en?.exclusions && translations.en.exclusions.length > 0)
          ? translations.en.exclusions.filter(Boolean)
          : marketing.exclusions.filter(Boolean);

        const finalTranslations = { ...translations };
        finalTranslations.en = {
          ...finalTranslations.en,
          cardExcerpt: finalTranslations.en?.cardExcerpt || cardExcerpt || '',
          highlights: enHighlights,
          inclusions: enInclusions,
          exclusions: enExclusions,
          whatToBring: finalTranslations.en?.whatToBring || logistics.whatToBring || '',
          pickupDescription: finalTranslations.en?.pickupDescription || logistics.pickupDescription || '',
          cancellationPolicy: finalTranslations.en?.cancellationPolicy || logistics.cancellationPolicy || '',
        };

        const payload = {
          slug: globalFields.slug,
          type: globalFields.tourType,
          basePriceUSD: globalFields.basePriceUSD,
          durationHours: globalFields.durationHours,
          maxCapacity: globalFields.maxCapacity,
          zoneId: globalFields.zoneId,
          translations: finalTranslations,
          coverImage: media.coverImage || undefined,
          galleryImages: media.galleryImages.filter(Boolean),
          highlights: enHighlights,
          inclusions: enInclusions,
          exclusions: enExclusions,
          itinerary: itinerary.length > 0 ? itinerary : undefined,
          whatToBring: finalTranslations.en.whatToBring || undefined,
          pickupDescription: finalTranslations.en.pickupDescription || undefined,
          hotelPickupIncluded: logistics.hotelPickupIncluded,
          pickupTime: logistics.pickupTime || undefined,
          cancellationPolicy: finalTranslations.en.cancellationPolicy || undefined,
          adultPrice: pricing.adultPrice,
          originalPrice: pricing.originalPrice && pricing.originalPrice > 0 ? pricing.originalPrice : undefined,
          childEnabled: pricing.childEnabled,
          childPrice: pricing.childEnabled ? pricing.childPrice : undefined,
          childMinAge: pricing.childEnabled ? pricing.childMinAge : undefined,
          childMaxAge: pricing.childEnabled ? pricing.childMaxAge : undefined,
          infantEnabled: pricing.infantEnabled,
          infantPrice: pricing.infantEnabled ? pricing.infantPrice : undefined,
          infantMinAge: pricing.infantEnabled ? pricing.infantMinAge : undefined,
          infantMaxAge: pricing.infantEnabled ? pricing.infantMaxAge : undefined,
          ageRestrictionsNotes: pricing.ageRestrictionsNotes || undefined,
          cardExcerpt: finalTranslations.en.cardExcerpt || cardExcerpt || undefined,
          showExcerptOnCard,
          displayExcerpt: showExcerptOnCard,
          reviews: seededReviews,
          tourOptions: addons.length > 0 ? addons : [],
          status: 'ACTIVE',
        };

        const url = isEditing
          ? `/api/admin/tours/${state.editingTourId}`
          : '/api/admin/tours/create';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.status === 409) {
          const err: ApiError = await res.json();
          setErrors(err.field ? { [err.field]: err.error } : {});
          setSubmitError(err.error);
          setState((prev) => ({ ...prev, isSubmitting: false }));
          return;
        }

        if (!res.ok) {
          const err: ApiError = await res.json();
          if (err.field) {
            setErrors({ [err.field]: err.error });
          }
          setSubmitError(err.error || (isEditing ? 'Failed to update tour' : 'Failed to create tour'));
          setState((prev) => ({ ...prev, isSubmitting: false }));
          return;
        }

        setSubmitSuccess(true);
        setToursCreated((prev) => prev + (isEditing ? 0 : 1));
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          isDirty: false,
        }));
      } catch {
        setSubmitError('Network error. Please try again.');
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [state, globalFields, media, marketing, itinerary, logistics, pricing, addons, translations, cardExcerpt, showExcerptOnCard, seededReviews]
  );

  const resetForm = useCallback(() => {
    setState(createInitialFormState);
    setErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty && !submitSuccess) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty, submitSuccess]);

  if (submitSuccess) {
    const isEditing = Boolean(state.editingTourId);
    return (
      <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="mb-2 text-xl font-black text-white">
          {isEditing ? 'Tour Updated Successfully' : 'Tour Created Successfully'}
        </h2>
        <p className="mb-6 text-slate-400">
          {isEditing ? 'Your changes have been saved.' : `${toursCreated} tour(s) created this session`}
        </p>
        {isEditing ? (
          <a
            href="/admin/tours"
            className="inline-block rounded-full bg-[#00E5FF] px-8 py-3 text-sm font-black text-[#070F1E] transition-all hover:bg-[#00E5FF]/90"
          >
            Back to Tours
          </a>
        ) : (
          <button
            type="button"
            onClick={resetForm}
            className="rounded-full bg-[#00E5FF] px-8 py-3 text-sm font-black text-[#070F1E] transition-all hover:bg-[#00E5FF]/90"
          >
            Create Another Tour
          </button>
        )}
      </section>
    );
  }

  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-5xl">
      {/* Title Bar */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">
          {state.editingTourId ? 'Edit Tour Experience' : 'Create New Tour Experience'}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {state.editingTourId
            ? 'Update tour details across all 7 languages — changes are saved when you click Save Changes.'
            : 'Fill in the details across each section. You can switch languages at any time using the global bar.'}
        </p>
      </div>

      {/* Global Multilingual Switcher (Always visible across all steps) */}
      <div className="sticky top-4 z-20 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0B1528]/95 p-3.5 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#00E5FF]" />
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-white">
              Active Language: <span className="text-[#00E5FF]">{LANG_FLAGS[activeLanguage]} {LANG_NAMES[activeLanguage]} ({activeLanguage.toUpperCase()})</span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {LANGUAGE_CODES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageChange(lang)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeLanguage === lang
                  ? 'bg-[#00E5FF] text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 scale-105'
                  : 'border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <span>{LANG_FLAGS[lang]}</span>
              <span>{LANGUAGE_LABELS[lang]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step Navigation Bar */}
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/20">
        <div className="flex flex-wrap sm:flex-nowrap">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = activeStep === i;
            const isComplete = i < activeStep;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => handleStepChange(i)}
                className={`relative flex flex-1 items-center justify-center gap-2.5 px-3 py-4 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    : isComplete
                      ? 'text-emerald-400 hover:bg-white/[0.02]'
                      : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black transition-all ${
                    isActive
                      ? 'bg-[#00E5FF] text-[#070F1E]'
                      : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'border border-white/10 text-slate-500'
                  }`}
                >
                  {isComplete ? <Check className="h-3.5 w-3.5" /> : <span>{step.num + 1}</span>}
                </div>
                <div className="hidden flex-col items-start lg:flex">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">
                    Step {step.num + 1}
                  </span>
                  <span className="text-xs font-bold whitespace-nowrap">
                    {step.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active step content */}
      <div className="space-y-6">
        {/* Step 0 — Overview & Media */}
        {activeStep === 0 && (
          <>
            <GlobalFields
              values={globalFields}
              zones={zones}
              errors={errors}
              onChange={handleGlobalChange}
            />

            {/* Localized Title, Excerpt & Description for Active Language */}
            <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-[#00E5FF]" />
                  Tour Content &amp; Copy ({LANG_FLAGS[activeLanguage]} {activeLanguage.toUpperCase()})
                </h2>
                <span className="text-xs text-slate-400">
                  Fill for {LANG_NAMES[activeLanguage]}
                </span>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Tour Title ({activeLanguage.toUpperCase()}) {activeLanguage === 'en' && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={currentTranslation.title || ''}
                  onChange={(e) => updateCurrentTranslation({ title: e.target.value })}
                  placeholder={`Tour title in ${LANG_NAMES[activeLanguage]}`}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Card Short Excerpt ({activeLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={currentTranslation.cardExcerpt || ''}
                  onChange={(e) => updateCurrentTranslation({ cardExcerpt: e.target.value })}
                  placeholder={`Short summary for catalog cards in ${LANG_NAMES[activeLanguage]}`}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Full Detailed Description ({activeLanguage.toUpperCase()}) {activeLanguage === 'en' && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  rows={5}
                  value={currentTranslation.description || ''}
                  onChange={(e) => updateCurrentTranslation({ description: e.target.value })}
                  placeholder={`Comprehensive itinerary overview and storytelling in ${LANG_NAMES[activeLanguage]}`}
                  className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                />
              </div>
            </section>

            <MediaSection
              values={media}
              errors={errors}
              onChange={handleMediaChange}
            />
          </>
        )}

        {/* Step 1 — Options & Upgrades */}
        {activeStep === 1 && (
          <TourAddonsBuilder
            addons={addons}
            activeLanguage={activeLanguage}
            onChange={handleAddonsChange}
          />
        )}

        {/* Step 2 — Highlights, Inclusions & Program */}
        {activeStep === 2 && (
          <>
            <HighlightsSection
              values={{
                highlights: currentTranslation.highlights || [],
                inclusions: currentTranslation.inclusions || [],
                exclusions: currentTranslation.exclusions || [],
              }}
              languageLabel={`${LANG_FLAGS[activeLanguage]} ${activeLanguage.toUpperCase()}`}
              errors={errors}
              onChange={(m) => {
                updateCurrentTranslation({
                  highlights: m.highlights,
                  inclusions: m.inclusions,
                  exclusions: m.exclusions,
                });
                if (activeLanguage === 'en') {
                  handleMarketingChange(m);
                }
              }}
            />

            <ItineraryBuilder
              milestones={itinerary}
              activeLanguage={activeLanguage}
              errors={errors}
              onChange={handleItineraryChange}
            />

            {/* Logistics for Active Language */}
            <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20 space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/5 pb-3">
                <Settings className="h-5 w-5 text-[#00E5FF]" />
                Logistics &amp; Directives ({LANG_FLAGS[activeLanguage]} {activeLanguage.toUpperCase()})
              </h2>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  What to Bring ({activeLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={currentTranslation.whatToBring || ''}
                  onChange={(e) => updateCurrentTranslation({ whatToBring: e.target.value })}
                  placeholder={`e.g. Passport, sunglasses, comfortable shoes (${activeLanguage.toUpperCase()})`}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pickup &amp; Transfer Directives ({activeLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={currentTranslation.pickupDescription || ''}
                  onChange={(e) => updateCurrentTranslation({ pickupDescription: e.target.value })}
                  placeholder={`e.g. Hotel pickup 30 minutes before departure (${activeLanguage.toUpperCase()})`}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Cancellation Policy Note ({activeLanguage.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={currentTranslation.cancellationPolicy || ''}
                  onChange={(e) => updateCurrentTranslation({ cancellationPolicy: e.target.value })}
                  placeholder={`e.g. 100% free cancellation up to 24 hours prior (${activeLanguage.toUpperCase()})`}
                  className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#00E5FF] placeholder:text-slate-600"
                />
              </div>
            </section>
          </>
        )}

        {/* Step 3 — Pricing & Capacity */}
        {activeStep === 3 && (
          <PricingSection
            values={pricing}
            errors={errors}
            onChange={handlePricingChange}
          />
        )}

        {/* Step 4 — Social Proof & Launch */}
        {activeStep === 4 && (
          <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                <MessageCircle className="h-5 w-5 text-[#FFD700]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Social Proof &amp; Verified Reviews</h2>
                <p className="text-xs text-slate-500">
                  Seed verified reviews for social trust before publishing this tour experience.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {seededReviews.map((review, index) => (
                <div key={index} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <input
                    value={review.customerName}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        seededReviews: prev.seededReviews.map((item, i) =>
                          i === index ? { ...item, customerName: e.target.value } : item,
                        ),
                      }))
                    }
                    className="mb-3 w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                  <select
                    value={review.rating}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        seededReviews: prev.seededReviews.map((item, i) =>
                          i === index ? { ...item, rating: Number(e.target.value) } : item,
                        ),
                      }))
                    }
                    className="mb-3 w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} Stars</option>
                    ))}
                  </select>
                  <textarea
                    value={review.comment}
                    rows={4}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        seededReviews: prev.seededReviews.map((item, i) =>
                          i === index ? { ...item, comment: e.target.value } : item,
                        ),
                      }))
                    }
                    className="w-full resize-y rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setState((prev) => ({
                  ...prev,
                  seededReviews: [
                    ...prev.seededReviews,
                    {
                      customerName: 'Verified Guest',
                      rating: 5,
                      comment: 'A seamless Talago experience from pickup to the final view. The team made every detail feel considered.',
                    },
                  ],
                }));
                markDirty();
              }}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-5 py-3 text-sm font-black text-[#FFD700] transition hover:bg-[#FFD700]/15"
            >
              <Star className="h-4 w-4" />
              + Add Seed Review
            </button>
          </section>
        )}
      </div>

      {/* Error messages */}
      {submitError && (
        <div className="mb-4 mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {errorsArray.length > 0 && (
        <div className="mb-4 mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          Please fix the errors above before submitting.
        </div>
      )}

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={activeStep === 0}
          className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all ${
            activeStep === 0
              ? 'pointer-events-none text-slate-600'
              : 'border border-white/10 text-slate-300 hover:bg-white/[0.04]'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous Step
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            Step {activeStep + 1} of {STEPS.length}
          </span>
        </div>

        {isLastStep ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-black text-[#070F1E] transition-all ${
              isSubmitting
                ? 'pointer-events-none bg-[#00E5FF]/50'
                : 'bg-[#00E5FF] hover:bg-[#00E5FF]/90 shadow-lg shadow-[#00E5FF]/20'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                {state.editingTourId ? 'Save Changes' : 'Create Tour'}
                <Check className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex items-center gap-2 rounded-full bg-[#00E5FF] px-8 py-3 text-sm font-black text-[#070F1E] transition-all hover:bg-[#00E5FF]/90"
          >
            Next Step
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </form>
  );
}

function arrayToErrors(errors: ValidationError[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const err of errors) {
    const key = err.field;
    if (!record[key]) {
      record[key] = err.message;
    }
  }
  return record;
}
