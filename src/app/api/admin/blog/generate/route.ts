import { NextRequest, NextResponse } from 'next/server';
import { generateAiBlogPost, isAiConfigured } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'ai-blog-generate'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const configured = await isAiConfigured();
    if (!configured) {
      return NextResponse.json(
        {
          error:
            'No AI Provider is configured. Please configure an AI Provider in Admin Settings > AI Key Pool or set GEMINI_API_KEY in .env.',
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { topic, destinationName, category, autoSave } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required for article generation.' },
        { status: 400 },
      );
    }

    const generated = await generateAiBlogPost({
      topic: topic.trim(),
      destinationName: destinationName || 'Egypt',
      category: category || 'Travel Guide',
    });

    let savedPost = null;
    if (autoSave) {
      // Check slug uniqueness
      let candidateSlug = generated.slug;
      const existing = await prisma.blogPost.findUnique({ where: { slug: candidateSlug } });
      if (existing) {
        candidateSlug = `${candidateSlug}-${Date.now().toString(36)}`;
      }

      savedPost = await prisma.blogPost.create({
        data: {
          title: generated.title,
          slug: candidateSlug,
          excerpt: generated.excerpt,
          content: generated.content,
          category: generated.category,
          tags: generated.tags,
          readTimeMinutes: generated.readTimeMinutes,
          isPublished: false, // Default to draft for admin review
          isFeatured: false,
          authorName: 'TALAGO AI Editorial',
          translations: generated.translations,
        },
      });
    }

    return NextResponse.json({
      success: true,
      article: generated,
      savedPost,
    });
  } catch (error: any) {
    console.error('AI blog generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI blog article' },
      { status: 500 },
    );
  }
}
