'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  Trash2,
  Share2,
  MessageCircle,
  Star,
  Clock,
  MapPin,
  ArrowRight,
  Compass,
  Sparkles,
  Check,
  Search,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useLanguage } from '@/context/LanguageContext';
import type { WishlistItem } from '@/types/wishlist';

type SortOption = 'recent' | 'price_asc' | 'price_desc' | 'rating';

export default function WishlistClient() {
  const { wishlist, count, isLoaded, removeFromWishlist, clearWishlist } = useWishlist();
  const { formatPrice } = useCurrency();
  const { dict } = useLanguage();

  const [sort, setSort] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter & sort
  const filteredItems = useMemo(() => {
    let items = [...wishlist];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          (item.destinationName && item.destinationName.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
      );
    }

    switch (sort) {
      case 'price_asc':
        items.sort((a, b) => a.priceUSD - b.priceUSD);
        break;
      case 'price_desc':
        items.sort((a, b) => b.priceUSD - a.priceUSD);
        break;
      case 'rating':
        items.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
        break;
      case 'recent':
      default:
        items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
        break;
    }

    return items;
  }, [wishlist, searchQuery, sort]);

  // Aggregate trip summary
  const totalEstimatedCostUSD = useMemo(() => {
    return wishlist.reduce((acc, curr) => acc + (curr.priceUSD || 0), 0);
  }, [wishlist]);

  // Share Wishlist handler
  const handleShare = () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    const shareText = `Explore my saved experiences on TALAGO (${wishlist.length} tours): ${url}`;

    if (navigator.share) {
      navigator
        .share({
          title: 'My TALAGO Wishlist',
          text: shareText,
          url,
        })
        .catch(() => {
          // User cancelled or unsupported
        });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      });
    }
  };

  // WhatsApp Concierge message with all saved tours
  const whatsappUrl = useMemo(() => {
    const phone = '2010222434602';
    if (wishlist.length === 0) {
      return `https://wa.me/${phone}?text=${encodeURIComponent(
        'Hello TALAGO Concierge! I would like help planning my vacation experiences.'
      )}`;
    }

    const itemsSummary = wishlist
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.title} ($${item.priceUSD}) - https://talago-tours.com/tours/${item.slug}`
      )
      .join('\n');

    const msg = `Hello TALAGO Concierge! I have saved ${wishlist.length} experiences to my bucket list and would like to check availability or request a custom bundled quote:\n\n${itemsSummary}\n\nCan you assist me with scheduling?`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }, [wishlist]);

  return (
    <div className="relative min-h-screen bg-[#070F1E] pb-24 pt-28 text-white sm:pt-32">
      {/* Background glow effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#00E5FF]/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-10 h-80 w-80 rounded-full bg-rose-500/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-rose-400">
              <Heart className="h-3.5 w-3.5 fill-rose-400" />
              <span>Personal Bucket List</span>
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Saved Experiences
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Keep track of your dream activities, compare itinerary details, and reserve your spots
              with VIP concierge support whenever you are ready.
            </p>
          </div>

          {/* Action pills (when items exist) */}
          {count > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Share button */}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-slate-200 backdrop-blur-md transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/10 hover:text-white"
              >
                {copiedShare ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 text-[#00E5FF]" />
                    <span>Share List</span>
                  </>
                )}
              </button>

              {/* VIP Concierge Bundle Inquiry */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-400 backdrop-blur-md transition-all hover:bg-emerald-500/20 hover:text-white"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Inquire All on WhatsApp</span>
              </a>

              {/* Clear button */}
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 text-xs font-bold text-slate-400 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                title="Clear all saved experiences"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Clear Confirmation Modal ── */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#0B1528] p-6 shadow-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-black text-white">Clear your wishlist?</h3>
              <p className="mt-2 text-xs leading-5 text-slate-400">
                This will remove all {count} saved tours from your bucket list. This action cannot be
                undone.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearWishlist();
                    setShowClearConfirm(false);
                  }}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Content States ── */}
        {!isLoaded ? (
          // Loading Skeleton
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-[2rem] border border-white/10 bg-[#0B1528]/50 p-4"
              />
            ))}
          </div>
        ) : count === 0 ? (
          // Empty State
          <div className="mt-16 rounded-[2.5rem] border border-dashed border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent p-8 text-center sm:p-16">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-400 ring-8 ring-rose-500/5">
              <Heart className="h-9 w-9 stroke-[1.5]" />
            </div>
            <h2 className="mt-6 text-2xl font-black text-white sm:text-3xl">
              Your Bucket List is Empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              You haven't saved any experiences yet. Tap the heart icon on any tour card to bookmark
              it for later!
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0099FF] px-6 py-3.5 text-sm font-black text-[#070F1E] shadow-xl shadow-[#00E5FF]/20 transition-all hover:brightness-110"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Signature Tours</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold text-slate-200 transition-all hover:bg-white/10 hover:text-white"
              >
                <span>Browse Destinations</span>
              </Link>
            </div>

            {/* Quick Inspiration Badges */}
            <div className="mt-12 border-t border-white/5 pt-8">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Popular adventure categories to explore:
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { label: 'Red Sea Diving & Snorkel', type: 'sea' },
                  { label: 'Desert Quad Safaris', type: 'safari' },
                  { label: 'Ancient Luxor & Nile', type: 'cultural' },
                  { label: 'Private Yacht Charters', type: 'entertainment' },
                  { label: 'Luxury Wellness & Spa', type: 'spa' },
                ].map((cat) => (
                  <Link
                    key={cat.label}
                    href={`/tours?type=${cat.type}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Populated Wishlist
          <div className="mt-10 space-y-8">
            {/* Filter & Sort Bar */}
            <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0B1528]/80 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
              {/* Search in saved */}
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter your saved tours..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none focus:ring-1 focus:ring-[#00E5FF]"
                />
              </div>

              {/* Status and Sort */}
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                <span className="text-xs text-slate-400">
                  Showing <strong className="text-white">{filteredItems.length}</strong> of{' '}
                  <strong className="text-white">{wishlist.length}</strong> saved
                </span>

                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="rounded-xl border border-white/10 bg-[#070F1E] px-3 py-1.5 text-xs font-bold text-slate-300 focus:border-[#00E5FF] focus:outline-none"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Trip Package Summary Banner */}
            <div className="flex flex-col justify-between gap-4 rounded-3xl border border-[#00E5FF]/20 bg-gradient-to-r from-[#00E5FF]/10 via-[#0B1528] to-emerald-500/10 p-5 sm:flex-row sm:items-center sm:p-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#00E5FF]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#00E5FF]">
                    Tailored Vacation Bundle
                  </span>
                </div>
                <h3 className="text-base font-black text-white sm:text-lg">
                  {wishlist.length} Curated Experience{wishlist.length > 1 ? 's' : ''} in Your Trip
                </h3>
                <p className="text-xs text-slate-400">
                  Estimated adult total: ~{formatPrice(totalEstimatedCostUSD)} (rates vary by dates
                  and add-ons).
                </p>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs font-black text-white shadow-xl shadow-emerald-500/20 transition-all hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Book Package via Concierge</span>
              </a>
            </div>

            {/* Grid of Wishlist Items */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] via-[#0B1528]/80 to-[#070F1E] shadow-2xl shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:border-[#00E5FF]/40"
                >
                  {/* Top Image + Badges */}
                  <div>
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/[0.02]">
                      {item.coverImage ? (
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-cyan-900/40 to-slate-900">
                          <Compass className="h-10 w-10 text-cyan-400/40" />
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        aria-label="Remove from wishlist"
                        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#070F1E]/80 text-rose-400 backdrop-blur-md transition-all hover:scale-110 hover:border-rose-500 hover:bg-rose-500 hover:text-white"
                        title="Remove from saved"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>

                      {/* Category Badge */}
                      {item.category && (
                        <div className="absolute left-3 top-3 z-10 rounded-full border border-white/20 bg-[#070F1E]/80 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                          {item.category}
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5">
                      {/* Meta badges: Location + Duration */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        {item.destinationName && (
                          <span className="flex items-center gap-1 text-[#00E5FF]">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate max-w-[130px]">{item.destinationName}</span>
                          </span>
                        )}
                        {(item.duration || item.durationHours) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span>{item.duration || `${item.durationHours}h`}</span>
                          </span>
                        )}
                        {item.ratingAverage > 0 && (
                          <span className="flex items-center gap-1 font-bold text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-400" />
                            <span>{item.ratingAverage.toFixed(1)}</span>
                            {item.ratingCount > 0 && (
                              <span className="text-slate-500">({item.ratingCount})</span>
                            )}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="mt-3 text-lg font-black leading-snug text-white transition-colors group-hover:text-[#00E5FF]">
                        <Link href={`/tours/${item.slug}`}>{item.title}</Link>
                      </h3>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="border-t border-white/5 p-5 pt-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">
                          Starting From
                        </span>
                        <div className="text-xl font-black text-white">
                          {formatPrice(item.priceUSD)}
                          <span className="text-xs font-normal text-slate-400"> / guest</span>
                        </div>
                      </div>

                      <Link
                        href={`/tours/${item.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 transition-all hover:bg-cyan-300"
                      >
                        <span>Book</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
