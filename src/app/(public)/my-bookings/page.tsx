'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseClient } from '@/lib/supabase/client';
import {
  CalendarDays,
  Ticket,
  LogOut,
  MapPin,
  ChevronRight,
  Loader2,
  AlertCircle,
  User,
  Clock,
} from 'lucide-react';

interface BookingItem {
  id: string;
  bookingReference: string;
  status: string;
  travelDate: string;
  guestCount: number;
  totalPriceUSD: number;
  currency: string;
  paymentScheme: string | null;
  amountDueOnArrival: number | null;
  amountPaidOnline: number | null;
  createdAt: string;
  tour: {
    slug: string;
    coverImage: string | null;
    translations: unknown;
    durationHours: number | null;
  } | null;
  transaction: { status: string } | null;
}

function getTourTitle(translations: unknown, lang = 'en'): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en', 'de']) {
      if (t[key]?.title) return t[key].title!;
    }
  }
  return 'Tour';
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  CONFIRMED: { label: 'Confirmed', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  PENDING: { label: 'Pending', class: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-500/10 text-red-300 border-red-500/20' },
  COMPLETED: { label: 'Completed', class: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
};

function BookingCard({ booking }: { booking: BookingItem }) {
  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;
  const tourTitle = getTourTitle(booking.tour?.translations);
  const travelDate = new Date(booking.travelDate);
  const isPast = travelDate < new Date();
  const currencySymbol = booking.currency === 'EGP' ? 'EGP ' : '$';
  const amountDue = Number(booking.amountDueOnArrival ?? 0);

  return (
    <Link
      href={`/booking/${booking.id}`}
      className="group block rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-300 hover:border-[#00E5FF]/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-[#00E5FF]/5"
    >
      <div className="flex items-start gap-4">
        {/* Tour cover image */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
          {booking.tour?.coverImage ? (
            <Image
              src={booking.tour.coverImage}
              alt={tourTitle}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0B1528]">
              <MapPin className="h-6 w-6 text-slate-600" />
            </div>
          )}
          {isPast && (
            <div className="absolute inset-0 bg-black/40" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-white transition-colors group-hover:text-[#00E5FF]">
              {tourTitle}
            </h3>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusCfg.class}`}>
              {statusCfg.label}
            </span>
          </div>

          <p className="mt-0.5 text-xs font-medium text-[#EAB308]">
            {booking.bookingReference}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {travelDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''}
            </span>
            {booking.tour?.durationHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.tour.durationHours}h
              </span>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm font-bold text-white">
              {currencySymbol}{Number(booking.totalPriceUSD).toFixed(2)}
              {amountDue > 0 && (
                <span className="ml-2 text-xs font-normal text-[#00E5FF]">
                  · {currencySymbol}{amountDue.toFixed(2)} due on arrival
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-[#00E5FF]" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadBookingsForSession = useCallback(async (token: string, userEmail: string) => {
    setEmail(userEmail);
    try {
      const res = await fetch('/api/public/my-bookings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      setBookings(data.bookings);
    } catch {
      setError('Could not load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;

    // Check if there is an access token in the hash
    const hasHash = typeof window !== 'undefined' && window.location.hash.includes('access_token');

    // If there is a hash, set a timeout to redirect to /auth if we don't get a session
    if (hasHash) {
      timeoutId = setTimeout(() => {
        setLoading(false);
        router.replace('/auth');
      }, 5000); // 5 seconds grace period for Supabase to exchange hash
    }

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          if (timeoutId) clearTimeout(timeoutId);
          // Clean the hash from the URL without a page reload
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          await loadBookingsForSession(session.access_token, session.user.email ?? '');
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          if (!hasHash) {
            // No hash to wait for, redirect to auth immediately
            setLoading(false);
            router.replace('/auth');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router, loadBookingsForSession]);

  async function handleSignOut() {
    await supabaseClient.auth.signOut();
    router.push('/');
  }

  const upcoming = bookings.filter(b => new Date(b.travelDate) >= new Date() && b.status !== 'CANCELLED');
  const past = bookings.filter(b => new Date(b.travelDate) < new Date() || b.status === 'CANCELLED');

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          <p className="text-sm text-slate-400">Loading your bookings…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">My Bookings</h1>
          {email && (
            <p className="mt-1 text-sm text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {email}
            </p>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-8 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        /* Empty State */
        <div className="flex flex-col items-center py-24 text-center">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Ticket className="h-9 w-9 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-white">No bookings yet</h2>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Your booked tours will appear here. Ready for your next adventure?
          </p>
          <Link
            href="/tours"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#00E5FF] px-6 py-3 text-sm font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 transition-all hover:scale-[1.03] hover:bg-[#00D4F0]"
          >
            Explore Tours
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}

          {/* Past / Cancelled */}
          {past.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Past & Cancelled ({past.length})
              </h2>
              <div className="space-y-3 opacity-70">
                {past.map(b => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {/* CTA */}
      {bookings.length > 0 && (
        <div className="mt-14 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-6 py-3 text-sm font-bold text-[#EAB308] transition-all hover:bg-[#EAB308]/20"
          >
            Book Another Tour
          </Link>
        </div>
      )}
    </main>
  );
}
