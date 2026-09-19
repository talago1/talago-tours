import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

const languages = ['en', 'de', 'ru', 'it', 'fr', 'pl', 'es'] as const;

function buildAlternates(path: string) {
  const languageMap: Record<string, string> = {
    'x-default': `${baseUrl}${path}`,
  };
  languages.forEach((lang) => {
    languageMap[lang] = `${baseUrl}${path}?lang=${lang}`;
  });
  return languageMap;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    '',
    '/tours',
    '/destinations',
    '/about',
    '/support',
    '/faq',
    '/concierge-help',
    '/flexible-protection',
    '/safety-policies',
    '/privacy',
    '/cancellation',
    '/booking-terms',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/tours' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : route === '/tours' ? 0.9 : 0.7,
    alternates: {
      languages: buildAlternates(route),
    },
  }));

  // Fetch active tours dynamically
  let tourEntries: MetadataRoute.Sitemap = [];
  try {
    const tours = await prisma.tour.findMany({
      where: {
        OR: [{ status: 'ACTIVE' }, { status: 'PUBLISHED' }, { status: null }],
      },
      select: { slug: true, updatedAt: true },
    });

    tourEntries = tours.map((t) => ({
      url: `${baseUrl}/tours/${t.slug}`,
      lastModified: t.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.85,
      alternates: {
        languages: buildAlternates(`/tours/${t.slug}`),
      },
    }));
  } catch (err) {
    console.warn('Failed to query tours for sitemap:', err);
  }

  // Fetch destinations dynamically
  let destinationEntries: MetadataRoute.Sitemap = [];
  try {
    const destinations = await prisma.destination.findMany({
      select: { slug: true, updatedAt: true },
    });

    destinationEntries = destinations.map((d) => ({
      url: `${baseUrl}/destinations#${d.slug}`,
      lastModified: d.updatedAt,
      changeFrequency: 'monthly',
      priority: 0.75,
      alternates: {
        languages: buildAlternates(`/destinations#${d.slug}`),
      },
    }));
  } catch (err) {
    console.warn('Failed to query destinations for sitemap:', err);
  }

  return [...staticEntries, ...tourEntries, ...destinationEntries];
}
