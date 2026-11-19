import { NextRequest, NextResponse } from 'next/server';
import { getManagedLanguages, saveManagedLanguages, inspectLanguageUsage } from '@/lib/languages';
import { ManagedLanguage } from '@/types/languages';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const languages = await getManagedLanguages();
    const withUsage = req.nextUrl.searchParams.get('usage') === 'true';

    if (withUsage) {
      const languagesWithUsage = await Promise.all(
        languages.map(async (l) => {
          const usage = await inspectLanguageUsage(l.code);
          return {
            ...l,
            usage,
          };
        })
      );
      return NextResponse.json({ success: true, languages: languagesWithUsage });
    }

    return NextResponse.json({ success: true, languages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // If payload is an entire array, save as whole list
    if (Array.isArray(body.languages)) {
      const languages: ManagedLanguage[] = body.languages;
      // Validate unique codes
      const codes = new Set<string>();
      for (const l of languages) {
        if (!l.code || typeof l.code !== 'string') {
          return NextResponse.json({ success: false, error: 'Invalid language code' }, { status: 400 });
        }
        const cleanCode = l.code.trim().toLowerCase();
        if (codes.has(cleanCode)) {
          return NextResponse.json({ success: false, error: `Duplicate language code: ${cleanCode}` }, { status: 400 });
        }
        codes.add(cleanCode);
      }
      await saveManagedLanguages(languages);
      return NextResponse.json({ success: true, languages });
    }

    // Adding or updating a single language
    const current = await getManagedLanguages();
    const { code, displayName, nativeName, flag, direction, isActive, includeInTranslations, isSource } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: 'Language code is required.' }, { status: 400 });
    }

    const cleanCode = code.trim().toLowerCase();
    const existingIndex = current.findIndex((l) => l.code === cleanCode);

    const updatedLang: ManagedLanguage = {
      code: cleanCode,
      displayName: displayName || cleanCode.toUpperCase(),
      nativeName: nativeName || displayName || cleanCode.toUpperCase(),
      flag: flag || '🌐',
      direction: direction === 'rtl' ? 'rtl' : 'ltr',
      isActive: isActive ?? true,
      includeInTranslations: includeInTranslations ?? !isSource,
      isSource: Boolean(isSource),
      order: existingIndex >= 0 ? current[existingIndex].order : current.length,
    };

    let nextList = [...current];
    if (existingIndex >= 0) {
      nextList[existingIndex] = updatedLang;
    } else {
      nextList.push(updatedLang);
    }

    // If this language was marked as source, ensure others are not
    if (updatedLang.isSource) {
      nextList = nextList.map((l) => (l.code === cleanCode ? l : { ...l, isSource: false }));
    }

    await saveManagedLanguages(nextList);
    return NextResponse.json({ success: true, languages: nextList });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const force = req.nextUrl.searchParams.get('force') === 'true';

    if (!code) {
      return NextResponse.json({ success: false, error: 'Language code is required.' }, { status: 400 });
    }

    const cleanCode = code.trim().toLowerCase();
    const current = await getManagedLanguages();
    const target = current.find((l) => l.code === cleanCode);

    if (!target) {
      return NextResponse.json({ success: false, error: 'Language not found.' }, { status: 404 });
    }

    if (target.isSource) {
      return NextResponse.json({ success: false, error: 'Cannot remove the primary source language.' }, { status: 400 });
    }

    // Inspect usage before deletion
    const usage = await inspectLanguageUsage(cleanCode);
    if (!usage.canSafelyDelete && !force) {
      return NextResponse.json({
        success: false,
        error: `Language "${target.displayName}" is used in ${usage.tourCount} tour(s) and ${usage.destinationCount} destination(s). Disable the language instead to preserve existing translations, or pass force=true to remove from configuration.`,
        usage,
        canSafelyDelete: false,
      }, { status: 409 });
    }

    const filtered = current.filter((l) => l.code !== cleanCode);
    await saveManagedLanguages(filtered);

    return NextResponse.json({
      success: true,
      message: `Language ${target.displayName} removed from configuration. Stored tour translations were preserved.`,
      languages: filtered,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
