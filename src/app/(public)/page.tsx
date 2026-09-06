export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from '@/lib/prisma';
import { parseSettingValue } from '@/lib/systemSettings';
import Hero from '@/components/landing/Hero';
import BentoGridUSPs from '@/components/landing/BentoGridUSPs';
import TourCatalog from '@/components/landing/TourCatalog';
import PopularDestinations from '@/components/landing/PopularDestinations';
import Testimonials from '@/components/landing/Testimonials';
import FAQSection from '@/components/landing/FAQSection';
import NewsletterBanner from '@/components/landing/NewsletterBanner';

export default async function HomePage() {
  const [tours, destinations, bannerSetting] = await Promise.all([
    prisma.tour.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
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
        destination: {
          select: { name: true, slug: true },
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
        _count: { select: { tours: true } },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: 'banners' } }),
  ]);

  const bannerData = bannerSetting
    ? parseSettingValue<{
        heroBackground?: string;
        conciergePickImage?: string;
        conciergePickTitle?: string;
        conciergePickDescription?: string;
      }>(bannerSetting.value, {})
    : {};
  const heroBackground = bannerData.heroBackground || '';
  const conciergePickImage = bannerData.conciergePickImage || '';
  const conciergePickTitle = bannerData.conciergePickTitle || '';
  const conciergePickDescription = bannerData.conciergePickDescription || '';

  return (
    <div className="min-h-screen bg-[#070F1E]">
      <Hero
        heroBackground={heroBackground}
        conciergePickImage={conciergePickImage}
        conciergePickTitle={conciergePickTitle}
        conciergePickDescription={conciergePickDescription}
      />
      <BentoGridUSPs />
      <TourCatalog tours={tours} />
      <PopularDestinations destinations={destinations} />
      <Testimonials />
      <FAQSection />
      <NewsletterBanner />
    </div>
  );
}
