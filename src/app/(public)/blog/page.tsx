import { prisma } from '@/lib/prisma';
import BlogClient from './BlogClient';
import type { Metadata } from 'next';
import { resolveServerLanguage } from '@/lib/i18n.server';

export const dynamic = 'force-dynamic';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
const BLOG_DESCRIPTION =
  'Curated travel guides, expert tips, secret snorkeling spots, yacht charter advice, desert expedition tips, and cultural itineraries worldwide.';

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<Metadata> {
  const lang = resolveServerLanguage(searchParams);
  const title = 'TALAGO | Travel Journal & Curated Experience Guides Worldwide';
  return {
    title,
    description: BLOG_DESCRIPTION,
    alternates: {
      canonical: `${baseUrl}/blog`,
      languages: {
        en: `${baseUrl}/blog?lang=en`,
        de: `${baseUrl}/blog?lang=de`,
        ru: `${baseUrl}/blog?lang=ru`,
        it: `${baseUrl}/blog?lang=it`,
        fr: `${baseUrl}/blog?lang=fr`,
        pl: `${baseUrl}/blog?lang=pl`,
        es: `${baseUrl}/blog?lang=es`,
        uk: `${baseUrl}/blog?lang=uk`,
        'x-default': `${baseUrl}/blog`,
      },
    },
    openGraph: {
      title,
      description: BLOG_DESCRIPTION,
      url: `${baseUrl}/blog`,
      locale: `${lang}_${lang.toUpperCase()}`,
      type: 'website',
      images: [
        {
          url: `${baseUrl}/og/default.jpg`,
          secureUrl: `${baseUrl}/og/default.jpg`,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: BLOG_DESCRIPTION,
      images: [`${baseUrl}/og/default.jpg`],
    },
  };
}

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