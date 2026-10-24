'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Rocket,
  Globe,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Layers,
  MapPin,
  Image as ImageIcon,
  DollarSign,
  Users,
  Calendar,
  Clock,
  Car,
  Compass,
  ListOrdered,
  Plus,
  Trash2,
  Eye,
  ShieldAlert,
  HelpCircle,
  Search,
  Check,
  Building,
  Info,
  Sliders,
  FileText,
  BadgeAlert,
  Languages,
  Loader2,
  Download,
} from 'lucide-react';

import type {
  TourEditorData,
  TourEditorSectionId,
  LanguageCode,
  LocalizedTourContent,
  RoutePoint,
  BookingQuestion,
  TourAddon,
  ItineraryMilestone,
  TourVariant,
} from '@/types/tourEditor';
import {
  ALL_LANGUAGES,
  TOUR_EDITOR_SECTIONS,
  createDefaultTourEditorData,
  createDefaultLocalizedContent,
  calculateTourCompleteness
} from '@/types/tourEditor';
import { createEmptyMilestone } from '@/types/itinerary';
import { TOUR_TEMPLATES, applyTemplateToTourData } from '@/lib/tourTemplates';

// Sub-builders
import ItineraryBuilder from './ItineraryBuilder';
import TourAddonsBuilder from './TourAddonsBuilder';
import BookingQuestionsBuilder from './BookingQuestionsBuilder';
import MediaOrganizer from './MediaOrganizer';
import dynamic from 'next/dynamic';
const MediaLibraryModalLazy = dynamic(() => import('./MediaLibraryModal'), { ssr: false });

interface ZoneOption {
  id: string;
  name: string;
}

interface DestinationOption {
  id: string;
  name: string;
}

interface UnifiedTourEditorProps {
  zones: ZoneOption[];
  destinations?: DestinationOption[];
  initialData?: Partial<TourEditorData>;
}

export default function UnifiedTourEditor({ zones, destinations = [], initialData }: UnifiedTourEditorProps) {
  const router = useRouter();

  // Primary Editor State
  const [data, setData] = useState<TourEditorData>(() => {
    const base = createDefaultTourEditorData();
    if (!initialData) return base;

    // Merge incoming initialData onto default canonical structure
    return {
      ...base,
      ...initialData,
      translations: {
        ...base.translations,
        ...(initialData.translations || {}),
      },
      highlights: initialData.highlights || [],
      inclusions: initialData.inclusions || [],
      exclusions: initialData.exclusions || [],
      itinerary: initialData.itinerary || [],
      addons: initialData.addons || [],
      bookingQuestions: initialData.bookingQuestions || [],
      pickupTimes: initialData.pickupTimes || [],
    };
  });

  const [activeSection, setActiveSection] = useState<TourEditorSectionId>('basic-info');
  const [quickMode, setQuickMode] = useState(false);
  const [activeLang, setActiveLang] = useState<LanguageCode>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<Partial<TourEditorData> | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [translating, setTranslating] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'cover' | 'gallery' | null>(null);

  const isEditing = Boolean(data.id);

  // Mark form dirty
  const updateData = useCallback((patch: Partial<TourEditorData> | ((prev: TourEditorData) => Partial<TourEditorData>)) => {
    setData((prev) => {
      const updates = typeof patch === 'function' ? patch(prev) : patch;
      return { ...prev, ...updates };
    });
    setIsDirty(true);
  }, []);

  // Update localized entry for the active language
  const updateLocalized = useCallback((patch: Partial<LocalizedTourContent>) => {
    setData((prev) => {
      const current = prev.translations[activeLang] || createDefaultLocalizedContent();
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [activeLang]: {
            ...current,
            ...patch,
          },
        },
      };
    });
    setIsDirty(true);
  }, [activeLang]);

  const handleAiAutoTranslate = async () => {
    const enContent = data.translations.en || createDefaultLocalizedContent();
    const sourceTitle = enContent.title?.trim();
    if (!sourceTitle) {
      alert('Please provide an English experience title first before generating AI translations.');
      return;
    }

    try {
      setTranslating(true);
      setErrorMessage(null);
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: {
            title: sourceTitle,
            description: enContent.description || '',
            highlights: enContent.highlights?.length ? enContent.highlights : data.highlights,
            inclusions: enContent.inclusions?.length ? enContent.inclusions : data.inclusions,
            exclusions: enContent.exclusions?.length ? enContent.exclusions : data.exclusions,
            whatToBring: enContent.whatToBring || '',
            requirements: enContent.requirements || '',
            cancellationPolicy: enContent.cancellationPolicy || '',
            faqItems: enContent.faqItems || [],
            itinerary: (data.itinerary || []).map((i) => ({
              timeTag: i.timeTag,
              title: typeof i.title === 'string' ? i.title : (i.title?.en || ''),
              description: typeof i.description === 'string' ? i.description : (i.description?.en || ''),
            })),
          },
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to auto-translate tour');
      }

      if (resData.translations) {
        setData((prev) => {
          const merged = { ...prev.translations };
          const updatedItinerary = prev.itinerary ? [...prev.itinerary.map((m) => ({ ...m, title: { ...m.title }, description: { ...(m.description || {}) } }))] : [];

          for (const [langKey, translated] of Object.entries(resData.translations)) {
            const typedKey = langKey as LanguageCode;
            merged[typedKey] = {
              ...(merged[typedKey] || createDefaultLocalizedContent()),
              ...(translated as Partial<LocalizedTourContent>),
            };

            // Merge translated itinerary milestones if present
            const translatedItinerary = (translated as any).itinerary;
            if (Array.isArray(translatedItinerary) && updatedItinerary.length > 0) {
              translatedItinerary.forEach((item: any, idx: number) => {
                if (updatedItinerary[idx]) {
                  if (item.title) {
                    (updatedItinerary[idx].title as any)[typedKey] = item.title;
                  }
                  if (item.description) {
                    if (!updatedItinerary[idx].description) {
                      updatedItinerary[idx].description = {} as any;
                    }
                    (updatedItinerary[idx].description as any)[typedKey] = item.description;
                  }
                }
              });
            }
          }
          return { ...prev, translations: merged, itinerary: updatedItinerary };
        });
        setIsDirty(true);
        setSaveSuccessMessage('✨ Experience localized into all languages using Gemini AI!');
        setTimeout(() => setSaveSuccessMessage(null), 5000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error running AI auto-translation');
    } finally {
      setTranslating(false);
    }
  };

  const updateFaqItems = useCallback(
    (items: NonNullable<LocalizedTourContent['faqItems']>) => {
      updateLocalized({ faqItems: items });
    },
    [updateLocalized],
  );

  // Current localized content helper
  const currentLocale = useMemo(() => {
    return data.translations[activeLang] || createDefaultLocalizedContent();
  }, [data.translations, activeLang]);

  // Completeness score
  const completeness = useMemo(() => calculateTourCompleteness(data), [data]);

  // Filtered sections for Quick vs Full Mode
  const displayedSections = useMemo(() => {
    if (quickMode) {
      return TOUR_EDITOR_SECTIONS.filter((s) => s.isEssential);
    }
    return TOUR_EDITOR_SECTIONS;
  }, [quickMode]);

  // Warn before unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Auto-generate slug from English title if creating new
  const handleTitleChange = (val: string) => {
    updateLocalized({ title: val });
    if (!isEditing && (!data.slug || data.slug.startsWith('draft-') || data.slug === '')) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (generated) {
        updateData({ slug: generated });
      }
    }
  };

  // Submit Handler (Draft or Active)
  const handleSave = async (targetStatus: 'DRAFT' | 'ACTIVE') => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
    // If publishing, ensure minimum fields are present
      if (targetStatus === 'ACTIVE') {
        const enTitle = data.translations.en?.title?.trim();
        if (!enTitle) {
          throw new Error('English title is required before publishing.');
        }
        if (!data.slug?.trim()) {
          throw new Error('URL Slug is required before publishing.');
        }
        if (!data.zoneId) {
          throw new Error('Please select a Pickup Zone before publishing.');
        }
        if (data.adultPrice <= 0) {
          throw new Error('Adult price must be greater than zero.');
        }
        // Completeness guard — warn if critical checks are failing
        const failedCritical = completeness.checks
          .filter((c) => c.critical && !c.complete)
          .map((c) => c.name);
        if (failedCritical.length > 0) {
          throw new Error(
            `Cannot publish: the following critical fields are incomplete — ${failedCritical.join(', ')}.`
          );
        }
      }

      // Build payload compatible with DB & legacy endpoints
      const resolvedSlug = data.slug.trim() || `tour-${Date.now()}`;
      const en = data.translations.en || createDefaultLocalizedContent();

      const finalTranslations = { ...data.translations };
      finalTranslations.en = {
        ...en,
        cardExcerpt: en.cardExcerpt || data.cardExcerpt || '',
        highlights: en.highlights.length > 0 ? en.highlights : data.highlights,
        inclusions: en.inclusions.length > 0 ? en.inclusions : data.inclusions,
        exclusions: en.exclusions.length > 0 ? en.exclusions : data.exclusions,
        whatToBring: en.whatToBring || data.whatToBring || '',
        pickupDescription: en.pickupDescription || data.pickupDescription || '',
        cancellationPolicy: en.cancellationPolicy || data.cancellationPolicy || '',
        requirements: en.requirements || data.requirements || '',
        accessibilityNotes: en.accessibilityNotes || data.accessibilityNotes || '',
        mobilityNotes: en.mobilityNotes || data.mobilityNotes || '',
        safetyGuidelines: (en.safetyGuidelines && en.safetyGuidelines.length > 0) ? en.safetyGuidelines : data.safetyGuidelines,
        seoTitle: en.seoTitle || data.metaTitle || '',
        seoDescription: en.seoDescription || data.metaDescription || '',
        faqItems: (en.faqItems && en.faqItems.length > 0) ? en.faqItems : (data.faqItems || []),
      };

      const payload = {
        id: data.id,
        slug: resolvedSlug,
        type: data.type,
        status: targetStatus,
        category: data.category,
        destinationId: data.destinationId || undefined,
        zoneId: data.zoneId,
        countryCode: data.countryCode || undefined,
        region: data.region || undefined,
        city: data.city || undefined,
        latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
        longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
        timezone: data.timezone || undefined,
        basePriceUSD: data.basePriceUSD || data.adultPrice || 0,
        adultPrice: data.adultPrice,
        originalPrice: data.originalPrice || undefined,
        privatePrice: typeof data.privatePrice === 'number' && data.privatePrice > 0 ? data.privatePrice : undefined,
        costPerPerson: typeof data.costPerPerson === 'number' && data.costPerPerson > 0 ? data.costPerPerson : undefined,
        durationHours: data.durationHours || 1,
        maxCapacity: data.maxCapacity || 10,
        coverImage: data.coverImage || undefined,
        galleryImages: data.galleryImages.filter(Boolean),
        highlights: data.highlights.length > 0 ? data.highlights : en.highlights,
        inclusions: data.inclusions.length > 0 ? data.inclusions : en.inclusions,
        exclusions: data.exclusions.length > 0 ? data.exclusions : en.exclusions,
        whatToBring: en.whatToBring || data.whatToBring || undefined,
        pickupDescription: en.pickupDescription || data.pickupDescription || undefined,
        hotelPickupIncluded: data.hotelPickupIncluded,
        pickupType: data.pickupType || 'hotel',
        meetingPointName: data.meetingPointName || undefined,
        meetingPointAddress: data.meetingPointAddress || undefined,
        meetingPointLat: data.meetingPointLat ?? undefined,
        meetingPointLng: data.meetingPointLng ?? undefined,
        meetingPointLandmark: en.meetingPointLandmark || data.meetingPointLandmark || undefined,
        meetingPointInstructions: en.meetingPointInstructions || data.meetingPointInstructions || undefined,
        meetingPointMapUrl: data.meetingPointMapUrl || undefined,
        meetingPointImageUrl: data.meetingPointImageUrl || undefined,
        pickupTimes: data.pickupTimes,
        pickupTime: data.pickupTimes.length > 0 ? data.pickupTimes.join(' | ') : undefined,
        cancellationPolicy: en.cancellationPolicy || data.cancellationPolicy || undefined,
        allowDeposit: data.allowDeposit,
        depositType: data.depositType || 'PERCENTAGE',
        depositPercentage: data.depositPercentage,
        depositAmount: data.depositAmount ?? null,
        allowPayAtLocation: data.allowPayAtLocation,
        cardExcerpt: data.cardExcerpt || en.cardExcerpt || undefined,
        showExcerptOnCard: data.showExcerptOnCard,
        childEnabled: data.childEnabled,
        childPrice: data.childEnabled ? data.childPrice : undefined,
        childMinAge: data.childEnabled ? data.childMinAge : undefined,
        childMaxAge: data.childEnabled ? data.childMaxAge : undefined,
        infantEnabled: data.infantEnabled,
        infantPrice: data.infantEnabled ? data.infantPrice : undefined,
        infantMinAge: data.infantEnabled ? data.infantMinAge : undefined,
        infantMaxAge: data.infantEnabled ? data.infantMaxAge : undefined,
        ageRestrictionsNotes: data.ageRestrictionsNotes || undefined,
        itinerary: data.itinerary.length > 0 ? data.itinerary : undefined,
        tourOptions: data.addons.length > 0 ? data.addons : [],
        bookingQuestions: (data.bookingQuestions && data.bookingQuestions.length > 0) ? data.bookingQuestions : [],
        reviews: data.reviews.length > 0 ? data.reviews : undefined,
        translations: finalTranslations,
        vehicleType: data.vehicleType || undefined,
        boatType: data.boatType || undefined,
        airConditioned: data.airConditioned,
        transferNotes: data.transferNotes || undefined,
        fitnessLevel: data.fitnessLevel || undefined,
        wheelchairAccessible: data.wheelchairAccessible,
        strollerAccessible: data.strollerAccessible,
        mobilityNotes: en.mobilityNotes || data.mobilityNotes || undefined,
        accessibilityNotes: en.accessibilityNotes || data.accessibilityNotes || undefined,
        safetyGuidelines: (data.safetyGuidelines.length > 0 ? data.safetyGuidelines : en.safetyGuidelines) || [],
        insuranceIncluded: data.insuranceIncluded,
        emergencyContact: data.emergencyContact || undefined,
        freeCancellationHours: data.freeCancellationHours,
        instantConfirmation: data.instantConfirmation,
        cutoffHours: data.cutoffHours,
        durationDisplay: data.durationDisplay || undefined,
        routeStops: data.routeStops.length > 0 ? data.routeStops : undefined,
        activityTypes: data.activityTypes,
        operatorName: data.operatorName || undefined,
        operatorPhone: data.operatorPhone || undefined,
        operatorEmail: data.operatorEmail || undefined,
        internalNotes: data.internalNotes || undefined,
        variants: (data.variants && data.variants.length > 0) ? data.variants : undefined,
        // Badges
        isFeatured: data.isFeatured,
        isBestSeller: data.isBestSeller,
        isRecommended: data.isRecommended,
        isVip: data.isVip,
        isFamilyFriendly: data.isFamilyFriendly,
        isNew: data.isNew,
        customBadge: data.customBadge || undefined,
        secondaryCategories: data.secondaryCategories,
        tags: data.tags,
        // SEO
        metaTitle: data.metaTitle || en.seoTitle || undefined,
        metaDescription: data.metaDescription || en.seoDescription || undefined,
        keywords: data.keywords,
      };

      const url = isEditing ? `/api/admin/tours/${data.id}` : '/api/admin/tours/create';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'create'} experience.`);
      }

      setIsDirty(false);
      setSaveSuccessMessage(
        targetStatus === 'DRAFT'
          ? 'Draft saved successfully!'
          : 'Tour published successfully to the global catalog!'
      );

      // If just created, navigate to edit page so subsequent saves update the record
      if (!isEditing && result?.tour?.id) {
        setTimeout(() => {
          router.push(`/admin/tours/${result.tour.id}`);
        }, 800);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section navigation
  const currentIndex = displayedSections.findIndex((s) => s.id === activeSection);
  const prevSection = currentIndex > 0 ? displayedSections[currentIndex - 1] : null;
  const nextSection = currentIndex < displayedSections.length - 1 ? displayedSections[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 flex flex-col font-sans pb-16">
      {/* Top Authoritative Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B1528]/95 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/admin/tours')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            All Tours
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-wide">
                {currentLocale.title || 'Untitled Experience'}
              </h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  data.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : data.status === 'DRAFT'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'
                }`}
              >
                {data.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              slug: /{data.slug || 'generating-slug...'}
            </p>
          </div>
        </div>

        {/* Global Controls & Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Mode Toggle */}
          <button
            type="button"
            onClick={() => setQuickMode(!quickMode)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition border ${
              quickMode
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {quickMode ? 'Fast Path Active' : 'Fast Path Mode'}
          </button>

          {/* Completeness Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-[#070F1E] px-3 py-1.5 text-xs">
            <span className="text-slate-400">Readiness:</span>
            <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-[#00E5FF] transition-all duration-300"
                style={{ width: `${completeness.score}%` }}
              />
            </div>
            <span className="font-bold text-[#00E5FF]">{completeness.score}%</span>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center rounded-xl border border-white/10 bg-[#070F1E] p-1">
            {ALL_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`rounded-lg px-2 py-1 text-xs font-bold transition flex items-center gap-1 ${
                  activeLang === lang.code
                    ? 'bg-[#00E5FF] text-[#070F1E]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{lang.flag}</span>
                <span className="uppercase">{lang.code}</span>
              </button>
            ))}
          </div>

          {/* AI Auto-Translate Button */}
          <button
            type="button"
            disabled={translating}
            onClick={handleAiAutoTranslate}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
            title="Auto-translate English experience into all 7 languages using Gemini AI"
          >
            {translating ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Languages className="w-4 h-4 text-emerald-400" />
            )}
            <span>{translating ? 'Translating...' : 'AI Translate All'}</span>
          </button>

          {/* Import from Text */}
          <button
            type="button"
            onClick={() => { setShowImportModal(true); setImportPreview(null); setImportErrors([]); setImportText(''); }}
            className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3.5 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/20 transition"
          >
            <FileText className="w-4 h-4 text-orange-400" />
            Import
          </button>

          {/* Templates Library Button */}
          <button
            type="button"
            onClick={() => setShowTemplateModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            Templates
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('DRAFT')}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-amber-400" />
            Save Draft
          </button>

          {/* Publish Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('ACTIVE')}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-cyan-400 px-5 py-2 text-xs font-black text-[#070F1E] hover:opacity-95 shadow-lg shadow-[#00E5FF]/20 transition disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            Publish
          </button>
        </div>
      </header>

      {/* Notifications Bar */}
      {saveSuccessMessage && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {saveSuccessMessage}
          </div>
          <button type="button" onClick={() => setSaveSuccessMessage(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-red-300">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 text-red-400" />
            {errorMessage}
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Split Layout: Left Grouped Nav + Right Editor Panel */}
      <div className="max-w-[1700px] w-full mx-auto px-4 md:px-6 mt-6 flex-1 flex flex-col md:flex-row gap-6">
        {/* Left Sections Sidebar */}
        <aside className="w-full md:w-80 flex-shrink-0">
          <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#0B1528] p-3 shadow-xl flex flex-col max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/5 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {quickMode ? 'Fast Path Configuration' : 'Master 27 Sections'}
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Editing language: <strong className="text-white uppercase">{activeLang}</strong>
              </p>
            </div>

            <nav className="space-y-1">
              {displayedSections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-between group ${
                      isActive
                        ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20 font-black'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="truncate">{sec.shortLabel}</span>
                    </div>
                    {sec.isEssential && (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          isActive
                            ? 'bg-[#070F1E]/20 text-[#070F1E]'
                            : 'bg-white/5 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        Core
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Section Content Panel */}
        <main className="flex-1 rounded-2xl border border-white/10 bg-[#0B1528] p-6 md:p-8 shadow-2xl min-h-[600px] flex flex-col justify-between">
          <div>
            {/* Section Header */}
            {(() => {
              const currentMeta = TOUR_EDITOR_SECTIONS.find((s) => s.id === activeSection);
              return (
                <div className="border-b border-white/10 pb-5 mb-6 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      {currentMeta?.title}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">{currentMeta?.description}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold bg-white/5 px-3 py-1.5 rounded-full border border-white/5 text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-[#00E5FF]" />
                    Target: <span className="text-[#00E5FF] font-bold uppercase">{activeLang}</span>
                  </div>
                </div>
              );
            })()}

            {/* Render Selected Section */}
            {activeSection === 'basic-info' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Experience Title ({activeLang.toUpperCase()}) *
                    </label>
                    <input
                      type="text"
                      value={currentLocale.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. VIP Giftun Island & Coral Snorkeling Safari"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      URL Slug * (Global Unique Identifier)
                    </label>
                    <input
                      type="text"
                      value={data.slug}
                      onChange={(e) => updateData({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })}
                      placeholder="vip-giftun-island-snorkeling"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Tour Type
                    </label>
                    <select
                      value={data.type}
                      onChange={(e) => updateData({ type: e.target.value as 'SHARED' | 'PRIVATE' })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    >
                      <option value="SHARED">Shared Group Experience</option>
                      <option value="PRIVATE">Private VIP Experience</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Primary Category
                    </label>
                    <input
                      type="text"
                      value={data.category}
                      onChange={(e) => updateData({ category: e.target.value })}
                      placeholder="sea / safari / culture / diving"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Short Title / Card Header
                    </label>
                    <input
                      type="text"
                      value={currentLocale.shortTitle || ''}
                      onChange={(e) => updateLocalized({ shortTitle: e.target.value })}
                      placeholder="Giftun Island VIP"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Card Excerpt (Catchphrase on Discovery Grid)
                    </label>
                    <input
                      type="text"
                      value={currentLocale.cardExcerpt || data.cardExcerpt || ''}
                      onChange={(e) => {
                        updateLocalized({ cardExcerpt: e.target.value });
                        updateData({ cardExcerpt: e.target.value });
                      }}
                      placeholder="Crystal waters, private reef stops and fresh seafood buffet on board."
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Comprehensive Description ({activeLang.toUpperCase()})
                    </label>
                    <textarea
                      rows={6}
                      value={currentLocale.description}
                      onChange={(e) => updateLocalized({ description: e.target.value })}
                      placeholder="Detailed overview of the experience, what travelers will feel and encounter..."
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>

                {/* Badges and Highlights */}
                <div className="rounded-xl border border-white/5 bg-[#070F1E] p-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Experience Badges & Merchandising
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { key: 'isFeatured', label: 'Featured' },
                      { key: 'isBestSeller', label: 'Best Seller' },
                      { key: 'isRecommended', label: 'Recommended' },
                      { key: 'isVip', label: 'VIP' },
                      { key: 'isFamilyFriendly', label: 'Family Friendly' },
                      { key: 'isNew', label: 'New Arrival' },
                    ].map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2 text-xs text-slate-200 cursor-pointer hover:bg-white/10 transition"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean((data as any)[key])}
                          onChange={(e) => updateData({ [key]: e.target.checked } as any)}
                          className="rounded border-white/20 text-[#00E5FF] focus:ring-0"
                        />
                        <span className="font-semibold">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'destination-location' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Destination / City Hub
                    </label>
                    <select
                      value={data.destinationId}
                      onChange={(e) => updateData({ destinationId: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    >
                      <option value="">Select Destination Hub</option>
                      {destinations.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Pickup Zone *
                    </label>
                    <select
                      value={data.zoneId}
                      onChange={(e) => updateData({ zoneId: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    >
                      <option value="">Select Operational Zone</option>
                      {zones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Country Code (ISO 3166-1)
                    </label>
                    <input
                      type="text"
                      value={data.countryCode || 'EG'}
                      onChange={(e) => updateData({ countryCode: e.target.value.toUpperCase() })}
                      placeholder="EG / IT / AE / FR"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Region / State / Province
                    </label>
                    <input
                      type="text"
                      value={data.region || ''}
                      onChange={(e) => updateData({ region: e.target.value })}
                      placeholder="Red Sea, Lazio, Île-de-France..."
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Timezone (IANA)
                    </label>
                    <input
                      type="text"
                      value={data.timezone || 'Africa/Cairo'}
                      onChange={(e) => updateData({ timezone: e.target.value })}
                      placeholder="Africa/Cairo, Europe/Rome, Asia/Dubai..."
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Latitude (GPS Decimal)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={typeof data.latitude === 'number' ? data.latitude : ''}
                      onChange={(e) => updateData({ latitude: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="27.2579"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Longitude (GPS Decimal)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={typeof data.longitude === 'number' ? data.longitude : ''}
                      onChange={(e) => updateData({ longitude: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="33.8116"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'media' && (
              <div className="space-y-6">
                {/* Cover Image */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Primary Cover Hero Image URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={data.coverImage}
                      onChange={(e) => updateData({ coverImage: e.target.value })}
                      placeholder="https://... or pick from Media Library"
                      className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('cover')}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] text-sm font-semibold hover:bg-[#00E5FF]/20 transition-colors whitespace-nowrap"
                    >
                      <ImageIcon className="w-4 h-4" />
                      Media Library
                    </button>
                  </div>
                  {data.coverImage && (
                    <div className="mt-3 relative w-full h-48 rounded-xl overflow-hidden border border-white/10 bg-[#070F1E]">
                      <img src={data.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => updateData({ coverImage: '' })}
                        className="absolute top-2 right-2 bg-black/60 hover:bg-red-600/80 text-white rounded-lg p-1.5 transition-colors"
                        title="Remove cover image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Gallery Images */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase text-slate-300">
                      Gallery Images ({data.galleryImages.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget('gallery')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-semibold hover:bg-[#00E5FF]/20 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add from Media Library
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={data.galleryImages.join('\n')}
                    onChange={(e) =>
                      updateData({
                        galleryImages: e.target.value.split('\n').map((u) => u.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Paste URLs manually (one per line) — or use the button above to pick from Media Library"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-mono focus:border-[#00E5FF] outline-none"
                  />
                  {data.galleryImages.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {data.galleryImages.map((img, i) => (
                        <div key={i} className="relative h-24 rounded-lg overflow-hidden border border-white/10 bg-[#070F1E] group">
                          <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => updateData({ galleryImages: data.galleryImages.filter((_, idx) => idx !== i) })}
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-red-600/80 text-white rounded p-1 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Media Library Picker Modal */}
            {mediaPickerTarget && (
              <MediaLibraryModalLazy
                isOpen={!!mediaPickerTarget}
                onClose={() => setMediaPickerTarget(null)}
                multiple={mediaPickerTarget === 'gallery'}
                title={mediaPickerTarget === 'cover' ? 'Select Cover Image' : 'Add Gallery Images'}
                onSelect={(urls) => {
                  if (mediaPickerTarget === 'cover') {
                    updateData({ coverImage: urls[0] || data.coverImage });
                  } else {
                    updateData({ galleryImages: [...data.galleryImages, ...urls] });
                  }
                  setMediaPickerTarget(null);
                }}
              />
            )}

            {activeSection === 'operator' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-[#070F1E] p-4 text-xs text-slate-400">
                  <p className="font-bold text-white mb-1">Operator & Operations Intelligence</p>
                  Internal records for local service suppliers, guides, drivers, and dispatch coordination. This information is private to the operations team and never displayed publicly.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Local Supplier / Operator Name
                    </label>
                    <input
                      type="text"
                      value={data.operatorName || ''}
                      onChange={(e) => updateData({ operatorName: e.target.value })}
                      placeholder="e.g. Red Sea Marine Excursions Co."
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Operator Dispatch Phone / WhatsApp
                    </label>
                    <input
                      type="text"
                      value={data.operatorPhone || ''}
                      onChange={(e) => updateData({ operatorPhone: e.target.value })}
                      placeholder="+20 100 123 4567"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Operator Email
                    </label>
                    <input
                      type="email"
                      value={data.operatorEmail || ''}
                      onChange={(e) => updateData({ operatorEmail: e.target.value })}
                      placeholder="dispatch@supplier.com"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Internal Operations & Manifest Notes
                  </label>
                  <textarea
                    rows={4}
                    value={data.internalNotes || ''}
                    onChange={(e) => updateData({ internalNotes: e.target.value })}
                    placeholder="Boat berth #14 at Hurghada New Marina. Captain Hassan (+20101...). Lead divemaster must confirm equipment inventory 30 min before departure."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'pricing' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Adult Price (USD) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={data.adultPrice || ''}
                      onChange={(e) => updateData({ adultPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="45"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-bold focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Original Price (Crossed out)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={data.originalPrice || ''}
                      onChange={(e) => updateData({ originalPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="60"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Internal Cost per Person
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={data.costPerPerson || ''}
                      onChange={(e) => updateData({ costPerPerson: parseFloat(e.target.value) || 0 })}
                      placeholder="25"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070F1E] p-4 space-y-4">
                  <span className="block text-xs font-bold uppercase text-slate-300">
                    Payment Policies & Methods
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.allowPayAtLocation}
                        onChange={(e) => updateData({ allowPayAtLocation: e.target.checked })}
                        className="rounded border-white/20 text-[#00E5FF]"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Cash / Pay at Location</span>
                        <span className="text-[11px] text-slate-400">Allow travelers to pay in cash upon pickup</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/5 p-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.allowDeposit}
                        onChange={(e) => updateData({ allowDeposit: e.target.checked })}
                        className="rounded border-white/20 text-[#00E5FF]"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Online Deposit</span>
                        <span className="text-[11px] text-slate-400">Require partial down payment online</span>
                      </div>
                    </label>
                  </div>

                  {data.allowDeposit && (
                    <div className="pt-2 space-y-3">
                      {/* Deposit type toggle */}
                      <div>
                        <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                          Deposit Type
                        </label>
                        <div className="flex gap-2">
                          {(['PERCENTAGE', 'FIXED'] as const).map((dt) => (
                            <button
                              key={dt}
                              type="button"
                              onClick={() => updateData({ depositType: dt })}
                              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                (data.depositType || 'PERCENTAGE') === dt
                                  ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                                  : 'border-white/10 text-slate-400 hover:text-white'
                              }`}
                            >
                              {dt === 'PERCENTAGE' ? '% Percentage' : '$ Fixed Amount'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Percentage input */}
                      {(data.depositType || 'PERCENTAGE') === 'PERCENTAGE' && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                            Deposit Percentage (%)
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={data.depositPercentage}
                            onChange={(e) => updateData({ depositPercentage: parseInt(e.target.value, 10) || 50 })}
                            className="w-48 rounded-xl border border-white/10 bg-[#0B1528] px-4 py-2 text-sm text-white focus:border-[#00E5FF] outline-none"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Customer pays {data.depositPercentage}% online, remainder on arrival.
                          </p>
                        </div>
                      )}

                      {/* Fixed amount input */}
                      {data.depositType === 'FIXED' && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                            Fixed Deposit Amount (USD $)
                          </label>
                          <input
                            type="number"
                            min={1}
                            step={0.01}
                            value={data.depositAmount ?? ''}
                            onChange={(e) =>
                              updateData({ depositAmount: e.target.value ? parseFloat(e.target.value) : undefined })
                            }
                            placeholder="e.g. 20"
                            className="w-48 rounded-xl border border-white/10 bg-[#0B1528] px-4 py-2 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                          />
                          <p className="text-[11px] text-slate-500 mt-1">
                            Customer pays a flat ${data.depositAmount ?? '?'} USD online, remainder on arrival.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'guest-types' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-[#070F1E] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">Children Pricing Tier</span>
                      <span className="text-xs text-slate-400">Allow discounted tickets for children</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={data.childEnabled}
                      onChange={(e) => updateData({ childEnabled: e.target.checked })}
                      className="h-5 w-5 rounded border-white/20 text-[#00E5FF]"
                    />
                  </div>

                  {data.childEnabled && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Child Price (USD)</label>
                        <input
                          type="number"
                          value={data.childPrice || ''}
                          onChange={(e) => updateData({ childPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Min Age</label>
                        <input
                          type="number"
                          value={data.childMinAge}
                          onChange={(e) => updateData({ childMinAge: parseInt(e.target.value, 10) || 3 })}
                          className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Max Age</label>
                        <input
                          type="number"
                          value={data.childMaxAge}
                          onChange={(e) => updateData({ childMaxAge: parseInt(e.target.value, 10) || 11 })}
                          className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070F1E] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-white block">Infants Pricing Tier</span>
                      <span className="text-xs text-slate-400">Infants (usually free or small transfer seat fee)</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={data.infantEnabled}
                      onChange={(e) => updateData({ infantEnabled: e.target.checked })}
                      className="h-5 w-5 rounded border-white/20 text-[#00E5FF]"
                    />
                  </div>

                  {data.infantEnabled && (
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Infant Price (USD)</label>
                        <input
                          type="number"
                          value={data.infantPrice || ''}
                          onChange={(e) => updateData({ infantPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Min Age</label>
                        <input
                          type="number"
                          value={data.infantMinAge}
                          onChange={(e) => updateData({ infantMinAge: parseInt(e.target.value, 10) || 0 })}
                          className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Max Age</label>
                        <input
                          type="number"
                          value={data.infantMaxAge}
                          onChange={(e) => updateData({ infantMaxAge: parseInt(e.target.value, 10) || 2 })}
                          className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-white/10 bg-[#070F1E] p-4 space-y-2">
                  <div>
                    <span className="text-sm font-bold text-white block">Private Tour Price</span>
                    <span className="text-xs text-slate-400">
                      Optional flat price for a fully private departure (leave empty to disable).
                    </span>
                  </div>
                  <div className="max-w-[220px]">
                    <label className="block text-xs text-slate-400 mb-1">Private Price (USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={data.privatePrice ?? ''}
                      onChange={(e) => updateData({ privatePrice: parseFloat(e.target.value) || undefined })}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Age & Participant Restrictions Notes
                  </label>
                  <input
                    type="text"
                    value={data.ageRestrictionsNotes || ''}
                    onChange={(e) => updateData({ ageRestrictionsNotes: e.target.value })}
                    placeholder="e.g. Children under 16 must be accompanied by an adult."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'addons' && (
              <div className="space-y-4">
                <TourAddonsBuilder
                  addons={data.addons}
                  activeLanguage={activeLang}
                  onChange={(newAddons) => updateData({ addons: newAddons })}
                />
              </div>
            )}

            {activeSection === 'availability' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Max Guests per Departure *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={data.maxCapacity}
                      onChange={(e) => updateData({ maxCapacity: parseInt(e.target.value, 10) || 10 })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-bold focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Duration in Hours *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={data.durationHours}
                      onChange={(e) => updateData({ durationHours: parseInt(e.target.value, 10) || 1 })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white font-bold focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Cut-off Hours (Min advance booking)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={data.cutoffHours}
                      onChange={(e) => updateData({ cutoffHours: parseInt(e.target.value, 10) || 12 })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Customer-Facing Duration
                  </label>
                  <input
                    type="text"
                    value={data.durationDisplay || ''}
                    onChange={(e) => updateData({ durationDisplay: e.target.value })}
                    placeholder="e.g. 7 hours, Full day, 2 days / 1 night"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-400">Use this for the exact duration shown to travellers; the numeric duration is used for scheduling.</p>
                </div>
              </div>
            )}

            {activeSection === 'schedule' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Scheduled Departure / Pickup Times (Selectable by Customer)
                  </label>
                  <p className="text-xs text-slate-400 mb-3">Add departure slots (e.g. 08:00 AM, 12:30 PM, 04:00 PM)</p>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.pickupTimes.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]"
                      >
                        <Clock className="w-3 h-3" />
                        {t}
                        <button
                          type="button"
                          onClick={() =>
                            updateData({ pickupTimes: data.pickupTimes.filter((_, i) => i !== idx) })
                          }
                          className="hover:text-red-400 ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      id="newPickupTimeInput"
                      placeholder="09:00 AM"
                      className="flex-1 rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById('newPickupTimeInput') as HTMLInputElement;
                        if (el && el.value.trim()) {
                          updateData({ pickupTimes: [...data.pickupTimes, el.value.trim()] });
                          el.value = '';
                        }
                      }}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                    >
                      Add Slot
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'pickup' && (
              <div className="space-y-6">
                {/* Pickup Type Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                    Pickup & Transfer Mode
                  </label>
                  <p className="text-xs text-slate-400 mb-3">
                    Specify whether guests are picked up or meet directly on-site.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'hotel', label: 'Hotel Pickup', desc: 'Pick up from resort/hotel lobby' },
                      { id: 'meeting_point', label: 'Meeting Point Only', desc: 'Guests arrive directly at location' },
                      { id: 'both', label: 'Both Options', desc: 'Guests choose hotel pickup or meeting point' },
                      { id: 'airport', label: 'Airport Transfer', desc: 'Pick up from airport arrivals terminal' },
                      { id: 'port', label: 'Cruise Port', desc: 'Pick up from sea port / cruise harbor' },
                      { id: 'station', label: 'Station Pickup', desc: 'Pick up from train / bus station' },
                      { id: 'private_address', label: 'Private Address', desc: 'Pick up from villa or private address' },
                      { id: 'none', label: 'No Pickup', desc: 'Self-guided or walk-in activity' },
                    ].map((option) => {
                      const isSelected = (data.pickupType || 'hotel') === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            updateData({
                              pickupType: option.id as any,
                              hotelPickupIncluded: option.id === 'hotel' || option.id === 'both' ? data.hotelPickupIncluded : false,
                            });
                          }}
                          className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white shadow-lg shadow-[#00E5FF]/10'
                              : 'border-white/10 bg-[#070F1E] text-slate-400 hover:border-white/20 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-xs font-black ${isSelected ? 'text-[#00E5FF]' : 'text-white'}`}>
                              {option.label}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#00E5FF]" />}
                          </div>
                          <span className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                            {option.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Hotel Pickup Specifics */}
                {((data.pickupType || 'hotel') === 'hotel' || data.pickupType === 'both') && (
                  <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070F1E] p-4 cursor-pointer hover:border-white/20 transition">
                    <input
                      type="checkbox"
                      checked={data.hotelPickupIncluded}
                      onChange={(e) => updateData({ hotelPickupIncluded: e.target.checked })}
                      className="h-5 w-5 rounded border-white/20 text-[#00E5FF] focus:ring-0"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">Hotel Pickup & Return Included in Price</span>
                      <span className="text-xs text-slate-400">Complimentary transfer from all resorts inside the selected zone</span>
                    </div>
                  </label>
                )}

                {/* Pickup Instructions Description */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Pickup Instructions & Logistics Notes ({activeLang.toUpperCase()})
                  </label>
                  <p className="text-xs text-slate-400 mb-2">
                    Clear guidance shown on voucher and checkout (e.g. lobby wait times, driver identification).
                  </p>
                  <textarea
                    rows={3}
                    value={currentLocale.pickupDescription || data.pickupDescription || ''}
                    onChange={(e) => {
                      updateLocalized({ pickupDescription: e.target.value });
                      updateData({ pickupDescription: e.target.value });
                    }}
                    placeholder="We pick you up directly from your hotel lobby. Exact pickup time confirmed via WhatsApp 12 hours prior."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            {activeSection === 'meeting-point' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Meeting Point Name *
                    </label>
                    <input
                      type="text"
                      value={data.meetingPointName || ''}
                      onChange={(e) => updateData({ meetingPointName: e.target.value })}
                      placeholder="e.g. Hurghada Marina Gate 2"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Physical Street Address
                    </label>
                    <input
                      type="text"
                      value={data.meetingPointAddress || ''}
                      onChange={(e) => updateData({ meetingPointAddress: e.target.value })}
                      placeholder="e.g. Marina Boulevard, Hurghada, Egypt"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* GPS Coordinates */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-2">
                    GPS Coordinates (Precise pin location)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Latitude (e.g. 27.2289)</label>
                      <input
                        type="number"
                        step="any"
                        value={data.meetingPointLat ?? ''}
                        onChange={(e) =>
                          updateData({ meetingPointLat: e.target.value ? parseFloat(e.target.value) : null })
                        }
                        placeholder="27.2289"
                        className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-2.5 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Longitude (e.g. 33.8441)</label>
                      <input
                        type="number"
                        step="any"
                        value={data.meetingPointLng ?? ''}
                        onChange={(e) =>
                          updateData({ meetingPointLng: e.target.value ? parseFloat(e.target.value) : null })
                        }
                        placeholder="33.8441"
                        className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-2.5 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Landmark & Map Reference */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Prominent Landmark ({activeLang.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={currentLocale.meetingPointLandmark || data.meetingPointLandmark || ''}
                      onChange={(e) => {
                        updateLocalized({ meetingPointLandmark: e.target.value });
                        updateData({ meetingPointLandmark: e.target.value });
                      }}
                      placeholder="e.g. Beside the main lighthouse tower"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Google Maps or Navigation Link
                    </label>
                    <input
                      type="url"
                      value={data.meetingPointMapUrl || ''}
                      onChange={(e) => updateData({ meetingPointMapUrl: e.target.value })}
                      placeholder="https://maps.google.com/?q=..."
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Visual Image Reference */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Meeting Point Reference Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={data.meetingPointImageUrl || ''}
                    onChange={(e) => updateData({ meetingPointImageUrl: e.target.value })}
                    placeholder="https://.../meeting-point-gate2.jpg"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Customers see this photo on their boarding pass and voucher to spot the guide immediately.
                  </p>
                </div>

                {/* Directions & Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Arrival Directions & Instructions ({activeLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={3}
                    value={currentLocale.meetingPointInstructions || data.meetingPointInstructions || ''}
                    onChange={(e) => {
                      updateLocalized({ meetingPointInstructions: e.target.value });
                      updateData({ meetingPointInstructions: e.target.value });
                    }}
                    placeholder="Look for the Talago Tours uniform / banner opposite the marina fountain. Please arrive 15 minutes before departure."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>
            )}

            {activeSection === 'transportation' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Land Vehicle Specification
                    </label>
                    <input
                      type="text"
                      value={data.vehicleType || ''}
                      onChange={(e) => updateData({ vehicleType: e.target.value })}
                      placeholder="e.g. Modern Toyota HiAce / Mercedes Sprinter"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Marine Vessel Specification (if applicable)
                    </label>
                    <input
                      type="text"
                      value={data.boatType || ''}
                      onChange={(e) => updateData({ boatType: e.target.value })}
                      placeholder="e.g. 3-Deck Luxury Marine Yacht with Flybridge"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070F1E] p-4">
                  <input
                    type="checkbox"
                    id="airConditionedToggle"
                    checked={data.airConditioned ?? true}
                    onChange={(e) => updateData({ airConditioned: e.target.checked })}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                  />
                  <label htmlFor="airConditionedToggle" className="text-sm font-semibold text-white cursor-pointer">
                    Air-Conditioned Passenger Fleet (Vehicles & Salon)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Transfer & Fleet Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={data.transferNotes || ''}
                    onChange={(e) => updateData({ transferNotes: e.target.value })}
                    placeholder="Drivers arrive in uniform with TALAGO Tours signage. Child safety booster seats available on advance request."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'route' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Route Waypoints & Geographical Stops</h3>
                    <p className="text-xs text-slate-400">Map waypoints along the tour journey</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newStop: RoutePoint = {
                        id: `stop-${Date.now()}`,
                        name: 'New Waypoint',
                        order: (data.routeStops || []).length + 1,
                        durationMinutes: 45,
                      };
                      updateData({ routeStops: [...(data.routeStops || []), newStop] });
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-[#00E5FF]/10 px-3 py-2 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF]/20 transition"
                  >
                    <Plus className="w-4 h-4" />
                    Add Waypoint
                  </button>
                </div>

                {(!data.routeStops || data.routeStops.length === 0) ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                    <Compass className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-white">No route stops configured yet</p>
                    <p className="text-xs text-slate-500 mt-1">Add waypoints to show customers an interactive tour journey map</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.routeStops.map((stop, idx) => (
                      <div key={stop.id} className="rounded-xl border border-white/10 bg-[#070F1E] p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#00E5FF]/20 text-xs font-black text-[#00E5FF]">
                            {idx + 1}
                          </span>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={stop.name}
                              onChange={(e) => {
                                const updated = [...data.routeStops];
                                updated[idx] = { ...stop, name: e.target.value };
                                updateData({ routeStops: updated });
                              }}
                              placeholder="Stop name (e.g. Dolphin Reef)"
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={stop.description || ''}
                              onChange={(e) => {
                                const updated = [...data.routeStops];
                                updated[idx] = { ...stop, description: e.target.value };
                                updateData({ routeStops: updated });
                              }}
                              placeholder="Description / activity"
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span>Duration:</span>
                            <input
                              type="number"
                              min={0}
                              value={stop.durationMinutes || 0}
                              onChange={(e) => {
                                const updated = [...data.routeStops];
                                updated[idx] = { ...stop, durationMinutes: parseInt(e.target.value, 10) || 0 };
                                updateData({ routeStops: updated });
                              }}
                              className="w-16 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white text-center"
                            />
                            <span>min</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = data.routeStops.filter((_, i) => i !== idx);
                              updateData({ routeStops: updated });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'itinerary' && (
              <div className="space-y-4">
                <ItineraryBuilder
                  milestones={data.itinerary}
                  activeLanguage={activeLang}
                  errors={{}}
                  onChange={(items) => updateData({ itinerary: items })}
                />
              </div>
            )}

            {activeSection === 'activities' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Main Activities
                  </label>
                  <p className="text-xs text-slate-400 mb-2">Comma-separated activity tags used for discovery and the tour summary.</p>
                  <input
                    type="text"
                    value={(data.activityTypes || []).join(', ')}
                    onChange={(e) => updateData({
                      activityTypes: e.target.value.split(',').map((item) => item.trim()).filter(Boolean),
                    })}
                    placeholder="e.g. Snorkeling, Desert safari, Cultural sightseeing"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Key Highlights / Selling Points ({activeLang.toUpperCase()})
                  </label>
                  <p className="text-xs text-slate-400 mb-2">Bullet points displayed prominently on the tour overview page</p>
                  <textarea
                    rows={5}
                    value={(currentLocale.highlights || data.highlights || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(Boolean);
                      updateLocalized({ highlights: lines });
                      // The flat columns hold the English copy; editing another
                      // language must never overwrite them.
                      if (activeLang === 'en') updateData({ highlights: lines });
                    }}
                    placeholder="Swim with wild dolphins at Dolphin House\nEnjoy fresh open-buffet seafood lunch on board\nAll high-grade snorkeling gear provided"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'inclusions' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  What is Included ({activeLang.toUpperCase()})
                </label>
                <textarea
                  rows={6}
                  value={(currentLocale.inclusions || data.inclusions || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(Boolean);
                      updateLocalized({ inclusions: lines });
                      // The flat columns hold the English copy; editing another
                      // language must never overwrite them.
                      if (activeLang === 'en') updateData({ inclusions: lines });
                    }}
                  placeholder="Hotel pickup and drop-off\nProfessional multilingual snorkel guide\nLife jackets & snorkeling masks\nLunch buffet and soft drinks"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
            )}

            {activeSection === 'exclusions' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  What is Excluded ({activeLang.toUpperCase()})
                </label>
                <textarea
                  rows={5}
                  value={(currentLocale.exclusions || data.exclusions || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(Boolean);
                      updateLocalized({ exclusions: lines });
                      // The flat columns hold the English copy; editing another
                      // language must never overwrite them.
                      if (activeLang === 'en') updateData({ exclusions: lines });
                    }}
                  placeholder="National park entrance fee ($5 per person)\nProfessional photo and video session\nPersonal expenses and tips"
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
            )}

            {activeSection === 'what-to-bring' && (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                  What to Bring ({activeLang.toUpperCase()})
                </label>
                <textarea
                  rows={4}
                  value={currentLocale.whatToBring || data.whatToBring || ''}
                  onChange={(e) => {
                    updateLocalized({ whatToBring: e.target.value });
                    // The flat columns hold the English copy; editing another
                    // language must never overwrite them.
                    if (activeLang === 'en') updateData({ whatToBring: e.target.value });
                  }}
                  placeholder="Swimwear, beach towels, sunglasses, sun cream, camera or waterproof phone case."
                  className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
            )}

            {activeSection === 'important-info' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Important Information ({activeLang.toUpperCase()})
                  </label>
                  <p className="text-xs text-slate-400">
                    Need-to-know details guests should read before booking — ID/passport rules, restrictions, what is not suitable, and good-to-know notes.
                  </p>
                </div>
                <textarea
                  rows={6}
                  value={currentLocale.importantInfo || ''}
                  onChange={(e) => updateLocalized({ importantInfo: e.target.value })}
                  placeholder="Please bring your passport. Not recommended for pregnant guests or children under 6. Entrance fees are not included..."
                  className="w-full resize-y rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
            )}

            {activeSection === 'faqs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300">
                      FAQs ({activeLang.toUpperCase()})
                    </label>
                    <p className="text-xs text-slate-400">
                      Questions and answers shown on the public tour page accordion.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateFaqItems([...(currentLocale.faqItems || []), { question: '', answer: '' }])
                    }
                    className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
                  >
                    + Add FAQ
                  </button>
                </div>

                {(currentLocale.faqItems || []).length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                    No FAQs yet for {activeLang.toUpperCase()}. Click &quot;Add FAQ&quot; to create localized FAQ content.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(currentLocale.faqItems || []).map((faq, i) => (
                      <div key={i} className="space-y-2 rounded-xl border border-white/10 bg-[#070F1E] p-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={faq.question}
                            onChange={(e) => {
                              const items = [...(currentLocale.faqItems || [])];
                              items[i] = { ...items[i], question: e.target.value };
                              updateFaqItems(items);
                            }}
                            placeholder="Question"
                            className="flex-1 rounded-lg border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateFaqItems((currentLocale.faqItems || []).filter((_, idx) => idx !== i))
                            }
                            className="rounded-lg p-2 text-rose-400/70 hover:bg-rose-500/10 hover:text-rose-400"
                            title="Delete FAQ"
                          >
                            ✕
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => {
                            const items = [...(currentLocale.faqItems || [])];
                            items[i] = { ...items[i], answer: e.target.value };
                            updateFaqItems(items);
                          }}
                          placeholder="Answer"
                          className="w-full resize-y rounded-lg border border-white/10 bg-[#0B1528] px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'requirements' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Fitness & Activity Level
                    </label>
                    <select
                      value={data.fitnessLevel || 'Easy'}
                      onChange={(e) => updateData({ fitnessLevel: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white"
                    >
                      <option value="Easy">Easy - Suitable for all fitness levels and ages</option>
                      <option value="Moderate">Moderate - Involves swimming, quad driving, or light walking</option>
                      <option value="Challenging">Challenging - Active hiking, deep diving, or long transfers</option>
                      <option value="Strenuous">Strenuous - Advanced physical endurance required</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      Age & Health Restrictions Notes
                    </label>
                    <input
                      type="text"
                      value={data.ageRestrictionsNotes || ''}
                      onChange={(e) => updateData({ ageRestrictionsNotes: e.target.value })}
                      placeholder="e.g. Not recommended for pregnant women or guests with back conditions"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Participant Requirements Statement ({activeLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={4}
                    value={currentLocale.requirements || data.requirements || ''}
                    onChange={(e) => {
                      updateLocalized({ requirements: e.target.value });
                      // The flat columns hold the English copy; editing another
                      // language must never overwrite them.
                      if (activeLang === 'en') updateData({ requirements: e.target.value });
                    }}
                    placeholder="Basic swimming capability recommended for marine activities. All divers must present a valid C-card. Quad bike drivers must be at least 16 years old."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'accessibility' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070F1E] p-4">
                    <input
                      type="checkbox"
                      id="wheelchairToggle"
                      checked={data.wheelchairAccessible}
                      onChange={(e) => updateData({ wheelchairAccessible: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                    />
                    <label htmlFor="wheelchairToggle" className="text-sm font-semibold text-white cursor-pointer">
                      Wheelchair Accessible (Vehicle ramps & accessible pathways)
                    </label>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070F1E] p-4">
                    <input
                      type="checkbox"
                      id="strollerToggle"
                      checked={data.strollerAccessible}
                      onChange={(e) => updateData({ strollerAccessible: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                    />
                    <label htmlFor="strollerToggle" className="text-sm font-semibold text-white cursor-pointer">
                      Stroller / Pram Accessible
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Accessibility & Special Needs Accommodations ({activeLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={4}
                    value={currentLocale.accessibilityNotes || data.accessibilityNotes || ''}
                    onChange={(e) => {
                      updateLocalized({ accessibilityNotes: e.target.value });
                      updateData({ accessibilityNotes: e.target.value });
                    }}
                    placeholder="Wheelchair users can be accommodated on our private transport with ramps. Lower deck of the marine vessel is accessible. Please inform us 24h in advance."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'safety' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070F1E] p-4">
                    <input
                      type="checkbox"
                      id="insuranceToggle"
                      checked={data.insuranceIncluded}
                      onChange={(e) => updateData({ insuranceIncluded: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                    />
                    <label htmlFor="insuranceToggle" className="text-sm font-semibold text-white cursor-pointer">
                      Comprehensive Activity & Passenger Insurance Included
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                      24/7 Operations Emergency Contact Phone
                    </label>
                    <input
                      type="text"
                      value={data.emergencyContact || ''}
                      onChange={(e) => updateData({ emergencyContact: e.target.value })}
                      placeholder="+20 100 000 0000"
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Safety Guidelines & Protocols (One rule per line)
                  </label>
                  <textarea
                    rows={5}
                    value={(currentLocale.safetyGuidelines || data.safetyGuidelines || []).join('\n')}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n').filter(Boolean);
                      updateLocalized({ safetyGuidelines: lines });
                      // The flat columns hold the English copy; editing another
                      // language must never overwrite them.
                      if (activeLang === 'en') updateData({ safetyGuidelines: lines });
                    }}
                    placeholder="Certified marine rescue diver on duty during all water sessions\nLife jackets mandatory in open water\nFirst aid kit and oxygen tank onboard\nFollow guides instructions at all times"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'cancellation' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-300 mb-1">Free Cancellation Window</label>
                    <select
                      value={data.freeCancellationHours}
                      onChange={(e) => updateData({ freeCancellationHours: parseInt(e.target.value, 10) || 24 })}
                      className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white"
                    >
                      <option value={24}>Up to 24 hours before (Standard)</option>
                      <option value={48}>Up to 48 hours before (Strict)</option>
                      <option value={0}>Non-refundable</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Cancellation Policy Statement ({activeLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={4}
                    value={currentLocale.cancellationPolicy || data.cancellationPolicy || ''}
                    onChange={(e) => {
                      updateLocalized({ cancellationPolicy: e.target.value });
                      // The flat columns hold the English copy; editing another
                      // language must never overwrite them.
                      if (activeLang === 'en') updateData({ cancellationPolicy: e.target.value });
                    }}
                    placeholder="Full refund if cancelled at least 24 hours prior to scheduled departure. No refund for no-shows."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'booking-questions' && (
              <div className="space-y-4">
                <BookingQuestionsBuilder
                  questions={data.bookingQuestions || []}
                  onChange={(questions) => updateData({ bookingQuestions: questions })}
                />
              </div>
            )}

            {activeSection === 'seo' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Custom SEO Page Title ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={currentLocale.seoTitle || ''}
                    onChange={(e) => updateLocalized({ seoTitle: e.target.value })}
                    placeholder="Dolphin House Snorkeling Tour from Hurghada | TALAGO Tours"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Recommended length: 50-60 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Meta Description ({activeLang.toUpperCase()})
                  </label>
                  <textarea
                    rows={3}
                    value={currentLocale.seoDescription || ''}
                    onChange={(e) => updateLocalized({ seoDescription: e.target.value })}
                    placeholder="Swim with wild dolphins in the Red Sea. Enjoy guided coral reef snorkeling, fresh seafood lunch, and hotel transfers. Book online with TALAGO Tours."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Recommended length: 140-160 characters</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Search Keywords (comma separated)
                  </label>
                  <input
                    type="text"
                    value={data.keywords.join(', ')}
                    onChange={(e) =>
                      updateData({
                        keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean),
                      })
                    }
                    placeholder="dolphin house, hurghada snorkeling, red sea safari, boat trip"
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>

                <div className="border-t border-white/10 pt-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="showExcerptToggle"
                      checked={data.showExcerptOnCard}
                      onChange={(e) => updateData({ showExcerptOnCard: e.target.checked })}
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                    />
                    <label htmlFor="showExcerptToggle" className="text-sm font-semibold text-white cursor-pointer">
                      Show Card Excerpt in Catalog Card
                    </label>
                  </div>

                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Card Excerpt (One sentence preview in search results)
                  </label>
                  <input
                    type="text"
                    value={data.cardExcerpt || ''}
                    onChange={(e) => updateData({ cardExcerpt: e.target.value })}
                    placeholder="Encounter wild spinner dolphins and explore pristine virgin reefs on a luxury yacht."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}

            {activeSection === 'publishing' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Catalog Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { status: 'DRAFT', label: 'Draft', desc: 'Hidden from public searches', color: 'amber' },
                      { status: 'ACTIVE', label: 'Published / Active', desc: 'Visible and bookable live', color: 'emerald' },
                      { status: 'HIDDEN', label: 'Hidden / Direct Link', desc: 'Only accessible via direct URL', color: 'blue' },
                      { status: 'COMING_SOON', label: 'Coming Soon', desc: 'Visible but not yet bookable', color: 'purple' },
                      { status: 'ARCHIVED', label: 'Archived', desc: 'Retired experience — no new bookings', color: 'slate' },
                    ].map((s) => (
                      <button
                        key={s.status}
                        type="button"
                        onClick={() => updateData({ status: s.status as any })}
                        className={`rounded-xl border p-3 text-left transition ${
                          data.status === s.status
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white'
                            : 'border-white/10 bg-[#070F1E] text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="block font-black text-sm">{s.label}</span>
                        <span className="text-[11px] opacity-75">{s.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Publish readiness reminder */}
                {data.status !== 'DRAFT' && data.status !== 'ARCHIVED' && completeness.score < 60 && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-amber-300">Low Readiness Score ({completeness.score}%)</p>
                      <p className="text-xs text-amber-400/80 mt-1">
                        This tour will be visible to customers but may underperform in search rankings and conversions.
                        Complete more fields to improve your score to at least 60%.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'completeness' && (
              <div className="space-y-6">
                <div className="rounded-xl border border-white/10 bg-[#070F1E] p-6 text-center">
                  <div className="text-4xl font-black text-[#00E5FF] mb-2">{completeness.score}%</div>
                  <h3 className="text-lg font-bold text-white mb-1">Tour Health & Completeness Audit</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    A higher score improves conversion, customer satisfaction, and international SEO ranking.
                  </p>
                </div>

                <div className="space-y-2">
                  {completeness.checks.map((c, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${
                        c.complete
                          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300'
                          : 'border-amber-500/20 bg-amber-500/5 text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {c.complete ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                        )}
                        <span>{c.name}: {c.message}</span>
                      </div>
                      <span className="font-mono opacity-60">+{c.weight} pts</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => handleSave('DRAFT')}
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave('ACTIVE')}
                    className="rounded-xl bg-[#00E5FF] px-6 py-2.5 text-xs font-black text-[#070F1E] hover:opacity-90"
                  >
                    Publish to Global Catalog
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">Tour Variants (Phase 11)</h3>
                      <p className="text-xs text-slate-400">Offer multiple service tiers (Standard, VIP, Sunset, Private Boat) on the same tour</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariant: TourVariant = {
                          id: `var-${Date.now()}`,
                          name: 'VIP Experience',
                          description: 'Upgraded lounge seating, private snorkeling guide, and priority boarding',
                          priceAdult: (data.adultPrice || 45) + 20,
                          isDefault: false,
                        };
                        updateData({ variants: [...(data.variants || []), newVariant] });
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-500/20 transition"
                    >
                      <Plus className="w-4 h-4" />
                      Add Variant
                    </button>
                  </div>

                  {(!data.variants || data.variants.length === 0) ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                      No variants defined. The tour will use the default standard pricing tier.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.variants.map((v, i) => (
                        <div key={v.id} className="rounded-xl border border-white/10 bg-[#070F1E] p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={v.name}
                              onChange={(e) => {
                                const updated = [...(data.variants || [])];
                                updated[i] = { ...v, name: e.target.value };
                                updateData({ variants: updated });
                              }}
                              placeholder="Variant name"
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={v.description || ''}
                              onChange={(e) => {
                                const updated = [...(data.variants || [])];
                                updated[i] = { ...v, description: e.target.value };
                                updateData({ variants: updated });
                              }}
                              placeholder="Description"
                              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">Adult $:</span>
                              <input
                                type="number"
                                value={v.priceAdult ?? 0}
                                onChange={(e) => {
                                  const updated = [...(data.variants || [])];
                                  updated[i] = { ...v, priceAdult: parseFloat(e.target.value) || 0 };
                                  updateData({ variants: updated });
                                }}
                                className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (data.variants || []).filter((_, idx) => idx !== i);
                              updateData({ variants: updated });
                            }}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 pt-4">
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1">
                    Special Operations Directives
                  </label>
                  <textarea
                    rows={4}
                    value={data.internalNotes || ''}
                    onChange={(e) => updateData({ internalNotes: e.target.value })}
                    placeholder="Custom operational guidelines, seasonal blackout notes, or special handling rules."
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white focus:border-[#00E5FF] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Section Navigator */}
          <div className="border-t border-white/10 pt-5 mt-8 flex items-center justify-between">
            {prevSection ? (
              <button
                type="button"
                onClick={() => setActiveSection(prevSection.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
              >
                ← {prevSection.shortLabel}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">
                Section {currentIndex + 1} of {displayedSections.length}
              </span>
            </div>

            {nextSection ? (
              <button
                type="button"
                onClick={() => setActiveSection(nextSection.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#00E5FF] hover:text-cyan-300 transition"
              >
                {nextSection.shortLabel} →
              </button>
            ) : <div />}
          </div>
        </main>
      </div>

      {/* Global Tour Template Library Modal (Phase 12) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Global Tour Template Library</h3>
                  <p className="text-xs text-slate-400">Instantly populate all 27 sections from a curated production preset</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white p-2 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TOUR_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between hover:border-[#00E5FF]/40 hover:bg-white/[0.05] transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{tmpl.icon}</span>
                      <span className="rounded-full bg-[#00E5FF]/10 px-2.5 py-0.5 text-[10px] font-black uppercase text-[#00E5FF]">
                        {tmpl.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition">
                      {tmpl.title}
                    </h4>
                    <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">
                      ${tmpl.price} · {tmpl.duration}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setData((prev) => applyTemplateToTourData(tmpl.id, prev));
                        setIsDirty(true);
                        setShowTemplateModal(false);
                        setSaveSuccessMessage(`Applied "${tmpl.title}" template! All 27 sections populated.`);
                      }}
                      className="rounded-xl bg-[#00E5FF] px-3 py-1.5 text-xs font-black text-[#070F1E] hover:opacity-90 transition"
                    >
                      Apply Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Import from Text Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-orange-500/20 bg-[#0B1528] p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white">Import Trip from Text</h3>
                <p className="text-xs text-slate-400 mt-0.5">Paste structured text or import the complete JSON template. Review every field before saving.</p>
              </div>
              <button type="button" onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white p-1 text-sm font-bold">✕</button>
            </div>

            {/* Template Example */}
            {!importPreview && (
              <details className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-[#00E5FF] hover:text-white transition">📋 See example template format</summary>
                <pre className="px-4 pb-4 text-[10px] text-slate-400 leading-relaxed whitespace-pre-wrap font-mono select-all">{`TITLE: Red Sea Snorkeling & Boat Adventure
DESTINATION: Hurghada
CATEGORY: SNORKELING
DURATION: 6
PRICE: 45
DESCRIPTION:
Discover the vibrant coral reefs of the Red Sea on this full-day snorkeling and boat trip departing from Hurghada Marina. Suitable for all levels.

HIGHLIGHTS:
- Swim with colorful reef fish at two prime snorkel spots
- Relax on a traditional wooden felucca boat
- Light lunch and refreshments included on board
- Professional bilingual guide (EN/DE)

INCLUSIONS:
- Hotel pickup and drop-off from Hurghada
- Snorkeling equipment (mask, fins, vest)
- Light lunch and soft drinks
- Entry fees and marine park permit

EXCLUSIONS:
- Alcoholic beverages
- Personal underwater photography
- Tips (optional)

ITINERARY:
08:00 - Hotel pickup across Hurghada
09:00 - Board boat at Hurghada Marina, safety briefing
10:00 - First snorkeling spot: Giftun Island reef
12:30 - Lunch on board
13:30 - Second snorkeling spot: Orange Bay lagoon
15:00 - Return to marina
15:30 - Hotel drop-off

CANCELLATION:
Full refund for cancellations made 48 hours or more before the tour start time.`}</pre>
              </details>
            )}

            {!importPreview && (
              <a
                href="/templates/talago-trip-template.json"
                download
                className="mb-4 inline-flex items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20"
              >
                <Download className="h-3.5 w-3.5" />
                Download complete JSON template
              </a>
            )}

            {/* Textarea */}
            {!importPreview && (
              <>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={14}
                  placeholder="Paste structured trip text or the downloaded JSON template here..."
                  className="w-full rounded-2xl border border-white/10 bg-[#060D1A] p-4 text-sm text-white placeholder-slate-500 focus:border-orange-500/40 focus:outline-none font-mono resize-y"
                />
                {importErrors.length > 0 && (
                  <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1">
                    {importErrors.map((e, i) => <p key={i} className="text-xs text-red-300">⚠ {e}</p>)}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-end gap-3">
                  <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 cursor-pointer hover:bg-white/10 transition">
                    <FileText className="h-3.5 w-3.5" />
                    Upload text or JSON
                    <input type="file" accept=".txt,.md,.json,application/json" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setImportText(ev.target?.result as string || '');
                        reader.readAsText(file);
                      }
                    }} />
                  </label>
                  <button
                    type="button"
                    disabled={!importText.trim()}
                    onClick={() => {
                      const text = importText;
                      const errors: string[] = [];
                      const trimmedText = text.trim();

                      // JSON templates preserve every supported editor field, including
                      // nested itinerary, options, booking questions and translations.
                      if (trimmedText.startsWith('{')) {
                        try {
                          const source = JSON.parse(trimmedText);
                          if (!source || typeof source !== 'object' || Array.isArray(source)) {
                            throw new Error('The JSON template must contain one trip object.');
                          }

                          const defaults = createDefaultTourEditorData();
                          const preview: Partial<TourEditorData> = {};
                          const own = Object.prototype.hasOwnProperty;
                          const importableKeys: Array<keyof TourEditorData> = [
                            ...(Object.keys(defaults) as Array<keyof TourEditorData>),
                            'originalPrice', 'privatePrice', 'costPerPerson', 'customBadge', 'region',
                            'durationDisplay', 'pickupDescription', 'meetingPointName', 'meetingPointAddress',
                            'meetingPointLat', 'meetingPointLng', 'meetingPointLandmark', 'meetingPointInstructions',
                            'meetingPointMapUrl', 'meetingPointImageUrl', 'vehicleType', 'boatType', 'transferNotes',
                            'fitnessLevel', 'mobilityNotes', 'accessibilityNotes', 'emergencyContact',
                            'cancellationPolicy', 'requirements', 'faqItems', 'operatorName', 'operatorPhone',
                            'operatorEmail', 'internalNotes', 'metaTitle', 'metaDescription',
                            'address', 'thumbnailUrl', 'videoUrl', 'imageAlt',
                          ];
                          for (const key of new Set(importableKeys)) {
                            if (own.call(source, key)) {
                              (preview as Record<string, unknown>)[key] = source[key];
                            }
                          }

                          if (source.translations && typeof source.translations === 'object' && !Array.isArray(source.translations)) {
                            preview.translations = {
                              ...defaults.translations,
                              ...source.translations,
                            } as TourEditorData['translations'];
                          }

                          const english = preview.translations?.en;
                          if (!english?.title?.trim()) errors.push('translations.en.title is required');
                          if (!english?.description?.trim()) errors.push('translations.en.description is required');
                          if (typeof preview.adultPrice !== 'number' || preview.adultPrice <= 0) errors.push('adultPrice is required and must be greater than zero');
                          if (typeof preview.durationHours !== 'number' || preview.durationHours <= 0) errors.push('durationHours is required and must be greater than zero');
                          if (typeof preview.maxCapacity !== 'number' || preview.maxCapacity <= 0) errors.push('maxCapacity is required and must be greater than zero');

                          setImportErrors(errors);
                          if (errors.length === 0) setImportPreview(preview);
                          return;
                        } catch (error) {
                          setImportErrors([error instanceof Error ? error.message : 'Invalid JSON template.']);
                          return;
                        }
                      }

                      const get = (key: string) => {
                        const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'im'));
                        return m ? m[1].trim() : '';
                      };
                      const getBlock = (key: string) => {
                        const m = text.match(new RegExp(`^${key}:\\s*\\n([\\s\\S]*?)(?=\\n[A-Z]+:|$)`, 'im'));
                        return m ? m[1].trim() : '';
                      };
                      const getBullets = (key: string) =>
                        getBlock(key).split('\n').map(l => l.replace(/^[-*•]\s*/, '').trim()).filter(Boolean);
                      const title = get('TITLE');
                      const price = parseFloat(get('PRICE') || '0');
                      const duration = parseFloat(get('DURATION') || '0');
                      const category = get('CATEGORY').toUpperCase();
                      const description = getBlock('DESCRIPTION');
                      const highlights = getBullets('HIGHLIGHTS');
                      const inclusions = getBullets('INCLUSIONS');
                      const exclusions = getBullets('EXCLUSIONS');
                      const cancellation = getBlock('CANCELLATION');
                      // Parse itinerary lines like "HH:MM - Description"
                      const itBlock = getBlock('ITINERARY');
                      const itLines = itBlock.split('\n').map(l => l.trim()).filter(Boolean);
                      const itinerary: ItineraryMilestone[] = itLines.map((line, idx) => {
                        const m = line.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(.+)/);
                        const milestone = createEmptyMilestone();
                        return {
                          ...milestone,
                          id: `imp-${idx}-${Date.now()}`,
                          timeTag: m ? m[1] : `${idx + 1}`,
                          title: {
                            ...milestone.title,
                            en: m ? m[2].trim() : line,
                          },
                        };
                      });
                      if (!title) errors.push('TITLE is required');
                      if (!price) errors.push('PRICE is required (a number, e.g. 45)');
                      if (!duration) errors.push('DURATION is required (hours, e.g. 6)');
                      setImportErrors(errors);
                      if (errors.length === 0) {
                        const preview: Partial<TourEditorData> = {
                          translations: {
                            en: { ...createDefaultLocalizedContent(), title, description, highlights, inclusions, exclusions, cancellationPolicy: cancellation },
                            de: createDefaultLocalizedContent(),
                            ru: createDefaultLocalizedContent(),
                            fr: createDefaultLocalizedContent(),
                            it: createDefaultLocalizedContent(),
                            pl: createDefaultLocalizedContent(),
                            es: createDefaultLocalizedContent(),
                            uk: createDefaultLocalizedContent(),
                          } as any,
                          adultPrice: price,
                          basePriceUSD: price,
                          durationHours: duration,
                          category: category as any,
                          highlights,
                          inclusions,
                          exclusions,
                          itinerary,
                        };
                        setImportPreview(preview);
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-40 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Parse &amp; Preview
                  </button>
                </div>
              </>
            )}

            {/* Preview */}
            {importPreview && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-300">Parsed successfully — review before applying</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-500">Title:</span> <span className="text-white font-medium">{(importPreview.translations as any)?.en?.title}</span></div>
                    <div><span className="text-slate-500">Price:</span> <span className="text-white font-medium">${importPreview.adultPrice}</span></div>
                    <div><span className="text-slate-500">Duration:</span> <span className="text-white font-medium">{importPreview.durationHours}h</span></div>
                    <div><span className="text-slate-500">Category:</span> <span className="text-white font-medium">{importPreview.category}</span></div>
                    <div><span className="text-slate-500">Highlights:</span> <span className="text-white font-medium">{importPreview.highlights?.length || 0} items</span></div>
                    <div><span className="text-slate-500">Itinerary:</span> <span className="text-white font-medium">{importPreview.itinerary?.length || 0} stops</span></div>
                  </div>
                  {(importPreview.translations as any)?.en?.description && (
                    <p className="text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-2">{(importPreview.translations as any).en.description.substring(0, 200)}…</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setImportPreview(null)} className="text-xs font-bold text-slate-400 hover:text-white transition">
                    ← Edit text
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setData((prev) => ({
                        ...prev,
                        ...importPreview,
                        translations: {
                          ...prev.translations,
                          ...(importPreview.translations || {}),
                        },
                        highlights: importPreview.highlights || prev.highlights,
                        inclusions: importPreview.inclusions || prev.inclusions,
                        exclusions: importPreview.exclusions || prev.exclusions,
                        itinerary: importPreview.itinerary || prev.itinerary,
                      }));
                      setIsDirty(true);
                      setShowImportModal(false);
                      setSaveSuccessMessage('Trip imported successfully! Review all fields, then save.');
                    }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-2.5 text-xs font-black text-white hover:opacity-90 transition"
                  >
                    <Rocket className="h-3.5 w-3.5" />
                    Apply to Editor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
