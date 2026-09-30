'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

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
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Travel Blog & Articles</h1>
          <p className="text-sm text-slate-400">Manage all editorial articles & multilingual guides</p>
        </div>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#0284C7] px-6 py-3 text-xs font-black uppercase text-[#070F1E] shadow-xl hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          <span>New Article</span>
        </Link>
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
    </div>
  );
}