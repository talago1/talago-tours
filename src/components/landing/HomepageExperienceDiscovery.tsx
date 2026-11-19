'use client';

import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { PublicTourCardData } from '@/components/tours/PublicTourCard';
import type { HomepageCollectionConfig } from '@/types/homepage';
import ExperienceCarousel from './ExperienceCarousel';

interface HomepageExperienceDiscoveryProps {
  tours: PublicTourCardData[];
  collections: HomepageCollectionConfig[];
}

export default function HomepageExperienceDiscovery({
  tours,
  collections,
}: HomepageExperienceDiscoveryProps) {
  const { language } = useLanguage();

  // Active published tours only
  const activeTours = useMemo(() => {
    return (tours || []).filter(
      (t) =>
        t &&
        t.id &&
        (t.priceAdult !== null || t.adultPrice !== null || t.basePriceUSD !== null || t.basePrice !== null)
    );
  }, [tours]);

  // Render enabled collections in order
  const collectionElements = useMemo(() => {
    const enabledCollections = [...collections]
      .filter((c) => c.enabled)
      .sort((a, b) => a.order - b.order);

    return enabledCollections.map((col) => {
      let filtered: PublicTourCardData[] = [];

      if (col.type === 'featured') {
        filtered = activeTours.filter((t) => t.isFeatured || t.isBestSeller);
        if (filtered.length === 0) {
          // Fallback to top rated
          filtered = [...activeTours].sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
        }
      } else if (col.type === 'destination' && col.targetSlug) {
        filtered = activeTours.filter(
          (t) => t.destination?.slug?.toLowerCase() === col.targetSlug?.toLowerCase()
        );
      } else if (col.type === 'category' && col.targetSlug) {
        filtered = activeTours.filter((t) =>
          t.category?.toLowerCase().includes(col.targetSlug!.toLowerCase())
        );
      } else if (col.type === 'popular') {
        filtered = [...activeTours].sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0));
      }

      const sliced = filtered.slice(0, col.maxItems || 8);

      // Localized title & subtitle
      const colTitle = col.translations?.[language]?.title || col.title;
      const colSubtitle = col.translations?.[language]?.subtitle || col.subtitle;

      return (
        <ExperienceCarousel
          key={col.id}
          id={col.id}
          title={colTitle}
          subtitle={colSubtitle}
          tours={sliced}
          viewAllLink={col.viewAllLink}
        />
      );
    });
  }, [activeTours, collections, language]);

  // If no tours exist or all collections are empty, return null gracefully (per visibility rules)
  if (activeTours.length === 0) {
    return null;
  }

  return <div className="space-y-4 my-6">{collectionElements}</div>;
}
