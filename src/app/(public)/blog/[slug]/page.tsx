import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BlogPostClient from './BlogPostClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';
const FALLBACK_OG = `${baseUrl}/og/default.png`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Must respect isPublished, otherwise a draft's title and excerpt leak into
  // search results and social previews even though the page 404s.
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, excerpt: true, coverImage: true, updatedAt: true },
  });

  if (!post) {
    return { title: 'Article Not Found | TALAGO Tours', robots: { index: false, follow: false } };
  }

  const description = post.excerpt || `Read our comprehensive travel guide on ${post.title}`;
  const image = post.coverImage || FALLBACK_OG;

  return {
    title: `${post.title} | TALAGO Tours`,
    description,
    alternates: { canonical: `${baseUrl}/blog/${params.slug}` },
    openGraph: {
      title: `${post.title} | TALAGO Tours`,
      description,
      url: `${baseUrl}/blog/${params.slug}`,
      siteName: 'TALAGO Tours',
      locale: 'en_US',
      type: 'article',
      modifiedTime: post.updatedAt.toISOString(),
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${post.title} | TALAGO Tours`,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, isPublished: true },
  });

  if (!post) {
    notFound();
  }

  // Record the view without blocking the render on a write.
  void prisma.blogPost
    .update({ where: { id: post.id }, data: { viewsCount: { increment: 1 } } })
    .catch(() => {});

  // Related guides: same category first, then anything else recent.
  const [sameCategory, recent] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true, id: { not: post.id }, category: post.category },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
        category: true,
        readTimeMinutes: true,
        translations: true,
      },
    }),
    prisma.blogPost.findMany({
      where: { isPublished: true, id: { not: post.id }, category: { not: post.category } },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
        category: true,
        readTimeMinutes: true,
        translations: true,
      },
    }),
  ]);

  const relatedPosts = [...sameCategory, ...recent].slice(0, 3);

  const serialized = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };

  return <BlogPostClient post={serialized} relatedPosts={relatedPosts} />;
}