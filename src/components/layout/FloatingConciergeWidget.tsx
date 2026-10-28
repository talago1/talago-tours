'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function FloatingConciergeWidget() {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState(
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+2010222434602'
  );

  useEffect(() => {
    fetch('/api/public/settings/contact')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.whatsappNumber) setWhatsappNumber(data.whatsappNumber); })
      .catch(() => {/* keep fallback */});
  }, []);

  const defaultMessage = encodeURIComponent('Hello TALAGO Concierge! I would like to inquire about booking tours & curated travel experiences.');
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${defaultMessage}`;

  return (
    <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex flex-col items-end lg:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] lg:right-[calc(1.5rem+env(safe-area-inset-right))]">
      {/* Expanded Concierge Quick Card */}
      {isOpen && (
        <div className="mb-4 w-72 sm:w-80 rounded-3xl border border-white/15 bg-[#0B1528]/95 p-5 shadow-2xl shadow-black/80 backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#EAB308]">VIP Concierge</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3">
            <p className="text-sm font-bold text-white">Need personal assistance?</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">
              Our travel specialists are online 24/7 to curate custom private tours, activities, and unforgettable experiences for you worldwide.
            </p>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] py-3 text-xs font-black uppercase tracking-wider text-[#070F1E] shadow-xl shadow-[#25D366]/20 transition-all hover:scale-[1.02] hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-4 w-4 fill-current" />
            Chat on WhatsApp
          </a>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-2xl shadow-[#25D366]/40 transition-all duration-300 hover:scale-110"
        aria-label="Contact VIP Concierge"
      >
        <span className="absolute -top-1 -right-1 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-4 w-4 rounded-full border-2 border-[#070F1E] bg-emerald-500"></span>
        </span>
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6 fill-current" />}
      </button>
    </div>
  );
}

