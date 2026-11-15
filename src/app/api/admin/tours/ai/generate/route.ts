import { NextRequest, NextResponse } from 'next/server';
import { isAiConfigured } from '@/lib/gemini';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';
import {
  generateTourDraft,
  fetchAndExtractUrlContent,
} from '@/lib/ai-tour-generator';

const LIMIT = 20;
const WINDOW_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  const limit = rateLimit(clientKey(request, 'ai-tour-generate'), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return tooManyRequests(limit.retryAfterSeconds);
  }

  try {
    const configured = await isAiConfigured();
    if (!configured) {
      return NextResponse.json(
        {
          error:
            'No AI Provider is configured. Please configure an AI Provider in Admin Settings > AI Providers or set GEMINI_API_KEY in environment variables.',
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { mode, prompt, url, sourceText, destinationName, category } = body;

    if (mode === 'url') {
      if (!url || typeof url !== 'string' || !url.trim()) {
        return NextResponse.json(
          { error: 'A valid website URL is required for URL extraction.' },
          { status: 400 }
        );
      }

      // Step 1: Fetch and clean URL content
      const fetchResult = await fetchAndExtractUrlContent(url.trim());
      if (!fetchResult.success) {
        return NextResponse.json(
          {
            error: fetchResult.error,
            blocked: fetchResult.blocked,
            suggestion: fetchResult.blocked
              ? 'Please copy the tour description and itinerary directly from the website and paste it into the "AI Prompt / Raw Text" tab.'
              : undefined,
          },
          { status: fetchResult.blocked ? 422 : 400 }
        );
      }

      // Step 2: Synthesize original Talago tour draft
      const draftResult = await generateTourDraft({
        prompt: prompt || 'Extract factual details and write an original, high-converting Talago experience.',
        sourceText: fetchResult.text,
        sourceUrl: fetchResult.sourceUrl,
        destinationName,
        category,
      });

      if (!draftResult.success) {
        return NextResponse.json({ error: draftResult.error }, { status: 500 });
      }

      return NextResponse.json(draftResult);
    }

    if (mode === 'text' || mode === 'prompt' || !mode) {
      const activePrompt = (prompt || '').trim();
      const activeSourceText = (sourceText || '').trim();

      if (!activePrompt && !activeSourceText) {
        return NextResponse.json(
          { error: 'Please enter a description, brief, or tour notes for the AI builder.' },
          { status: 400 }
        );
      }

      const draftResult = await generateTourDraft({
        prompt: activePrompt,
        sourceText: activeSourceText,
        destinationName,
        category,
      });

      if (!draftResult.success) {
        return NextResponse.json({ error: draftResult.error }, { status: 500 });
      }

      return NextResponse.json(draftResult);
    }

    return NextResponse.json({ error: `Unsupported mode: ${mode}` }, { status: 400 });
  } catch (error: any) {
    console.error('[ai-tour-generate] Route handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process AI tour generation request.' },
      { status: 500 }
    );
  }
}
