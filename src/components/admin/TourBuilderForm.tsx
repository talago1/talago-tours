'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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

export default function TourBuilderForm({ zones }: TourBuilderFormProps) {
  const [state, setState] = useState<TourFormState>(createInitialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [toursCreated, setToursCreated] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const { globalFields, media, marketing, itinerary, logistics, pricing, translations, activeLanguage, isSubmitting } = state;

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

  const errorsArray = errorsToArray(errors);

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
          adultPrice: pricing.adultPrice,
          childEnabled: pricing.childEnabled,
          childPrice: pricing.childEnabled ? pricing.childPrice : undefined,
          childMinAge: pricing.childEnabled ? pricing.childMinAge : undefined,
          childMaxAge: pricing.childEnabled ? pricing.childMaxAge : undefined,
          infantEnabled: pricing.infantEnabled,
          infantPrice: pricing.infantEnabled ? pricing.infantPrice : undefined,
          infantMinAge: pricing.infantEnabled ? pricing.infantMinAge : undefined,
          infantMaxAge: pricing.infantEnabled ? pricing.infantMaxAge : undefined,
          ageRestrictionsNotes: pricing.ageRestrictionsNotes || undefined,
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
    [state, globalFields, media, marketing, itinerary, logistics, pricing, translations]
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
      <section className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary-forest/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Tour Created Successfully</h2>
        <p className="text-gray-600 mb-6">
          {toursCreated} tour(s) created this session
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="px-6 py-3 bg-primary-coral text-white font-semibold rounded-lg hover:bg-primary-coral/90 transition-colors duration-200"
        >
          Create Another Tour
        </button>
      </section>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Tour</h1>

      <GlobalFields
        values={globalFields}
        zones={zones}
        errors={errors}
        onChange={handleGlobalChange}
      />

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

      <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
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

      {submitError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {submitError}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-8 py-3 bg-primary-coral text-white font-semibold rounded-lg transition-all duration-200 ${
            isSubmitting
              ? 'opacity-50 pointer-events-none'
              : 'hover:bg-primary-coral/90'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : (
            'Create Tour'
          )}
        </button>

        {errorsArray.length > 0 && (
          <span className="text-sm text-red-500">
            Please fix the errors above
          </span>
        )}
      </div>
    </form>
  );
}

function errorsToArray(errors: Record<string, string>): string[] {
  return Object.values(errors);
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
