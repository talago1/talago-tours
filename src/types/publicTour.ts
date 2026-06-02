export const TOUR_CATEGORIES = [
  'SNORKELING',
  'DIVING',
  'BOAT_TRIP',
  'SAFARI',
  'DESERT',
  'CITY',
  'ADVENTURE',
] as const;

export type TourCategory = typeof TOUR_CATEGORIES[number];

export interface PublicTour {
  id: string;
  title: string;
  slug: string;
  basePrice: number | null;
  duration: string | null;
  rating: number;
  thumbnailUrl: string | null;
  category: TourCategory | null;
  destination: {
    name: string;
    slug: string;
  };
  translations?: any;
}

export interface PublicTourApiResponse {
  tours: PublicTour[];
  total: number;
}

export interface TourFilterState {
  destination: string;
  type: string;
  minPrice: string;
  maxPrice: string;
  search: string;
}
