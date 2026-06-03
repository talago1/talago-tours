'use client';

import { useEffect, useState } from 'react';
import TourSearchHeader from './TourSearchHeader';

interface TourSearchHeaderWrapperProps {
  destinations: { name: string; slug: string }[];
}

export default function TourSearchHeaderWrapper({ destinations }: TourSearchHeaderWrapperProps) {
  const [counts, setCounts] = useState({ total: 0, filtered: 0 });

  useEffect(() => {
    async function loadCounts() {
      try {
        const res = await fetch('/api/public/tours');
        if (!res.ok) return;
        const data = await res.json();
        const total = data.total ?? data.tours?.length ?? 0;
        setCounts({ total, filtered: data.tours?.length ?? total });
      } catch {
        // silent
      }
    }
    loadCounts();
  }, []);

  return (
    <TourSearchHeader
      destinations={destinations}
      totalCount={counts.total}
      filteredCount={counts.filtered}
    />
  );
}
