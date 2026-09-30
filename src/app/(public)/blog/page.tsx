import { prisma } from '@/lib/prisma';
import BlogClient from './BlogClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
const BLOG_DESCRIPTION =
  'Expert Egypt travel guides, secret snorkeling spots, yacht charter guides, quad safari tips, and Luxor & Cairo cultural itineraries.';

export const metadata: Metadata = {
  title: 'Travel Blog & Red Sea Excursion Guides | TALAGO Tours',
  description: BLOG_DESCRIPTION,
  alternates: { canonical: `${baseUrl}/blog` },
  openGraph: {
    title: 'Egypt Travel Blog & Guides | TALAGO Tours',
    description: BLOG_DESCRIPTION,
    url: `${baseUrl}/blog`,
    siteName: 'TALAGO Tours',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: `${baseUrl}/og/default.png`,
        width: 1200,
        height: 630,
        alt: 'TALAGO Tours travel guides for Egypt and the Red Sea',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Egypt Travel Blog & Guides | TALAGO Tours',
    description: BLOG_DESCRIPTION,
    images: [`${baseUrl}/og/default.png`],
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