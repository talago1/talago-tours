'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, Share2, Check } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface Props {
  post: {
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    category: string;
    tags: string[];
    authorName: string;
    readTimeMinutes: number;
    translations: unknown;
    createdAt: string;
  };
  relatedPosts: Array<{
    id: string;
    slug: string;
    title: string;
    coverImage: string | null;
    category: string;
    translations: unknown;
  }>;
}

export default function BlogPostClient({ post, relatedPosts }: Props) {
  const { dict, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const t = post.translations as Record<string, { title?: string; excerpt?: string; content?: string }> | undefined;
  const title = t?.[language]?.title || post.title;
  const excerpt = t?.[language]?.excerpt || post.excerpt;
  const content = t?.[language]?.content || post.content;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 0);

  return (
    <article className="min-h-screen bg-[#070F1E] text-white">
      <header className="border-b border-white/10 bg-gradient-to-b from-[#0B1528] to-[#070F1E] px-5 pt-28 pb-10">
        <div className="mx-auto max-w-4xl">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#00E5FF] mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span>{dict.blog.backToBlog}</span>
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <span className="rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/20 px-3 py-0.5 text-xs font-black uppercase text-[#00E5FF]">
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3 text-slate-500" />
              {post.readTimeMinutes} min
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {title}
          </h1>

          {excerpt && <p className="mt-4 text-base text-slate-300 leading-relaxed">{excerpt}</p>}

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-xs text-slate-400">{post.authorName} • {new Date(post.createdAt).toLocaleDateString(language)}</span>
            <button onClick={handleShare} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold hover:bg-white/10">
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Share2 className="h-3 w-3" />}
              <span>{copied ? dict.blog.copied : dict.blog.share}</span>
            </button>
          </div>
        </div>
      </header>

      {post.coverImage && (
        <div className="mx-auto max-w-4xl px-5 -mt-4 mb-8">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <Image
              src={post.coverImage}
              alt={title}
              fill
              priority
              sizes="(max-width: 896px) calc(100vw - 40px), 896px"
              className="object-cover"
            />
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-5 py-6 space-y-6 text-base leading-relaxed text-slate-300">
        {paragraphs.map((p, idx) => {
          if (p.startsWith('## ')) return <h2 key={idx} className="text-2xl font-black text-white pt-4">{p.replace('## ', '')}</h2>;
          return <p key={idx}>{p}</p>;
        })}

        <div className="my-10 rounded-2xl border border-[#00E5FF]/20 bg-gradient-to-r from-[#00E5FF]/10 to-[#0B1528] p-6 sm:flex sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black text-white">{dict.blog.ctaTitle}</h3>
            <p className="text-xs text-slate-400">{dict.blog.ctaDesc}</p>
          </div>
          <Link href="/tours" className="mt-4 sm:mt-0 inline-block rounded-full bg-[#00E5FF] px-6 py-2 text-xs font-black uppercase text-[#070F1E]">
            {dict.blog.ctaButton}
          </Link>
        </div>

        {relatedPosts.length > 0 && (
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-base font-black text-white mb-4">{dict.blog.relatedGuides}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="group block">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-800 mb-2">
                    {r.coverImage && (
                      <Image
                        src={r.coverImage}
                        alt={r.title}
                        fill
                        sizes="(max-width: 640px) calc(100vw - 40px), 232px"
                        className="object-cover transition group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00E5FF] line-clamp-2">{r.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}