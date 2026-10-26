import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CONTENT_PAGES, getManagedContentPages, saveManagedContentPages, type ManagedContentPage, type ContentBlock } from '@/lib/contentPages';
import { sanitizePlain, sanitizeText } from '@/utils/sanitize';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n';
import { isAdminRequest } from '@/utils/adminAuth';

function cleanPages(input: unknown): ManagedContentPage[] {
  if (!Array.isArray(input)) throw new Error('Pages must be an array');

  const mapBySlug = new Map<string, ManagedContentPage>();
  for (const def of DEFAULT_CONTENT_PAGES) {
    mapBySlug.set(def.slug, { ...def });
  }

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const page = raw as Record<string, unknown>;
    const slug = typeof page.slug === 'string' ? page.slug.trim() : '';
    if (!slug) continue;

    const fallback = mapBySlug.get(slug) || {
      slug,
      label: typeof page.label === 'string' ? page.label : slug,
      visible: true,
      translations: { en: { title: '', intro: '', blocks: [] } },
    };

    const cleanBlocks = (rawBlocks: unknown): ContentBlock[] => {
      if (!Array.isArray(rawBlocks)) return [];
      return rawBlocks.slice(0, 50).map((block, index) => {
        const source = (block && typeof block === 'object') ? block as Record<string, unknown> : {};
        return {
          id: sanitizePlain(source.id, 80) || `${slug}-${Date.now()}-${index}`,
          heading: sanitizePlain(source.heading, 160),
          body: sanitizeText(source.body, 10000),
          visible: source.visible !== false,
          kind: source.kind === 'FAQ' ? ('FAQ' as const) : ('TEXT' as const),
        };
      });
    };

    const rawTranslations = page.translations && typeof page.translations === 'object'
      ? page.translations as Record<string, unknown>
      : {};

    const translations: ManagedContentPage['translations'] = {};

    // 1. English (source of truth)
    const rawEn = (rawTranslations.en && typeof rawTranslations.en === 'object')
      ? rawTranslations.en as Record<string, unknown>
      : null;

    const enTitle = sanitizePlain(rawEn?.title ?? page.title, 160) || fallback.translations.en?.title || '';
    const enIntro = sanitizeText(rawEn?.intro ?? page.intro, 2000) || fallback.translations.en?.intro || '';
    const enBlocks = cleanBlocks(rawEn?.blocks ?? page.blocks ?? fallback.translations.en?.blocks ?? []);

    translations.en = {
      title: enTitle,
      intro: enIntro,
      blocks: enBlocks,
    };

    // 2. Other languages — only store what is explicitly translated, no forced English clones!
    for (const language of LANGUAGES) {
      if (language === 'en') continue;
      const raw = rawTranslations[language];
      if (!raw || typeof raw !== 'object') continue;
      const value = raw as Record<string, unknown>;

      const title = sanitizePlain(value.title, 160);
      const intro = sanitizeText(value.intro, 2000);
      const blocks = cleanBlocks(value.blocks);

      // Only preserve translation if at least one field has been translated
      if (title || intro || blocks.length > 0) {
        translations[language as LanguageCode] = {
          title,
          intro,
          blocks,
        };
      }
    }

    mapBySlug.set(slug, {
      slug,
      label: sanitizePlain(page.label, 120) || fallback.label,
      visible: page.visible !== false,
      translations,
    });
  }

  return Array.from(mapBySlug.values());
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ pages: await getManagedContentPages() });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { pages } = await request.json();
    const clean = cleanPages(pages);
    await saveManagedContentPages(clean);
    return NextResponse.json({ success: true, pages: clean });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to save content' }, { status: 400 });
  }
}
