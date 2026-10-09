'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';
import { UploadCloud, Image as ImageIcon, Star, Trash2, Plus, X, RefreshCw, CheckSquare, Square, FolderOpen } from 'lucide-react';
import MediaLibraryModal from './MediaLibraryModal';

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
}

interface MediaUploaderProps {
  coverImage: string;
  galleryImages: string[];
  onCoverChange: (url: string) => void;
  onGalleryAdd: (url: string) => void;
  onGalleryAddBatch?: (urls: string[]) => void;
  onMediaBatchUpdate?: (cover: string | undefined, newGallery: string[]) => void;
  onGalleryRemove: (index: number) => void;
  onGalleryRemoveBatch?: (indices: number[]) => void;
  onGalleryClear?: () => void;
}

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function uploadSingleFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  const uploaded = data.uploaded?.[0];
  if (!uploaded?.url) {
    throw new Error('No URL returned from upload');
  }
  return uploaded.url;
}

export default function MediaUploader({
  coverImage,
  galleryImages,
  onCoverChange,
  onGalleryAdd,
  onGalleryAddBatch,
  onMediaBatchUpdate,
  onGalleryRemove,
  onGalleryRemoveBatch,
  onGalleryClear,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const coverReplaceInputRef = useRef<HTMLInputElement>(null);

  const removeUploadItem = useCallback((id: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const handleSelectFromLibrary = useCallback(
    (urls: string[], makeCover?: boolean) => {
      if (urls.length === 0) return;
      if (makeCover && urls[0]) {
        onCoverChange(urls[0]);
        if (urls.length > 1) {
          if (onGalleryAddBatch) {
            onGalleryAddBatch(urls.slice(1));
          } else {
            urls.slice(1).forEach((u) => onGalleryAdd(u));
          }
        }
      } else {
        if (onGalleryAddBatch) {
          onGalleryAddBatch(urls);
        } else {
          urls.forEach((u) => onGalleryAdd(u));
        }
      }
    },
    [onCoverChange, onGalleryAdd, onGalleryAddBatch]
  );

  // Process a batch of files concurrently
  const handleBatchFiles = useCallback(
    async (rawFiles: FileList | File[], targetOverride?: 'cover' | 'gallery') => {
      const files = Array.from(rawFiles).filter((f) => ALLOWED_TYPES.includes(f.type));
      if (files.length === 0) return;

      setIsProcessingBatch(true);

      // Determine targets for each file
      let needsCover = !coverImage && targetOverride !== 'gallery';

      // Process up to 4 concurrent uploads at a time
      const CONCURRENCY = 4;
      const queue = [...files];
      let assignedCover: string | undefined = undefined;
      const batchGalleryUrls: string[] = [];

      const worker = async () => {
        while (queue.length > 0) {
          const file = queue.shift();
          if (!file) break;

          const isCover = needsCover;
          if (isCover) {
            needsCover = false;
          }

          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          setUploading((prev) => [...prev, { id, name: file.name, progress: 10 }]);

          try {
            const progressTimer = setInterval(() => {
              setUploading((prev) =>
                prev.map((u) =>
                  u.id === id && u.progress < 90 ? { ...u, progress: u.progress + 15 } : u
                )
              );
            }, 180);

            const uploadedUrl = await uploadSingleFile(file);
            clearInterval(progressTimer);

            setUploading((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u))
            );

            setTimeout(() => removeUploadItem(id), 600);

            if (isCover) {
              assignedCover = uploadedUrl;
            } else {
              batchGalleryUrls.push(uploadedUrl);
            }
          } catch (err) {
            console.error('File upload failed:', err);
            setUploading((prev) =>
              prev.map((u) => (u.id === id ? { ...u, progress: -1 } : u))
            );
            setTimeout(() => removeUploadItem(id), 4000);
          }
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
      await Promise.all(workers);

      // Single atomic commit for both cover and all gallery images!
      if (onMediaBatchUpdate) {
        onMediaBatchUpdate(assignedCover, batchGalleryUrls);
      } else {
        if (assignedCover) onCoverChange(assignedCover);
        if (batchGalleryUrls.length > 0) {
          if (onGalleryAddBatch) {
            onGalleryAddBatch(batchGalleryUrls);
          } else {
            batchGalleryUrls.forEach((url) => onGalleryAdd(url));
          }
        }
      }

      setIsProcessingBatch(false);
    },
    [coverImage, onCoverChange, onGalleryAdd, onGalleryAddBatch, onMediaBatchUpdate, removeUploadItem]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleBatchFiles(e.dataTransfer.files);
      }
    },
    [handleBatchFiles]
  );

  const handleMultiFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleBatchFiles(e.target.files, 'gallery');
    }
    if (e.target) e.target.value = '';
  };

  const handleCoverReplaceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleBatchFiles([file], 'cover');
    }
    if (e.target) e.target.value = '';
  };

  // Promote a gallery photo to be the new cover
  const handleMakeCover = (index: number) => {
    const selectedUrl = galleryImages[index];
    if (!selectedUrl) return;

    // Remove from gallery and set as cover
    onGalleryRemove(index);
    if (coverImage) {
      // Put old cover into gallery
      onGalleryAdd(coverImage);
    }
    onCoverChange(selectedUrl);
  };

  // Toggle single item selection
  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedIndices.length === galleryImages.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(galleryImages.map((_, i) => i));
    }
  };

  // Delete selected photos in batch
  const handleDeleteSelected = () => {
    if (selectedIndices.length === 0) return;
    if (!window.confirm(`Delete ${selectedIndices.length} selected photos?`)) return;

    if (onGalleryRemoveBatch) {
      onGalleryRemoveBatch(selectedIndices);
    } else if (onGalleryClear && selectedIndices.length === galleryImages.length) {
      onGalleryClear();
    } else {
      // Fallback in descending order to avoid index shifts
      [...selectedIndices].sort((a, b) => b - a).forEach((i) => onGalleryRemove(i));
    }
    setSelectedIndices([]);
  };

  // Clear all gallery photos
  const handleClearAllGallery = () => {
    if (window.confirm(`Are you sure you want to remove all ${galleryImages.length} gallery photos?`)) {
      setSelectedIndices([]);
      if (onGalleryClear) {
        onGalleryClear();
      } else if (onGalleryRemoveBatch) {
        onGalleryRemoveBatch(galleryImages.map((_, i) => i));
      } else {
        for (let i = galleryImages.length - 1; i >= 0; i--) {
          onGalleryRemove(i);
        }
      }
    }
  };

  // Add multiple URLs
  const handleAddUrls = (target: 'cover' | 'gallery') => {
    if (!urlInput.trim()) return;

    // Split by comma, newline, or space
    const urls = urlInput
      .split(/[\n,\s]+/)
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/'));

    if (urls.length === 0) return;

    if (target === 'cover') {
      onCoverChange(urls[0]);
      if (urls.length > 1) {
        if (onGalleryAddBatch) {
          onGalleryAddBatch(urls.slice(1));
        } else {
          urls.slice(1).forEach((u) => onGalleryAdd(u));
        }
      }
    } else {
      if (onGalleryAddBatch) {
        onGalleryAddBatch(urls);
      } else {
        urls.forEach((u) => onGalleryAdd(u));
      }
    }

    setUrlInput('');
  };

  return (
    <div className="space-y-5">
      {/* Hidden file inputs with multi-select support */}
      <input
        ref={multiFileInputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={handleMultiFileSelect}
      />
      <input
        ref={coverReplaceInputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png,image/gif,image/avif"
        className="hidden"
        onChange={handleCoverReplaceSelect}
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => multiFileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-[#00E5FF] bg-[#00E5FF]/10 scale-[1.01]'
            : 'border-white/10 bg-[#0B1528] hover:border-[#00E5FF]/40 hover:bg-white/[0.02]'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00E5FF] transition-transform duration-300 group-hover:scale-110 group-hover:border-[#00E5FF]/40">
            <UploadCloud className="h-7 w-7" />
          </div>

          <p className="mb-1 text-sm font-semibold text-white">
            <span className="text-[#00E5FF] underline decoration-[#00E5FF]/30 underline-offset-4">
              Click to select multiple photos
            </span>{' '}
            or drag &amp; drop all at once
          </p>
          <p className="text-xs text-slate-400">
            {coverImage
              ? 'New uploads will be added automatically to the Gallery'
              : 'The first image will become the Cover, and all remaining photos will go to Gallery'}
          </p>
          <p className="mt-2 text-[11px] text-slate-500">
            Supports WebP, JPEG, PNG, GIF, AVIF &middot; Max 10MB per image &middot; Multi-select enabled
          </p>
        </div>
      </div>

      {/* Centralized Media Library Integration Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/[0.04] p-4 transition-all hover:border-[#00E5FF]/30">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shadow-sm shadow-[#00E5FF]/10">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              Centralized Media Library
              <span className="rounded-full bg-[#00E5FF]/20 px-2 py-0.5 text-[9px] font-black uppercase text-[#00E5FF]">Supabase</span>
            </h4>
            <p className="text-xs text-slate-400">
              Browse, search, and reuse existing tour assets or multi-select images in one click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLibraryModalOpen(true)}
            className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-[#00E5FF] px-4 py-2.5 text-xs font-black text-[#070F1E] shadow-lg shadow-[#00E5FF]/20 hover:brightness-110 transition-all"
          >
            <FolderOpen className="h-4 w-4" />
            Select from Library
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            title="Paste image URL directly"
          >
            + URL
          </button>
        </div>
      </div>

      {/* Optional Direct URL input fallback */}
      {showUrlInput && (
        <div className="rounded-xl border border-white/10 bg-[#0B1528] p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste image URL (or multiple URLs separated by commas/newlines)"
              className="flex-1 rounded-lg border border-white/10 bg-[#060D1A] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-[#00E5FF] focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddUrls('cover')}
                disabled={!urlInput.trim()}
                className="flex items-center gap-1 rounded-lg bg-[#00E5FF]/20 px-3 py-2 text-xs font-bold text-[#00E5FF] transition-colors hover:bg-[#00E5FF] hover:text-[#060D1A] disabled:opacity-40"
              >
                <Star className="h-3 w-3" />
                Set Cover
              </button>
              <button
                type="button"
                onClick={() => handleAddUrls('gallery')}
                disabled={!urlInput.trim()}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <Plus className="h-3 w-3" />
                + Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Uploads Indicator */}
      {uploading.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-white flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#00E5FF]" />
              Uploading {uploading.filter((u) => u.progress < 100 && u.progress !== -1).length} photos...
            </span>
            <span className="text-[#00E5FF]">
              {Math.round(
                uploading.reduce((acc, u) => acc + (u.progress > 0 ? u.progress : 0), 0) /
                  uploading.length
              )}
              %
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {uploading.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#060D1A] px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-300">{u.name}</p>
                  {u.progress === -1 ? (
                    <p className="text-[10px] text-red-400">Upload failed</p>
                  ) : u.progress === 100 ? (
                    <p className="text-[10px] text-emerald-400">Complete</p>
                  ) : (
                    <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#00E5FF] transition-all duration-300"
                        style={{ width: `${u.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                {u.progress < 100 && u.progress !== -1 ? (
                  <span className="text-[10px] font-bold text-slate-400">{u.progress}%</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COVER IMAGE SECTION */}
      {coverImage && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-[#00E5FF] text-[#00E5FF]" />
              <span className="text-sm font-bold text-white">Cover Photo</span>
              <span className="rounded-full bg-[#00E5FF]/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#00E5FF]">
                Hero
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => coverReplaceInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                Replace Cover
              </button>
              <button
                type="button"
                onClick={() => onCoverChange('')}
                className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>

          <div className="group relative aspect-[16/9] max-h-72 w-full overflow-hidden rounded-xl border border-white/10 bg-[#060D1A]">
            <img src={coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-4">
              <p className="text-xs text-white/90 truncate font-mono">{coverImage}</p>
            </div>
          </div>
        </div>
      )}

      {/* GALLERY IMAGES SECTION */}
      <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[#00E5FF]" />
            <h3 className="text-sm font-bold text-white">
              Gallery Photos ({galleryImages.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => multiFileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border border-[#00E5FF]/30 bg-[#00E5FF]/10 px-3 py-1.5 text-xs font-bold text-[#00E5FF] transition-all hover:bg-[#00E5FF] hover:text-[#060D1A]"
            >
              <Plus className="h-3.5 w-3.5" />
              + Add Photos (Multi-select)
            </button>

            {galleryImages.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/10"
              >
                {selectedIndices.length === galleryImages.length ? (
                  <>
                    <CheckSquare className="h-3 w-3 text-[#00E5FF]" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 text-slate-400" />
                    Select All
                  </>
                )}
              </button>
            )}

            {selectedIndices.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30"
              >
                <Trash2 className="h-3 w-3" />
                Delete Selected ({selectedIndices.length})
              </button>
            )}

            {galleryImages.length > 1 && (
              <button
                type="button"
                onClick={handleClearAllGallery}
                className="flex items-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </button>
            )}
          </div>
        </div>

        {galleryImages.length === 0 ? (
          <div
            onClick={() => multiFileInputRef.current?.click()}
            className="cursor-pointer rounded-xl border border-dashed border-white/10 p-8 text-center transition-colors hover:border-white/20"
          >
            <p className="text-xs text-slate-400">No gallery photos added yet.</p>
            <p className="mt-1 text-[11px] text-[#00E5FF]">Click here or select files above to add photos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {galleryImages.map((url, i) => {
              const isSelected = selectedIndices.includes(i);
              return (
                <div
                  key={i}
                  className={`group relative aspect-[4/3] overflow-hidden rounded-xl border bg-[#060D1A] transition-all ${
                    isSelected
                      ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40'
                      : 'border-white/10 hover:border-[#00E5FF]/50'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Gallery item ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Top quick-select bar (always visible for easy tapping) */}
                  <div className="absolute top-2 left-2 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(i);
                      }}
                      className={`flex items-center justify-center rounded-lg p-1 transition-colors ${
                        isSelected
                          ? 'bg-[#00E5FF] text-[#060D1A]'
                          : 'bg-black/60 text-white/70 hover:bg-black/80 hover:text-white'
                      }`}
                      title={isSelected ? 'Deselect image' : 'Select image'}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between ml-8">
                      <span className="rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        #{i + 1}
                      </span>
                      <button
                        type="button"
                        title="Remove image"
                        onClick={() => onGalleryRemove(i)}
                        className="rounded-lg bg-red-500/80 p-1.5 text-white transition-colors hover:bg-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMakeCover(i)}
                      className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#00E5FF] py-1 text-[11px] font-bold text-[#060D1A] shadow-lg transition-transform hover:scale-[1.02]"
                    >
                      <Star className="h-3 w-3 fill-[#060D1A]" />
                      Make Cover
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Media Library Selector Modal */}
      <MediaLibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onSelect={handleSelectFromLibrary}
        multiple={true}
        initialBucket="talago-tour-media"
        title="Select Tour Photos from Media Library"
      />
    </div>
  );
}
