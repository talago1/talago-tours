import { NextRequest, NextResponse } from 'next/server';
import {
  getAiProviders,
  saveAiProviders,
  testAiProvider,
  AiProviderConfig,
} from '@/lib/ai-router';
import { clientKey, rateLimit, tooManyRequests } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const providers = await getAiProviders(false);
    return NextResponse.json({ providers });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch AI providers' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider, providers } = body;

    // Test connectivity action
    if (action === 'test') {
      if (!provider || !provider.apiKey || !provider.modelId) {
        return NextResponse.json(
          { error: 'API Key and Model ID are required for testing' },
          { status: 400 },
        );
      }

      // If testing an existing provider with a masked key, fetch real key from DB
      let keyToTest = provider.apiKey;
      if (keyToTest.includes('••••')) {
        const fullProviders = await getAiProviders(true);
        const match = fullProviders.find((p) => p.id === provider.id);
        if (match) keyToTest = match.apiKey;
      }

      const result = await testAiProvider({
        ...provider,
        apiKey: keyToTest,
      });

      return NextResponse.json(result);
    }

    // Save full list action
    if (Array.isArray(providers)) {
      // Re-hydrate any masked keys from previous DB state
      const currentFull = await getAiProviders(true);
      const rehydrated = providers.map((p: AiProviderConfig) => {
        if (p.apiKey.includes('••••')) {
          const match = currentFull.find((c) => c.id === p.id);
          return match ? { ...p, apiKey: match.apiKey } : p;
        }
        return p;
      });

      await saveAiProviders(rehydrated);
      const updated = await getAiProviders(false);
      return NextResponse.json({ success: true, providers: updated });
    }

    // Single provider upsert
    if (provider) {
      const currentFull = await getAiProviders(true);
      let providerToSave = { ...provider };

      if (!providerToSave.id) {
        providerToSave.id = `provider-${Date.now().toString(36)}`;
      }

      if (providerToSave.apiKey.includes('••••')) {
        const match = currentFull.find((c) => c.id === providerToSave.id);
        if (match) providerToSave.apiKey = match.apiKey;
      }

      const existingIndex = currentFull.findIndex((c) => c.id === providerToSave.id);
      let updatedList: AiProviderConfig[];

      if (existingIndex >= 0) {
        updatedList = [...currentFull];
        updatedList[existingIndex] = providerToSave;
      } else {
        updatedList = [...currentFull, providerToSave];
      }

      await saveAiProviders(updatedList);
      const safeList = await getAiProviders(false);
      return NextResponse.json({ success: true, providers: safeList });
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process AI settings' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    const currentFull = await getAiProviders(true);
    const filtered = currentFull.filter((p) => p.id !== id);

    await saveAiProviders(filtered);
    const safeList = await getAiProviders(false);

    return NextResponse.json({ success: true, providers: safeList });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete AI provider' },
      { status: 500 },
    );
  }
}
