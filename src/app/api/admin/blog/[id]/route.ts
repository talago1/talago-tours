import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { id: params.id },
    });

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const existing = await prisma.blogPost.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    let cleanSlug = existing.slug;
    if (slug && slug !== existing.slug) {
      cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const duplicate = await prisma.blogPost.findUnique({ where: { slug: cleanSlug } });
      if (duplicate && duplicate.id !== params.id) {
        return NextResponse.json({ error: 'Another post is already using this slug' }, { status: 400 });
      }
    }

    const updated = await prisma.blogPost.update({
      where: { id: params.id },
      data: {
        title: title !== undefined ? title : existing.title,
        slug: cleanSlug,
        excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
        content: content !== undefined ? content : existing.content,
        coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
        category: category !== undefined ? category : existing.category,
        tags: Array.isArray(tags) ? tags : existing.tags,
        authorName: authorName !== undefined ? authorName : existing.authorName,
        authorAvatar: authorAvatar !== undefined ? authorAvatar : existing.authorAvatar,
        readTimeMinutes: readTimeMinutes !== undefined ? Number(readTimeMinutes) : existing.readTimeMinutes,
        isPublished: isPublished !== undefined ? isPublished : existing.isPublished,
        isFeatured: isFeatured !== undefined ? isFeatured : existing.isFeatured,
        translations: translations !== undefined ? translations : existing.translations,
      },
    });

    return NextResponse.json({ post: updated });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json({ error: error.message || 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.blogPost.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}