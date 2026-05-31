import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import MediaOrganizer from '@/components/admin/MediaOrganizer';

export const metadata = {
  title: 'Tour Media | Talago Tours',
  description: 'Manage images for this tour.',
};

export default async function TourMediaPage({
  params,
}: {
  params: { tourId: string };
}) {
  const tour = await prisma.tour.findUnique({
    where: { id: params.tourId },
    select: {
      id: true,
      slug: true,
      translations: true,
    },
  });

  if (!tour) notFound();

  const getTitle = (translations: unknown) => {
    if (typeof translations === 'object' && translations !== null) {
      const t = translations as Record<string, { title?: string }>;
      return t.en?.title || t.de?.title || tour.slug;
    }
    return tour.slug;
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Tour Media</h1>
        <p className="mt-1 text-sm text-gray-500">
          {getTitle(tour.translations)}
        </p>
      </div>
      <MediaOrganizer tourId={params.tourId} />
    </div>
  );
}
