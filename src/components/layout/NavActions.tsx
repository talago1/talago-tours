'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Globe, LayoutDashboard, LogOut, ChevronDown, DollarSign, Heart } from 'lucide-react';
import { useLanguage, type LanguageCode, languageLabels } from '@/context/LanguageContext';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlist } from '@/context/WishlistContext';
import { supabaseClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Session } from '@supabase/supabase-js';

const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: 'en', label: 'EN', native: 'English' },
  { code: 'de', label: 'DE', native: 'Deutsch' },
  { code: 'ru', label: 'RU', native: 'Русский' },
  { code: 'it', label: 'IT', native: 'Italiano' },
  { code: 'fr', label: 'FR', native: 'Français' },
  { code: 'pl', label: 'PL', native: 'Polski' },
  { code: 'es', label: 'ES', native: 'Español' },
  { code: 'uk', label: 'UA', native: 'Українська' },
];

export default function NavActions() {
  const { language, setLanguage, dict } = useLanguage();
  const { currency, setCurrency, symbols, supportedCurrencies } = useCurrency();
  const { count } = useWishlist();
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [serverUser, setServerUser] = useState<{
    email?: string;
    name?: string;
    telegramPhotoUrl?: string | null;
    telegramUsername?: string | null;
  } | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Bootstrap session state + listen for changes
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
      } else {
        fetch('/api/auth/session')
          .then((res) => (res.ok ? res.json() : null))
          .then((authData) => {
            if (authData?.authenticated && authData.user) {
              setServerUser(authData.user);
            }
          })
          .catch(() => {});
      }
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setServerUser(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (currencyRef.current && !currencyRef.current.contains(e.target as Node)) setCurrencyOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      await supabaseClient.auth.signOut();
    } catch {}
    setSession(null);
    setServerUser(null);
    setUserOpen(false);
    router.push('/');
    router.refresh();
  }, [router]);

  const activeEmail = session?.user?.email || serverUser?.email || '';
  const activeName = serverUser?.name || activeEmail.split('@')[0] || '';
  const userInitial = (activeName[0] || activeEmail[0] || 'T').toUpperCase();

  return (
    <div className="flex items-center gap-2">
      {/* ── Language Switcher ── */}
      <div ref={langRef} className="relative">
        <button
          type="button"
          onClick={() => setLangOpen(!langOpen)}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
        >
          <Globe className="h-4 w-4" />
          <span>{languageLabels[language]}</span>
        </button>

        {langOpen && (
          <div className="absolute right-0 top-full mt-2 w-40 rounded-xl border border-white/10 bg-[#0B1528] py-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  language === lang.code
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span className="w-8 font-bold">{lang.label}</span>
                <span className="text-slate-500">{lang.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Currency Switcher ── */}
      <div ref={currencyRef} className="relative">
        <button
          type="button"
          onClick={() => setCurrencyOpen(!currencyOpen)}
          className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-bold text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
        >
          <span className="text-[#00E5FF] font-mono text-xs font-black">{symbols[currency]}</span>
          <span>{currency}</span>
        </button>

        {currencyOpen && (
          <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-white/10 bg-[#0B1528] py-1 shadow-2xl shadow-black/60 backdrop-blur-xl z-50">
            {supportedCurrencies.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => { setCurrency(c); setCurrencyOpen(false); }}
                className={`flex w-full items-center justify-between px-3.5 py-2 text-xs font-bold transition-colors ${
                  currency === c
                    ? 'bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <span>{c}</span>
                <span className="font-mono text-slate-400">{symbols[c]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Wishlist Link & Counter ── */}
      <Link
        href="/wishlist"
        className="relative inline-flex items-center justify-center rounded-xl p-2 text-slate-300 transition-all hover:bg-white/[0.06] hover:text-[#00E5FF] group"
        title="Saved Experiences"
        aria-label="Wishlist"
      >
        <Heart className={`h-4 w-4 transition-transform group-hover:scale-110 ${count > 0 ? 'text-rose-400 fill-rose-400' : ''}`} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-md shadow-rose-500/40">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>

      <div className="h-6 w-px bg-white/10" />

      {/* ── Auth: Logged In → Avatar Dropdown | Logged Out → Sign In button ── */}
      {(session || serverUser) ? (
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/10 py-1 pl-1.5 pr-3 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20"
          >
            {/* Avatar circle or photo */}
            {serverUser?.telegramPhotoUrl ? (
              <img
                src={serverUser.telegramPhotoUrl}
                alt={activeName}
                className="h-6 w-6 rounded-full object-cover border border-[#00E5FF]/40"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00E5FF] text-[10px] font-black text-[#070F1E]">
                {userInitial}
              </span>
            )}
            <span className="hidden sm:block max-w-[120px] truncate">
              {activeName || activeEmail.split('@')[0]}
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-white/10 bg-[#0B1528] py-1.5 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="border-b border-white/[0.08] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed in</p>
                <p className="mt-0.5 truncate text-sm font-bold text-white">{activeName}</p>
                {activeEmail && activeEmail !== activeName && !activeEmail.endsWith('@noreply.talago.com') && (
                  <p className="truncate text-xs text-slate-400">{activeEmail}</p>
                )}
                {serverUser?.telegramUsername && (
                  <span className="inline-block mt-1 text-[11px] font-mono text-[#00E5FF]">@{serverUser.telegramUsername}</span>
                )}
              </div>
              <Link
                href="/account"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-white/[0.06] hover:text-[#00E5FF]"
              >
                <User className="h-4 w-4 text-[#00E5FF]" />
                {dict.navbar.account || 'Account Dashboard'}
              </Link>
              <Link
                href="/account?tab=bookings"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                {dict.navbar.myBookings || 'My Bookings'}
              </Link>
              <div className="h-px bg-white/[0.06] my-1" />
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                {dict.navbar.logout || 'Sign Out'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Link
            href="/auth"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:text-white"
          >
            <span>Sign In</span>
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#00E5FF]/10"
          >
            <User className="h-3.5 w-3.5" />
            <span>Register</span>
          </Link>
        </div>
      )}
    </div>
  );
}
