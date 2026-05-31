'use client';

import { useEffect, useState, useCallback } from 'react';
import MediaCard from './MediaCard';
import type { MediaAsset } from '@/types/media';

interface ToastState {
  message: string;
  type: 'error' | 'success';
  key: number;
}

export default function MediaOrganizer({ tourId }: { tourId: string }) {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: 'error' | 'success') => {
    setToast({ message, type, key: Date.now() });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/media?tourId=${tourId}`);
      if (!res.ok) throw new Error('Failed to load media');
      const data: MediaAsset[] = await res.json();
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleDragStart = useCallback((_e: React.DragEvent, index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback(
    async (_e: React.DragEvent, dropIndex: number) => {
      if (dragIndex === null || dragIndex === dropIndex) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }

      const previous = [...assets];
      const reordered = [...assets];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(dropIndex, 0, moved);
      setAssets(reordered);
      setDragIndex(null);
      setDragOverIndex(null);

      try {
        const res = await fetch('/api/admin/media/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId,
            orderedAssetIds: reordered.map((a) => a.id),
          }),
        });
        if (!res.ok) throw new Error('Reorder failed');
        showToast('Order updated', 'success');
      } catch {
        setAssets(previous);
        showToast('Reorder failed. Changes reverted.', 'error');
      }
    },
    [assets, dragIndex, tourId, showToast]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setPendingDeleteIds((prev) => new Set(prev).add(id));

      const previous = [...assets];
      const removedIndex = assets.findIndex((a) => a.id === id);
      if (removedIndex === -1) return;

      const updated = assets
        .filter((a) => a.id !== id)
        .map((a, i) => ({ ...a, displayOrder: i }));
      setAssets(updated);

      try {
        const res = await fetch(`/api/admin/media/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');

        const data = await res.json();
        showToast('Image deleted', 'success');
        if (data.tourId && data.remainingCount === 0) {
          setAssets([]);
        }
      } catch {
        setAssets(previous);
        showToast('Delete failed. Changes reverted.', 'error');
      } finally {
        setPendingDeleteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [assets, showToast]
  );

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-xl bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={fetchAssets}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700">No media yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload images for this tour using the media upload section to see them here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div
          key={toast.key}
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        {assets.map((asset, index) => (
          <MediaCard
            key={asset.id}
            id={asset.id}
            url={asset.filePath}
            filename={asset.filename}
            displayOrder={asset.displayOrder}
            isDragging={dragIndex === index}
            dragOverIndex={dragOverIndex}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            index={index}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
