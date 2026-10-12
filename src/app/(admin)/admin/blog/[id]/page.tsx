'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2, ImageIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
const MediaLibraryModalLazy = dynamic(() => import('@/components/admin/MediaLibraryModal'), { ssr: false });

export default function EditBlogPostPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const [loading, setLoading] = useState(true);
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
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.post;
        if (p) {
          setTitle(p.title || '');
          setSlug(p.slug || '');
          setCoverImage(p.coverImage || '');
          setExcerpt(p.excerpt || '');
          setContent(p.content || '');
          setCategory(p.category || 'Travel Guide');
          setTags(Array.isArray(p.tags) ? p.tags.join(', ') : '');
          setAuthorName(p.authorName || 'TALAGO Editorial');
          setReadTimeMinutes(p.readTimeMinutes ?? 5);
          setIsPublished(p.isPublished !== false);
          setIsFeatured(p.isFeatured === true);
          if (p.translations) setTranslations(p.translations);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/blog/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        slug,
        coverImage,
        excerpt,
        content,
        translations,
        category,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        authorName,
        readTimeMinutes,
        isPublished,
        isFeatured,
      }),
    });
    if (res.ok) router.push('/admin/blog');
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete article?')) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/blog');
  };

  if (loading) return <div className="p-10 text-center text-slate-400">Loading...</div>;

  const curTitle = lang === 'en' ? title : translations[lang]?.title || '';
  const curExcerpt = lang === 'en' ? excerpt : translations[lang]?.excerpt || '';
  const curContent = lang === 'en' ? content : translations[lang]?.content || '';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/admin/blog" className="text-xs text-slate-400 flex items-center gap-1 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex gap-2">
          <button onClick={handleDelete} className="bg-red-500/10 text-red-400 rounded-xl px-4 py-2 text-xs">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={handleSubmit} className="bg-[#00E5FF] text-black rounded-xl px-5 py-2 text-xs font-bold flex items-center gap-1">
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
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
              if (lang === 'en') setTitle(val);
              else setTranslations((t) => ({ ...t, [lang]: { ...t[lang], title: val } }));
            }}
            className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white font-bold"
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
                <div className="flex gap-2">
                  <input type="text" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className="flex-1 bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm" placeholder="https://... or pick from library" />
                  <button type="button" onClick={() => setLibraryOpen(true)} className="flex items-center gap-1.5 px-3 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 text-[#00E5FF] text-xs font-semibold hover:bg-[#00E5FF]/20 transition-colors whitespace-nowrap">
                    <ImageIcon className="h-3.5 w-3.5" /> Media Library
                  </button>
                </div>
                {coverImage && <img src={coverImage} alt="Cover preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-white/10" />}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <input
                  type="text"
                  list="blog-categories-edit"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0B1528] border border-white/10 rounded-xl p-3 text-white text-sm"
                />
                <datalist id="blog-categories-edit">
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
      {libraryOpen && (
        <MediaLibraryModalLazy
          isOpen={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          multiple={false}
          title="Select Cover Image"
          onSelect={(urls) => {
            if (urls[0]) setCoverImage(urls[0]);
            setLibraryOpen(false);
          }}
        />
      )}
    </div>
  );
}