export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';
import { resolveServerLanguage } from '@/lib/i18n.server';
import type { Metadata } from 'next';
import Hero from '@/components/landing/Hero';
import BentoGridUSPs from '@/components/landing/BentoGridUSPs';
import TourCatalog from '@/components/landing/TourCatalog';
import ExploreByInterest from '@/components/landing/ExploreByInterest';
import HomepageExperienceDiscovery from '@/components/landing/HomepageExperienceDiscovery';
import { getHomepageCollections, getHomepageSections } from '@/lib/homepageCollections';
import PopularDestinations from '@/components/landing/PopularDestinations';
import Testimonials, { LandingReview } from '@/components/landing/Testimonials';
import FAQSection from '@/components/landing/FAQSection';
import NewsletterBanner from '@/components/landing/NewsletterBanner';

import { getHomeMetadata } from '@/lib/seoMetadata';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = resolveServerLanguage(searchParams);
  return getHomeMetadata(lang);
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const [tours, destinations, bannerSetting, activeTourCount, reviews, collections, homepageSections] = await Promise.all([
    prisma.tour.findMany({
      where: { status: 'ACTIVE' },
      orderBy: [
        { isFeatured: 'desc' },
        { isBestSeller: 'desc' },
        { ratingAverage: 'desc' },
        { ratingCount: 'desc' },
        { createdAt: 'desc' },
      ],
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
        hotelPickupIncluded: true,
        destinationId: true,
        destination: {
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.destination.findMany({
      where: {
        isVisible: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        region: true,
        city: true,
        translations: true,
        _count: {
          select: {
            tours: { where: { status: 'ACTIVE' } },
          },
        },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: 'banners' } }),
    prisma.tour.count({ where: { status: 'ACTIVE' } }),
    prisma.review.findMany({
      where: {
        status: 'APPROVED',
        isVisible: true,
        isSeeded: false,
      },
      // Use select instead of include to avoid loading all tour fields
      select: {
        id: true,
        customerName: true,
        rating: true,
        comment: true,
        country: true,
        source: true,
        createdAt: true,
        tour: { select: { slug: true, translations: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    getHomepageCollections(),
    getHomepageSections(),
  ]);

  const bannerData = bannerSetting
    ? parseSettingValue<SystemSettings['banners']>(bannerSetting.value, DEFAULT_SYSTEM_SETTINGS.banners)
    : DEFAULT_SYSTEM_SETTINGS.banners;

  const landingReviews: LandingReview[] = (reviews || [])
    .filter((r) => r.comment && r.comment.trim().length > 0)
    .map((r) => {
      const trans = r.tour?.translations as Record<string, { title?: string }> | null;
      return {
        id: r.id,
        customerName: r.customerName,
        rating: r.rating,
        comment: r.comment || '',
        tourName: trans?.en?.title || r.tour?.slug,
        createdAt: r.createdAt,
        country: r.country,
        source: r.source,
      };
    });

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

  const searchDestinations = destinations.map((d) => ({
    name: d.name,
    slug: d.slug,
    description: d.description || '',
  }));

  const popularTours = tours.slice(0, 8).map((t) => {
    const trans = t.translations as any;
    return {
      title: trans?.en?.title || t.slug,
      slug: t.slug,
      category: t.category,
      destinationName: t.destination?.name,
      price: t.adultPrice || t.basePriceUSD || t.priceAdult || null,
    };
  });

  const heroSectionConfig = homepageSections.find((s) => s.key === 'hero');
  const isHeroSectionEnabled = heroSectionConfig ? heroSectionConfig.enabled : true;
  const shouldRenderHero = bannerData.showHero !== false && isHeroSectionEnabled;

  return (
    <div className="min-h-screen bg-[#070F1E]">
      <Hero
        heroBackground={bannerData.heroBackground}
        heroBackgroundMobile={bannerData.heroBackgroundMobile}
        heroOverlayOpacity={bannerData.heroOverlayOpacity}
        showHero={shouldRenderHero}
        showHeroBackground={bannerData.showHeroBackground}
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
        showHeroTitle={bannerData.showHeroTitle}
        showHeroTagline={bannerData.showHeroTagline}
        showHeroDescription={bannerData.showHeroDescription}
        showHeroTrust={bannerData.showHeroTrust}
        showHeroSearch={bannerData.showHeroSearch}
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
        searchDestinations={searchDestinations}
        popularTours={popularTours}
        activeTourCount={activeTourCount}
        heroTranslations={bannerData.heroTranslations}
      />
      {Boolean(
        searchParams?.search ||
        searchParams?.destination ||
        searchParams?.type ||
        searchParams?.category ||
        searchParams?.duration ||
        searchParams?.rating ||
        searchParams?.maxPrice ||
        searchParams?.pickup
      ) ? (
        <TourCatalog tours={tours} totalActiveCount={activeTourCount} />
      ) : (
        <>
          {homepageSections
            .filter((s) => s.enabled && s.key !== 'hero')
            .map((section) => {
              switch (section.key) {
                case 'destinations':
                  return <PopularDestinations key="destinations" destinations={destinations} />;
                case 'interests':
                  return <ExploreByInterest key="interests" />;
                case 'collections':
                  return (
                    <HomepageExperienceDiscovery
                      key="collections"
                      tours={tours as any}
                      collections={collections}
                    />
                  );
                case 'why-talago':
                  return <BentoGridUSPs key="why-talago" />;
                case 'reviews':
                  return <Testimonials key="reviews" reviews={landingReviews} />;
                case 'faq':
                  return <FAQSection key="faq" />;
                case 'newsletter':
                  return <NewsletterBanner key="newsletter" />;
                default:
                  return null;
              }
            })}
        </>
      )}
    </div>
  );
}
