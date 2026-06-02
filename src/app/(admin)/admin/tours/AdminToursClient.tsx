'use client';

import { useState, useCallback } from 'react';
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
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TourTranslation {
  title: string;
  description: string;
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
}

interface AdminToursClientProps {
  initialTours: Tour[];
  destinations: { id: string; name: string }[];
  zones: { id: string; name: string }[];
}

type LanguageTab = 'en' | 'de' | 'ru' | 'it' | 'fr' | 'pl' | 'es';

const LANGUAGE_TABS: LanguageTab[] = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];

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
        onUploaded(data.url);
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
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');
  const [uploading, setUploading] = useState(false);

  // Form Fields
  const [slug, setSlug] = useState('');
  const [type, setType] = useState('SHARED');
  const [category, setCategory] = useState('Sea');
  const [adultPrice, setAdultPrice] = useState(100);
  const [durationHours, setDurationHours] = useState(6);
  const [maxCapacity, setMaxCapacity] = useState(25);
  const [destinationId, setDestinationId] = useState(destinations[0]?.id || '');
  const [zoneId, setZoneId] = useState(zones[0]?.id || '');
  const [status, setStatus] = useState('INACTIVE');
  const [coverImage, setCoverImage] = useState('');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [itinerarySteps, setItinerarySteps] = useState<ItineraryStep[]>([]);
  const [allowDeposit, setAllowDeposit] = useState(false);
  const [depositPercentage, setDepositPercentage] = useState(100);
  const [allowPayAtLocation, setAllowPayAtLocation] = useState(true);
  const [translations, setTranslations] = useState<Record<string, TourTranslation>>({
    en: { title: '', description: '' },
    de: { title: '', description: '' },
    ru: { title: '', description: '' },
    it: { title: '', description: '' },
    fr: { title: '', description: '' },
    pl: { title: '', description: '' },
    es: { title: '', description: '' },
  });

  function getTourTitle(tourTranslations: unknown): string {
    const value = tourTranslations as Record<string, { title?: string }> | null;
    return value?.en?.title ?? 'Untitled Experience';
  }

  function resetFormState() {
    setSlug('');
    setType('SHARED');
    setCategory('Sea');
    setAdultPrice(100);
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
    setTranslations({
      en: { title: '', description: '' },
      de: { title: '', description: '' },
      ru: { title: '', description: '' },
      it: { title: '', description: '' },
      fr: { title: '', description: '' },
      pl: { title: '', description: '' },
      es: { title: '', description: '' },
    });
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
    setCategory(tour.category || 'Sea');
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

    const originalTranslations = tour.translations as Record<string, TourTranslation>;
    const newTranslations: Record<string, TourTranslation> = {};
    for (const lang of LANGUAGE_TABS) {
      newTranslations[lang] = {
        title: originalTranslations?.[lang]?.title || '',
        description: originalTranslations?.[lang]?.description || '',
      };
    }
    setTranslations(newTranslations);

    // Parse existing itinerary if available
    const tourData = tour as unknown as { itinerary?: ItineraryStep[] };
    if (Array.isArray(tourData.itinerary)) {
      setItinerarySteps(tourData.itinerary.map((s) => ({
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

  function handleTranslationChange(lang: string, field: 'title' | 'description', value: string) {
    setTranslations((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));

    if (!editingTour && lang === 'en' && field === 'title') {
      const generated = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setSlug(generated);
    }
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
      translations: {
        en: { ...translations.en, cancellationPolicies: [] },
        de: { ...translations.de, cancellationPolicies: [] },
        ru: { ...translations.ru, cancellationPolicies: [] },
        it: { ...translations.it, cancellationPolicies: [] },
        fr: { ...translations.fr, cancellationPolicies: [] },
        pl: { ...translations.pl, cancellationPolicies: [] },
        es: { ...translations.es, cancellationPolicies: [] },
        tr: { title: '', description: '', cancellationPolicies: [] },
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

      const listRes = await fetch('/api/public/tours');
      if (listRes.ok) {
        const listData = await listRes.json();
        const mapped = listData.tours.map((t: Record<string, unknown>) => ({
          ...t,
          adultPrice: Number((t as { basePrice?: number }).basePrice || 0),
          basePriceUSD: Number((t as { basePrice?: number }).basePrice || 0),
          coverImage: (t as { thumbnailUrl?: string }).thumbnailUrl,
          destinationId: (t as { destinationId?: string }).destinationId || destinationId,
          zoneId: (t as { zoneId?: string }).zoneId || zoneId,
          maxCapacity: (t as { maxCapacity?: number }).maxCapacity || 20,
          durationHours: Number(String((t as { duration?: string }).duration || '6').split(' ')[0] || 6),
          status: (t as { status?: string }).status || 'ACTIVE',
          allowDeposit: (t as { allowDeposit?: boolean }).allowDeposit ?? false,
          depositPercentage: (t as { depositPercentage?: number }).depositPercentage ?? 100,
          allowPayAtLocation: (t as { allowPayAtLocation?: boolean }).allowPayAtLocation ?? true,
        }));
        setTours(mapped as Tour[]);
      } else {
        window.location.reload();
      }

      setModalOpen(false);
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

        {/* Tours Table */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-5 py-4">Title</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Destination</th>
                <th className="px-5 py-4">Price</th>
                <th className="px-5 py-4">Capacity</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((tour) => (
                <tr key={tour.id} className="text-slate-300 transition-all duration-300 ease-in-out hover:bg-white/[0.03]">
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      {tour.coverImage ? (
                        <img
                          src={tour.coverImage}
                          alt=""
                          className="h-11 w-11 rounded-2xl object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#06B6D4]/10 text-[#06B6D4]">
                          <Ship className="h-5 w-5" />
                        </span>
                      )}
                      <div>
                        <p className="font-black text-white">{getTourTitle(tour.translations)}</p>
                        <p className="mt-1 text-xs text-slate-500">/{tour.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-5">{tour.category || tour.type}</td>
                  <td className="px-5 py-5">{tour.destination?.name || 'Hub'}</td>
                  <td className="px-5 py-5">${tour.adultPrice.toFixed(0)}</td>
                  <td className="px-5 py-5">{tour.maxCapacity} pax</td>
                  <td className="px-5 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        tour.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-[#EAB308]/10 text-[#EAB308]'
                      }`}
                    >
                      {tour.status}
                    </span>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(tour)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-black text-slate-200 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#06B6D4]/40 hover:text-[#06B6D4]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Manage
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tour.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:border-red-400/30 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No experiences match your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

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

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Experience Title ({activeTab.toUpperCase()})
                    </span>
                    <input
                      type="text"
                      required={activeTab === 'en'}
                      value={translations[activeTab].title}
                      onChange={(e) => handleTranslationChange(activeTab, 'title', e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#06B6D4]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      Description ({activeTab.toUpperCase()})
                    </span>
                    <textarea
                      required={activeTab === 'en'}
                      rows={4}
                      value={translations[activeTab].description}
                      onChange={(e) => handleTranslationChange(activeTab, 'description', e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#070F1E] px-4 py-3.5 text-white outline-none focus:border-[#06B6D4]"
                    />
                  </label>
                </div>
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
                    <option value="Sea">Sea Trips</option>
                    <option value="Safari">Desert Safaris</option>
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
