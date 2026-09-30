export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';
import Hero from '@/components/landing/Hero';
import BentoGridUSPs from '@/components/landing/BentoGridUSPs';
import TourCatalog from '@/components/landing/TourCatalog';
import PopularDestinations from '@/components/landing/PopularDestinations';
import Testimonials from '@/components/landing/Testimonials';
import FAQSection from '@/components/landing/FAQSection';
import NewsletterBanner from '@/components/landing/NewsletterBanner';

export default async function HomePage() {
  const [tours, destinations, bannerSetting, activeTourCount] = await Promise.all([
    prisma.tour.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [
        { isBestSeller: 'desc' },
        { ratingAverage: 'desc' },
        { ratingCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 36,
      select: {
        id: true,
        slug: true,
        coverImage: true,
        galleryImages: true,
        thumbnailUrl: true,
        basePriceUSD: true,
        basePrice: true,
        duration: true,
        durationHours: true,
        translations: true,
        displayExcerpt: true,
        cardExcerpt: true,
        category: true,
        ratingAverage: true,
        ratingCount: true,
        priceAdult: true,
        adultPrice: true,
        originalPrice: true,
        isBestSeller: true,
        isFeatured: true,
        isRecommended: true,
        isVip: true,
        isNew: true,
        customBadge: true,
        destinationId: true,
        destination: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.destination.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        region: true,
        city: true,
        _count: { select: { tours: true } },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: 'banners' } }),
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
  ]);

  const bannerData = bannerSetting
    ? parseSettingValue<SystemSettings['banners']>(bannerSetting.value, DEFAULT_SYSTEM_SETTINGS.banners)
    : DEFAULT_SYSTEM_SETTINGS.banners;

  // The hero's rotating card is built from real destinations rather than a
  // hardcoded list, so a destination added in the admin shows up here.
  const showcaseDestinations = destinations
    .filter((d) => d.imageUrl && d._count.tours > 0)
    .slice(0, 4)
    .map((d) => ({
      name: d.name,
      subtitle: d.description || '',
      image: d.imageUrl as string,
      tag: d.region || d.city || '',
      price: '',
      rating: '',
      link: `/tours?destination=${d.slug}`,
    }));

  return (
    <div className="min-h-screen bg-[#070F1E]">
      <Hero
        heroBackground={bannerData.heroBackground}
        conciergePickImage={bannerData.conciergePickImage}
        conciergePickTitle={bannerData.conciergePickTitle}
        conciergePickDescription={bannerData.conciergePickDescription}
        conciergePickBadge={bannerData.conciergePickBadge}
        conciergePickPrice={bannerData.conciergePickPrice}
        conciergePickLink={bannerData.conciergePickLink}
        showConciergePick={bannerData.showConciergePick}
        heroBadge={bannerData.heroBadge}
        heroTitle={bannerData.heroTitle}
        heroTagline={bannerData.heroTagline}
        heroDescription={bannerData.heroDescription}
        showHeroBadge={bannerData.showHeroBadge}
        showHeroTagline={bannerData.showHeroTagline}
        showHeroDescription={bannerData.showHeroDescription}
        heroPrimaryBtnText={bannerData.heroPrimaryBtnText}
        heroPrimaryBtnLink={bannerData.heroPrimaryBtnLink}
        showPrimaryBtn={bannerData.showPrimaryBtn}
        heroSecondaryBtnText={bannerData.heroSecondaryBtnText}
        heroSecondaryBtnLink={bannerData.heroSecondaryBtnLink}
        showSecondaryBtn={bannerData.showSecondaryBtn}
        showHeroMetrics={bannerData.showHeroMetrics}
        heroMetric1Value={bannerData.heroMetric1Value}
        heroMetric1Label={bannerData.heroMetric1Label}
        heroMetric2Value={bannerData.heroMetric2Value}
        heroMetric2Label={bannerData.heroMetric2Label}
        heroMetric3Value={bannerData.heroMetric3Value}
        heroMetric3Label={bannerData.heroMetric3Label}
        showcaseDestinations={showcaseDestinations}
        activeTourCount={activeTourCount}
        heroTranslations={bannerData.heroTranslations}
      />
      <TourCatalog tours={tours} />
      <BentoGridUSPs />
      <PopularDestinations destinations={destinations} />
      <Testimonials />
      <FAQSection />
      <NewsletterBanner />
    </div>
  );
}
