'use client';

import TourSearchHeader from './TourSearchHeader';

interface TourSearchHeaderWrapperProps {
  totalCount: number;
  filteredCount: number;
}

export default function TourSearchHeaderWrapper({
  totalCount,
  filteredCount,
}: TourSearchHeaderWrapperProps) {
  return (
    <TourSearchHeader
      totalCount={totalCount}
      filteredCount={filteredCount}
    />
  );
}
