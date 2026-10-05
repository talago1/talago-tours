import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';
import { resolveServerLanguage } from '@/lib/i18n.server';
import type { Metadata } from 'next';
import DestinationsClient from './DestinationsClient';

export const dynamic = 'force-dynamic';

import { getDestinationsMetadata } from '@/lib/seoMetadata';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = resolveServerLanguage(searchParams);
  return getDestinationsMetadata(lang);
}

export default async function DestinationsPage() {
  const [destinations, bannerSetting] = await Promise.all([
    prisma.destination.findMany({
      where: { isVisible: true },
      include: {
        _count: {
          select: { tours: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.systemSetting.findUnique({ where: { key: 'banners' } }),
  ]);

  // Read on the server. This used to be fetched client-side from
  // /api/admin/settings, which the admin middleware answers with 401, so the
  // hero background silently never rendered.
  const banners = bannerSetting
    ? parseSettingValue<SystemSettings['banners']>(bannerSetting.value, DEFAULT_SYSTEM_SETTINGS.banners)
    : DEFAULT_SYSTEM_SETTINGS.banners;

  // A destination with no imageUrl would otherwise fall through to the curated
  // Unsplash covers, several of which have since 404'd. Prefer a photo the site
  // actually owns: the best-rated active tour in that same destination.
  const missingImage = destinations.filter((d) => !d.imageUrl).map((d) => d.id);
  const ownedFallbacks = new Map<string, string>();

  if (missingImage.length > 0) {
    const fallbackTours = await prisma.tour.findMany({
      where: {
        destinationId: { in: missingImage },
        status: 'ACTIVE',
        coverImage: { not: null },
      },
      select: { destinationId: true, coverImage: true, images: true },
      orderBy: { ratingAverage: 'desc' },
    });

    for (const t of fallbackTours) {
      if (!t.destinationId || ownedFallbacks.has(t.destinationId)) continue;
      const candidate = t.coverImage ?? (Array.isArray(t.images) ? t.images[0] : undefined);
      if (typeof candidate === 'string' && candidate.trim()) {
        ownedFallbacks.set(t.destinationId, candidate.trim());
      }
    }
  }

  const mapped = destinations.map((d) => {
    const translations = d.translations as Record<string, { name?: string; description?: string }> | null;
    return {
      id: d.id,
      slug: d.slug,
      name: d.name,
      description: d.description ?? '',
      imageUrl: d.imageUrl,
      ownedCover: ownedFallbacks.get(d.id) ?? null,
      translations,
      tourCount: d._count.tours,
    };
  });

  return <DestinationsClient destinations={mapped} banners={banners} />;
}
