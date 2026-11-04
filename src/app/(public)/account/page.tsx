'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n';
import type { SupportedCurrency } from '@/utils/currency';
import WriteReviewModal from '@/components/modals/WriteReviewModal';
import { useContactSettings } from '@/hooks/useContactSettings';
import {
  CalendarDays,
  Ticket,
  LogOut,
  MapPin,
  Loader2,
  AlertCircle,
  User,
  Clock,
  Star,
  Phone,
  ShieldCheck,
  SendHorizontal,
  ExternalLink,
  Heart,
  MessageSquare,
  Globe,
  Coins,
  CheckCircle2,
  CreditCard,
  Sparkles,
  LayoutDashboard,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  RefreshCw,
  Send,
} from 'lucide-react';

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  de: 'Deutsch',
  ru: 'Русский',
  it: 'Italiano',
  fr: 'Français',
  pl: 'Polski',
  es: 'Español',
  uk: 'Українська',
};

interface BookingItem {
  id: string;
  bookingReference: string;
  accessToken: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  tourId: string;
  status: string;
  travelDate: string;
  guestCount: number;
  adultsCount?: number;
  childrenCount?: number;
  infantsCount?: number;
  hotelName?: string | null;
  roomNumber?: string | null;
  pickupLocationName?: string | null;
  selectedPickupTime?: string | null;
  pickupDirectives?: string | null;
  selectedAddons?: any;
  specialRequirements?: string | null;
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
  leadId?: string;
  tourId: string | null;
  tourTitle: string | null;
  tourSlug: string | null;
  adults: number;
  children: number;
  totalEstimatedPrice: number | null;
  currency: string;
  status: string;
  createdAt: string;
  travelDate?: string | null;
  reservationReference?: string;
  lastAdminMessage?: string | null;
  lastAdminMessageAt?: string | null;
  hasUnreadAdminReply?: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  isTelegram?: boolean;
  telegramId?: string | null;
  telegramUsername?: string | null;
  telegramPhotoUrl?: string | null;
  telegramPhone?: string | null;
  telegramPhoneVerified?: boolean;
  telegramBotAccess?: boolean;
  telegramConnectedAt?: string | null;
  provider?: 'telegram' | 'google' | 'email';
}

interface ChatMessage {
  id: string;
  sender: 'VISITOR' | 'ADMIN' | 'SYSTEM';
  body: string;
  createdAt: string;
}

function getTourTitle(translations: unknown, lang = 'en'): string {
  if (typeof translations === 'object' && translations !== null) {
    const t = translations as Record<string, { title?: string }>;
    for (const key of [lang, 'en', 'de', 'ru', 'it', 'fr', 'pl', 'es', 'uk']) {
      if (t[key]?.title) return t[key].title!;
    }
  }
  return 'Tour Experience';
}

export default function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict, language, setLanguage } = useLanguage();
  const { currency, setCurrency, formatPrice } = useCurrency();
  const { wishlist, removeFromWishlist } = useWishlist();

  // Active tab state
  type TabKey = 'overview' | 'bookings' | 'messages' | 'favorites' | 'profile' | 'preferences' | 'security';
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'bookings', 'messages', 'favorites', 'profile', 'preferences', 'security'].includes(tabParam)) {
      setActiveTab(tabParam as TabKey);
    }
  }, [searchParams]);
  const { getWhatsAppUrl } = useContactSettings();

  // Auth & Profile state
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Bookings & Reservations
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [bookingFilter, setBookingFilter] = useState<'ALL' | 'UPCOMING' | 'PAST' | 'INQUIRIES'>('ALL');
  const [activeReviewTour, setActiveReviewTour] = useState<{ id: string; title: string } | null>(null);

  // Profile Edit form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Live Chat / Concierge Messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedChatBookingRef, setSelectedChatBookingRef] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  // Init Auth & Load Customer Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Session verification from dual-path session API
      const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' });
      const sessionData = await sessionRes.json();

      if (sessionData?.authenticated && sessionData.user) {
        setAuthenticated(true);
        setUserProfile(sessionData.user);
        setEditName(sessionData.user.name || '');
        setEditPhone(sessionData.user.phone || sessionData.user.telegramPhone || '');

        // 2. Fetch authenticated customer bookings
        const { data: { session: activeSession } } = await supabaseClient.auth.getSession();
        const bookingsHeaders: Record<string, string> = {};
        if (activeSession?.access_token) {
          bookingsHeaders['Authorization'] = `Bearer ${activeSession.access_token}`;
        }
        const bookingsRes = await fetch('/api/public/my-bookings', { headers: bookingsHeaders, cache: 'no-store' });
        if (bookingsRes.ok) {
          const bData = await bookingsRes.json();
          setBookings(Array.isArray(bData.bookings) ? bData.bookings : []);
          setReservations(Array.isArray(bData.reservations) ? bData.reservations : []);
        }

        // 3. Fetch concierge live chat messages
        fetchChatMessages();
      } else {
        // Fallback: check Supabase client session in browser
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session?.access_token) {
          // Sync server cookie immediately
          try {
            const syncRes = await fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              if (syncData?.authenticated && syncData.user) {
                setAuthenticated(true);
                setUserProfile(syncData.user);
                setEditName(syncData.user.name || '');
                setEditPhone(syncData.user.phone || syncData.user.telegramPhone || '');

                const bookingsRes = await fetch('/api/public/my-bookings', {
                  headers: { Authorization: `Bearer ${session.access_token}` },
                  cache: 'no-store',
                });
                if (bookingsRes.ok) {
                  const bData = await bookingsRes.json();
                  setBookings(Array.isArray(bData.bookings) ? bData.bookings : []);
                  setReservations(Array.isArray(bData.reservations) ? bData.reservations : []);
                }
                fetchChatMessages();
                return;
              }
            }
          } catch {}

          setAuthenticated(true);
          const email = session.user.email || '';
          const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || email.split('@')[0];
          setUserProfile({
            id: session.user.id,
            name,
            email,
            phone: session.user.phone || null,
            provider: session.user.app_metadata?.provider === 'google' ? 'google' : 'email',
          });
          setEditName(name);

          // Fetch bookings using client token
          const bookingsRes = await fetch('/api/public/my-bookings', {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: 'no-store',
          });
          if (bookingsRes.ok) {
            const bData = await bookingsRes.json();
            setBookings(Array.isArray(bData.bookings) ? bData.bookings : []);
            setReservations(Array.isArray(bData.reservations) ? bData.reservations : []);
          }
        } else {
          setAuthenticated(false);
        }
      }
    } catch (err) {
      console.error('Account load error:', err);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChatMessages = useCallback(async (refOverride?: string | null) => {
    const bookingRef = refOverride !== undefined ? refOverride : selectedChatBookingRef;
    setChatLoading(true);
    try {
      // Ensure chat session exists with bookingReference context if applicable
      await fetch('/api/public/live-chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath: '/account',
          bookingReference: bookingRef || undefined,
        }),
      });
      const url = bookingRef
        ? `/api/public/live-chat/messages?bookingReference=${encodeURIComponent(bookingRef)}`
        : '/api/public/live-chat/messages';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch {}
    finally {
      setChatLoading(false);
    }
  }, [selectedChatBookingRef]);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchChatMessages();
    }
  }, [activeTab, selectedChatBookingRef, fetchChatMessages]);

  useEffect(() => {
    loadData();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session?.access_token && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        loadData();
      } else if (event === 'SIGNED_OUT') {
        setAuthenticated(false);
        setUserProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadData]);

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      await supabaseClient.auth.signOut();
    } catch {}
    window.location.href = '/';
  };

  // Profile save handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    try {
      const res = await fetch('/api/auth/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfileSuccess(true);
      setIsEditingProfile(false);
      if (data.user) {
        setUserProfile((prev) => (prev ? { ...prev, name: data.user.name, phone: data.user.phone } : prev));
      }
      setTimeout(() => setProfileSuccess(false), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Error updating profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // Send chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sendingMsg) return;

    const text = chatInput.trim();
    setChatInput('');
    setSendingMsg(true);

    try {
      const res = await fetch('/api/public/live-chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          bookingReference: selectedChatBookingRef || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Filtered bookings
  const now = new Date();
  const upcomingBookings = useMemo(() => {
    return bookings.filter((b) => new Date(b.travelDate) >= now && b.status !== 'CANCELLED');
  }, [bookings]);

  const pastBookings = useMemo(() => {
    return bookings.filter((b) => new Date(b.travelDate) < now || b.status === 'COMPLETED' || b.status === 'CANCELLED');
  }, [bookings]);

  const displayedBookings = useMemo(() => {
    if (bookingFilter === 'UPCOMING') return upcomingBookings;
    if (bookingFilter === 'PAST') return pastBookings;
    return bookings;
  }, [bookingFilter, bookings, upcomingBookings, pastBookings]);

  // Loading indicator
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070F1E] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Talago Account…</p>
        </div>
      </div>
    );
  }

  // Not authenticated view -> Clean, localized member access prompt
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#070F1E] text-slate-100 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-7 sm:p-10 shadow-2xl shadow-black/80 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25 shadow-lg shadow-[#00E5FF]/10">
            <User className="h-8 w-8" />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">{dict.account.authRequired.title}</h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
              {dict.account.authRequired.subtitle}
            </p>
          </div>

          <div className="pt-2 space-y-3">
            <Link
              href="/auth?returnTo=/account"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] py-3.5 px-6 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:scale-[1.02] active:scale-[0.98] transition"
            >
              <User className="h-4 w-4" />
              <span>{dict.account.authRequired.signInButton}</span>
            </Link>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-3">{dict.account.authRequired.orGuest}</p>
              <Link
                href="/my-bookings"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-2.5 px-5 text-xs font-bold text-slate-200 hover:bg-white/10 transition"
              >
                <Ticket className="h-4 w-4 text-[#00E5FF]" />
                <span>{dict.account.authRequired.guestLookupButton}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.name || 'Traveler';
  const displayEmail = userProfile?.email?.endsWith('@noreply.talago.com') ? null : userProfile?.email;
  const userInitial = displayName.charAt(0).toUpperCase() || 'T';

  return (
    <div className="min-h-screen bg-[#070F1E] text-slate-100 font-sans pb-20">
      {/* ── Top Header Banner ── */}
      <div className="relative border-b border-white/10 bg-[#0B1528] pt-12 pb-8 px-5 sm:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            {userProfile?.telegramPhotoUrl ? (
              <img
                src={userProfile.telegramPhotoUrl}
                alt={displayName}
                className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border-2 border-[#00E5FF] shadow-lg shadow-[#00E5FF]/20 shrink-0"
              />
            ) : (
              <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E5FF] to-[#0284C7] text-2xl sm:text-3xl font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20">
                {userInitial}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
                  <Sparkles className="h-3 w-3" />
                  {dict.account.travelerBadge}
                </span>
                {userProfile?.telegramUsername && (
                  <span className="inline-block rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-[10px] font-mono text-sky-300">
                    @{userProfile.telegramUsername}
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-3xl font-black text-white truncate">
                {dict.account.welcome}, {displayName}
              </h1>
              {displayEmail && <p className="text-xs text-slate-400 mt-0.5 truncate">{displayEmail}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tours"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 hover:scale-105 transition"
            >
              <span>{dict.account.overview.exploreButton}</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition"
              title={dict.account.security.signOutButton}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{dict.navbar.logout}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Tabs + Content ── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-8">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-white/10">
          {[
            { key: 'overview', label: dict.account.tabs.overview, icon: LayoutDashboard },
            { key: 'bookings', label: dict.account.tabs.bookings, icon: Ticket, badge: bookings.length },
            { key: 'messages', label: dict.account.tabs.messages, icon: MessageSquare, badge: messages.length },
            { key: 'favorites', label: dict.account.tabs.favorites, icon: Heart, badge: wishlist.length },
            { key: 'profile', label: dict.account.tabs.profile, icon: User },
            { key: 'preferences', label: dict.account.tabs.preferences, icon: Settings },
            { key: 'security', label: dict.account.tabs.security, icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabKey)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-md shadow-[#00E5FF]/20 font-black'
                    : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                      isActive ? 'bg-[#070F1E] text-[#00E5FF]' : 'bg-[#00E5FF]/20 text-[#00E5FF]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="pt-8 space-y-8 animate-in fade-in duration-150">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{dict.account.overview.upcomingTrips}</span>
                  <CalendarDays className="h-4 w-4 text-[#00E5FF]" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{upcomingBookings.length}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{dict.account.overview.totalBookings}</span>
                  <Ticket className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{bookings.length}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{dict.account.overview.savedFavorites}</span>
                  <Heart className="h-4 w-4 text-rose-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{wishlist.length}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider">{dict.account.overview.unreadMessages}</span>
                  <MessageSquare className="h-4 w-4 text-amber-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{messages.length}</p>
              </div>
            </div>

            {/* Upcoming Journey Hero Card */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#00E5FF]" />
                  <span>{dict.account.overview.upcomingTrips}</span>
                </h2>
                {bookings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-bold text-[#00E5FF] hover:underline flex items-center gap-1"
                  >
                    <span>{dict.account.overview.viewAllBookings}</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {upcomingBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {upcomingBookings.slice(0, 2).map((booking) => {
                    const title = getTourTitle(booking.tour?.translations, language);
                    return (
                      <div
                        key={booking.id}
                        className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 sm:p-6 shadow-xl flex flex-col justify-between space-y-4 hover:border-[#00E5FF]/30 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-[#00E5FF] mb-2">
                              {booking.bookingReference}
                            </span>
                            <h3 className="text-base font-black text-white line-clamp-1">{title}</h3>
                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                              <span>{new Date(booking.travelDate).toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              <span>·</span>
                              <span>{booking.guestCount} {dict.account.bookings.guestsLabel}</span>
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase">
                            {dict.account.bookings.statusConfirmed}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">{dict.account.bookings.dueOnArrival}</span>
                            <span className="text-sm font-bold text-white">
                              {booking.amountDueOnArrival ? formatPrice(booking.amountDueOnArrival) : '$0'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatBookingRef(booking.bookingReference);
                              setActiveTab('messages');
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[#00E5FF]" />
                            <span>Chat</span>
                          </button>
                          <a
                            href={`/booking/${booking.accessToken}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-sm hover:scale-105 transition"
                          >
                            <Ticket className="h-3.5 w-3.5" />
                            <span>{dict.account.bookings.viewBoardingPass}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-8 sm:p-12 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                    <CalendarDays className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{dict.account.overview.noUpcoming}</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{dict.account.overview.noUpcomingDesc}</p>
                  </div>
                  <Link
                    href="/tours"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 hover:scale-105 transition"
                  >
                    <span>{dict.account.overview.browseTours}</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions & Help Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#00E5FF]" />
                  <span>{dict.account.messages.title}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {dict.account.messages.conciergeNotice}
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('messages')}
                    className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-white transition"
                  >
                    {dict.account.messages.activeChat}
                  </button>
                  <a
                    href={getWhatsAppUrl('I need support with my Talago booking')}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 transition"
                  >
                    {dict.account.messages.whatsappDirect}
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-[#00E5FF]" />
                  <span>{dict.account.profile.title}</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {userProfile?.isTelegram
                    ? dict.account.profile.telegramConnected
                    : userProfile?.provider === 'google'
                    ? dict.account.security.googleConnectedDesc
                    : dict.account.security.emailConnectedDesc}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-white transition"
                  >
                    {dict.account.profile.editButton}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MY BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div className="pt-8 space-y-6 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white">{dict.account.bookings.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{dict.account.bookings.subtitle}</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                {(['ALL', 'UPCOMING', 'PAST'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setBookingFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      bookingFilter === f
                        ? 'bg-[#00E5FF] text-[#070F1E] font-black shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f === 'ALL'
                      ? dict.account.bookings.filterAll
                      : f === 'UPCOMING'
                      ? dict.account.bookings.filterUpcoming
                      : dict.account.bookings.filterPast}
                  </button>
                ))}
              </div>
            </div>

            {displayedBookings.length > 0 ? (
              <div className="space-y-4">
                {displayedBookings.map((booking) => {
                  const title = getTourTitle(booking.tour?.translations, language);
                  const isPast = new Date(booking.travelDate) < now;
                  return (
                    <div
                      key={booking.id}
                      className="rounded-3xl border border-white/10 bg-[#0B1528] p-5 sm:p-6 shadow-xl space-y-4 hover:border-white/20 transition"
                    >
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4 min-w-0">
                          {booking.tour?.coverImage ? (
                            <div className="relative h-20 w-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-slate-900">
                              <Image
                                src={booking.tour.coverImage}
                                alt={title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-[#00E5FF]">
                              <Ticket className="h-8 w-8" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-bold text-[#00E5FF] bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                                {booking.bookingReference}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                  booking.status === 'CONFIRMED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : booking.status === 'COMPLETED'
                                    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                                }`}
                              >
                                {booking.status === 'CONFIRMED'
                                  ? dict.account.bookings.statusConfirmed
                                  : booking.status === 'COMPLETED'
                                  ? dict.account.bookings.statusCompleted
                                  : booking.status}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-white line-clamp-1">{title}</h3>
                            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 text-slate-500" />
                                {new Date(booking.travelDate).toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              <span>·</span>
                              <span>{booking.guestCount} {dict.account.bookings.guestsLabel}</span>
                              {booking.amountDueOnArrival !== null && booking.amountDueOnArrival > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-300 font-bold">
                                    {dict.account.bookings.dueOnArrival}: {formatPrice(booking.amountDueOnArrival)}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-white/5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setExpandedBookingId((prev) => (prev === booking.id ? null : booking.id))}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2.5 text-xs font-bold text-slate-200 transition"
                          >
                            <Info className="h-3.5 w-3.5 text-slate-400" />
                            <span>{expandedBookingId === booking.id ? 'Hide Details' : 'Details'}</span>
                            {expandedBookingId === booking.id ? (
                              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatBookingRef(booking.bookingReference);
                              setActiveTab('messages');
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white transition hover:border-[#00E5FF]/40 hover:text-[#00E5FF]"
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-[#00E5FF]" />
                            <span>Chat</span>
                          </button>

                          <a
                            href={`/booking/${booking.accessToken}`}
                            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-sm hover:scale-105 transition"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>{dict.account.bookings.viewBoardingPass}</span>
                          </a>

                          {isPast && (
                            <button
                              type="button"
                              onClick={() => setActiveReviewTour({ id: booking.tourId, title })}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition"
                            >
                              <Star className="h-3.5 w-3.5 text-amber-400" />
                              <span>Review</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable In-Account Booking Details View */}
                      {expandedBookingId === booking.id && (
                        <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-white/[0.02] p-4 rounded-2xl animate-in fade-in duration-150">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pickup Location & Hotel</span>
                            <p className="font-semibold text-white">
                              {booking.hotelName || booking.pickupLocationName || 'To be coordinated with concierge'}
                            </p>
                            {booking.roomNumber && (
                              <p className="text-slate-400 text-[11px] mt-0.5">Room: {booking.roomNumber}</p>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Pickup Time</span>
                            <p className="font-semibold text-white">
                              {booking.selectedPickupTime || 'Supplier will confirm in chat'}
                            </p>
                            {booking.pickupDirectives && (
                              <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{booking.pickupDirectives}</p>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Guests Breakdown</span>
                            <p className="font-semibold text-white">
                              {booking.guestCount} Guests
                              {(booking.adultsCount || 0) > 0 && ` (${booking.adultsCount} Adults`}
                              {(booking.childrenCount || 0) > 0 && `, ${booking.childrenCount} Children`}
                              {(booking.infantsCount || 0) > 0 && `, ${booking.infantsCount} Infants`}
                              {(booking.adultsCount || 0) > 0 && ')'}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Payment Scheme</span>
                            <p className="font-semibold text-white">
                              {booking.paymentScheme ? booking.paymentScheme.replace(/_/g, ' ') : 'Pay on Arrival'}
                            </p>
                            <p className="text-slate-400 text-[11px] mt-0.5">
                              Total: {formatPrice(booking.totalPriceUSD)}
                              {booking.amountDueOnArrival != null && booking.amountDueOnArrival > 0 && (
                                <span className="text-amber-300 ml-1">· Due on arrival: {formatPrice(booking.amountDueOnArrival)}</span>
                              )}
                            </p>
                          </div>

                          {booking.specialRequirements && (
                            <div className="sm:col-span-2">
                              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Special Requirements</span>
                              <p className="text-slate-300 text-[11px]">{booking.specialRequirements}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center space-y-4">
                <Ticket className="h-10 w-10 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">{dict.account.bookings.noBookings}</h3>
                  <p className="text-xs text-slate-400 mt-1">{dict.account.bookings.noBookingsDesc}</p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/my-bookings"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#00E5FF] hover:underline"
                  >
                    <span>{dict.account.bookings.guestLookupLink}</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ── Reservations & Inquiry Requests ── */}
            {reservations.length > 0 && (
              <div className="mt-8 space-y-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400">
                  Preliminary Requests & Inquiries
                </h3>
                <div className="space-y-3">
                  {reservations.map((res) => (
                    <div
                      key={res.id}
                      className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {res.reservationReference && (
                            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                              {res.reservationReference}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase border bg-amber-500/10 text-amber-300 border-amber-500/20">
                            {res.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white line-clamp-1">
                          {res.tourTitle || 'Tour Inquiry'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {res.travelDate
                            ? new Date(res.travelDate).toLocaleDateString(language, { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Date TBD'}
                          {res.adults ? ` · ${res.adults + (res.children || 0)} guests` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChatBookingRef(res.leadId ? `lead:${res.leadId}` : null);
                          setActiveTab('messages');
                        }}
                        className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 transition"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: CONCIERGE MESSAGES ── */}
        {activeTab === 'messages' && (
          <div className="pt-8 space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-black text-white">{dict.account.messages.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{dict.account.messages.subtitle}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1528] overflow-hidden shadow-2xl flex flex-col h-[560px] max-h-[78dvh]">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      {selectedChatBookingRef ? `Booking ${selectedChatBookingRef}` : 'Talago 24/7 Concierge'}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {selectedChatBookingRef ? 'Dedicated booking assistance & dispatch' : 'Direct dispatch & itinerary support'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fetchChatMessages()}
                  className="p-2 text-slate-400 hover:text-white transition"
                  title="Refresh chat"
                >
                  <RefreshCw className={`h-4 w-4 ${chatLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {(bookings.length > 0 || reservations.length > 0) && (
                <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.01] flex items-center gap-2 overflow-x-auto text-xs shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Channel:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedChatBookingRef(null)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition ${!selectedChatBookingRef ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30' : 'text-slate-400 hover:text-white bg-white/5'}`}
                  >
                    General Concierge
                  </button>
                  {bookings.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedChatBookingRef(b.bookingReference)}
                      className={`px-2.5 py-1 rounded-lg shrink-0 font-mono text-[11px] font-bold transition ${selectedChatBookingRef === b.bookingReference ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30' : 'text-slate-400 hover:text-white bg-white/5'}`}
                    >
                      {b.bookingReference}
                    </button>
                  ))}
                  {reservations.map((r) => {
                    const refKey = r.leadId ? `lead:${r.leadId}` : (r.reservationReference || r.id);
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedChatBookingRef(refKey)}
                        className={`px-2.5 py-1 rounded-lg shrink-0 font-mono text-[11px] font-bold transition ${selectedChatBookingRef === refKey ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' : 'text-slate-400 hover:text-white bg-white/5'}`}
                      >
                        {r.reservationReference || `REQ-${r.id.slice(-6).toUpperCase()}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Chat Messages Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <MessageSquare className="h-8 w-8 text-slate-600" />
                    <div>
                      <p className="text-sm font-bold text-white">{dict.account.messages.noMessages}</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">{dict.account.messages.noMessagesDesc}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    if (m.sender === 'SYSTEM') {
                      return (
                        <div key={m.id} className="flex justify-center my-2">
                          <div className="max-w-md rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2.5 text-xs text-sky-200 text-center leading-relaxed shadow-sm">
                            <span className="font-bold text-[#00E5FF] mr-1.5 uppercase tracking-wider text-[10px]">[SYSTEM]</span>
                            {m.body.replace(/^\[SYSTEM BOOKING RECORD\]\s*|^\[BOOKING INITIALIZED\]\s*|^\[STATUS UPDATE\]\s*/, '')}
                            <span className="block mt-1 text-[9px] text-sky-300/60 font-mono">
                              {new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const isMe = m.sender === 'VISITOR';
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-md rounded-2xl p-3.5 text-xs ${
                            isMe
                              ? 'bg-gradient-to-r from-[#00E5FF] to-[#0284C7] text-[#070F1E] font-medium shadow-md'
                              : 'bg-white/10 text-white border border-white/10'
                          }`}
                        >
                          <p className="leading-relaxed">{m.body}</p>
                          <span
                            className={`block mt-1 text-[9px] ${
                              isMe ? 'text-[#070F1E]/70 text-right' : 'text-slate-400'
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#0B1528] shrink-0 sticky bottom-0 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={dict.account.messages.typePlaceholder}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || sendingMsg}
                  className="rounded-xl bg-[#00E5FF] px-4 py-2.5 text-xs font-black uppercase text-[#070F1E] shadow-sm disabled:opacity-40 hover:scale-105 active:scale-95 transition flex items-center gap-1.5"
                >
                  <span>{dict.account.messages.sendButton}</span>
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── TAB 4: FAVORITES ── */}
        {activeTab === 'favorites' && (
          <div className="pt-8 space-y-6 animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-black text-white">{dict.account.favorites.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{dict.account.favorites.subtitle}</p>
            </div>

            {wishlist.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-3xl border border-white/10 bg-[#0B1528] overflow-hidden shadow-xl flex flex-col justify-between hover:border-[#00E5FF]/40 transition"
                  >
                    <div className="relative h-48 w-full bg-slate-900">
                      {item.coverImage ? (
                        <Image
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          className="object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-600">
                          <Ticket className="h-10 w-10" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromWishlist(item.id)}
                        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 backdrop-blur-md text-rose-400 hover:scale-110 transition"
                        title={dict.account.favorites.removeFavorite}
                      >
                        <Heart className="h-4 w-4 fill-rose-400" />
                      </button>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        {item.destinationName && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#00E5FF] block mb-1">
                            {item.destinationName}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-white line-clamp-2">{item.title}</h3>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">{dict.account.favorites.fromPrice}</span>
                          <span className="text-base font-black text-white">{formatPrice(item.priceUSD)}</span>
                        </div>
                        <Link
                          href={`/tours/${item.slug}`}
                          className="rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black uppercase text-[#070F1E] shadow-sm hover:scale-105 transition"
                        >
                          {dict.account.favorites.bookNow}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center space-y-4">
                <Heart className="h-10 w-10 text-slate-600 mx-auto" />
                <div>
                  <h3 className="text-base font-bold text-white">{dict.account.favorites.noFavorites}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">{dict.account.favorites.noFavoritesDesc}</p>
                </div>
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-md shadow-[#00E5FF]/20 hover:scale-105 transition"
                >
                  <span>{dict.account.favorites.exploreTours}</span>
                  <span>→</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: MY PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="pt-8 space-y-6 max-w-2xl animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-black text-white">{dict.account.profile.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{dict.account.profile.subtitle}</p>
            </div>

            {profileSuccess && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{dict.account.profile.savedSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 sm:p-8 space-y-6">
              {!isEditingProfile ? (
                /* Profile Read-Only View */
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{dict.account.profile.fullName}</span>
                      <p className="text-base font-bold text-white mt-0.5">{displayName}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(true)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
                    >
                      {dict.account.profile.editButton}
                    </button>
                  </div>

                  {displayEmail && (
                    <div className="pb-4 border-b border-white/5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{dict.account.profile.emailAddress}</span>
                      <p className="text-sm font-semibold text-slate-200 mt-0.5">{displayEmail}</p>
                    </div>
                  )}

                  <div className="pb-4 border-b border-white/5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">{dict.account.profile.phoneNumber}</span>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {userProfile?.phone || userProfile?.telegramPhone || dict.account.profile.phoneNotShared}
                    </p>
                    {userProfile?.telegramPhoneVerified && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {dict.account.profile.phoneVerified}
                      </span>
                    )}
                  </div>

                  {userProfile?.isTelegram && (
                    <div className="pb-4 border-b border-white/5 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{dict.account.profile.telegramIdentity}</span>
                      <div className="flex items-center gap-3">
                        {userProfile.telegramPhotoUrl && (
                          <img
                            src={userProfile.telegramPhotoUrl}
                            alt=""
                            className="h-10 w-10 rounded-full object-cover border border-[#00E5FF]/30"
                          />
                        )}
                        <div>
                          <p className="text-xs font-mono font-bold text-[#00E5FF]">
                            {userProfile.telegramUsername ? `@${userProfile.telegramUsername}` : `ID: ${userProfile.telegramId}`}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {userProfile.telegramBotAccess ? dict.account.profile.botEnabled : dict.account.profile.botDisabled}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Profile Edit Mode */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">{dict.account.profile.fullName}</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder={dict.account.profile.namePlaceholder}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">{dict.account.profile.phoneNumber}</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder={dict.account.profile.phonePlaceholder}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>

                  <div className="pt-3 flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="rounded-xl bg-[#00E5FF] px-5 py-2.5 text-xs font-black uppercase text-[#070F1E] shadow-sm disabled:opacity-50 hover:scale-105 transition"
                    >
                      {profileSaving ? 'Saving…' : dict.account.profile.saveButton}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
                    >
                      {dict.account.profile.cancelButton}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 6: PREFERENCES ── */}
        {activeTab === 'preferences' && (
          <div className="pt-8 space-y-6 max-w-2xl animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-black text-white">{dict.account.preferences.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{dict.account.preferences.subtitle}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 sm:p-8 space-y-6">
              {/* Language Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#00E5FF]" />
                  <span>{dict.account.preferences.languageLabel}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LANGUAGES.map((code) => {
                    const isSelected = language === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLanguage(code)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white shadow-sm'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-mono text-[#00E5FF] uppercase">{code}</span>
                        <span className="mt-1">{LANGUAGE_NAMES[code] || code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency Selector */}
              <div className="pt-4 border-t border-white/10">
                <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                  <Coins className="h-4 w-4 text-[#00E5FF]" />
                  <span>{dict.account.preferences.currencyLabel}</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['USD', 'EUR', 'EGP', 'GBP'] as SupportedCurrency[]).map((c) => {
                    const isSelected = currency === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCurrency(c)}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition ${
                          isSelected
                            ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-white shadow-sm font-black'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">{dict.account.preferences.currencyNotice}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: SECURITY ── */}
        {activeTab === 'security' && (
          <div className="pt-8 space-y-6 max-w-2xl animate-in fade-in duration-150">
            <div>
              <h2 className="text-lg font-black text-white">{dict.account.security.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{dict.account.security.subtitle}</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0B1528] p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {dict.account.security.signInProvider}
                </h4>

                {userProfile?.isTelegram && (
                  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                      TG
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{dict.account.security.telegramAuth}</p>
                      <p className="text-[11px] text-slate-400">{dict.account.security.telegramConnectedDesc}</p>
                    </div>
                  </div>
                )}

                {userProfile?.provider === 'google' && (
                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                      G
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{dict.account.security.googleAuth}</p>
                      <p className="text-[11px] text-slate-400">{dict.account.security.googleConnectedDesc}</p>
                    </div>
                  </div>
                )}

                {userProfile?.provider === 'email' && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      @
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{dict.account.security.emailAuth}</p>
                      <p className="text-[11px] text-slate-400">{dict.account.security.emailConnectedDesc}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{dict.account.security.signOutButton}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {activeReviewTour && (
        <WriteReviewModal
          isOpen={true}
          tourId={activeReviewTour.id}
          tourTitle={activeReviewTour.title}
          onClose={() => setActiveReviewTour(null)}
        />
      )}
    </div>
  );
}

