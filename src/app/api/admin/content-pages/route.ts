import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_CONTENT_PAGES, getManagedContentPages, saveManagedContentPages, type ManagedContentPage } from '@/lib/contentPages';
import { sanitizePlain, sanitizeText } from '@/utils/sanitize';
import { LANGUAGES, type LanguageCode } from '@/lib/i18n';

function cleanPages(input: unknown): ManagedContentPage[] {
  if (!Array.isArray(input)) throw new Error('Pages must be an array');
  return DEFAULT_CONTENT_PAGES.map((fallback) => {
    const page = input.find((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && item.slug === fallback.slug));
    if (!page) return fallback;
    const cleanBlocks = (rawBlocks: unknown, fallbackBlocks: ManagedContentPage['translations']['en'] extends infer T ? T extends { blocks: infer B } ? B : never : never) => (Array.isArray(rawBlocks) ? rawBlocks : fallbackBlocks).slice(0, 30).map((block, index) => {
      const source = block as Record<string, unknown>;
      return { id: sanitizePlain(source.id, 80) || `${fallback.slug}-${Date.now()}-${index}`, heading: sanitizePlain(source.heading, 160), body: sanitizeText(source.body, 5000), visible: source.visible !== false, kind: source.kind === 'FAQ' ? 'FAQ' as const : 'TEXT' as const };
    });
    const rawTranslations = page.translations && typeof page.translations === 'object' ? page.translations as Record<string, unknown> : {};
    const legacyEnglish = {
      title: sanitizePlain(page.title, 160) || fallback.translations.en?.title || '',
      intro: sanitizeText(page.intro, 1200) || fallback.translations.en?.intro || '',
      blocks: cleanBlocks(page.blocks, fallback.translations.en?.blocks || []),
    };
    const translations: ManagedContentPage['translations'] = {};
    for (const language of LANGUAGES) {
      const raw = rawTranslations[language];
      const value = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
      const fallbackTranslation = fallback.translations[language] || fallback.translations.en;
      translations[language as LanguageCode] = {
        title: sanitizePlain(value.title, 160) || (language === 'en' ? legacyEnglish.title : fallbackTranslation?.title || legacyEnglish.title),
        intro: sanitizeText(value.intro, 1200) || (language === 'en' ? legacyEnglish.intro : fallbackTranslation?.intro || legacyEnglish.intro),
        blocks: cleanBlocks(value.blocks, language === 'en' ? legacyEnglish.blocks : fallbackTranslation?.blocks || legacyEnglish.blocks),
      };
    }
    return { slug: fallback.slug, label: fallback.label, visible: page.visible !== false, translations };
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
