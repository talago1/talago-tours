export const dynamic = 'force-dynamic';

import Hero from '@/components/landing/Hero';
import BentoGridUSPs from '@/components/landing/BentoGridUSPs';
import TourCatalog from '@/components/landing/TourCatalog';
import PopularDestinations from '@/components/landing/PopularDestinations';
import Testimonials from '@/components/landing/Testimonials';
import FAQSection from '@/components/landing/FAQSection';
import NewsletterBanner from '@/components/landing/NewsletterBanner';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070F1E]">
      <Hero />
      <BentoGridUSPs />
      <TourCatalog />
      <PopularDestinations />
      <Testimonials />
      <FAQSection />
      <NewsletterBanner />
    </div>
  );
}
