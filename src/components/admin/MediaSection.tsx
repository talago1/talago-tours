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
    <section className="mb-6 rounded-[2rem] border border-white/10 bg-[#0B1528] p-6 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-[#00E5FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-lg font-black text-white">Media Assets</h2>
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
        <p className="mt-2 text-xs text-red-400">{errors.coverImage}</p>
      )}
    </section>
  );
}
