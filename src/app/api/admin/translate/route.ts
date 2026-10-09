import { NextRequest, NextResponse } from 'next/server';
import { translateTourContent, isAiConfigured, SupportedLanguage } from '@/lib/gemini';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

const LIMIT = 30;
const WINDOW_MS = 60 * 1000; // 1 minute

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'ai-translate'), LIMIT, WINDOW_MS);
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
    const { source, targetLangs } = body;

    if (!source || !source.title) {
      return NextResponse.json(
        { error: 'Source experience title is required for translation.' },
        { status: 400 },
      );
    }

    const defaultLangs: SupportedLanguage[] = ['de', 'ru', 'fr', 'it', 'pl', 'es', 'uk'];
    const selectedLangs: SupportedLanguage[] = Array.isArray(targetLangs) && targetLangs.length > 0
      ? targetLangs
      : defaultLangs;

    const translations = await translateTourContent(source, selectedLangs);

    return NextResponse.json({
      success: true,
      translations,
    });
  } catch (error: any) {
    console.error('AI translation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to auto-translate tour content' },
      { status: 500 },
    );
  }
}
