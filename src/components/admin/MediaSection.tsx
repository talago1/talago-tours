'use client';

import type { MediaFields } from '@/types/tourBuilder';
import MediaUploader from './MediaUploader';

interface MediaSectionProps {
  values: MediaFields;
  errors: Record<string, string>;
  onChange: (values: MediaFields) => void;
}

export default function MediaSection({ values, errors, onChange }: MediaSectionProps) {
  const update = (partial: Partial<MediaFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-secondary-forest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-lg font-semibold text-gray-800">Media</h2>
      </div>

      <MediaUploader
        coverImage={values.coverImage}
        galleryImages={values.galleryImages}
        onCoverChange={(url) => update({ coverImage: url })}
        onGalleryAdd={(url) =>
          update({ galleryImages: [...values.galleryImages, url] })
        }
        onGalleryRemove={(index) =>
          update({
            galleryImages: values.galleryImages.filter((_, i) => i !== index),
          })
        }
      />

      {errors.coverImage && (
        <p className="mt-2 text-xs text-red-500">{errors.coverImage}</p>
      )}
    </section>
  );
}
