'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, User, Globe, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react';
import { useLanguage, type LanguageCode, languageLabels } from '@/context/LanguageContext';
import { supabaseClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';
import NavLinks from './NavLinks';
import NavActions from './NavActions';

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

export default function Navbar() {
  const { language, setLanguage, dict } = useLanguage();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [mobileLangOpen, setMobileLangOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMobileLangOpen(false);
  }, [pathname]);

  // Auth session listener
  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabaseClient.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabaseClient.auth.signOut();
    setMobileMenuOpen(false);
  }

  const userEmail = session?.user?.email ?? '';
  const userInitial = userEmail[0]?.toUpperCase() ?? '?';

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#070F1E]/85 shadow-lg shadow-black/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-10">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 transition-all hover:opacity-90">
          <span className="text-2xl font-black uppercase tracking-[0.34em] text-white">TALAGO</span>
          <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          <Link
            href="/"
            className="rounded-xl px-4 py-2 text-sm font-semibold tracking-wide text-slate-300 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            {(dict?.navbar as any)?.home || 'Home'}
          </Link>
          <NavLinks />
          <NavActions />
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/[0.06] bg-[#070F1E]/95 backdrop-blur-2xl lg:hidden max-h-[calc(100vh-64px)] overflow-y-auto">
          <div className="flex flex-col gap-6 p-6">
            {/* Links */}
            <nav className="flex flex-col gap-1.5">
              <Link
                href="/"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {(dict?.navbar as any)?.home || 'Home'}
              </Link>
              <Link
                href="/tours"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {dict.navbar.tours}
              </Link>
              <Link
                href="/destinations"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {dict.navbar.destinations}
              </Link>
              <Link
                href="/blog"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {dict.navbar.blog}
              </Link>
              <Link
                href="/about"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {dict.navbar.aboutUs}
              </Link>
              <Link
                href="/faq"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {dict.navbar.faq}
              </Link>
              <Link
                href="/partners"
                className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                <span>Partner with Us</span>
                <span className="rounded-full bg-[#EAB308]/10 px-2 py-0.5 text-[10px] font-bold text-[#EAB308]">Supplier</span>
              </Link>
              <Link
                href="/support"
                className="flex items-center rounded-xl px-4 py-3 text-base font-bold text-slate-200 transition-all hover:bg-white/5 hover:text-[#00E5FF]"
              >
                {dict.footer?.contactUs || 'Concierge & Support'}
              </Link>
            </nav>

            <div className="h-px bg-white/10" />

            {/* Language Selector */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMobileLangOpen(!mobileLangOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-300"
              >
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[#00E5FF]" />
                  Language: {languageLabels[language]}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {mobileLangOpen && (
                <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-[#0B1528] p-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setMobileLangOpen(false);
                      }}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                        language === lang.code
                          ? 'bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20'
                          : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({lang.native})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Actions */}
            <div className="pt-2">
              {session ? (
                <div className="space-y-3">
                  {/* User Profile Card */}
                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00E5FF] text-sm font-black text-[#070F1E]">
                      {userInitial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-slate-400">Signed in as</p>
                      <p className="truncate text-sm font-bold text-white">{userEmail}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="/my-bookings"
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 py-3 text-xs font-bold text-[#00E5FF]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      My Bookings
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 py-3 text-xs font-bold text-red-400"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#00E5FF] py-3.5 text-sm font-bold uppercase tracking-wider text-[#070F1E] shadow-lg shadow-[#00E5FF]/10"
                >
                  <User className="h-4 w-4" />
                  {dict.navbar.signInRegister}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
