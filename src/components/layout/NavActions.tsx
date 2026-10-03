'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Globe, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useLanguage, type LanguageCode, languageLabels } from '@/context/LanguageContext';
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
  const router = useRouter();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Bootstrap session state + listen for changes
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabaseClient.auth.signOut();
    setUserOpen(false);
    router.push('/');
    router.refresh();
  }, [router]);

  const userEmail = session?.user?.email ?? '';
  const userInitial = userEmail[0]?.toUpperCase() ?? '?';

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

      <div className="h-6 w-px bg-white/10" />

      {/* ── Auth: Logged In → Avatar Dropdown | Logged Out → Sign In button ── */}
      {session ? (
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserOpen(!userOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/10 py-1.5 pl-2 pr-3 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20"
          >
            {/* Avatar circle */}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00E5FF] text-[10px] font-black text-[#070F1E]">
              {userInitial}
            </span>
            <span className="hidden sm:block max-w-[120px] truncate">
              {userEmail.split('@')[0]}
            </span>
            <ChevronDown className={`h-3 w-3 transition-transform ${userOpen ? 'rotate-180' : ''}`} />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#0B1528] py-1 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="border-b border-white/[0.06] px-4 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Signed in as</p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">{userEmail}</p>
              </div>
              <Link
                href="/my-bookings"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                My Bookings
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/25 bg-[#00E5FF]/10 px-5 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 hover:shadow-lg hover:shadow-[#00E5FF]/10"
        >
          <User className="h-3.5 w-3.5" />
          {dict.navbar.signInRegister}
        </Link>
      )}
    </div>
  );
}
