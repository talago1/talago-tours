import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Booking Confirmed | Talago Tours',
  description: 'Your tour booking has been confirmed. Our team will contact you via WhatsApp shortly.',
  openGraph: {
    title: 'Booking Confirmed | Talago Tours',
    description: 'Your tour booking has been confirmed.',
  },
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { ref?: string };
}) {
  const ref = searchParams.ref || '';

  return (
    <main className="min-h-screen bg-neutral-light flex items-center justify-center px-4 py-12">
      <article className="max-w-lg w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#00473F]/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-[#00473F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>

        <p className="text-gray-500 mb-6">
          Your booking reference
        </p>

        <div className="inline-block bg-[#00473F]/5 border border-[#00473F]/20 rounded-xl px-6 py-3 mb-6">
          <span className="text-xl font-bold text-[#00473F] tracking-wider">
            {ref}
          </span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-sm text-amber-800">
          <p>
            Our team is preparing your pickup details and will contact you directly via WhatsApp within 15 minutes.
          </p>
        </div>

        <a
          href="/"
          className="inline-block px-8 py-3 bg-[#FF5B00] text-white font-semibold rounded-lg hover:bg-[#FF5B00]/90 transition-colors duration-200"
        >
          Back to Home
        </a>

        {ref && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <a
              href={`/tours/voucher/${ref}`}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/20 bg-emerald-50 px-6 py-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              View Digital Voucher
            </a>
          </div>
        )}
      </article>
    </main>
  );
}
