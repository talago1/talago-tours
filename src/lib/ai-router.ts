import { prisma } from '@/lib/prisma';
import { parseSettingValue, serializeSettingValue } from '@/lib/systemSettings';

if (typeof window !== 'undefined') {
  throw new Error('Security Violation: ai-router cannot be imported into client bundle.');
}

export type AiProviderType = 'gemini' | 'openai_compatible';

export interface AiProviderConfig {
  id: string;
  name: string;
  type: AiProviderType;
  baseUrl?: string;
  apiKey: string;
  modelId: string;
  isActive: boolean;
  priority: number;
  lastUsedAt?: string;
  lastError?: string;
}

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  jsonMode?: boolean;
}

export interface GenerateResult {
  text: string;
  providerUsed: string;
  modelUsed: string;
  attemptsCount: number;
}

const SETTINGS_KEY = 'ai_providers';
const COOLDOWN_MS = 60_000; // 60 seconds after a rate limit or 5xx

// Ephemeral in-memory cooldown tracker (cleared on server restart)
const cooldownMap = new Map<string, number>();

/**
 * Loads registered providers from database, falling back to environment keys.
 */
export async function getAiProviders(includeSecrets = false): Promise<AiProviderConfig[]> {
  let dbProviders: AiProviderConfig[] = [];

  try {
    const record = await prisma.systemSetting.findUnique({
      where: { key: SETTINGS_KEY },
    });

    if (record) {
      dbProviders = parseSettingValue<AiProviderConfig[]>(record.value, []);
    }
  } catch (err) {
    console.warn('[ai-router] Unable to load AI providers from DB, falling back to env:', err);
  }

  // If no providers in DB, build defaults from environment variables
  if (dbProviders.length === 0) {
    const envProviders: AiProviderConfig[] = [];
    const primaryGemini = process.env.GEMINI_API_KEY?.trim();

    if (primaryGemini) {
      envProviders.push({
        id: 'env-gemini-primary',
        name: 'Google Gemini Flash (Primary Env)',
        type: 'gemini',
        apiKey: primaryGemini,
        modelId: 'gemini-3.8-flash',
        isActive: true,
        priority: 1,
      });
    }

    // Additional Gemini pool keys
    for (let i = 2; i <= 10; i++) {
      const extraKey = process.env[`GEMINI_API_KEY_${i}`]?.trim();
      if (extraKey) {
        envProviders.push({
          id: `env-gemini-pool-${i}`,
          name: `Google Gemini Flash (Pool #${i})`,
          type: 'gemini',
          apiKey: extraKey,
          modelId: 'gemini-3.8-flash',
          isActive: true,
          priority: i,
        });
      }
    }

    // Optional Groq env key
    const groqKey = process.env.GROQ_API_KEY?.trim();
    if (groqKey) {
      envProviders.push({
        id: 'env-groq',
        name: 'Groq Llama 3.3 70B (Env)',
        type: 'openai_compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: groqKey,
        modelId: 'llama-3.3-70b-versatile',
        isActive: true,
        priority: 20,
      });
    }

    // Optional OpenRouter env key
    const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
    if (openRouterKey) {
      envProviders.push({
        id: 'env-openrouter',
        name: 'OpenRouter (Env)',
        type: 'openai_compatible',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: openRouterKey,
        modelId: 'google/gemini-flash-1.5',
        isActive: true,
        priority: 30,
      });
    }

    // Optional DeepSeek env key
    const deepSeekKey = process.env.DEEPSEEK_API_KEY?.trim();
    if (deepSeekKey) {
      envProviders.push({
        id: 'env-deepseek',
        name: 'DeepSeek Chat (Env)',
        type: 'openai_compatible',
        baseUrl: 'https://api.deepseek.com',
        apiKey: deepSeekKey,
        modelId: 'deepseek-chat',
        isActive: true,
        priority: 40,
      });
    }

    dbProviders = envProviders;
  }

  // Sort by priority ascending
  dbProviders.sort((a, b) => a.priority - b.priority);

  if (includeSecrets) {
    return dbProviders;
  }

  // Mask API keys for safe client inspection
  return dbProviders.map((p) => ({
    ...p,
    apiKey: p.apiKey.length > 8 ? `${p.apiKey.slice(0, 4)}••••${p.apiKey.slice(-4)}` : '••••••••',
  }));
}

/**
 * Saves providers back to the database.
 */
export async function saveAiProviders(providers: AiProviderConfig[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key: SETTINGS_KEY },
    create: {
      key: SETTINGS_KEY,
      value: serializeSettingValue(providers),
    },
    update: {
      value: serializeSettingValue(providers),
    },
  });
}

/**
 * Executes a completion request against a specific provider.
 */
/**
 * Models that have been sunset by Google – automatically redirected to supported equivalents.
 */
const GEMINI_MODEL_ALIASES: Record<string, string> = {
  'gemini-1.5-flash': 'gemini-3.8-flash',
  'gemini-1.5-flash-latest': 'gemini-3.8-flash',
  'gemini-2.5-flash': 'gemini-3.8-flash',
  'gemini-2.5-flash-preview': 'gemini-3.8-flash',
};

async function callProvider(provider: AiProviderConfig, options: GenerateOptions): Promise<string> {
  const { prompt, systemPrompt, temperature = 0.4, jsonMode = false } = options;

  if (provider.type === 'gemini') {
    // Resolve any sunset model aliases before calling the API
    const resolvedModel = GEMINI_MODEL_ALIASES[provider.modelId] ?? provider.modelId;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${resolvedModel}:generateContent?key=${provider.apiKey}`;
    const contents: any[] = [];

    let combinedPrompt = prompt;
    if (systemPrompt) {
      combinedPrompt = `${systemPrompt}\n\n---\n\n${prompt}`;
    }

    contents.push({
      parts: [{ text: combinedPrompt }],
    });

    const body: any = {
      contents,
      generationConfig: {
        temperature,
      },
    };

    if (jsonMode) {
      body.generationConfig.responseMimeType = 'application/json';
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      // On 503 (capacity spike), automatically retry with gemini-3.5-flash fallback
      if (res.status === 503 && resolvedModel === 'gemini-3.8-flash') {
        console.warn('[ai-router] gemini-3.8-flash returned 503, retrying with gemini-3.5-flash…');
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${provider.apiKey}`;
        const fallbackRes = await fetch(fallbackEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (fallbackText) return fallbackText.trim();
        }
      }
      throw new Error(`Gemini API HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Gemini response did not contain text content.');
    }

    return text.trim();
  }

  if (provider.type === 'openai_compatible') {
    const baseUrl = (provider.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const endpoint = `${baseUrl}/chat/completions`;

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const body: any = {
      model: provider.modelId,
      messages,
      temperature,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`OpenAI-compatible HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const message = data.choices?.[0]?.message;
    const text = message?.content;

    if (!text) {
      throw new Error('OpenAI-compatible response did not contain message content.');
    }

    return text.trim();
  }

  throw new Error(`Unsupported provider type: ${provider.type}`);
}

/**
 * Universal AI Router with Smart Failover & Automatic Cooldown.
 * Tries the active providers in order of priority.
 * If provider throws rate limit or server error, marks provider on cooldown and tries next.
 */
export async function executeAiPrompt(options: GenerateOptions): Promise<GenerateResult> {
  const providers = await getAiProviders(true);
  const activeProviders = providers.filter((p) => p.isActive);

  if (activeProviders.length === 0) {
    throw new Error('No active AI providers configured. Please add an AI provider in Admin Settings.');
  }

  const now = Date.now();
  const errors: string[] = [];
  let attemptsCount = 0;

  for (const provider of activeProviders) {
    const cooldownUntil = cooldownMap.get(provider.id) || 0;
    if (now < cooldownUntil) {
      // Temporarily rate-limited, skip to next
      continue;
    }

    attemptsCount++;

    try {
      const text = await callProvider(provider, options);
      // Success: clear cooldown if any
      cooldownMap.delete(provider.id);

      return {
        text,
        providerUsed: provider.name,
        modelUsed: provider.modelId,
        attemptsCount,
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.warn(`[ai-router] Failover: Provider "${provider.name}" failed: ${errMsg}`);
      errors.push(`${provider.name} (${provider.modelId}): ${errMsg}`);

      // Set cooldown on rate-limit (429) or high demand / server error (503/5xx)
      if (errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('500') || errMsg.includes('502')) {
        cooldownMap.set(provider.id, now + COOLDOWN_MS);
      }
    }
  }

  // If all providers failed or were on cooldown, attempt one retry ignoring cooldown if all were skipped
  if (attemptsCount === 0 && activeProviders.length > 0) {
    const fallbackProvider = activeProviders[0];
    try {
      const text = await callProvider(fallbackProvider, options);
      cooldownMap.delete(fallbackProvider.id);
      return {
        text,
        providerUsed: fallbackProvider.name,
        modelUsed: fallbackProvider.modelId,
        attemptsCount: 1,
      };
    } catch (err: any) {
      errors.push(`${fallbackProvider.name}: ${err?.message || String(err)}`);
    }
  }

  throw new Error(`All AI providers failed:\n${errors.join('\n')}`);
}

/**
 * Tests connectivity and response latency for a single provider candidate.
 */
export async function testAiProvider(
  provider: Omit<AiProviderConfig, 'id'>,
): Promise<{ success: boolean; latencyMs: number; responseSnippet?: string; error?: string }> {
  const start = Date.now();

  try {
    const text = await callProvider(
      { ...provider, id: 'test-temp' },
      {
        prompt: 'Ping test. Reply with exactly "PONG" and nothing else.',
        temperature: 0.1,
      },
    );

    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      responseSnippet: text.slice(0, 100),
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err?.message || 'Connection test failed',
    };
  }
}
