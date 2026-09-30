'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Search, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  authorName: string;
  readTimeMinutes: number;
  translations: unknown;
  createdAt: string;
}

export default function BlogClient({ initialPosts }: { initialPosts: BlogPostData[] }) {
  const { language } = useLanguage();
  const isAr = (language as string) === 'ar';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const categories = ['ALL', 'Travel Guide', 'Tips & Advice', 'Diving & Marine', 'Desert Safari'];

  const filtered = initialPosts.filter((post) => {
    if (category !== 'ALL' && post.category !== category) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const t = post.translations as Record<string, { title?: string }> | undefined;
      const curTitle = t?.[language]?.title || post.title;
      return curTitle.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <section className="border-b border-white/10 bg-gradient-to-b from-[#0B1528] to-[#070F1E] px-5 pt-28 pb-14 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-4 py-1 text-xs font-black uppercase text-[#00E5FF]">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isAr ? 'دليل السفر والمدونة' : 'Editorial Guides'}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            {isAr ? 'أدلة وقصص السفر في مصر' : 'Curated Egypt Travel Guides'}
          </h1>
          <p className="text-sm text-slate-300">
            {isAr ? 'نصائح حصرية لرحلات الغردقة وشرم واليخوت والسفاري.' : 'Insider tips for Red Sea diving, yacht charters, and desert safaris.'}
          </p>

          <div className="max-w-md mx-auto relative pt-3">
            <Search className="absolute left-4 top-6 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={isAr ? 'ابحث في المقالات...' : 'Search articles...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-[#00E5FF]"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold ${
                  category === cat ? 'bg-[#00E5FF] text-black' : 'bg-white/5 text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 py-12">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">No articles found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => {
              const t = post.translations as Record<string, { title?: string; excerpt?: string }> | undefined;
              const title = t?.[language]?.title || post.title;
              const excerpt = t?.[language]?.excerpt || post.excerpt;

              return (
                <article key={post.id} className="group flex flex-col justify-between rounded-[2rem] border border-white/10 bg-white/[0.03] overflow-hidden hover:border-[#00E5FF]/40 transition">
                  <Link href={`/blog/${post.slug}`}>
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                      {post.coverImage && <img src={post.coverImage} alt={title} className="h-full w-full object-cover group-hover:scale-105 transition duration-500" />}
                      <span className="absolute top-3 left-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-black uppercase text-[#00E5FF]">
                        {post.category}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Clock className="h-3 w-3 text-[#00E5FF]" />
                        <span>{post.readTimeMinutes} min read</span>
                        <span>•</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-[#00E5FF] transition line-clamp-2">
                        {title}
                      </h3>

                      {excerpt && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{excerpt}</p>}

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                        <span className="text-xs text-slate-400">{post.authorName}</span>
                        <span className="flex items-center gap-1 text-xs font-black text-[#00E5FF]">
                          <span>Read</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}