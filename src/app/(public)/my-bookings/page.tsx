'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { isSupabaseStorageImage } from '@/utils/imageOptimization';
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
  Star,
  Search,
  Phone,
  ShieldCheck,
  ArrowRight,
  SendHorizontal,
  ExternalLink,
} from 'lucide-react';
import WriteReviewModal from '@/components/modals/WriteReviewModal';

interface BookingItem {
  id: string;
  bookingReference: string;
  accessToken: string;
  customerName: string;
  tourId: string;
  status: string;
  travelDate: string;
  guestCount: number;
  totalPriceUSD: number;
  currency: string;
  paymentScheme: string | null;
  amountDueOnArrival: number | null;
  amountPaidOnline: number | null;
  createdAt: string;
  reviews?: { id: string; rating: number }[];
  tour: {
    slug: string;
    coverImage: string | null;
    translations: unknown;
    durationHours: number | null;
  } | null;
  transaction: { status: string } | null;
}

interface ReservationItem {
  id: string;
  tourId: string | null;
  tourTitle: string | null;
  tourSlug: string | null;
  adults: number;
  children: number;
  totalEstimatedPrice: number | null;
  currency: string;
  status: string;
  createdAt: string;
  reservationReference?: string;
  lastAdminMessage?: string | null;
  lastAdminMessageAt?: string | null;
  hasUnreadAdminReply?: boolean;
}

function getTourTitle(translations: unknown, lang = 'en'): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en', 'de', 'ru', 'it', 'fr', 'pl', 'es', 'uk']) {
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

const RESERVATION_STATUS_CONFIG: Record<string, { label: string; desc: string; class: string }> = {
  INTERESTED:        { label: 'Pending', desc: 'Awaiting team confirmation', class: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' },
  IN_PROGRESS:       { label: 'In Progress', desc: 'Our team is preparing your trip', class: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  CONTACTED:         { label: 'Team Contacted', desc: 'Our team has reached out', class: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  AWAITING_CUSTOMER: { label: 'Action Required', desc: 'Please reply to our message', class: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  AWAITING_PAYMENT:  { label: 'Ready to Pay', desc: 'Your booking is ready — payment required', class: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
  CONFIRMED:         { label: 'Confirmed', desc: 'Your booking is confirmed', class: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  COMPLETED:         { label: 'Completed', desc: 'Trip completed', class: 'bg-sky-500/10 text-sky-300 border-sky-500/20' },
  CANCELLED:         { label: 'Cancelled', desc: 'Booking was cancelled', class: 'bg-red-500/10 text-red-300 border-red-500/20' },
  LOST:              { label: 'Closed', desc: 'Enquiry closed', class: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

function ReservationCard({ reservation }: { reservation: ReservationItem }) {
  const cfg = RESERVATION_STATUS_CONFIG[reservation.status] ?? RESERVATION_STATUS_CONFIG.INTERESTED;
  const ref = reservation.reservationReference ?? `RES-${reservation.id.slice(-8).toUpperCase()}`;
  const currencySymbol = reservation.currency === 'EGP' ? 'EGP ' : '$';
  const guestCount = reservation.adults + reservation.children;

  return (
    <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-white">
            {reservation.tourTitle || 'Tour Reservation'}
          </p>
          <p className="mt-0.5 text-xs font-mono font-semibold text-[#EAB308]">{ref}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.class}`}>
          {cfg.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <User className="h-3 w-3" />
          {guestCount} guest{guestCount !== 1 ? 's' : ''}
        </span>
        {reservation.totalEstimatedPrice != null && (
          <span className="flex items-center gap-1">
            <Ticket className="h-3 w-3" />
            Est. {currencySymbol}{Number(reservation.totalEstimatedPrice).toFixed(2)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(reservation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <p className="text-xs text-slate-400">{cfg.desc}</p>

      {reservation.lastAdminMessage && (
        <div className={`rounded-xl border p-3 ${
          reservation.hasUnreadAdminReply
            ? 'border-[#00E5FF]/30 bg-[#00E5FF]/[0.07]'
            : 'border-white/5 bg-white/[0.03]'
        }`}>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Team Reply</span>
            {reservation.hasUnreadAdminReply && (
              <span className="rounded-full bg-[#00E5FF] px-1.5 py-0.5 text-[9px] font-black uppercase text-[#070F1E]">New</span>
            )}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2">{reservation.lastAdminMessage}</p>
          {reservation.lastAdminMessageAt && (
            <p className="mt-1 text-[10px] text-slate-500">
              {new Date(reservation.lastAdminMessageAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  onOpenReview,
}: {
  booking: BookingItem;
  onOpenReview?: (booking: BookingItem) => void;
}) {
  const statusCfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.PENDING;
  const tourTitle = getTourTitle(booking.tour?.translations);
  const travelDate = new Date(booking.travelDate);
  const isPast = travelDate < new Date();
  const currencySymbol = booking.currency === 'EGP' ? 'EGP ' : '$';
  const amountDue = Number(booking.amountDueOnArrival ?? 0);

  return (
    <Link
      href={`/booking/${booking.accessToken}`}
      className="group block rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-300 hover:border-[#00E5FF]/30 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-[#00E5FF]/5"
    >
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
          {booking.tour?.coverImage ? (
            <Image
              src={booking.tour.coverImage}
              alt={tourTitle}
              fill
              sizes="64px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              unoptimized={isSupabaseStorageImage(booking.tour.coverImage)}
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

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2.5">
            <div className="text-sm font-bold text-white">
              {currencySymbol}{Number(booking.totalPriceUSD).toFixed(2)}
              {amountDue > 0 && (
                <span className="ml-2 text-xs font-normal text-[#00E5FF]">
                  · {currencySymbol}{amountDue.toFixed(2)} due on arrival
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {booking.reviews && booking.reviews.length > 0 ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FFD700]/10 border border-[#FFD700]/20 px-2.5 py-1 text-[11px] font-bold text-[#FFD700]">
                  <Star className="h-3 w-3 fill-[#FFD700]" />
                  Reviewed
                </span>
              ) : (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') && onOpenReview ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenReview(booking);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 hover:scale-105"
                >
                  <Star className="h-3 w-3" />
                  Leave a Review
                </button>
              ) : null}
              <ChevronRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-[#00E5FF]" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MyBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication & account states
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BookingItem | null>(null);

  // Guest Lookup states
  const [lookupRef, setLookupRef] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookedUpBooking, setLookedUpBooking] = useState<BookingItem | null>(null);
  const [lookedUpReservation, setLookedUpReservation] = useState<ReservationItem | null>(null);

  const loadBookingsForSession = useCallback(async (token?: string, userEmail?: string) => {
    if (userEmail) setEmail(userEmail);
    try {
      const res = await fetch('/api/public/my-bookings', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
      setReservations(data.reservations || []);
      setIsAuthenticated(true);
    } catch {
      setError('Could not load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Guest lookup handler
  const handleLookupSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!lookupRef.trim() || !lookupPhone.trim()) {
      setLookupError('Please enter both your booking reference and contact phone number.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookedUpBooking(null);
    setLookedUpReservation(null);

    try {
      const res = await fetch('/api/public/my-bookings/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: lookupRef.trim(),
          phone: lookupPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No matching booking found.');
      }

      if (data.type === 'BOOKING' && data.booking) {
        setLookedUpBooking(data.booking);
      } else if (data.type === 'RESERVATION' && data.reservation) {
        setLookedUpReservation(data.reservation);
      }
    } catch (err: any) {
      setLookupError(err.message || 'Lookup failed. Please verify your details.');
    } finally {
      setLookupLoading(false);
    }
  }, [lookupRef, lookupPhone]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined;
    const hasHash = typeof window !== 'undefined' && window.location.hash.includes('access_token');

    // Pre-populate lookup from query params if available
    const initialRef = searchParams.get('ref');
    const initialPhone = searchParams.get('phone');
    if (initialRef) setLookupRef(initialRef);
    if (initialPhone) setLookupPhone(initialPhone);

    if (hasHash) {
      timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);
    }

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          if (timeoutId) clearTimeout(timeoutId);
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          await loadBookingsForSession(session.access_token, session.user.email ?? '');
        } else if (event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
          // If no session, allow guest lookup mode instead of bouncing to /auth
          setLoading(false);
          setIsAuthenticated(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, loadBookingsForSession]);

  async function handleSignOut() {
    await supabaseClient.auth.signOut();
    setIsAuthenticated(false);
    setBookings([]);
    setReservations([]);
    setEmail('');
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

  // ---------------------------------------------------------------------------
  // GUEST LOOKUP INTERFACE (WHEN NOT SIGNED IN)
  // ---------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1 text-xs font-bold text-[#00E5FF] mb-3">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure Guest Portal</span>
          </div>
          <h1 className="text-3xl font-black text-white">Find Your Booking</h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl">
            Booked without an account? Enter your booking or reservation reference along with your contact phone number to access your trip details and boarding passes.
          </p>
        </div>

        {/* Lookup Card */}
        <div className="rounded-[2rem] border border-white/10 bg-[#0B1528]/85 p-6 sm:p-8 shadow-2xl backdrop-blur-xl mb-8">
          <form onSubmit={handleLookupSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Booking or Reservation Reference
                </label>
                <div className="relative">
                  <Ticket className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. TAL-12345678 or RES-ABC12345"
                    value={lookupRef}
                    onChange={(e) => setLookupRef(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-mono text-sm uppercase placeholder-slate-500 outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +20 122 243 4602"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-slate-500 outline-none focus:border-[#00E5FF] focus:ring-1 focus:ring-[#00E5FF]"
                  />
                </div>
              </div>
            </div>

            {lookupError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{lookupError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={lookupLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:bg-[#00D4F0] transition-all disabled:opacity-60"
            >
              {lookupLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Find My Booking</span>
                </>
              )}
            </button>
          </form>

          {/* Lookup Results Display */}
          {(lookedUpBooking || lookedUpReservation) && (
            <div className="mt-8 pt-6 border-t border-white/10 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                Found Matching Experience:
              </h2>
              {lookedUpBooking && <BookingCard booking={lookedUpBooking} />}
              {lookedUpReservation && <ReservationCard reservation={lookedUpReservation} />}
            </div>
          )}
        </div>

        {/* Account Sign-In Card */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Have a customer account?</h3>
            <p className="mt-1 text-xs text-slate-400">
              Sign in with Telegram, Google, or Email to view all your past and upcoming trips in one place.
            </p>
          </div>
          <Link
            href="/auth"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all"
          >
            <span>Sign In or Register</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATED CUSTOMER DASHBOARD
  // ---------------------------------------------------------------------------
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

      {bookings.length === 0 && reservations.length === 0 && !error ? (
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
          {reservations.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                <Clock className="h-3.5 w-3.5" />
                Reservation Requests ({reservations.length})
              </h2>
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <ReservationCard key={reservation.id} reservation={reservation} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                Upcoming ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} onOpenReview={(target) => setReviewTarget(target)} />
                ))}
              </div>
            </section>
          )}

          {/* Past / Cancelled */}
          {past.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Past &amp; Cancelled ({past.length})
              </h2>
              <div className="space-y-3 opacity-90">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} onOpenReview={(target) => setReviewTarget(target)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* CTA */}
      {(bookings.length > 0 || reservations.length > 0) && (
        <div className="mt-14 text-center">
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 rounded-full border border-[#EAB308]/25 bg-[#EAB308]/10 px-6 py-3 text-sm font-bold text-[#EAB308] transition-all hover:bg-[#EAB308]/20"
          >
            Book Another Tour
          </Link>
        </div>
      )}

      {/* Write a Review Modal */}
      {reviewTarget && (
        <WriteReviewModal
          isOpen={Boolean(reviewTarget)}
          onClose={() => setReviewTarget(null)}
          tourId={reviewTarget.tourId}
          tourTitle={getTourTitle(reviewTarget.tour?.translations)}
          initialBookingId={reviewTarget.id}
          initialBookingAccessToken={reviewTarget.accessToken}
          initialCustomerName={reviewTarget.customerName}
          onSuccess={() => {
            setBookings((prev) =>
              prev.map((b) =>
                b.id === reviewTarget.id ? { ...b, reviews: [{ id: 'new', rating: 5 }] } : b
              )
            );
          }}
        />
      )}
    </main>
  );
}
