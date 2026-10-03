'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [lang, setLang] = useState('en');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Travel Guide');
  const [tags, setTags] = useState('');
  const [authorName, setAuthorName] = useState('TALAGO Editorial');
  const [readTimeMinutes, setReadTimeMinutes] = useState(5);
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [translations, setTranslations] = useState<Record<string, { title: string; excerpt: string; content: string }>>({
    de: { title: '', excerpt: '', content: '' },
    ru: { title: '', excerpt: '', content: '' },
    fr: { title: '', excerpt: '', content: '' },
    it: { title: '', excerpt: '', content: '' },
    pl: { title: '', excerpt: '', content: '' },
    es: { title: '', excerpt: '', content: '' },
    uk: { title: '', excerpt: '', content: '' },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !slug || !content) return alert('Title, slug, content required');
    try {
      setSaving(true);
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          coverImage,
          excerpt,
          content,
          category,
          translations,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          authorName,
          readTimeMinutes,
          isPublished,
          isFeatured,
        }),
      });
      if (res.ok) router.push('/admin/blog');
    } finally {
      setSaving(false);
    }
  };

  const curTitle = lang === 'en' ? title : translations[lang]?.title || '';
  const curExcerpt = lang === 'en' ? excerpt : translations[lang]?.excerpt || '';
  const curContent = lang === 'en' ? content : translations[lang]?.content || '';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/admin/blog" className="text-xs text-slate-400 flex items-center gap-1 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-[#00E5FF] px-5 py-2 text-xs font-bold text-[#070F1E] flex items-center gap-1"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Publish
        </button>
      </div>

      <div className="flex gap-2">
        {['en', 'de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'].map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-lg text-xs font-bold ${lang === l ? 'bg-[#00E5FF] text-black' : 'bg-white/5 text-white'}`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-400">Title ({lang.toUpperCase()})</label>
          <input
            type="text"
            value={curTitle}
            onChange={(e) => {
              const val = e.target.value;
              if (lang === 'en') {
                setTitle(val);
                setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
              } else {
                setTranslations((t) => ({ ...t, [lang]: { ...t[lang], title: val } }));
              }
            }}
            className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-base font-bold"
          />
        </div>

        {lang === 'en' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">Slug</label>
                <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Cover Image URL</label>
                <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <input
                  type="text"
                  list="blog-categories"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm"
                />
                <datalist id="blog-categories">
                  <option value="Travel Guide" />
                  <option value="Destinations" />
                  <option value="Diving & Snorkeling" />
                  <option value="Culture & History" />
                  <option value="Tips & Advice" />
                  <option value="News" />
                </datalist>
              </div>
              <div>
                <label className="text-xs text-slate-400">Author</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Read time (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={readTimeMinutes}
                  onChange={(e) => setReadTimeMinutes(Number(e.target.value))}
                  className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400">Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="red sea, snorkeling, family"
                className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 accent-[#00E5FF]" />
                Published
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 accent-[#00E5FF]" />
                Featured
              </label>
            </div>
          </>
        )}

        <div>
          <label className="text-xs text-slate-400">Excerpt ({lang.toUpperCase()})</label>
          <textarea
            rows={2}
            value={curExcerpt}
            onChange={(e) => {
              const val = e.target.value;
              if (lang === 'en') setExcerpt(val);
              else setTranslations((t) => ({ ...t, [lang]: { ...t[lang], excerpt: val } }));
            }}
            className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm"
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">Content ({lang.toUpperCase()})</label>
          <textarea
            rows={10}
            value={curContent}
            onChange={(e) => {
              const val = e.target.value;
              if (lang === 'en') setContent(val);
              else setTranslations((t) => ({ ...t, [lang]: { ...t[lang], content: val } }));
            }}
            className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm font-mono"
          />
        </div>
      </form>
    </div>
  );
}