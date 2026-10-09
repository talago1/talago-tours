'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  UploadCloud,
  Check,
  Loader2,
  RefreshCw,
  FolderOpen,
  Image as ImageIcon,
  Sparkles,
  Layers,
} from 'lucide-react';

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  bucket: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
  createdAt: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrls: string[], makeCover?: boolean) => void;
  multiple?: boolean;
  initialBucket?: 'all' | 'talago-tour-media' | 'talago-media';
  title?: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  multiple = true,
  initialBucket = 'all',
  title = 'Select from Media Library',
}: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [bucket, setBucket] = useState<'all' | 'talago-tour-media' | 'talago-media'>(initialBucket);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [makeCover, setMakeCover] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (bucket !== 'all') params.set('bucket', bucket);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('[MediaLibraryModal] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [bucket, search]);

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    } else {
      setSelectedUrls([]);
      setMakeCover(false);
    }
  }, [isOpen, fetchMedia]);

  const toggleSelect = (url: string) => {
    if (!multiple) {
      setSelectedUrls([url]);
      return;
    }
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append('files', f));
      formData.append('bucket', bucket === 'talago-media' ? 'talago-media' : 'talago-tour-media');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(80);

      if (res.ok) {
        const data = await res.json();
        const uploadedUrls = (data.uploaded || []).map((u: { url: string }) => u.url);
        // Refresh library items and auto-select uploaded
        await fetchMedia();
        if (multiple) {
          setSelectedUrls((prev) => [...prev, ...uploadedUrls]);
        } else if (uploadedUrls.length > 0) {
          setSelectedUrls([uploadedUrls[0]]);
        }
        setActiveTab('browse');
      }
    } catch (err) {
      console.error('[MediaLibraryModal] Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex h-[90vh] max-h-[850px] w-full max-w-5xl flex-col rounded-3xl border border-white/10 bg-[#0B1528] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
              <ImageIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">{title}</h2>
              <p className="text-xs text-slate-400">
                Centralized Supabase Storage ({items.length} items found)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch */}
            <div className="flex rounded-xl bg-[#060D1A] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'browse'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Browse
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-[#00E5FF] text-[#070F1E] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Upload New
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Subheader / Filters (Browse mode) */}
        {activeTab === 'browse' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/10 bg-[#070F1E]/50 px-6 py-3">
            {/* Bucket Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setBucket('all')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  bucket === 'all'
                    ? 'bg-white/20 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All Buckets
              </button>
              <button
                type="button"
                onClick={() => setBucket('talago-tour-media')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  bucket === 'talago-tour-media'
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🏖️ Tours Bucket
              </button>
              <button
                type="button"
                onClick={() => setBucket('talago-media')}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                  bucket === 'talago-media'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                🌐 General & Blogs
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search file name..."
                className="w-full rounded-xl border border-white/10 bg-[#060D1A] pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' ? (
            /* Upload Dropzone */
            <div className="flex h-full flex-col items-center justify-center">
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center w-full max-w-lg p-10 border-2 border-dashed border-[#00E5FF]/40 rounded-3xl bg-[#00E5FF]/5 cursor-pointer hover:bg-[#00E5FF]/10 transition-all text-center"
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) handleUploadFiles(e.target.files);
                  }}
                  className="hidden"
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00E5FF]/20 text-[#00E5FF] mb-4">
                  {uploading ? (
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  ) : (
                    <UploadCloud className="h-8 w-8" />
                  )}
                </div>
                <p className="text-base font-bold text-white mb-1">
                  {uploading ? 'Uploading to Supabase...' : 'Click or Drag images here'}
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  Target bucket:{' '}
                  <span className="font-mono text-[#00E5FF]">
                    {bucket === 'talago-media' ? 'talago-media' : 'talago-tour-media'}
                  </span>
                </p>
                <span className="rounded-xl bg-[#00E5FF] px-4 py-2 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20">
                  Select Files
                </span>
              </label>
            </div>
          ) : loading ? (
            /* Loading State */
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
              <p className="text-xs text-slate-400">Loading library assets...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
                <ImageIcon className="h-8 w-8" />
              </div>
              <p className="text-sm font-bold text-white">No media files found</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Try switching bucket tabs or upload new photos directly into your Supabase library.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className="mt-2 rounded-xl bg-[#00E5FF]/20 px-4 py-2 text-xs font-bold text-[#00E5FF] hover:bg-[#00E5FF] hover:text-[#070F1E] transition-colors"
              >
                Upload to this Bucket
              </button>
            </div>
          ) : (
            /* Media Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
              {items.map((item) => {
                const isSelected = selectedUrls.includes(item.url);
                const selectIndex = selectedUrls.indexOf(item.url);

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.url)}
                    className={`group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-[#00E5FF] shadow-lg shadow-[#00E5FF]/20 scale-[0.98]'
                        : 'border-white/10 hover:border-white/30 bg-[#060D1A]'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold rounded-md bg-black/60 px-1.5 py-0.5 text-white/90 truncate max-w-[120px]">
                          {item.bucket === 'talago-tour-media' ? 'Tours' : 'General'}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-white truncate drop-shadow">
                        {item.name}
                      </p>
                    </div>

                    {/* Selection Indicator Checkbox */}
                    <div
                      className={`absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                        isSelected
                          ? 'border-[#00E5FF] bg-[#00E5FF] text-[#070F1E] font-black text-xs'
                          : 'border-white/40 bg-black/40 text-transparent opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {multiple ? (
                        isSelected ? selectIndex + 1 : <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 bg-[#070F1E] px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-semibold">
              <strong className="text-white font-bold">{selectedUrls.length}</strong> photo(s) selected
            </span>

            {/* Set as Cover option when 1 image is selected */}
            {selectedUrls.length === 1 && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={makeCover}
                  onChange={(e) => setMakeCover(e.target.checked)}
                  className="rounded border-white/20 bg-white/5 text-[#00E5FF] focus:ring-0"
                />
                <span className="text-xs text-[#00E5FF] font-bold flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Set as Tour Cover
                </span>
              </label>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedUrls.length === 0}
              onClick={() => {
                onSelect(selectedUrls, makeCover);
                onClose();
              }}
              className="flex items-center gap-2 rounded-xl bg-[#00E5FF] px-5 py-2.5 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Check className="h-4 w-4" />
              Insert {selectedUrls.length > 0 ? `(${selectedUrls.length})` : ''} Photos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
