import { prisma } from '@/lib/prisma';
import DestinationsClient from './DestinationsClient';

export const dynamic = 'force-dynamic';

export default async function DestinationsPage() {
  const destinations = await prisma.destination.findMany({
    include: {
      _count: {
        select: { tours: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  const mapped = destinations.map((d) => {
    const translations = d.translations as Record<string, { name?: string; description?: string }> | null;
    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      description: d.description ?? '',
      imageUrl: d.imageUrl,
      translations,
      tourCount: d._count.tours,
    };
  });

  return <DestinationsClient destinations={mapped} />;
}
