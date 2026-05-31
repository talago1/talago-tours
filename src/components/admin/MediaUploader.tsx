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

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || 'jpg';
}

async function uploadSingleFile(
  file: File
): Promise<string> {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new Error(`File type .${ext} is not supported`);
  }

  const signRes = await fetch('/api/media/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    }),
  });

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({ error: 'Failed to get upload URL' }));
    throw new Error(err.error || 'Failed to get upload URL');
  }

  const { signedUrl, publicUrl } = await signRes.json();

  const uploadRes = await fetch(signedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || `image/${ext}` },
  });

  if (!uploadRes.ok) {
    throw new Error('Upload to storage failed');
  }

  return publicUrl;
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
                : u
            )
          );
        }, 200);

        const publicUrl = await uploadSingleFile(file);

        clearInterval(simulateProgress);
        setUploading((prev) =>
          prev.map((u) => (u.id === id ? { ...u, progress: 100 } : u))
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
            u.id === id ? { ...u, progress: -1 } : u
          )
        );
        setTimeout(() => removeUpload(id), 3000);
      }
    },
    [onCoverChange, onGalleryAdd, removeUpload]
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ALLOWED_TYPES.includes(f.type)
      );
      if (files.length === 0) return;

      if (!coverImage) {
        processFile(files[0], 'cover');
        files.slice(1).forEach((f) => processFile(f, 'gallery'));
      } else {
        files.forEach((f) => processFile(f, 'gallery'));
      }
    },
    [coverImage, processFile]
  );

  const handleCoverSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file, 'cover');
      if (e.target) e.target.value = '';
    },
    [processFile]
  );

  const handleGallerySelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((f) => processFile(f, 'gallery'));
      if (e.target) e.target.value = '';
    },
    [processFile]
  );

  const isUploading = uploading.length > 0;

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          dragOver
            ? 'border-primary-coral bg-primary-coral/5'
            : 'border-gray-300 hover:border-secondary-forest/50 bg-neutral-light/50'
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
          accept="image/webp,image/jpeg,image/png,image/gif"
          className="hidden"
          onChange={handleCoverSelect}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/webp,image/jpeg,image/png,image/gif"
          multiple
          className="hidden"
          onChange={handleGallerySelect}
        />

        <svg
          className={`w-10 h-10 mx-auto mb-3 transition-colors duration-200 ${
            dragOver ? 'text-primary-coral' : 'text-gray-400'
          }`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>

        <p className="text-sm text-gray-600 mb-1">
          <span className="font-semibold text-secondary-forest">Click to browse</span> or drag &amp; drop
        </p>
        <p className="text-xs text-gray-400">
          {coverImage
            ? 'Additional files go to gallery'
            : 'First file becomes the cover image'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          WebP, JPEG, PNG or GIF &middot; Max 10MB per file
        </p>
      </div>

      {uploading.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploading.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3 bg-neutral-light rounded-lg border border-gray-200"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{u.name}</p>
                {u.progress === -1 ? (
                  <p className="text-xs text-red-500">Upload failed</p>
                ) : u.progress === 100 ? (
                  <p className="text-xs text-secondary-forest">Complete</p>
                ) : (
                  <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-coral rounded-full transition-all duration-300"
                      style={{ width: `${u.progress}%` }}
                    />
                  </div>
                )}
              </div>
              {u.progress < 100 ? (
                <svg className="w-5 h-5 text-primary-coral animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : u.progress === -1 ? (
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      {coverImage && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
          <div className="relative group w-48">
            <img
              src={coverImage}
              alt="Cover"
              className="w-48 h-32 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCoverChange(''); }}
              className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {galleryImages.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gallery ({galleryImages.length})
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {galleryImages.map((url, i) => (
              <div key={i} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`Gallery ${i + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => onGalleryRemove(i)}
                  className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
