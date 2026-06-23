'use client';

import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Compass, Edit3, ImageIcon, Loader2, Plus, Trash2, Upload, X, MapPin, Clock } from 'lucide-react';
import type { Destination, ZoneItem } from '@/types/destination';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LanguageTab = 'en' | 'de' | 'ru' | 'it' | 'fr' | 'pl' | 'es';

const LANGUAGE_TABS: LanguageTab[] = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'];

interface DestinationTranslation {
  description: string;
}

interface FormState {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  translations: Record<string, DestinationTranslation>;
}

const emptyTranslations = (): Record<string, DestinationTranslation> => ({
  en: { description: '' },
  de: { description: '' },
  ru: { description: '' },
  it: { description: '' },
  fr: { description: '' },
  pl: { description: '' },
  es: { description: '' },
});

const emptyForm: FormState = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  translations: emptyTranslations(),
};

function createSlugPreview(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Image Dropzone Component
// ---------------------------------------------------------------------------

function DestinationImageDropzone({
  currentUrl,
  onUploaded,
  onUploadingChange,
}: {
  currentUrl: string;
  onUploaded: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setUploadError(null);
      setPreviewUrl(URL.createObjectURL(file));
      setUploading(true);
      onUploadingChange?.(true);

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
        onUploadingChange?.(false);
      }
    },
    [onUploaded, onUploadingChange],
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
      <span className="mb-2 block text-sm font-bold text-slate-300">Destination Image</span>
      <div
        {...getRootProps()}
        className={`relative flex min-h-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
          isDragActive
            ? 'border-[#06B6D4] bg-[#06B6D4]/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {displayUrl ? (
          <div className="group relative h-36 w-full">
            <img src={displayUrl} alt="Destination" className="h-full w-full rounded-xl object-cover" />
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <p className="text-sm font-bold text-white">Drop to replace</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewUrl(null);
                onUploaded('');
              }}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity duration-200 hover:bg-red-500 group-hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-5">
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-[#06B6D4]" />
            ) : (
              <>
                <Upload className="h-7 w-7 text-slate-500" />
                <p className="text-sm text-slate-400">
                  {isDragActive ? 'Drop image here...' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-slate-600">JPG, PNG, WebP • Max 10MB</p>
              </>
            )}
          </div>
        )}
      </div>
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Zone Sub-Panel Component
// ---------------------------------------------------------------------------

function ZoneSubPanel({
  destinationId,
  zones,
  onZonesChanged,
}: {
  destinationId: string;
  zones: ZoneItem[];
  onZonesChanged: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [pickupOffset, setPickupOffset] = useState(0);
  const [transferFee, setTransferFee] = useState(0);
  const [savingZone, setSavingZone] = useState(false);
  const [zoneExpand, setZoneExpand] = useState(false);

  async function handleAddZone(e: FormEvent) {
    e.preventDefault();
    if (!zoneName.trim()) return;
    setSavingZone(true);
    try {
      const res = await fetch('/api/admin/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: zoneName.trim(),
          pickupOffset,
          transferFee,
          destinationId,
        }),
      });
      if (res.ok) {
        setZoneName('');
        setPickupOffset(0);
        setTransferFee(0);
        setAdding(false);
        onZonesChanged();
      }
    } catch {
      // Handle error
    } finally {
      setSavingZone(false);
    }
  }

  async function handleDeleteZone(zoneId: string) {
    if (!confirm('Delete this pickup zone?')) return;
    try {
      const res = await fetch(`/api/admin/zones?id=${zoneId}`, { method: 'DELETE' });
      if (res.ok) {
        onZonesChanged();
      }
    } catch {
      // Handle error
    }
  }

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <button
        type="button"
        onClick={() => setZoneExpand(!zoneExpand)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-[#06B6D4]" />
          <span className="text-sm font-bold text-slate-300">Pickup Zones ({zones.length})</span>
        </div>
        <span className={`text-xs text-slate-500 transition-transform ${zoneExpand ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {zoneExpand && (
        <div className="mt-3 space-y-2">
          {zones.length === 0 && (
            <p className="text-xs text-slate-600">No pickup zones configured for this destination.</p>
          )}
          {zones.map((zone) => (
            <div
              key={zone.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-2.5"
            >
              <div>
                <p className="text-sm font-bold text-slate-200">{zone.name}</p>
                <p className="text-xs text-slate-500">
                  Pickup +{zone.pickupOffset} min • Transfer fee: ${zone.transferFee}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteZone(zone.id)}
                className="rounded-full p-1.5 text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {adding ? (
            <form onSubmit={handleAddZone} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Zone name (e.g., El Gouna)"
                className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={pickupOffset}
                  onChange={(e) => setPickupOffset(Number(e.target.value))}
                  placeholder="Pickup offset (min)"
                  className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                />
                <input
                  type="number"
                  value={transferFee}
                  onChange={(e) => setTransferFee(Number(e.target.value))}
                  placeholder="Transfer fee ($)"
                  className="w-full rounded-lg border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#06B6D4]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingZone}
                  className="rounded-lg bg-[#06B6D4] px-3 py-1.5 text-xs font-black text-[#070F1E] disabled:opacity-60"
                >
                  {savingZone ? 'Adding...' : 'Add Zone'}
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 py-2 text-xs font-bold text-slate-400 transition-all hover:border-[#06B6D4]/40 hover:text-[#06B6D4]"
            >
              <Plus className="h-3 w-3" />
              Add Pickup Zone
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DestinationManager() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageTab>('en');

  async function fetchDestinations() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/destinations', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load destinations');
      }
      const data = await response.json() as { destinations: Destination[]; total: number };
      setDestinations(data.destinations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load destinations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDestinations();
  }, []);

  function openCreateModal() {
    setEditingDestination(null);
    setForm({ ...emptyForm, translations: emptyTranslations() });
    setServerError(null);
    setActiveTab('en');
    setModalOpen(true);
  }

  function openEditModal(destination: Destination) {
    setEditingDestination(destination);

    const existingTranslations = (destination as unknown as { translations?: Record<string, DestinationTranslation> }).translations;
    const parsedTranslations = emptyTranslations();
    if (existingTranslations && typeof existingTranslations === 'object') {
      for (const lang of LANGUAGE_TABS) {
        if (existingTranslations[lang]) {
          parsedTranslations[lang] = {
            description: existingTranslations[lang].description || '',
          };
        }
      }
    }
    if (!parsedTranslations.en.description && destination.description) {
      parsedTranslations.en.description = destination.description;
    }

    setForm({
      name: destination.name,
      slug: destination.slug,
      description: destination.description,
      imageUrl: destination.imageUrl ?? '',
      translations: parsedTranslations,
    });
    setServerError(null);
    setActiveTab('en');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingDestination(null);
    setForm({ ...emptyForm, translations: emptyTranslations() });
    setServerError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setServerError(null);

    const primaryDescription = form.translations.en.description || form.description;

    try {
      const response = await fetch(
        editingDestination ? `/api/admin/destinations/${editingDestination.id}` : '/api/admin/destinations',
        {
          method: editingDestination ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            slug: form.slug || undefined,
            description: primaryDescription,
            imageUrl: form.imageUrl || null,
            translations: form.translations,
          }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to save destination');
      }

      await fetchDestinations();
      closeModal();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save destination');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(destinationId: string) {
    if (!confirm('Are you absolutely sure you want to delete this destination hub?')) return;
    try {
      const response = await fetch(`/api/admin/destinations/${destinationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'Failed to delete destination');
      }

      await fetchDestinations();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete destination');
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-100">
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchDestinations}
          className="mt-5 rounded-full bg-[#EAB308] px-5 py-2 text-sm font-black text-[#070F1E] transition-all duration-300 ease-in-out hover:scale-[1.02]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-400">
            {destinations.length} curated destination hubs
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#EAB308] px-5 py-3 text-sm font-black text-[#070F1E] shadow-xl shadow-[#EAB308]/20 transition-all duration-300 ease-in-out hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Add Destination
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {destinations.map((destination) => (
          <article
            key={destination.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition-all duration-300 ease-in-out hover:-translate-y-2 hover:border-[#06B6D4]/40"
          >
            <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-[#0EA5E9]/35 via-[#070F1E] to-[#EAB308]/25">
              {destination.imageUrl ? (
                <img src={destination.imageUrl} alt={destination.name} className="h-full w-full object-cover opacity-85" />
              ) : (
                <ImageIcon className="h-12 w-12 text-white/35" />
              )}
              <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#070F1E]/70 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#EAB308] backdrop-blur-md">
                /{destination.slug}
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-white">{destination.name}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{destination.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-[#06B6D4]/10 px-3 py-1 text-xs font-black text-[#06B6D4]">
                  {destination._count?.tours ?? 0} tours
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(destination)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:border-[#EAB308]/40 hover:bg-[#EAB308]/10 hover:text-[#EAB308]"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Hub
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(destination.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all duration-300 hover:border-red-400/30 hover:text-red-400"
                  title="Delete Hub"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Zone Sub-Panel */}
              <ZoneSubPanel
                destinationId={destination.id}
                zones={destination.zones || []}
                onZonesChanged={fetchDestinations}
              />
            </div>
          </article>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#070F1E] p-6 shadow-2xl shadow-black/50">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#EAB308]">
                  Destination Studio
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {editingDestination ? 'Edit Destination Hub' : 'Create Destination Hub'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/10 p-2 text-slate-300 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Name</span>
                <input
                  value={form.name}
                  onChange={(event) => {
                    const newName = event.target.value;
                    setForm((current) => ({
                      ...current,
                      name: newName,
                      slug: current.slug || createSlugPreview(newName),
                    }));
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 ease-in-out focus:border-[#06B6D4]"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">URL Slug</span>
                <input
                  value={form.slug}
                  onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 ease-in-out focus:border-[#06B6D4]"
                  placeholder={form.name ? createSlugPreview(form.name) : 'auto-generated'}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Preview: /{form.slug || createSlugPreview(form.name)}
                </span>
              </label>

              <DestinationImageDropzone
                currentUrl={form.imageUrl}
                onUploaded={(url) => setForm((current) => ({ ...current, imageUrl: url }))}
                onUploadingChange={setUploadingImage}
              />

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                <span className="mb-3 block text-sm font-bold text-slate-300">Localized Descriptions</span>
                <div className="mb-4 flex flex-wrap gap-2">
                  {LANGUAGE_TABS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveTab(lang)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === lang
                          ? 'bg-[#06B6D4] text-[#070F1E]'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lang.toUpperCase()}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.translations[activeTab]?.description || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      translations: {
                        ...current.translations,
                        [activeTab]: { description: event.target.value },
                      },
                      ...(activeTab === 'en' ? { description: event.target.value } : {}),
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition-all duration-300 ease-in-out focus:border-[#06B6D4]"
                  required={activeTab === 'en'}
                  placeholder={`Description in ${activeTab.toUpperCase()}...`}
                />
              </div>

              {serverError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {serverError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-slate-300 transition-all duration-300 ease-in-out hover:scale-[1.02] hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="inline-flex items-center gap-2 rounded-full bg-[#EAB308] px-5 py-3 text-sm font-black text-[#070F1E] transition-all duration-300 ease-in-out hover:scale-[1.02] disabled:opacity-60"
                >
                  {(saving || uploadingImage) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploadingImage ? 'Uploading Image...' : 'Save Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
