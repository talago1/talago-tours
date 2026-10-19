'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Search,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Eye,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  HardDrive,
  Sparkles,
  X,
  AlertTriangle,
} from 'lucide-react';

interface MediaAssetItem {
  id: string;
  name: string;
  url: string;
  bucket: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaAssetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucketFilter, setBucketFilter] = useState<'all' | 'talago-tour-media' | 'talago-media'>('all');
  const [search, setSearch] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaAssetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Upload state
  const [uploadTargetBucket, setUploadTargetBucket] = useState<'talago-tour-media' | 'talago-media'>('talago-tour-media');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bucketFilter !== 'all') params.set('bucket', bucketFilter);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '500');
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('[AdminMedia] Failed to load media:', err);
    } finally {
      setLoading(false);
    }
  }, [bucketFilter, search]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch {
      // Fallback
    }
  };

  const handleUpload = async (files: FileList | File[]) => {
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    setIsUploading(true);
    setUploadProgress(25);

    try {
      const formData = new FormData();
      fileList.forEach((f) => formData.append('files', f));
      formData.append('bucket', uploadTargetBucket);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(85);

      if (res.ok) {
        await fetchMedia();
      }
    } catch (err) {
      console.error('[AdminMedia] Upload error:', err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: deleteTarget.bucket,
          path: deleteTarget.path,
          id: deleteTarget.id,
        }),
      });

      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch (err) {
      console.error('[AdminMedia] Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const tourCount = items.filter((i) => i.bucket === 'talago-tour-media').length;
  const generalCount = items.filter((i) => i.bucket === 'talago-media').length;

  return (
    <div className="min-h-screen bg-[#070F1E] p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-lg shadow-[#00E5FF]/5">
              <ImageIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Centralized Media Library</h1>
              <p className="text-xs text-slate-400">
                Connected to Supabase buckets &middot; <span className="text-[#00E5FF] font-mono">talago-tour-media</span> &amp; <span className="text-purple-400 font-mono">talago-media</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMedia()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#00E5FF]' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Upload Dropzone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleUpload(e.dataTransfer.files);
        }}
        className={`relative rounded-3xl border-2 border-dashed p-6 transition-all duration-300 ${
          dragOver
            ? 'border-[#00E5FF] bg-[#00E5FF]/10 scale-[1.005]'
            : 'border-white/10 bg-[#0B1528] hover:border-[#00E5FF]/30'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
              {isUploading ? (
                <RefreshCw className="h-7 w-7 animate-spin" />
              ) : (
                <UploadCloud className="h-7 w-7" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isUploading ? 'Uploading assets to Supabase...' : 'Upload Photos & Assets'}
              </h3>
              <p className="text-xs text-slate-400">
                Drag and drop files here, or click to browse. WebP, JPEG, PNG, GIF, AVIF supported (up to 10MB each).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Target Bucket Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#060D1A] p-1">
              <button
                type="button"
                onClick={() => setUploadTargetBucket('talago-tour-media')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  uploadTargetBucket === 'talago-tour-media'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏖️ Tours Bucket
              </button>
              <button
                type="button"
                onClick={() => setUploadTargetBucket('talago-media')}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  uploadTargetBucket === 'talago-media'
                    ? 'bg-purple-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🌐 General Bucket
              </button>
            </div>

            <label className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 cursor-pointer hover:brightness-110 transition-all">
              <UploadCloud className="h-4 w-4" />
              Select Files
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) handleUpload(e.target.files);
                }}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {isUploading && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#00E5FF] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#0B1528] p-4">
        {/* Bucket Filters */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setBucketFilter('all')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              bucketFilter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Media ({items.length})
          </button>
          <button
            onClick={() => setBucketFilter('talago-tour-media')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              bucketFilter === 'talago-tour-media'
                ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🏖️ Tour Assets ({tourCount})
          </button>
          <button
            onClick={() => setBucketFilter('talago-media')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              bucketFilter === 'talago-media'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🌐 General &amp; Blogs ({generalCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name..."
            className="w-full rounded-xl border border-white/10 bg-[#060D1A] pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
          />
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-[#00E5FF]" />
          <p className="text-xs text-slate-400">Loading gallery...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-[#0B1528] p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
            <ImageIcon className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-white">No media assets found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Upload images above to store them permanently in your Supabase media buckets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => {
            const isTourBucket = item.bucket === 'talago-tour-media';
            const sizeDisplay = item.sizeBytes
              ? `${(item.sizeBytes / 1024).toFixed(0)} KB`
              : '';

            return (
              <div
                key={item.id}
                className="group relative flex flex-col rounded-2xl border border-white/10 bg-[#0B1528] overflow-hidden hover:border-[#00E5FF]/40 transition-all duration-200"
              >
                {/* Image Preview Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#060D1A]">
                  <img
                    src={item.url}
                    alt={item.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${
                        isTourBucket
                          ? 'bg-[#00E5FF]/80 text-[#070F1E]'
                          : 'bg-purple-600/80 text-white'
                      }`}
                    >
                      {isTourBucket ? 'Tours' : 'General'}
                    </span>

                    {sizeDisplay && (
                      <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white/90 backdrop-blur-md">
                        {sizeDisplay}
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay with Quick Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      title="Preview Image"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(item.url)}
                      title="Copy Public URL"
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        copiedUrl === item.url
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {copiedUrl === item.url ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      title="Delete Asset"
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Card Meta */}
                <div className="p-3">
                  <p className="truncate text-xs font-semibold text-slate-200" title={item.name}>
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-mono text-slate-500">
                    {item.path}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => setPreviewItem(null)}
          />
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl p-4 z-10 flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-bold text-white truncate max-w-md">
                {previewItem.name}
              </span>
              <button
                onClick={() => setPreviewItem(null)}
                className="rounded-full p-1.5 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <img
              src={previewItem.url}
              alt={previewItem.name}
              className="max-h-[70vh] w-auto rounded-xl object-contain"
            />
            <div className="w-full flex items-center justify-between pt-3 border-t border-white/10 mt-3 text-xs">
              <span className="font-mono text-slate-400 truncate max-w-lg">
                {previewItem.url}
              </span>
              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem.url)}
                className="flex items-center gap-1.5 rounded-lg bg-[#00E5FF] px-3 py-1.5 text-xs font-black text-[#070F1E]"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-md rounded-3xl border border-red-500/20 bg-[#0B1528] p-6 shadow-2xl z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Asset?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 bg-white/5 p-3 rounded-xl font-mono truncate">
              {deleteTarget.path}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
