'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  X,
  Clock,
  Eye,
  Star,
  MapPin,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Flame
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  isFeatured?: boolean;
  isBestSeller?: boolean;
  allowDeposit?: boolean;
  depositPercentage?: number;
  allowPayAtLocation?: boolean;
  pickupTime?: string;
  pickupTimes?: string[];
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
  cardExcerpt?: string;
  showExcerptOnCard?: boolean;
  ratingAverage?: number;
  ratingCount?: number;
  tourOptions?: Array<{ id: string; title?: string; name?: string; labels?: Record<string, string>; price: number; priceType?: string }> | null;
}

interface AdminToursClientProps {
  initialTours: Tour[];
  destinations: { id: string; name: string }[];
  zones: { id: string; name: string }[];
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
                i === index ? 'w-4 bg-[#00E5FF]' : 'w-1.5 bg-white/40'
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
  const trans = tour.translations as Record<string, { description?: string }> | null;
  const description = trans?.en?.description ?? '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#070F1E] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {tour.coverImage && (
          <div className="mb-6 aspect-video w-full overflow-hidden rounded-2xl">
            <img src={tour.coverImage} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF]">
              {tour.destination.name || 'Global'}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
              {tour.durationHours}h duration
            </span>
          </div>

          <h2 className="text-2xl font-black text-white">{getTourTitle(tour.translations)}</h2>

          <p className="text-sm leading-relaxed text-slate-300">
            {description || 'No description provided.'}
          </p>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4">
            <div>
              <span className="text-xs text-slate-500">Category</span>
              <p className="font-bold text-white capitalize">{tour.category || tour.type}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Adult Price</span>
              <p className="font-bold text-[#00E5FF]">${tour.adultPrice.toFixed(0)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Max Capacity</span>
              <p className="font-bold text-white">{tour.maxCapacity} pax</p>
            </div>
          </div>

          {tour.tourOptions && tour.tourOptions.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00E5FF]">
                Tour Options & Upgrades ({tour.tourOptions.length})
              </span>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tour.tourOptions.map((opt) => (
                  <div
                    key={opt.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{opt.labels?.en || opt.title || opt.name || 'Option'}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {opt.priceType === 'per_person' ? 'Per Guest' : 'Per Booking'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-[#00E5FF]">
                      {opt.price > 0 ? `+$${opt.price}` : 'Included'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <a
              href={`/admin/tours/${tour.id}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2 text-xs font-black text-[#070F1E] hover:opacity-90 transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Open in Unified Editor
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Client Component
// ---------------------------------------------------------------------------

export default function AdminToursClient({ initialTours, destinations }: AdminToursClientProps) {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>(initialTours);
  const [search, setSearch] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('All');
  const [previewTour, setPreviewTour] = useState<Tour | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  useEffect(() => {
    setTours(initialTours);
  }, [initialTours]);

  function getTourTitle(tourTranslations: unknown): string {
    const value = tourTranslations as Record<string, { title?: string }> | null;
    return value?.en?.title ?? 'Untitled Experience';
  }

  async function handleToggleStatus(tour: Tour) {
    const newStatus = tour.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingStatusId(tour.id);
    try {
      const res = await fetch(`/api/admin/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update tour status');
      }
      setTours((prev) =>
        prev.map((t) => (t.id === tour.id ? { ...t, status: newStatus } : t))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update tour status');
    } finally {
      setTogglingStatusId(null);
    }
  }

  async function handleToggleFeatured(tour: Tour) {
    const newFeatured = !tour.isFeatured;
    try {
      const res = await fetch(`/api/admin/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: newFeatured }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update featured state');
      }
      setTours((prev) =>
        prev.map((t) => (t.id === tour.id ? { ...t, isFeatured: newFeatured } : t))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update featured state');
    }
  }

  async function handleToggleBestSeller(tour: Tour) {
    const newBestSeller = !tour.isBestSeller;
    try {
      const res = await fetch(`/api/admin/tours/${tour.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBestSeller: newBestSeller }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update best seller state');
      }
      setTours((prev) =>
        prev.map((t) => (t.id === tour.id ? { ...t, isBestSeller: newBestSeller } : t))
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update best seller state');
    }
  }

  async function handleDelete(tourId: string, tourTitle?: string) {
    if (!confirm(`Are you sure you want to delete "${tourTitle || 'this experience'}"?`)) return;

    try {
      const response = await fetch(`/api/admin/tours/${tourId}`, {
        method: 'DELETE',
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.hasBookings) {
          const choice = confirm(
            `⚠️ This tour has ${data.bookingsCount} active booking(s)!\n\n` +
            `• Click [OK] to DEACTIVATE (Hide) the tour from public catalog while preserving booking records.\n` +
            `• Click [Cancel] to abort.`
          );

          if (choice) {
            const archiveRes = await fetch(`/api/admin/tours/${tourId}?action=archive`, {
              method: 'DELETE',
            });
            if (archiveRes.ok) {
              setTours((prev) =>
                prev.map((t) => (t.id === tourId ? { ...t, status: 'INACTIVE' } : t))
              );
              alert('Tour has been deactivated and hidden from the public catalog.');
              return;
            }
          }
          return;
        }

        throw new Error(data.error || 'Failed to delete tour');
      }

      setTours((prev) => prev.filter((t) => t.id !== tourId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete experience');
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
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#00E5FF]">Experience Studio</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">Tour Command Library</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              Manage experiences, destinations, pricing architecture, and global catalog status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin/tours/new"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#00E5FF] to-cyan-400 px-6 py-3.5 text-sm font-black text-[#070F1E] transition-all duration-300 ease-in-out hover:opacity-95 hover:scale-[1.02] shadow-xl shadow-[#00E5FF]/20"
            >
              <Plus className="h-4 w-4" />
              Create Experience
            </a>
          </div>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search experiences by title or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#070F1E]/70 pl-11 pr-4 py-3 text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]"
              />
            </div>
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="rounded-2xl border border-white/10 bg-[#070F1E]/70 px-4 py-3 text-sm font-bold text-slate-300 outline-none focus:border-[#00E5FF]"
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
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#00E5FF]/40"
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
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#070F1E]/80 backdrop-blur-sm px-3 py-1 text-[11px] font-black uppercase tracking-wider text-slate-300 border border-white/10">
                    <span className="capitalize">{tour.category || tour.type}</span>
                  </div>

                  {/* Status Toggle Badge */}
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(tour)}
                    disabled={togglingStatusId === tour.id}
                    title="Click to toggle Active / Inactive status"
                    className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider transition-all backdrop-blur-sm ${
                      tour.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${tour.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    {tour.status}
                  </button>

                  {/* Featured on Homepage Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(tour)}
                    title="Toggle Featured on Homepage"
                    className={`absolute left-3 bottom-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all backdrop-blur-sm ${
                      tour.isFeatured
                        ? 'bg-[#EAB308] text-[#070F1E] shadow-lg shadow-[#EAB308]/30 font-bold'
                        : 'bg-[#070F1E]/80 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <Star className={`h-3 w-3 ${tour.isFeatured ? 'fill-[#070F1E]' : ''}`} />
                    {tour.isFeatured ? 'Featured' : 'Feature'}
                  </button>

                  {/* Best Seller Badge Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleBestSeller(tour)}
                    title="Toggle Best Seller badge"
                    className={`absolute right-3 bottom-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all backdrop-blur-sm ${
                      tour.isBestSeller
                        ? 'bg-amber-500 text-[#070F1E] shadow-lg shadow-amber-500/30 font-bold'
                        : 'bg-[#070F1E]/80 text-slate-400 hover:text-white border border-white/10'
                    }`}
                  >
                    <Flame className={`h-3 w-3 ${tour.isBestSeller ? 'fill-[#070F1E]' : ''}`} />
                    {tour.isBestSeller ? 'Best Seller' : 'Badge'}
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between min-h-[170px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                      <MapPin className="h-3 w-3 text-[#00E5FF]" />
                      <span>{tour.destination.name || 'Global Experience'}</span>
                      <span>•</span>
                      <span>{tour.durationHours}h</span>
                    </div>

                    <h3 className="line-clamp-2 text-base font-black text-white group-hover:text-[#00E5FF] transition-colors">
                      {getTourTitle(tour.translations)}
                    </h3>

                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-xs text-slate-400">From</span>
                      <span className="text-xl font-black text-white">${tour.adultPrice.toFixed(0)}</span>
                      <span className="text-xs text-slate-500 font-medium">/ person</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-white/5 pt-4 mt-4">
                    <a
                      href={`/admin/tours/${tour.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-3.5 py-2.5 text-xs font-black text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 hover:scale-[1.02]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit Experience
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewTour(tour)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 px-3 py-2.5 text-xs font-black text-slate-300 transition-all hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tour.id, getTourTitle(tour.translations))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-all hover:border-red-400/30 hover:text-red-400"
                      title="Delete experience"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {filtered.length === 0 && (
          <div className="mt-12 text-center py-16 border border-white/5 rounded-3xl bg-white/[0.02]">
            <p className="text-slate-400 text-sm">No experiences found matching your query.</p>
          </div>
        )}
      </div>

      {/* Live Preview Modal */}
      {previewTour && (
        <TourPreviewModal
          tour={previewTour}
          onClose={() => setPreviewTour(null)}
          getTourTitle={getTourTitle}
        />
      )}
    </main>
  );
}
