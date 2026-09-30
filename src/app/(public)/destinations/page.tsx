import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';
import DestinationsClient from './DestinationsClient';

export const dynamic = 'force-dynamic';

export default async function DestinationsPage() {
  const [destinations, bannerSetting] = await Promise.all([
    prisma.destination.findMany({
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

  return <DestinationsClient destinations={mapped} banners={banners} />;
}
