'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search, Edit, Trash2, Eye, Sparkles, Loader2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BlogPostItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  tags: string[];
  authorName: string;
  readTimeMinutes: number;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export default function AdminBlogListPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // AI Generator Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [destinationName, setDestinationName] = useState('Egypt');
  const [category, setCategory] = useState('Travel Guide');
  const [genError, setGenError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/blog?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this article?')) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
    if (res.ok) setPosts((p) => p.filter((x) => x.id !== id));
  };

  const handleGenerateAiPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      setGenError(null);

      const res = await fetch('/api/admin/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          destinationName,
          category,
          autoSave: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate blog article');
      }

      setAiModalOpen(false);
      setTopic('');
      await fetchPosts();

      if (data.savedPost?.id) {
        router.push(`/admin/blog/${data.savedPost.id}`);
      }
    } catch (err: any) {
      setGenError(err.message || 'Error generating article');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Travel Blog & Articles</h1>
          <p className="text-sm text-slate-400">Manage all editorial articles & multilingual guides</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setAiModalOpen(true);
              setGenError(null);
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 px-5 py-3 text-xs font-black uppercase text-[#00E5FF] transition-all hover:bg-[#00E5FF]/20 hover:scale-105"
          >
            <Sparkles className="h-4 w-4 text-[#00E5FF]" />
            <span>Generate AI Article</span>
          </button>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-3 text-xs font-black uppercase text-[#070F1E] shadow-xl hover:scale-105"
          >
            <Plus className="h-4 w-4" />
            <span>New Article</span>
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#0B1528] py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-[#00E5FF]"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Loading articles...</div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-12 text-center text-slate-400">
          No articles found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0B1528] p-5">
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-800 mb-4">
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-600">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                  <span className="absolute top-3 left-3 rounded-full bg-[#070F1E]/80 px-2.5 py-0.5 text-[10px] font-bold text-[#00E5FF]">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-base font-black text-white line-clamp-2">{post.title}</h3>
                {post.excerpt && <p className="mt-2 text-xs text-slate-400 line-clamp-2">{post.excerpt}</p>}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                  <Eye className="h-3.5 w-3.5" /> View
                </Link>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/blog/${post.id}`} className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-[#00E5FF] hover:text-[#070F1E]">
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(post.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Blog Post Generator Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#00E5FF]" />
                <h3 className="text-lg font-black text-white">Generate AI Blog Article</h3>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateAiPost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Article Topic or Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Top 10 Things to Do in Hurghada for First-Timers"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Destination Hub
                  </label>
                  <select
                    value={destinationName}
                    onChange={(e) => setDestinationName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="Egypt">All Egypt</option>
                    <option value="Hurghada">Hurghada</option>
                    <option value="Sharm El Sheikh">Sharm El Sheikh</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Luxor">Luxor</option>
                    <option value="Marsa Alam">Marsa Alam</option>
                    <option value="Aswan">Aswan</option>
                    <option value="Alexandria">Alexandria</option>
                    <option value="El Gouna">El Gouna</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Editorial Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2.5 text-sm text-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="Travel Guide">Travel Guide</option>
                    <option value="Culture & History">Culture & History</option>
                    <option value="Sea & Adventure">Sea & Adventure</option>
                    <option value="Practical Tips">Practical Tips</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Powered by Google Gemini AI. Creates an in-depth, SEO-optimized article draft with 8-language translations ready for review.
              </p>

              {genError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-200">
                  {genError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !topic.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-5 py-2 text-xs font-black uppercase text-[#070F1E] disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Writing Draft...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Draft</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}