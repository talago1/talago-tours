import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BlogPostClient from './BlogPostClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
  });

  if (!post) {
    return { title: 'Article Not Found | TALAGO Tours' };
  }

  return {
    title: `${post.title} | TALAGO Tours`,
    description: post.excerpt || `Read our comprehensive travel guide on ${post.title}`,
    openGraph: {
      title: `${post.title} | تالا جو TALAGO Tours`,
      description: post.excerpt || `Read our comprehensive travel guide on ${post.title}`,
      images: post.coverImage ? [post.coverImage] : [],
      type: 'article',
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

  // Increment views in background
  try {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: { viewsCount: { increment: 1 } },
    });
  } catch {}

  // Fetch related tours or articles
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      isPublished: true,
      id: { not: post.id },
    },
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
  });

  const serialized = {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };

  return <BlogPostClient post={serialized} relatedPosts={relatedPosts} />;
}