'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function CheckoutSuccessContent({ ref }: { ref: string }) {
  const { dict } = useLanguage();

  return (
    <main className="min-h-screen bg-[#070F1E] flex items-center justify-center px-4 py-12">
      <article className="max-w-lg w-full rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{dict.checkoutSuccessPage.title}</h1>

        <p className="text-slate-400 mb-6">
          {dict.checkoutSuccessPage.bookingRefLabel}
        </p>

        <div className="inline-block bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-xl px-6 py-3 mb-6">
          <span className="text-xl font-bold text-[#00E5FF] tracking-wider">
            {ref}
          </span>
        </div>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 mb-6 text-sm text-amber-300">
          <p>
            {dict.checkoutSuccessPage.whatsappMsg}
          </p>
        </div>

        <a
          href="/"
          className="inline-block px-8 py-3 bg-[#00E5FF] text-[#070F1E] font-semibold rounded-lg hover:bg-[#00D4F0] transition-colors duration-200"
        >
          {dict.checkoutSuccessPage.backToHome}
        </a>

        {ref && (
          <div className="mt-6 border-t border-white/10 pt-6">
            <a
              href={`/tours/voucher/${ref}`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {dict.checkoutSuccessPage.viewVoucher}
            </a>
          </div>
        )}
      </article>
    </main>
  );
}
