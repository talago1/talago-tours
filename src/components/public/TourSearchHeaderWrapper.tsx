'use client';

import TourSearchHeader from './TourSearchHeader';

interface TourSearchHeaderWrapperProps {
  destinations: { name: string; slug: string }[];
  totalCount: number;
  filteredCount: number;
}

export default function TourSearchHeaderWrapper({ destinations, totalCount, filteredCount }: TourSearchHeaderWrapperProps) {
  return (
    <TourSearchHeader
      destinations={destinations}
      totalCount={totalCount}
      filteredCount={filteredCount}
    />
  );
}
