import { notFound } from 'next/navigation';
import { getManagedContentPage } from '@/lib/contentPages';

export default async function ManagedContentPage({ slug }: { slug: string }) {
  const page = await getManagedContentPage(slug);
  if (!page.visible) notFound();
  return <main className="min-h-screen bg-[#070F1E] text-[#F8FAFC]">
    <section className="border-b border-white/10 px-5 py-20 sm:px-8 lg:px-10 lg:py-28"><div className="mx-auto max-w-4xl text-center"><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">{page.label}</p><h1 className="mt-4 text-4xl font-black text-white sm:text-6xl">{page.title}</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">{page.intro}</p></div></section>
    <section className="px-5 py-12 sm:px-8 lg:px-10 lg:py-20"><div className="mx-auto max-w-4xl space-y-10">{page.blocks.filter((block) => block.visible).map((block) => <article key={block.id} className="border-b border-white/10 pb-10 last:border-0"><h2 className="text-2xl font-bold text-white">{block.heading}</h2><p className="mt-3 whitespace-pre-line text-base leading-8 text-slate-300">{block.body}</p></article>)}</div></section>
  </main>;
}
