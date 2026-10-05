import { NextRequest, NextResponse } from 'next/server';
import { translateTourContent, isGeminiConfigured, SupportedLanguage } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json(
        {
          error:
            'GEMINI_API_KEY is not configured in .env. Please provide a valid Google Gemini API key to enable AI auto-translation.',
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
