import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BlogPostClient from './BlogPostClient';
import type { Metadata } from 'next';
import { resolveServerLanguage } from '@/lib/i18n.server';

export const dynamic = 'force-dynamic';

interface Props {
  params: { slug: string };
  searchParams?: Record<string, string | string[] | undefined>;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://talago-tours.com';

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const lang = resolveServerLanguage(searchParams);
  // Must respect isPublished, otherwise a draft's title and excerpt leak into
  // search results and social previews even though the page 404s.
  const post = await prisma.blogPost.findFirst({
    where: { slug: params.slug, isPublished: true },
    select: { title: true, excerpt: true, coverImage: true, updatedAt: true, translations: true },
  });

  if (!post) {
    return { title: 'Article Not Found', robots: { index: false, follow: false } };
  }

  const translations = (post.translations as Record<string, { title?: string; excerpt?: string }> | null) || {};
  const localized = translations[lang];
  const english = translations.en;
  const postTitle = localized?.title || post.title || english?.title || 'Travel Guide';
  const description = localized?.excerpt || post.excerpt || english?.excerpt || `Read our travel guide on ${postTitle}`;
  const fallbackImage = `${baseUrl}/og/default.jpg`;
  const image = post.coverImage || fallbackImage;
  const pageUrl = `${baseUrl}/blog/${params.slug}`;

  return {
    title: postTitle,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        en: `${pageUrl}?lang=en`,
        de: `${pageUrl}?lang=de`,
        ru: `${pageUrl}?lang=ru`,
        it: `${pageUrl}?lang=it`,
        fr: `${pageUrl}?lang=fr`,
        pl: `${pageUrl}?lang=pl`,
        es: `${pageUrl}?lang=es`,
        uk: `${pageUrl}?lang=uk`,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      title: postTitle,
      description,
      url: `${pageUrl}${lang === 'en' ? '' : `?lang=${lang}`}`,
      siteName: 'TALAGO',
      locale: `${lang}_${lang.toUpperCase()}`,
      type: 'article',
      modifiedTime: post.updatedAt.toISOString(),
      images: [
        {
          url: image,
          secureUrl: image,
          width: 1200,
          height: 630,
          alt: postTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: postTitle,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params, searchParams }: Props) {
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

  const lang = resolveServerLanguage(searchParams);
  const translations = (post.translations as Record<string, { title?: string; excerpt?: string }> | null) || {};
  const localized = translations[lang];
  const english = translations.en;
  const postTitle = localized?.title || post.title || english?.title || 'Travel Guide';
  const postDescription = localized?.excerpt || post.excerpt || english?.excerpt || `Read our travel guide on ${postTitle}`;
  const postImage = post.coverImage || `${baseUrl}/opengraph-image`;
  const postUrl = `${baseUrl}/blog/${params.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: postTitle,
    description: postDescription,
    image: postImage,
    url: postUrl,
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Organization',
      name: post.authorName || 'TALAGO Tours',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TALAGO Tours',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  };

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPostClient post={serialized} relatedPosts={relatedPosts} />
    </>
  );
}