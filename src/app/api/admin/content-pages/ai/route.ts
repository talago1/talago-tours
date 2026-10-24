import { NextRequest, NextResponse } from 'next/server';
import { generateContentPage, isAiConfigured, translateContentPage, type SupportedLanguage } from '@/lib/gemini';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizeText } from '@/utils/sanitize';

const ALL_TRANSLATION_LANGUAGES: SupportedLanguage[] = ['de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'];

function cleanPage(value: unknown) {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const blocks = Array.isArray(source.blocks) ? source.blocks.slice(0, 30).map((raw) => {
    const block = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    return { heading: sanitizePlain(block.heading, 160), body: sanitizeText(block.body, 5000), kind: block.kind === 'FAQ' ? 'FAQ' as const : 'TEXT' as const };
  }) : [];
  return { title: sanitizePlain(source.title, 160), intro: sanitizeText(source.intro, 1200), blocks };
}

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'ai-content-pages'), 10, 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);
  try {
    if (!(await isAiConfigured())) return NextResponse.json({ error: 'No AI provider is configured.' }, { status: 503 });
    const body = await request.json();
    const action = body.action === 'translate' ? 'translate' : 'generate';
    if (action === 'generate') {
      const brief = sanitizeText(body.brief, 4000);
      if (!brief) return NextResponse.json({ error: 'Write an example or brief first.' }, { status: 400 });
      const generated = await generateContentPage(brief, sanitizePlain(body.pageLabel, 120) || 'content');
      return NextResponse.json({ page: cleanPage(generated) });
    }
    const source = cleanPage(body.source);
    if (!source.title || !source.intro) return NextResponse.json({ error: 'English title and intro are required before translation.' }, { status: 400 });
    const translations = await translateContentPage(source, ALL_TRANSLATION_LANGUAGES);
    return NextResponse.json({ translations: Object.fromEntries(Object.entries(translations).map(([language, page]) => [language, cleanPage(page)])) });
  } catch (error) {
    console.error('[content-pages-ai]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI content generation failed' }, { status: 500 });
  }
}
