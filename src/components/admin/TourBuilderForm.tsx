'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, ChevronRight, ChevronLeft, Star, Settings, MessageCircle } from 'lucide-react';
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
} from '@/types/tourBuilder';
import { createInitialFormState, LANGUAGE_CODES } from '@/types/tourBuilder';
import { validateTourForm } from '@/utils/tourValidation';
import { validateItinerary } from '@/utils/itineraryValidator';
import LanguageTabs from './LanguageTabs';
import GlobalFields from './GlobalFields';
import LocalizedPanel from './LocalizedPanel';
import MediaSection from './MediaSection';
import HighlightsSection from './HighlightsSection';
import ItineraryBuilder from './ItineraryBuilder';
import LogisticsSection from './LogisticsSection';
import PricingSection from './PricingSection';

interface TourBuilderFormProps {
  zones: { id: string; name: string }[];
}

const STEPS = [
  { num: 0, label: 'Core Experiential Assets', icon: Star },
  { num: 1, label: 'Operational Engine', icon: Settings },
  { num: 2, label: 'Social Proof & Trust Seeding', icon: MessageCircle },
];

export default function TourBuilderForm({ zones }: TourBuilderFormProps) {
  const [state, setState] = useState<TourFormState>(createInitialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toursCreated, setToursCreated] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const { globalFields, media, marketing, itinerary, logistics, pricing, translations, activeLanguage, activeStep, cardExcerpt, showExcerptOnCard, seededReviews, isSubmitting } = state;

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
      setState((prev) => ({ ...prev, marketing: values }));
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

  const handleLogisticsChange = useCallback(
    (values: LogisticsFields) => {
      setState((prev) => ({ ...prev, logistics: values }));
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

  const handleLanguageChange = useCallback((language: LanguageCode) => {
    setState((prev) => ({
      ...prev,
      activeLanguage: language,
    }));
  }, []);

  const handleTranslationChange = useCallback(
    (data: (typeof translations)['en']) => {
      setState((prev) => ({
        ...prev,
        translations: { ...prev.translations, [prev.activeLanguage]: data },
      }));
      markDirty();
    },
    [markDirty]
  );

  const handleStepChange = useCallback((step: number) => {
    setState((prev) => ({ ...prev, activeStep: step }));
  }, []);

  const errorsArray = Object.values(errors);

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
        const payload = {
          slug: globalFields.slug,
          type: globalFields.tourType,
          basePriceUSD: globalFields.basePriceUSD,
          durationHours: globalFields.durationHours,
          maxCapacity: globalFields.maxCapacity,
          zoneId: globalFields.zoneId,
          translations,
          coverImage: media.coverImage || undefined,
          galleryImages: media.galleryImages.filter(Boolean),
          highlights: marketing.highlights.filter(Boolean),
          inclusions: marketing.inclusions.filter(Boolean),
          exclusions: marketing.exclusions.filter(Boolean),
          itinerary: itinerary.length > 0 ? itinerary : undefined,
          whatToBring: logistics.whatToBring || undefined,
          pickupDescription: logistics.pickupDescription || undefined,
          hotelPickupIncluded: logistics.hotelPickupIncluded,
          pickupTime: logistics.pickupTime || undefined,
          cancellationPolicy: logistics.cancellationPolicy || undefined,
          adultPrice: pricing.adultPrice,
          priceAdult: pricing.adultPrice,
          childEnabled: pricing.childEnabled,
          childPrice: pricing.childEnabled ? pricing.childPrice : undefined,
          priceChild: pricing.childEnabled ? pricing.childPrice : undefined,
          childMinAge: pricing.childEnabled ? pricing.childMinAge : undefined,
          childMaxAge: pricing.childEnabled ? pricing.childMaxAge : undefined,
          infantEnabled: pricing.infantEnabled,
          infantPrice: pricing.infantEnabled ? pricing.infantPrice : undefined,
          infantMinAge: pricing.infantEnabled ? pricing.infantMinAge : undefined,
          infantMaxAge: pricing.infantEnabled ? pricing.infantMaxAge : undefined,
          ageRestrictionsNotes: pricing.ageRestrictionsNotes || undefined,
          cardExcerpt: cardExcerpt || undefined,
          showExcerptOnCard,
          displayExcerpt: showExcerptOnCard,
          reviews: seededReviews,
        };

        const res = await fetch('/api/admin/tours/create', {
          method: 'POST',
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
          setSubmitError(err.error || 'Failed to create tour');
          setState((prev) => ({ ...prev, isSubmitting: false }));
          return;
        }

        const data: TourCreateResponse = await res.json();
        setSubmitSuccess(true);
        setToursCreated((prev) => prev + 1);
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
    [state, globalFields, media, marketing, itinerary, logistics, pricing, translations, cardExcerpt, showExcerptOnCard, seededReviews]
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
    return (
      <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <Check className="h-8 w-8 text-emerald-400" />
        </div>
        <h2 className="mb-2 text-xl font-black text-white">Tour Created Successfully</h2>
        <p className="mb-6 text-slate-400">
          {toursCreated} tour(s) created this session
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="rounded-full bg-[#00E5FF] px-8 py-3 text-sm font-black text-[#070F1E] transition-all hover:bg-[#00E5FF]/90"
        >
          Create Another Tour
        </button>
      </section>
    );
  }

  const isLastStep = activeStep === STEPS.length - 1;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mx-auto max-w-5xl">
      {/* Wizard header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white">Create New Tour</h1>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details across each section to create a complete tour experience
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/20">
        <div className="flex">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = activeStep === i;
            const isComplete = i < activeStep;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => handleStepChange(i)}
                className={`relative flex flex-1 items-center justify-center gap-3 px-4 py-5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#00E5FF]/5 text-[#00E5FF]'
                    : isComplete
                      ? 'text-emerald-400 hover:bg-white/[0.02]'
                      : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Step connector line */}
                {i > 0 && (
                  <div
                    className={`absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 ${
                      isComplete ? 'bg-emerald-500/30' : 'bg-white/5'
                    }`}
                  />
                )}

                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                    isActive
                      ? 'bg-[#00E5FF] text-[#070F1E]'
                      : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'border border-white/10 text-slate-500'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <span>{step.num + 1}</span>}
                </div>
                <div className="hidden flex-col items-start sm:flex">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    Step {step.num + 1}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <Icon className="h-3 w-3" />
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
        {/* Step A — Core Experiential Assets */}
        {activeStep === 0 && (
          <>
            <GlobalFields
              values={globalFields}
              zones={zones}
              errors={errors}
              onChange={handleGlobalChange}
            />

            {/* Card Excerpt Section */}
            <section className="mb-6 rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
              <h2 className="mb-4 text-lg font-black text-white">
                Card Excerpt
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-slate-300">
                    Short Description
                  </label>
                  <textarea
                    rows={3}
                    value={cardExcerpt}
                    onChange={(e) => {
                      setState((prev) => ({ ...prev, cardExcerpt: e.target.value }));
                      markDirty();
                    }}
                    placeholder="A brief, enticing summary shown on tour cards — e.g. 'Explore the Red Sea's most vibrant coral gardens...'"
                    className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#00E5FF]"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {cardExcerpt.length}/200 characters
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={showExcerptOnCard}
                      onChange={(e) => {
                        setState((prev) => ({ ...prev, showExcerptOnCard: e.target.checked }));
                        markDirty();
                      }}
                      className="peer sr-only"
                    />
                    <div className="h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#00E5FF] peer-checked:after:translate-x-5 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00E5FF]/30" />
                    <span className="ml-3 text-sm text-slate-300">
                      Display Excerpt on Public Tour Card
                    </span>
                  </label>
                </div>
              </div>
            </section>

            <MediaSection
              values={media}
              errors={errors}
              onChange={handleMediaChange}
            />

            <HighlightsSection
              values={marketing}
              errors={errors}
              onChange={handleMarketingChange}
            />
          </>
        )}

        {/* Step B — Operational Engine */}
        {activeStep === 1 && (
          <>
            <ItineraryBuilder
              milestones={itinerary}
              activeLanguage={activeLanguage}
              errors={errors}
              onChange={handleItineraryChange}
            />

            <LogisticsSection
              values={logistics}
              errors={errors}
              onChange={handleLogisticsChange}
            />

            <PricingSection
              values={pricing}
              errors={errors}
              onChange={handlePricingChange}
            />

            {/* Localized Content */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-800">
                Localized Content
              </h2>

              <LanguageTabs
                activeLanguage={activeLanguage}
                onLanguageChange={handleLanguageChange}
              />

              {LANGUAGE_CODES.map((lang) => (
                <div key={lang} className={lang === activeLanguage ? '' : 'hidden'}>
                  <LocalizedPanel
                    language={lang}
                    data={translations[lang]}
                    isEnglish={lang === 'en'}
                    errors={errors}
                    onChange={handleTranslationChange}
                  />
                </div>
              ))}
            </section>
          </>
        )}

        {/* Step C — Social Proof & Trust Seeding */}
        {activeStep === 2 && (
          <section className="rounded-[2rem] border border-white/10 bg-[#0B1528] p-8 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFD700]/10">
                <MessageCircle className="h-5 w-5 text-[#FFD700]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Social Proof & Trust Seeding</h2>
                <p className="text-xs text-slate-500">
                  Generate seed reviews that are saved directly to the tour reviews JSON field
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
                    rows={5}
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
              Generate Review
            </button>
            {seededReviews.length === 0 && (
              <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-sm text-slate-400">
                Generate one or more trust-seeding reviews before publishing a new tour.
              </div>
            )}
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
                : 'bg-[#00E5FF] hover:bg-[#00E5FF]/90'
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
                Create Tour
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
