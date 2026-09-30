import { prisma } from '@/lib/prisma';
import BlogClient from './BlogClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Travel Blog & Red Sea Excursion Guides | TALAGO Tours',
  description: 'Expert Egypt travel guides, secret snorkeling spots, yacht charter guides, quad safari tips, and Luxor & Cairo cultural itineraries.',
  openGraph: {
    title: 'Egypt Travel Blog & Guides | تالا جو TALAGO Tours',
    description: 'Expert travel guides and insider tips for Hurghada, Sharm El Sheikh, Marsa Alam, Luxor, and Cairo.',
  },
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      category: true,
      tags: true,
      authorName: true,
      readTimeMinutes: true,
      isFeatured: true,
      translations: true,
      createdAt: true,
    },
  });

  const serialized = posts.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return <BlogClient initialPosts={serialized} />;
}