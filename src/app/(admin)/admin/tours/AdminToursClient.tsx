'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import {
  Edit3,
  Plus,
  Search,
  Ship,
  Trash2,
  X,
  Loader2,
  Upload,
  Clock,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ImageIcon,
  Eye,
  Star,
  MapPin,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TourTranslation {
  title: string;
  description: string;
  cancellationPolicies: string[];
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  cardExcerpt: string;
  whatToBring: string;
  pickupDescription: string;
  cancellationPolicy: string;
}

interface ItineraryStep {
  id: string;
  timeTag: string;
  activity: string;
  inclusions: string;
}

interface Tour {
  id: string;
  slug: string;
  type: string;
  category: string | null;
  adultPrice: number;
  basePriceUSD: number;
  status: string;
  translations: unknown;
  coverImage: string | null;
  destinationId: string;
  zoneId: string;
  maxCapacity: number;
  durationHours: number;
  destination: { name: string };
  allowDeposit?: boolean;
  depositPercentage?: number;
  allowPayAtLocation?: boolean;
  pickupTime?: string;
  pickupDescription?: string;
  whatToBring?: string;
  cancellationPolicy?: string;
  hotelPickupIncluded?: boolean;
  childPrice?: number | null;
  childMinAge?: number | null;
  childMaxAge?: number | null;
  infantPrice?: number | null;
  infantMinAge?: number | null;
  infantMaxAge?: number | null;
  ageRestrictionsNotes?: string | null;
  itinerary?: ItineraryStep[];
  cardExcerpt?: string;
  showExcerptOnCard?: boolean;
  reviews?: { customerName: string; rating: number; comment: string }[];
  ratingAverage?: number;
  ratingCount?: number;
}

interface AdminToursClientProps {
  initialTours: Tour[];
  destinations: { id: string; name: string }[];
  zones: { id: string; name: string }[];
}

type LanguageTab = 'en' | 'de' | 'ru' | 'it' | 'fr' | 'pl' | 'es';

const LANGUAGE_TABS: LanguageTab[] = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];

function createEmptyTranslations(): Record<string, TourTranslation> {
  const empty: TourTranslation = { title: '', description: '', cancellationPolicies: [], highlights: [], inclusions: [], exclusions: [], cardExcerpt: '', whatToBring: '', pickupDescription: '', cancellationPolicy: '' };
  return Object.fromEntries(LANGUAGE_TABS.map((l) => [l, { ...empty }]));
}

function createEmptyStep(): ItineraryStep {
  return {
    id: crypto.randomUUID(),
    timeTag: '09:00 AM',
    activity: '',
    inclusions: '',
  };
}

// ---------------------------------------------------------------------------
// Cover Image Dropzone Component
// ---------------------------------------------------------------------------

function StringListInput({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  return (
    <div>
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <div className="space-y-2">
        {values.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => {
                const updated = [...values];
                updated[idx] = e.target.value;
                onChange(updated);
              }}
              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-[#06B6D4]"
            />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, i) => i !== idx))}
              className="rounded-2xl px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (draft.trim()) { onChange([...values, draft.trim()]); setDraft(''); }
              }
            }}
            placeholder={placeholder || `Add ${label.toLowerCase()}`}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
          />
          <button
            type="button"
            onClick={() => { if (draft.trim()) { onChange([...values, draft.trim()]); setDraft(''); } }}
            className="rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-4 py-3 text-sm font-bold text-[#06B6D4]"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverImageDropzone({
  currentUrl,
  onUploaded,
  uploading,
  setUploading,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadError(null);
      setPreviewUrl(URL.createObjectURL(file));
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || 'Upload failed');
        }

        const data = await res.json();
        const uploaded = data.uploaded?.[0];
        onUploaded(uploaded?.url || '');
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
        setPreviewUrl(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploaded, setUploading],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  const displayUrl = previewUrl || currentUrl;

  return (
    <div className="space-y-2">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Cover Image
      </span>
      <div
        {...getRootProps()}
        className={`relative flex min-h-[160px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragActive
            ? 'border-[#06B6D4] bg-[#06B6D4]/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {displayUrl ? (
          <div className="relative h-40 w-full">
            <img
              src={displayUrl}
              alt="Cover preview"
              className="h-full w-full rounded-xl object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity duration-200 hover:opacity-100">
              <p className="text-sm font-bold text-white">Drop to replace</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-[#06B6D4]" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-slate-500" />
                <p className="text-sm text-slate-400">
                  {isDragActive ? 'Drop image here...' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-slate-600">JPG, PNG, WebP • Max 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
      {uploadError && (
        <p className="text-xs text-red-400">{uploadError}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gallery Add Button Component
// ---------------------------------------------------------------------------

function GalleryAddButton({
  onImagesAdded,
  uploading,
  setUploading,
}: {
  onImagesAdded: (urls: string[]) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setUploadError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        for (const file of acceptedFiles) {
          formData.append('files', file);
        }

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || 'Upload failed');
        }

        const data = await res.json();
        const urls: string[] = (data.uploaded || []).map((u: { url: string }) => u.url);
        if (urls.length > 0) {
          onImagesAdded(urls);
        }
        if (data.errors?.length > 0) {
          setUploadError(`${data.errors.length} file(s) failed`);
        }
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onImagesAdded, setUploading],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`flex aspect-square cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
          isDragActive
            ? 'border-[#06B6D4] bg-[#06B6D4]/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#06B6D4]" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Plus className="h-5 w-5 text-slate-500" />
            <span className="text-[10px] text-slate-500">Add Images</span>
          </div>
        )}
      </div>
      {uploadError && <p className="mt-1 text-[10px] text-red-400">{uploadError}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Carousel Images Component
// ---------------------------------------------------------------------------

function CarouselImages({
  images,
  isHovered,
  tourId,
}: {
  images: string[];
  isHovered: boolean;
  tourId: string;
}) {
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
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
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

// ---------------------------------------------------------------------------
// Live Preview Modal Component
// ---------------------------------------------------------------------------

function TourPreviewModal({
  tour,
  onClose,
  getTourTitle,
}: {
  tour: Tour;
  onClose: () => void;
  getTourTitle: (t: unknown) => string;
}) {
  const translations = tour.translations as Record<string, { title?: string; description?: string }> | null;
  const description = translations?.en?.description ?? '';

  const gallery = ((tour as unknown as { galleryImages?: (string | null)[] }).galleryImages || []).filter(Boolean) as string[];
  const allImages = [tour.coverImage, ...gallery].filter((x): x is string => typeof x === 'string' && x.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 bg-[#070F1E] shadow-2xl shadow-black/80"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Preview header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#070F1E]/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Eye className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Live Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 p-2 text-slate-400 transition-all hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Preview content */}
        <div className="p-6">
          {/* Hero image */}
          <div className="relative mb-6 aspect-[16/7] overflow-hidden rounded-2xl bg-white/[0.02]">
            {tour.coverImage ? (
              <img src={tour.coverImage} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="h-12 w-12 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070F1E]/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <h2 className="text-2xl font-black text-white">{getTourTitle(tour.translations)}</h2>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-[#06B6D4]" />
                {tour.destination?.name || 'Hub'} &middot; {tour.durationHours}h &middot; ${tour.adultPrice.toFixed(0)}
              </p>
            </div>
          </div>

          {/* Gallery strip */}
          {allImages.length > 1 && (
            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Gallery</p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {allImages.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-xl object-cover"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Description</p>
            <p className="text-sm leading-relaxed text-slate-300">
              {description || 'No description available.'}
            </p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-[#0B1528] p-5">
            <div>
              <span className="text-xs text-slate-500">Status</span>
              <p className="font-bold text-white">{tour.status}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Category</span>
              <p className="font-bold text-white">{tour.category || tour.type}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Price</span>
              <p className="font-bold text-white">${tour.adultPrice.toFixed(0)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Capacity</span>
              <p className="font-bold text-white">{tour.maxCapacity} pax</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Itinerary Builder Component
// ---------------------------------------------------------------------------

function ItineraryBuilderSection({
  steps,
  onChange,
}: {
  steps: ItineraryStep[];
  onChange: (steps: ItineraryStep[]) => void;
}) {
  function addStep() {
    onChange([...steps, createEmptyStep()]);
  }

  function removeStep(id: string) {
    onChange(steps.filter((s) => s.id !== id));
  }

  function updateStep(id: string, field: keyof Omit<ItineraryStep, 'id'>, value: string) {
    onChange(steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  function moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const newSteps = [...steps];
    const tmp = newSteps[index];
    newSteps[index] = newSteps[newIndex];
    newSteps[newIndex] = tmp;
    onChange(newSteps);
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#06B6D4]" />
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
            Itinerary Builder
          </h3>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#06B6D4]/10 px-3 py-1.5 text-xs font-black text-[#06B6D4] transition-all hover:bg-[#06B6D4]/20"
        >
          <Plus className="h-3 w-3" />
          Add Step
        </button>
      </div>

      {steps.length === 0 && (
        <p className="py-6 text-center text-sm text-slate-600">
          No itinerary steps yet. Click &quot;Add Step&quot; to begin building the day schedule.
        </p>
      )}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className="group flex gap-3 rounded-2xl border border-white/5 bg-[#070F1E]/60 p-4 transition-all hover:border-white/10"
          >
            {/* Reorder Controls */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <GripVertical className="h-4 w-4 text-slate-600" />
              <button
                type="button"
                onClick={() => moveStep(index, -1)}
                disabled={index === 0}
                className="rounded p-0.5 text-slate-600 transition-colors hover:text-white disabled:opacity-30"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => moveStep(index, 1)}
                disabled={index === steps.length - 1}
                className="rounded p-0.5 text-slate-600 transition-colors hover:text-white disabled:opacity-30"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Fields */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-3">
                <input
                  type="text"
                  placeholder="05:00 AM"
                  value={step.timeTag}
                  onChange={(e) => updateStep(step.id, 'timeTag', e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                />
                <input
                  type="text"
                  placeholder="Activity description (e.g., Sunrise dolphin watching)"
                  value={step.activity}
                  onChange={(e) => updateStep(step.id, 'activity', e.target.value)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                />
              </div>
              <input
                type="text"
                placeholder="Inclusions (comma-separated, e.g., Snorkeling gear, Breakfast, Guide)"
                value={step.inclusions}
                onChange={(e) => updateStep(step.id, 'inclusions', e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
              />
            </div>

            {/* Delete */}
            <button
              type="button"
              onClick={() => removeStep(step.id)}
              className="mt-1 rounded-full p-1.5 text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export default function AdminToursClient({ initialTours, destinations, zones }: AdminToursClientProps) {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [uploading, setUploading] = useState(false);

  // Sync server-fetched tours back into state when router.refresh() re-renders the server component
  useEffect(() => { setTours(initialTours); }, [initialTours]);

  // Form Fields
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('SHARED');
  const [category, setCategory] = useState('sea');
  const [adultPrice, setAdultPrice] = useState(100);

  // Child pricing
  const [childEnabled, setChildEnabled] = useState(false);
  const [childPrice, setChildPrice] = useState(0);
  const [childMinAge, setChildMinAge] = useState(3);
  const [childMaxAge, setChildMaxAge] = useState(11);

  // Infant pricing
  const [infantEnabled, setInfantEnabled] = useState(false);
  const [infantPrice, setInfantPrice] = useState(0);
  const [infantMinAge, setInfantMinAge] = useState(0);
  const [infantMaxAge, setInfantMaxAge] = useState(2);
  const [ageRestrictionsNotes, setAgeRestrictionsNotes] = useState('');
  const [durationHours, setDurationHours] = useState(6);
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [destinationId, setDestinationId] = useState(destinations[0]?.id || '');
  const [zoneId, setZoneId] = useState(zones[0]?.id || '');
  const [status, setStatus] = useState('INACTIVE');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [itinerarySteps, setItinerarySteps] = useState<ItineraryStep[]>([]);
  const [previewTour, setPreviewTour] = useState<Tour | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [allowDeposit, setAllowDeposit] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(100);
  const [allowPayAtLocation, setAllowPayAtLocation] = useState(true);

  const [pickupTime, setPickupTime] = useState('');
  const [hotelPickupIncluded, setHotelPickupIncluded] = useState(false);
  const [draftTime, setDraftTime] = useState('');
  const [showExcerptOnCard, setShowExcerptOnCard] = useState(true);

  // Seeded reviews
  const [seededReviews, setSeededReviews] = useState<{ customerName: string; rating: number; comment: string }[]>([]);

  const [translations, setTranslations] = useState<Record<string, TourTranslation>>(createEmptyTranslations());

  function getTourTitle(tourTranslations: unknown): string {
    const value = tourTranslations as Record<string, { title?: string }> | null;
    return value?.en?.title ?? 'Untitled Experience';
  }

  function resetFormState() {
    setSlug('');
    setType('SHARED');
    setCategory('sea');
    setAdultPrice(100);
    setChildEnabled(false);
    setChildPrice(0);
    setChildMinAge(3);
    setChildMaxAge(11);
    setInfantEnabled(false);
    setInfantPrice(0);
    setInfantMinAge(0);
    setInfantMaxAge(2);
    setAgeRestrictionsNotes('');
    setDurationHours(6);
    setMaxCapacity(25);
    setDestinationId(destinations[0]?.id || '');
    setZoneId(zones[0]?.id || '');
    setStatus('INACTIVE');
    setCoverImage('');
    setGalleryImages([]);
    setItinerarySteps([]);
    setAllowDeposit(false);
    setDepositPercentage(100);
    setAllowPayAtLocation(true);
    setPickupTime('');
    setHotelPickupIncluded(false);
    setDraftTime('');
    setShowExcerptOnCard(true);
    setSeededReviews([]);
    setTranslations(createEmptyTranslations());
    setError(null);
    setActiveTab('en');
  }

  function handleOpenCreate() {
    setEditingTour(null);
    resetFormState();
    setModalOpen(true);
  }

  function handleOpenEdit(tour: Tour) {
    setEditingTour(tour);
    setSlug(tour.slug);
    setType(tour.type);
    setCategory(tour.category || 'sea');
    setAdultPrice(tour.adultPrice);
    setDurationHours(tour.durationHours);
    setMaxCapacity(tour.maxCapacity);
    setDestinationId(tour.destinationId);
    setZoneId(tour.zoneId);
    setStatus(tour.status);
    setCoverImage(tour.coverImage || '');
    setGalleryImages(((tour as unknown as { galleryImages?: (string | null)[] }).galleryImages || []).filter(Boolean) as string[]);
    setAllowDeposit(tour.allowDeposit ?? false);
    setDepositPercentage(tour.depositPercentage ?? 100);
    setAllowPayAtLocation(tour.allowPayAtLocation ?? true);

    const logisticData = tour as unknown as { pickupTime?: string; pickupDescription?: string; whatToBring?: string; cancellationPolicy?: string; hotelPickupIncluded?: boolean };
    setPickupTime(logisticData.pickupTime || '');
    setHotelPickupIncluded(logisticData.hotelPickupIncluded ?? false);
    setDraftTime('');

    // Pricing
    const hasChild = tour.childPrice !== null && tour.childPrice !== undefined && tour.childPrice > 0;
    setChildEnabled(hasChild);
    setChildPrice(tour.childPrice ?? 0);
    setChildMinAge(tour.childMinAge ?? 3);
    setChildMaxAge(tour.childMaxAge ?? 11);
    const hasInfant = tour.infantPrice !== null && tour.infantPrice !== undefined && tour.infantPrice > 0;
    setInfantEnabled(hasInfant);
    setInfantPrice(tour.infantPrice ?? 0);
    setInfantMinAge(tour.infantMinAge ?? 0);
    setInfantMaxAge(tour.infantMaxAge ?? 2);
    setAgeRestrictionsNotes(tour.ageRestrictionsNotes ?? '');

    // Marketing fields
    const tourData = tour as unknown as { highlights?: string[]; inclusions?: string[]; exclusions?: string[]; cardExcerpt?: string; showExcerptOnCard?: boolean; reviews?: { customerName: string; rating: number; comment: string }[] };
    setShowExcerptOnCard(tourData.showExcerptOnCard ?? true);
    setSeededReviews(tourData.reviews ?? []);

    const originalTranslations = tour.translations as Record<string, TourTranslation>;
    const newTranslations: Record<string, TourTranslation> = {};
    for (const lang of LANGUAGE_TABS) {
      const orig = originalTranslations?.[lang];
      newTranslations[lang] = {
        title: orig?.title || '',
        description: orig?.description || '',
        cancellationPolicies: orig?.cancellationPolicies || [],
        highlights: orig?.highlights || [],
        inclusions: orig?.inclusions || [],
        exclusions: orig?.exclusions || [],
        cardExcerpt: orig?.cardExcerpt || '',
        whatToBring: orig?.whatToBring || '',
        pickupDescription: orig?.pickupDescription || '',
        cancellationPolicy: orig?.cancellationPolicy || '',
      };
    }
    // Seed English from legacy columns for backward compatibility with old tours
    if (!newTranslations.en.highlights.length && Array.isArray(tourData.highlights)) newTranslations.en.highlights = [...tourData.highlights];
    if (!newTranslations.en.inclusions.length && Array.isArray(tourData.inclusions)) newTranslations.en.inclusions = [...tourData.inclusions];
    if (!newTranslations.en.exclusions.length && Array.isArray(tourData.exclusions)) newTranslations.en.exclusions = [...tourData.exclusions];
    if (!newTranslations.en.cardExcerpt && tourData.cardExcerpt) newTranslations.en.cardExcerpt = tourData.cardExcerpt;
    if (!newTranslations.en.whatToBring && logisticData.whatToBring) newTranslations.en.whatToBring = logisticData.whatToBring;
    if (!newTranslations.en.pickupDescription && logisticData.pickupDescription) newTranslations.en.pickupDescription = logisticData.pickupDescription;
    if (!newTranslations.en.cancellationPolicy && logisticData.cancellationPolicy) newTranslations.en.cancellationPolicy = logisticData.cancellationPolicy;
    setTranslations(newTranslations);

    // Parse existing itinerary if available
    const itineraryData = tour as unknown as { itinerary?: ItineraryStep[] };
    if (Array.isArray(itineraryData.itinerary)) {
      setItinerarySteps(itineraryData.itinerary.map((s) => ({
        id: s.id || crypto.randomUUID(),
        timeTag: s.timeTag || '',
        activity: s.activity || '',
        inclusions: s.inclusions || '',
      })));
    } else {
      setItinerarySteps([]);
    }

    setError(null);
    setActiveTab('en');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug || !destinationId || !zoneId) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!translations.en.title || !translations.en.description) {
      setError('English title and description are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      slug,
      type,
      category,
      adultPrice,
      basePriceUSD: adultPrice,
      childEnabled,
      childPrice: childEnabled ? childPrice : null,
      childMinAge: childEnabled ? childMinAge : null,
      childMaxAge: childEnabled ? childMaxAge : null,
      infantEnabled,
      infantPrice: infantEnabled ? infantPrice : null,
      infantMinAge: infantEnabled ? infantMinAge : null,
      infantMaxAge: infantEnabled ? infantMaxAge : null,
      ageRestrictionsNotes: ageRestrictionsNotes || null,
      durationHours,
      maxCapacity,
      destinationId,
      zoneId,
      status,
      coverImage: coverImage || null,
      galleryImages: galleryImages,
      itinerary: itinerarySteps.length > 0 ? itinerarySteps : null,
      allowDeposit,
      depositPercentage,
      allowPayAtLocation,
      pickupTime: pickupTime || null,
      hotelPickupIncluded,
      highlights: translations.en.highlights?.length > 0 ? translations.en.highlights : undefined,
      inclusions: translations.en.inclusions?.length > 0 ? translations.en.inclusions : undefined,
      exclusions: translations.en.exclusions?.length > 0 ? translations.en.exclusions : undefined,
      cardExcerpt: translations.en.cardExcerpt || undefined,
      whatToBring: translations.en.whatToBring || null,
      pickupDescription: translations.en.pickupDescription || null,
      cancellationPolicy: translations.en.cancellationPolicy || null,
      showExcerptOnCard,
      displayExcerpt: showExcerptOnCard,
      reviews: seededReviews.length > 0 ? seededReviews : undefined,
      translations: {
        en: { ...translations.en },
        de: { ...translations.de },
        ru: { ...translations.ru },
        it: { ...translations.it },
        fr: { ...translations.fr },
        pl: { ...translations.pl },
        es: { ...translations.es },
      },
    };

    try {
      const url = editingTour ? `/api/admin/tours/${editingTour.id}` : '/api/admin/tours/create';
      const method = editingTour ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save experience');
      }

      // Refresh server component data (includes ALL tours, active & inactive) so the
      // admin list always shows the saved tour with its updated coverImage/status.
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(tourId: string) {
    if (!confirm('Are you absolutely sure you want to delete this experience?')) return;

    try {
      const response = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tour');
      }

      setTours((prev) => prev.filter((t) => t.id !== tourId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete experience');
    }
  }

  const filtered = tours.filter((t) => {
    const matchesSearch =
      getTourTitle(t.translations).toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesDest = selectedDestination === 'All' || t.destination.name === selectedDestination;
    return matchesSearch && matchesDest;
  });

  return (
    <main className="min-h-screen bg-[#070F1E] px-6 py-8 text-[#F8FAFC] lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#06B6D4]">Experience Studio</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">Tour Command Library</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Manage sea trips, safari products, destination assignment, pricing posture, and live catalog status.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-5 py-3 text-sm font-black text-[#070F1E] transition-all duration-300 ease-in-out hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </button>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search experiences..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#070F1E]/70 pl-11 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-[#06B6D4]"
              />
            </div>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#070F1E]/70 px-4 py-3 text-sm font-bold text-slate-300 outline-none"
            >
              <option value="All">All destinations</option>
              {destinations.map((dest) => (
                <option key={dest.id} value={dest.name}>
                  {dest.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Tours Card Grid */}
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filtered.map((tour) => {
            const gallery = ((tour as unknown as { galleryImages?: (string | null)[] }).galleryImages || []).filter(Boolean) as string[];
            const allImages = [tour.coverImage, ...gallery].filter((x): x is string => typeof x === 'string' && x.length > 0);

            return (
              <div
                key={tour.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#06B6D4]/35"
                onMouseEnter={() => setHoveredCardId(tour.id)}
                onMouseLeave={() => setHoveredCardId(null)}
              >
                {/* Image carousel */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-white/[0.02]">
                  <CarouselImages
                    images={allImages}
                    isHovered={hoveredCardId === tour.id}
                    tourId={tour.id}
                  />

                  {/* Category badge */}
                  <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#070F1E]/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#EAB308] backdrop-blur-md">
                    {tour.category || tour.type}
                  </div>

                  {/* Status badge */}
                  <div className="absolute right-4 top-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black ${
                        tour.status === 'ACTIVE'
                          ? 'bg-emerald-400/10 text-emerald-300'
                          : 'bg-[#EAB308]/10 text-[#EAB308]'
                      }`}
                    >
                      {tour.status}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3 className="mb-1 line-clamp-2 min-h-[2.5rem] text-base font-black leading-tight text-white transition-colors group-hover:text-[#06B6D4]">
                    {getTourTitle(tour.translations)}
                  </h3>
                  <p className="mb-1 text-xs text-slate-500">/{tour.slug}</p>

                  <div className="mb-4 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-[#06B6D4]" />
                      {tour.destination?.name || 'Hub'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-[#EAB308]" />
                      {tour.durationHours}h
                    </span>
                  </div>

                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                        Starting at
                      </span>
                      <p className="text-xl font-black text-white">
                        ${tour.adultPrice.toFixed(0)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{tour.maxCapacity} pax</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tour)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-black text-slate-200 transition-all hover:border-[#06B6D4]/40 hover:text-[#06B6D4]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Manage
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTour(tour)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-xs font-black text-slate-200 transition-all hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tour.id)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:border-red-400/30 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Ship className="h-8 w-8 text-slate-500" />
              </div>
              <p className="text-lg font-bold text-white">No experiences match your search criteria</p>
              <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter.</p>
            </div>
          )}
        </section>
      </div>

      {/* Live Preview Modal */}
      {previewTour && (
        <TourPreviewModal tour={previewTour} onClose={() => setPreviewTour(null)} getTourTitle={getTourTitle} />
      )}

      {/* Dynamic Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white/10 bg-[#070F1E] p-8 shadow-2xl shadow-black/80">
            <div className="mb-8 flex items-center justify-between border-b border-white/5 pb-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#EAB308]">Experience Studio</p>
                <h2 className="mt-2 text-3xl font-black text-white">
                  {editingTour ? 'Modify Experience' : 'Define New Experience'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-white/10 p-2.5 text-slate-400 transition-all hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tabbed Localized Inputs */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5">
                <div className="mb-5 flex gap-2 border-b border-white/5 pb-3">
                  {LANGUAGE_TABS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveTab(lang)}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === lang ? 'bg-[#06B6D4] text-[#070F1E]' : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>

                {LANGUAGE_TABS.map((lang) => (
                  <div key={lang} className={lang === activeTab ? '' : 'hidden'}>
                    <div className="space-y-5">
                      {/* Title */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Title {lang === 'en' && <span className="text-red-400">*</span>}
                        </label>
                        <input
                          type="text"
                          value={translations[lang].title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], title: val } }));
                            if (!editingTour && lang === 'en') {
                              setSlug(val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-'));
                            }
                          }}
                          placeholder={`Tour title (${lang.toUpperCase()})`}
                          className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#06B6D4]"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Description {lang === 'en' && <span className="text-red-400">*</span>}
                        </label>
                        <textarea
                          rows={4}
                          value={translations[lang].description}
                          onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], description: e.target.value } }))}
                          placeholder={`Tour description (${lang.toUpperCase()})`}
                          className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#06B6D4]"
                        />
                      </div>

                      {/* Card Excerpt */}
                      <div>
                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Card Excerpt ({lang.toUpperCase()})
                        </label>
                        <textarea
                          rows={3}
                          value={translations[lang].cardExcerpt}
                          onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], cardExcerpt: e.target.value } }))}
                          placeholder="A brief, enticing summary shown on tour cards"
                          className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                        />
                      </div>

                      {/* Highlights & Details */}
                      <div className="border-t border-white/5 pt-4">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Highlights &amp; Details ({lang.toUpperCase()})
                        </label>
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                          <StringListInput label="Highlights" values={translations[lang].highlights}
                            onChange={(v) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], highlights: v } }))}
                            placeholder="e.g. Snorkeling at Giftun Island" />
                          <StringListInput label="Inclusions" values={translations[lang].inclusions}
                            onChange={(v) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], inclusions: v } }))}
                            placeholder="e.g. Lunch, transfers, guide" />
                          <StringListInput label="Exclusions" values={translations[lang].exclusions}
                            onChange={(v) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], exclusions: v } }))}
                            placeholder="e.g. Personal expenses" />
                        </div>
                      </div>

                      {/* Logistics Text */}
                      <div className="border-t border-white/5 pt-4">
                        <label className="mb-3 block text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                          Logistics &amp; Information ({lang.toUpperCase()})
                        </label>
                        <div className="space-y-4">
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                              What to Bring / Info
                            </label>
                            <textarea
                              rows={3}
                              value={translations[lang].whatToBring}
                              onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], whatToBring: e.target.value } }))}
                              placeholder="Swimsuit, towel, sunscreen, comfortable shoes, camera..."
                              className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                              Pickup / Meeting Point Description
                            </label>
                            <input
                              type="text"
                              value={translations[lang].pickupDescription}
                              onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], pickupDescription: e.target.value } }))}
                              placeholder="e.g. Main entrance of Hurghada Marina"
                              className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                              Cancellation Policy
                            </label>
                            <textarea
                              rows={2}
                              value={translations[lang].cancellationPolicy}
                              onChange={(e) => setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], cancellationPolicy: e.target.value } }))}
                              placeholder="Free cancellation up to 24 hours before pickup..."
                              className="w-full resize-y rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cancellation Policies */}
                      <div className="border-t border-white/5 pt-4">
                        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                          Cancellation Policies
                        </label>
                        {translations[lang].cancellationPolicies.map((policy, idx) => (
                          <div key={idx} className="mb-2 flex gap-2">
                            <input
                              type="text"
                              value={policy}
                              onChange={(e) => {
                                const updated = [...translations[lang].cancellationPolicies];
                                updated[idx] = e.target.value;
                                setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], cancellationPolicies: updated } }));
                              }}
                              placeholder={`Policy ${idx + 1}`}
                              className="flex-1 rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3 text-sm text-white outline-none focus:border-[#06B6D4]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = translations[lang].cancellationPolicies.filter((_, i) => i !== idx);
                                setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], cancellationPolicies: updated } }));
                              }}
                              className="rounded-2xl px-4 py-2 text-sm text-red-400 transition-all hover:bg-red-500/10"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...translations[lang].cancellationPolicies, ''];
                            setTranslations((prev) => ({ ...prev, [lang]: { ...prev[lang], cancellationPolicies: updated } }));
                          }}
                          className="mt-1 rounded-2xl border border-[#06B6D4]/30 px-5 py-2.5 text-sm font-bold text-[#06B6D4] transition-all hover:bg-[#06B6D4]/10"
                        >
                          + Add Policy
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show Excerpt Toggle */}
              <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
                <span className="text-xs font-black uppercase tracking-[0.09em] text-slate-400">Display Excerpt on Public Tour Card</span>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={showExcerptOnCard}
                    onChange={(e) => setShowExcerptOnCard(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[#06B6D4] peer-checked:after:translate-x-5" />
                </label>
              </div>

              {/* Cover Image Dropzone */}
              <CoverImageDropzone
                currentUrl={coverImage}
                onUploaded={(url) => setCoverImage(url)}
                uploading={uploading}
                setUploading={setUploading}
              />

              {/* Multi-Image Gallery */}
              <div className="space-y-2">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                  Gallery Images ({galleryImages.length})
                </span>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {galleryImages.map((url, index) => (
                    <div key={index} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGalleryImages((prev) => prev.filter((_, i) => i !== index))}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <GalleryAddButton
                    onImagesAdded={(urls) => setGalleryImages((prev) => [...prev, ...urls])}
                    uploading={galleryUploading}
                    setUploading={setGalleryUploading}
                  />
                </div>
              </div>

              {/* Itinerary Builder */}
              <ItineraryBuilderSection
                steps={itinerarySteps}
                onChange={setItinerarySteps}
              />

              {/* Core Global Metadata */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">SEO URL Slug</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none focus:border-[#06B6D4]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Adult Base Price ($)</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adultPrice}
                    onChange={(e) => setAdultPrice(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none focus:border-[#06B6D4]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Destination Hub</span>
                  <select
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none"
                  >
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Pickup Zone</span>
                  <select
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Category Tag</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none"
                  >
                    <option value="sea">🌊 Sea Trips (All)</option>
                    <option value="snorkeling">🤿 Snorkeling</option>
                    <option value="diving">🐠 Diving</option>
                    <option value="boat_trip">⛵ Boat Trip</option>
                    <option value="safari">🦁 Safari / Desert (All)</option>
                    <option value="desert">🏜️ Desert</option>
                    <option value="adventure">🧗 Adventure</option>
                    <option value="city">🏙️ City Tour</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Catalog Visibility</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none"
                  >
                    <option value="INACTIVE">INACTIVE (Hidden)</option>
                    <option value="ACTIVE">ACTIVE (Published)</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Max Capacity (PAX)</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none focus:border-[#06B6D4]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Duration (Hours)</span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none focus:border-[#06B6D4]"
                  />
                </label>
              </div>

              {/* Payment Policy & Hybrid Posture */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                  Payment Policy & Hybrid Posture
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <span className="text-xs font-black uppercase tracking-[0.09em] text-slate-400">Allow Pay on Arrival</span>
                    <input
                      type="checkbox"
                      checked={allowPayAtLocation}
                      onChange={(e) => setAllowPayAtLocation(e.target.checked)}
                      className="h-5 w-5 rounded border-white/10 bg-[#070F1E] text-[#06B6D4] focus:ring-[#06B6D4]"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <span className="text-xs font-black uppercase tracking-[0.09em] text-slate-400">Enable Deposit</span>
                    <input
                      type="checkbox"
                      checked={allowDeposit}
                      onChange={(e) => setAllowDeposit(e.target.checked)}
                      className="h-5 w-5 rounded border-white/10 bg-[#070F1E] text-[#06B6D4] focus:ring-[#06B6D4]"
                    />
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Deposit Percentage (%)</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      disabled={!allowDeposit}
                      value={depositPercentage}
                      onChange={(e) => setDepositPercentage(Number(e.target.value))}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none focus:border-[#06B6D4] disabled:opacity-50"
                    />
                  </label>
                </div>
              </div>

              {/* Pricing & Age Tiers */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                  Pricing & Age Tiers
                </h3>

                {/* Child Tier */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                  <span className="text-xs font-black uppercase tracking-[0.09em] text-slate-400">Enable Child Pricing</span>
                  <input
                    type="checkbox"
                    checked={childEnabled}
                    onChange={(e) => setChildEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-white/10 bg-[#070F1E] text-[#06B6D4] focus:ring-[#06B6D4]"
                  />
                </div>
                {childEnabled && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pl-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Child Price ($)</span>
                      <input type="number" min="0" step="0.01" value={childPrice}
                        onChange={(e) => setChildPrice(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#06B6D4]" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Min Age</span>
                      <input type="number" min="0" value={childMinAge}
                        onChange={(e) => setChildMinAge(parseInt(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#06B6D4]" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Max Age</span>
                      <input type="number" min="0" value={childMaxAge}
                        onChange={(e) => setChildMaxAge(parseInt(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#06B6D4]" />
                    </label>
                  </div>
                )}

                {/* Infant Tier */}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                  <span className="text-xs font-black uppercase tracking-[0.09em] text-slate-400">Enable Infant Pricing</span>
                  <input
                    type="checkbox"
                    checked={infantEnabled}
                    onChange={(e) => setInfantEnabled(e.target.checked)}
                    className="h-5 w-5 rounded border-white/10 bg-[#070F1E] text-[#06B6D4] focus:ring-[#06B6D4]"
                  />
                </div>
                {infantEnabled && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pl-2">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Infant Price ($)</span>
                      <input type="number" min="0" step="0.01" value={infantPrice}
                        onChange={(e) => setInfantPrice(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#06B6D4]" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Min Age</span>
                      <input type="number" min="0" value={infantMinAge}
                        onChange={(e) => setInfantMinAge(parseInt(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#06B6D4]" />
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Max Age</span>
                      <input type="number" min="0" value={infantMaxAge}
                        onChange={(e) => setInfantMaxAge(parseInt(e.target.value) || 0)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#06B6D4]" />
                    </label>
                  </div>
                )}

                {/* Age Restrictions */}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">Age & Safety Restrictions</span>
                  <textarea
                    rows={2}
                    value={ageRestrictionsNotes}
                    onChange={(e) => setAgeRestrictionsNotes(e.target.value)}
                    placeholder="Minimum age for driving Quad Safari is 16 years. Children under 6 are not allowed."
                    className="w-full resize-y rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                  />
                </label>
              </div>

              {/* Logistics Section */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                  Logistics & Pickup
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Available Pickup Times
                      <span className="ml-1 text-xs font-normal text-slate-500">(customers will choose)</span>
                    </label>

                    {/* Tag list */}
                    {pickupTime.split('|').map((t) => t.trim()).filter(Boolean).length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {pickupTime.split('|').map((t) => t.trim()).filter(Boolean).map((slot) => (
                          <span
                            key={slot}
                            className="flex items-center gap-1.5 rounded-full bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-3 py-1 text-sm font-semibold text-[#06B6D4]"
                          >
                            {slot}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = pickupTime.split('|').map((t) => t.trim()).filter(Boolean).filter((s) => s !== slot).join('|');
                                setPickupTime(updated);
                              }}
                              className="ml-0.5 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={draftTime}
                        onChange={(e) => setDraftTime(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = draftTime.trim();
                            if (val) {
                              const slots = pickupTime.split('|').map((t) => t.trim()).filter(Boolean);
                              if (!slots.includes(val)) {
                                setPickupTime([...slots, val].join('|'));
                              }
                              setDraftTime('');
                            }
                          }
                        }}
                        placeholder="e.g. 07:00 AM"
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-[#06B6D4]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = draftTime.trim();
                          if (val) {
                            const slots = pickupTime.split('|').map((t) => t.trim()).filter(Boolean);
                            if (!slots.includes(val)) {
                              setPickupTime([...slots, val].join('|'));
                            }
                            setDraftTime('');
                          }
                        }}
                        className="rounded-2xl bg-[#06B6D4]/10 border border-[#06B6D4]/30 px-4 py-3 text-sm font-bold text-[#06B6D4] hover:bg-[#06B6D4]/20 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Add one slot at a time. Press Enter or click Add.</p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5">
                    <span className="text-xs font-black uppercase tracking-[0.09em] text-slate-400">Hotel Pickup</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={hotelPickupIncluded}
                        onChange={(e) => setHotelPickupIncluded(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[#06B6D4] peer-checked:after:translate-x-5" />
                      <span className="ml-3 text-sm text-slate-300">
                        {hotelPickupIncluded ? 'Included' : 'Not included'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Seeded Reviews */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-300">
                    Social Proof & Trust Seeding
                  </h3>
                  <button
                    type="button"
                    onClick={() => setSeededReviews([...seededReviews, { customerName: 'Verified Guest', rating: 5, comment: '' }])}
                    className="rounded-full border border-[#EAB308]/30 bg-[#EAB308]/10 px-4 py-2 text-xs font-black text-[#EAB308] hover:bg-[#EAB308]/20 transition-all"
                  >
                    + Generate Review
                  </button>
                </div>
                {seededReviews.length === 0 && (
                  <p className="text-sm text-slate-500">Generate one or more trust-seeding reviews before publishing.</p>
                )}
                <div className="grid gap-4 md:grid-cols-3">
                  {seededReviews.map((review, idx) => (
                    <div key={idx} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 space-y-3">
                      <input
                        value={review.customerName}
                        onChange={(e) => {
                          const updated = [...seededReviews];
                          updated[idx] = { ...updated[idx], customerName: e.target.value };
                          setSeededReviews(updated);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                      />
                      <select
                        value={review.rating}
                        onChange={(e) => {
                          const updated = [...seededReviews];
                          updated[idx] = { ...updated[idx], rating: Number(e.target.value) };
                          setSeededReviews(updated);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </select>
                      <textarea
                        rows={4}
                        value={review.comment}
                        onChange={(e) => {
                          const updated = [...seededReviews];
                          updated[idx] = { ...updated[idx], comment: e.target.value };
                          setSeededReviews(updated);
                        }}
                        className="w-full resize-y rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                      />
                      <button
                        type="button"
                        onClick={() => setSeededReviews(seededReviews.filter((_, i) => i !== idx))}
                        className="text-xs font-bold text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-white/5 pt-5">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-white/10 px-6 py-3.5 text-sm font-bold text-slate-300 transition-all hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-6 py-3.5 text-sm font-black text-[#070F1E] transition-all hover:scale-[1.02] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTour ? 'Save Changes' : 'Publish Experience'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
