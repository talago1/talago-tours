import { notFound } from 'next/navigation';
import { getManagedContentPage } from '@/lib/contentPages';
import { resolveServerLanguage, type SearchParamsLike } from '@/lib/i18n.server';
import { HelpCircle, MessageCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default async function ManagedContentPage({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams?: SearchParamsLike;
}) {
  const language = resolveServerLanguage(searchParams);
  const page = await getManagedContentPage(slug, language);
  if (!page.visible) notFound();

  const visibleBlocks = page.blocks.filter((block) => block.visible);
  const faqBlocks = visibleBlocks.filter((block) => block.kind === 'FAQ');
  const textBlocks = visibleBlocks.filter((block) => block.kind !== 'FAQ');

  return (
    <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,229,255,0.06),transparent_60%)]" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="inline-block rounded-full bg-[#00E5FF]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] text-[#00E5FF]">
            {page.label}
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">
            {page.title}
          </h1>
          {page.intro && (
            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              {page.intro}
            </p>
          )}
        </div>
      </section>

      {/* Main Content Sections */}
      <section className="px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Article / Text Blocks */}
          {textBlocks.map((block) => (
            <article
              key={block.id}
              className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 shadow-xl shadow-black/20"
            >
              {block.heading && (
                <h2 className="text-2xl font-black text-white sm:text-3xl">
                  {block.heading}
                </h2>
              )}
              <div className="mt-4 whitespace-pre-line text-base leading-8 text-slate-300">
                {block.body}
              </div>
            </article>
          ))}

          {/* FAQ Cards (if any) */}
          {faqBlocks.length > 0 && (
            <div className="pt-4 space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#00E5FF] mb-2">
                <HelpCircle className="h-4 w-4" />
                <span>Frequently Asked Questions</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {faqBlocks.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 shadow-md transition hover:border-[#00E5FF]/30"
                  >
                    <h3 className="text-lg font-bold text-white flex items-start gap-3">
                      <span className="text-[#00E5FF] font-black">Q.</span>
                      <span>{faq.heading}</span>
                    </h3>
                    <div className="mt-3 pl-7 whitespace-pre-line text-sm leading-7 text-slate-300">
                      {faq.body}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Concierge & Support Callout */}
          <div className="rounded-3xl border border-[#00E5FF]/20 bg-gradient-to-br from-[#00E5FF]/10 via-[#0B1528] to-[#0B1528] p-8 sm:p-10 text-center shadow-2xl">
            <ShieldCheck className="mx-auto h-10 w-10 text-[#00E5FF]" />
            <h3 className="mt-4 text-2xl font-black text-white">Need more assistance?</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Our Egypt travel concierge is available on live chat to answer questions about bookings, pickups, or custom group itineraries.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-full bg-[#00E5FF] px-6 py-3 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:bg-[#00E5FF]/90 transition"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Concierge
              </Link>
              <Link
                href="/tours"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Browse Experiences
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
