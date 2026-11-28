import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const getCachedBlogFeed = unstable_cache(
  async (category: string, featuredOnly: boolean, limit: number, page: number) => {
    const where: Record<string, unknown> = { isPublished: true };
    if (category && category !== 'ALL') where.category = category;
    if (featuredOnly) where.isFeatured = true;
    const skip = (page - 1) * limit;

    return Promise.all([
      prisma.blogPost.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip,
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          category: true,
          tags: true,
          authorName: true,
          authorAvatar: true,
          readTimeMinutes: true,
          isFeatured: true,
          viewsCount: true,
          translations: true,
          createdAt: true,
        },
      }),
      prisma.blogPost.count({ where }),
    ]);
  },
  ['public-blog-feed-v1'],
  { revalidate: 120, tags: ['blog'] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const search = (searchParams.get('search') || '').trim();
    const featuredOnly = searchParams.get('featured') === 'true';
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const skip = (page - 1) * limit;

    let posts;
    let total;

    if (search) {
      const where: Record<string, unknown> = {
        isPublished: true,
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { excerpt: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ],
      };
      if (category && category !== 'ALL') where.category = category;
      if (featuredOnly) where.isFeatured = true;

      [posts, total] = await Promise.all([
        prisma.blogPost.findMany({
          where,
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
          take: limit,
          skip,
          select: {
            id: true,
            slug: true,
            title: true,
            excerpt: true,
            coverImage: true,
            category: true,
            tags: true,
            authorName: true,
            authorAvatar: true,
            readTimeMinutes: true,
            isFeatured: true,
            viewsCount: true,
            translations: true,
            createdAt: true,
          },
        }),
        prisma.blogPost.count({ where }),
      ]);
    } else {
      [posts, total] = await getCachedBlogFeed(category, featuredOnly, limit, page);
    }

    return NextResponse.json(
      {
        posts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Error in public blog API:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}
