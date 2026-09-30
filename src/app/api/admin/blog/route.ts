import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      category,
      tags,
      authorName,
      authorAvatar,
      readTimeMinutes,
      isPublished,
      isFeatured,
      translations,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 });
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const existing = await prisma.blogPost.findUnique({ where: { slug: cleanSlug } });
    if (existing) {
      return NextResponse.json({ error: 'A blog post with this slug already exists' }, { status: 400 });
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: cleanSlug,
        excerpt: excerpt || '',
        content,
        coverImage: coverImage || null,
        category: category || 'Travel Guide',
        tags: Array.isArray(tags) ? tags : [],
        authorName: authorName || 'TALAGO Editorial',
        authorAvatar: authorAvatar || null,
        readTimeMinutes: Number(readTimeMinutes) || 5,
        isPublished: isPublished ?? true,
        isFeatured: isFeatured ?? false,
        translations: translations || {},
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: error.message || 'Failed to create blog post' }, { status: 500 });
  }
}