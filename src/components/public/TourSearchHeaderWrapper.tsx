'use client';

import type { SystemSettings } from '@/types/settings';
import TourSearchHeader from './TourSearchHeader';

interface TourSearchHeaderWrapperProps {
  destinations: { name: string; slug: string }[];
  totalCount: number;
  filteredCount: number;
  modules?: SystemSettings['modules'];
}

export default function TourSearchHeaderWrapper({
  destinations,
  totalCount,
  filteredCount,
  modules,
}: TourSearchHeaderWrapperProps) {
  return (
    <TourSearchHeader
      destinations={destinations}
      totalCount={totalCount}
      filteredCount={filteredCount}
      modules={modules}
    />
  );
}
