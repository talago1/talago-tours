'use client';

import { useState, useRef, useCallback, type DragEvent } from 'react';

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
  onGalleryRemove: (index: number) => void;
}

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/avif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
  onGalleryRemove,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const removeUpload = useCallback((id: string) => {
    setUploading((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const processFile = useCallback(
    async (file: File, target: 'cover' | 'gallery') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setUploading((prev) => [...prev, { id, name: file.name, progress: 0 }]);

      try {
        const simulateProgress = setInterval(() => {
          setUploading((prev) =>
            prev.map((u) =>
              u.id === id && u.progress < 90
                ? { ...u, progress: u.progress + 10 }
                : u,
            ),
          );
        }, 200);

        const publicUrl = await uploadSingleFile(file);

        clearInterval(simulateProgress);
        setUploading((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u)),
        );

        setTimeout(() => removeUpload(id), 600);

        if (target === 'cover') {
          onCoverChange(publicUrl);
        } else {
          onGalleryAdd(publicUrl);
        }
      } catch (err) {
        setUploading((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, progress: -1 } : u,
          ),
        );
        setTimeout(() => removeUpload(id), 3000);
      }
    },
    [onCoverChange, onGalleryAdd, removeUpload],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ALLOWED_TYPES.includes(f.type),
      );
      if (files.length === 0) return;

      if (!coverImage) {
        processFile(files[0], 'cover');
        files.slice(1).forEach((f) => processFile(f, 'gallery'));
      } else {
        files.forEach((f) => processFile(f, 'gallery'));
      }
    },
    [coverImage, processFile],
  );

  const handleCoverSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file, 'cover');
      if (e.target) e.target.value = '';
    },
    [processFile],
  );

  const handleGallerySelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((f) => processFile(f, 'gallery'));
      if (e.target) e.target.value = '';
    },
    [processFile],
  );

  const isUploading = uploading.length > 0;

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
          dragOver
            ? 'border-[#00E5FF] bg-[#00E5FF]/5'
            : 'border-white/10 bg-[#0B1528] hover:border-[#00E5FF]/30'
        }`}
        onClick={() => {
          if (!coverImage) {
            coverInputRef.current?.click();
          } else {
            galleryInputRef.current?.click();
          }
        }}
      >
        <input
          ref={coverInputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png,image/gif,image/avif"
          className="hidden"
          onChange={handleCoverSelect}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png,image/gif,image/avif"
          multiple
          className="hidden"
          onChange={handleGallerySelect}
        />

        <svg
          className={`mx-auto mb-3 h-10 w-10 transition-colors duration-200 ${
            dragOver ? 'text-[#00E5FF]' : 'text-slate-500'
          }`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>

        <p className="mb-1 text-sm text-slate-400">
          <span className="font-bold text-[#00E5FF]">Click to browse</span> or drag &amp; drop
        </p>
        <p className="text-xs text-slate-500">
          {coverImage
            ? 'Additional files go to gallery'
            : 'First file becomes the cover image'}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          WebP, JPEG, PNG, GIF, AVIF &middot; Max 10MB per file
        </p>
      </div>

      {uploading.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploading.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0B1528] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-300">{u.name}</p>
                {u.progress === -1 ? (
                  <p className="text-xs text-red-400">Upload failed</p>
                ) : u.progress === 100 ? (
                  <p className="text-xs text-emerald-400">Complete</p>
                ) : (
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#00E5FF] transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {u.progress < 100 ? (
                <svg className="h-5 w-5 animate-spin text-[#00E5FF]" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : u.progress === -1 ? (
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {coverImage && (
        <div className="mt-4">
          <span className="mb-2 block text-sm font-bold text-slate-300">Cover Image</span>
          <div className="group relative w-48">
            <img
              src={coverImage}
              alt="Cover"
              className="h-32 w-48 rounded-xl border border-white/10 object-cover"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCoverChange(''); }}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity duration-200 hover:bg-red-500 group-hover:opacity-100"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="mt-4">
          <span className="mb-2 block text-sm font-bold text-slate-300">
            Gallery ({galleryImages.length})
          </span>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {galleryImages.map((url, i) => (
              <div key={i} className="group relative aspect-square">
                <img
                  src={url}
                  alt={`Gallery ${i + 1}`}
                  className="h-full w-full rounded-lg border border-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => onGalleryRemove(i)}
                  className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity duration-200 hover:bg-red-500 group-hover:opacity-100"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
