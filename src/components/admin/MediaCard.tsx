'use client';

import { useState } from 'react';

interface MediaCardProps {
  id: string;
  url: string;
  filename: string;
  displayOrder: number;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  index: number;
  onDelete: (id: string) => void;
  dragOverIndex: number | null;
}

export default function MediaCard({
  id,
  url,
  filename,
  displayOrder,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  index,
  onDelete,
  dragOverIndex,
}: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    onDelete(id);
  };

  const isDragOver = dragOverIndex === index;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 transition-all ${
        isDragging
          ? 'border-[#FF5B00] opacity-50 shadow-lg'
          : isDragOver
            ? 'border-[#FF5B00]'
            : 'border-gray-200 hover:border-gray-300'
      } ${deleting ? 'pointer-events-none opacity-30' : ''}`}
    >
      {imgError ? (
        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <img
          src={url}
          alt={filename}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}

      <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
        {displayOrder + 1}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs text-white">{filename}</p>
      </div>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white opacity-0 shadow transition-all hover:bg-red-700 group-hover:opacity-100"
        title="Delete image"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
