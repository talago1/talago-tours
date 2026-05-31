'use client';

import { useCallback } from 'react';
import MediaUploader from './MediaUploader';

interface MediaManagerProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export default function MediaManager({
  value = [],
  onChange,
}: MediaManagerProps) {
  const handleCoverChange = useCallback(
    (url: string) => {
      const [, ...gallery] = value;
      if (url) {
        onChange([url, ...gallery]);
      } else {
        onChange(gallery.length > 0 ? [gallery[0], ...gallery.slice(1)] : []);
      }
    },
    [value, onChange]
  );

  const handleGalleryAdd = useCallback(
    (url: string) => {
      onChange([...value, url]);
    },
    [value, onChange]
  );

  const handleGalleryRemove = useCallback(
    (index: number) => {
      const [, ...gallery] = value;
      const next = gallery.filter((_, i) => i !== index);
      onChange(value[0] ? [value[0], ...next] : next);
    },
    [value, onChange]
  );

  const [coverImage, ...galleryImages] = value;

  return (
    <MediaUploader
      coverImage={coverImage || ''}
      galleryImages={galleryImages}
      onCoverChange={handleCoverChange}
      onGalleryAdd={handleGalleryAdd}
      onGalleryRemove={handleGalleryRemove}
    />
  );
}
