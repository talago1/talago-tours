'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, ImageIcon, X } from 'lucide-react';

interface UploadedAsset {
  id: string;
  url: string;
  label: string;
}

interface GlobalAssetStudioProps {
  onUploadSuccess: (assets: UploadedAsset[]) => void;
}

export default function GlobalAssetStudio({ onUploadSuccess }: GlobalAssetStudioProps) {
  const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const newFiles = accepted.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        for (const f of accepted) {
          formData.append('files', f);
        }

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || 'Upload failed');
        }

        const data = await res.json();
        const uploaded: UploadedAsset[] = (data.uploaded || []).map(
          (u: { id?: string; url: string; originalName?: string }) => ({
            id: u.id || crypto.randomUUID(),
            url: u.url,
            label: u.originalName || 'Untitled',
          }),
        );

        if (uploaded.length > 0) {
          onUploadSuccess(uploaded);
        }
        setFiles([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      } finally {
        setUploading(false);
      }
    },
    [onUploadSuccess],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    disabled: uploading,
  });

  function removeFile(index: number) {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative flex min-h-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all ${
          isDragActive
            ? 'border-[#00E5FF] bg-[#00E5FF]/10'
            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
        } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-6">
            <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
            <p className="text-sm text-slate-400">Uploading assets...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFD700]/10">
              <ImageIcon className="h-6 w-6 text-[#FFD700]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-white">
                {isDragActive ? 'Drop assets here' : 'Upload Scenery Assets'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Drag &amp; drop or click to browse &mdash; JPG, PNG, WebP &bull; Max 10MB each
              </p>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-4">
          <p className="mb-3 text-xs font-bold text-slate-400">{files.length} file(s) selected</p>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
            {files.map((f, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10">
                <img src={f.preview} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
