export interface WishlistItem {
  id: string;
  slug: string;
  title: string;
  coverImage: string;
  priceUSD: number;
  ratingAverage: number;
  ratingCount: number;
  duration?: string;
  durationHours?: number | null;
  destinationName?: string;
  category?: string | null;
  addedAt: number;
}
