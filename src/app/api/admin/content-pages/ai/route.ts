import { NextRequest, NextResponse } from 'next/server';
import {
  generateContentPage,
  isAiConfigured,
  translateContentPage,
  translateSingleLanguage,
  generateContentFaqs,
  rewriteContentBlock,
  type SupportedLanguage,
} from '@/lib/gemini';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import { sanitizePlain, sanitizeText } from '@/utils/sanitize';
import { isAdminRequest } from '@/utils/adminAuth';

const ALL_TRANSLATION_LANGUAGES: SupportedLanguage[] = ['de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'];

function cleanPage(value: unknown) {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const blocks = Array.isArray(source.blocks) ? source.blocks.slice(0, 50).map((raw) => {
    const block = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
    return {
      heading: sanitizePlain(block.heading, 160),
      body: sanitizeText(block.body, 10000),
      kind: block.kind === 'FAQ' ? ('FAQ' as const) : ('TEXT' as const),
    };
  }) : [];
  return { title: sanitizePlain(source.title, 160), intro: sanitizeText(source.intro, 2000), blocks };
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const limit = rateLimit(clientKey(request, 'ai-content-pages'), 20, 60 * 1000);
  if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

  try {
    if (!(await isAiConfigured())) {
      return NextResponse.json({ error: 'No AI provider is configured.' }, { status: 503 });
    }

    const body = await request.json();
    const action = body.action || 'generate';

    // 1. Generate full English draft from brief
    if (action === 'generate') {
      const brief = sanitizeText(body.brief, 4000);
      if (!brief) return NextResponse.json({ error: 'Write an example or brief first.' }, { status: 400 });
      const generated = await generateContentPage(brief, sanitizePlain(body.pageLabel, 120) || 'content');
      return NextResponse.json({ page: cleanPage(generated) });
    }

    // 2. Translate English to a single target language
    if (action === 'translate-single') {
      const source = cleanPage(body.source);
      const targetLang = body.targetLang as SupportedLanguage;
      if (!ALL_TRANSLATION_LANGUAGES.includes(targetLang)) {
        return NextResponse.json({ error: 'Invalid target language for translation.' }, { status: 400 });
      }
      if (!source.title || !source.intro) {
        return NextResponse.json({ error: 'English title and intro are required before translation.' }, { status: 400 });
      }
      const translated = await translateSingleLanguage(source, targetLang);
      return NextResponse.json({ page: cleanPage(translated), language: targetLang });
    }

    // 3. Translate to all configured languages
    if (action === 'translate' || action === 'translate-all') {
      const source = cleanPage(body.source);
      if (!source.title || !source.intro) {
        return NextResponse.json({ error: 'English title and intro are required before translation.' }, { status: 400 });
      }
      const translations = await translateContentPage(source, ALL_TRANSLATION_LANGUAGES);
      return NextResponse.json({
        translations: Object.fromEntries(
          Object.entries(translations).map(([language, page]) => [language, cleanPage(page)]),
        ),
      });
    }

    // 4. Generate FAQ items based on current page title & intro
    if (action === 'generate-faqs') {
      const pageTitle = sanitizePlain(body.title, 160);
      const intro = sanitizeText(body.intro, 2000);
      if (!pageTitle) {
        return NextResponse.json({ error: 'Page title is required to draft FAQs.' }, { status: 400 });
      }
      const faqs = await generateContentFaqs(pageTitle, intro);
      return NextResponse.json({
        blocks: faqs.map((f) => ({
          heading: sanitizePlain(f.heading, 160),
          body: sanitizeText(f.body, 10000),
          kind: 'FAQ' as const,
        })),
      });
    }

    // 5. Rewrite, shorten, or expand a single content block
    if (action === 'rewrite-block') {
      const text = sanitizeText(body.text, 5000);
      const mode = (body.mode === 'shorten' || body.mode === 'expand') ? body.mode : 'rewrite';
      if (!text) {
        return NextResponse.json({ error: 'Text is required to rewrite.' }, { status: 400 });
      }
      const revised = await rewriteContentBlock(text, mode);
      return NextResponse.json({ text: sanitizeText(revised, 10000) });
    }

    return NextResponse.json({ error: `Unknown AI action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[content-pages-ai]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI content generation failed' }, { status: 500 });
  }
}
