import { prisma } from '@/lib/prisma';
import AdminToursClient from './AdminToursClient';

export const dynamic = 'force-dynamic';

export default async function AdminToursPage() {
  const [tours, destinations, zones] = await Promise.all([
    prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        type: true,
        category: true,
        adultPrice: true,
        basePriceUSD: true,
        status: true,
        translations: true,
        coverImage: true,
        galleryImages: true,
        destinationId: true,
        zoneId: true,
        maxCapacity: true,
        durationHours: true,
        destination: { select: { name: true } },
      },
    }),
    prisma.destination.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.zone.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  // Convert decimal to number if needed or cast types
  const mappedTours = tours.map(t => ({
    ...t,
    destinationId: t.destinationId ?? '',
    destination: t.destination ?? { name: '' },
    status: t.status ?? 'ACTIVE',
    category: t.category ?? null,
    adultPrice: Number(t.adultPrice || t.basePriceUSD || 0),
    basePriceUSD: Number(t.basePriceUSD || 0),
  }));

  return (
    <AdminToursClient
      initialTours={mappedTours}
      destinations={destinations}
      zones={zones}
    />
  );
}
