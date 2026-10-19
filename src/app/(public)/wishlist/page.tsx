import type { Metadata } from 'next';
import WishlistClient from './WishlistClient';

export const metadata: Metadata = {
  title: 'My Saved Tours & Bucket List | TALAGO',
  description:
    'Review, compare, and manage your saved dream tours, desert safaris, and Red Sea experiences on TALAGO.',
  alternates: {
    canonical: 'https://talago-tours.com/wishlist',
  },
  openGraph: {
    title: 'My Saved Tours & Bucket List | TALAGO',
    description:
      'Review, compare, and manage your saved dream tours, desert safaris, and Red Sea experiences on TALAGO.',
  },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
