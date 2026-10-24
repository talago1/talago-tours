import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CONTENT_PAGES, getManagedContentPages, saveManagedContentPages, type ManagedContentPage } from '@/lib/contentPages';
import { sanitizePlain, sanitizeText } from '@/utils/sanitize';

function cleanPages(input: unknown): ManagedContentPage[] {
  if (!Array.isArray(input)) throw new Error('Pages must be an array');
  return DEFAULT_CONTENT_PAGES.map((fallback) => {
    const page = input.find((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && item.slug === fallback.slug));
    if (!page) return fallback;
    const blocks = Array.isArray(page.blocks) ? page.blocks.slice(0, 30).map((block, index) => {
      const source = block as Record<string, unknown>;
      return { id: sanitizePlain(source.id, 80) || `${fallback.slug}-${Date.now()}-${index}`, heading: sanitizePlain(source.heading, 160), body: sanitizeText(source.body, 5000), visible: source.visible !== false, kind: source.kind === 'FAQ' ? 'FAQ' as const : 'TEXT' as const };
    }) : fallback.blocks;
    return { slug: fallback.slug, label: fallback.label, title: sanitizePlain(page.title, 160) || fallback.title, intro: sanitizeText(page.intro, 1200), visible: page.visible !== false, blocks };
  });
}

export async function GET() { return NextResponse.json({ pages: await getManagedContentPages() }); }

export async function PUT(request: NextRequest) {
  try {
    const { pages } = await request.json();
    const clean = cleanPages(pages);
    await saveManagedContentPages(clean);
    return NextResponse.json({ pages: clean });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save content' }, { status: 400 });
  }
}
