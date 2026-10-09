'use client';

import { useState, useEffect } from 'react';
import {
  Bot,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Zap,
  Shield,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface AiProvider {
  id: string;
  name: string;
  type: 'gemini' | 'openai_compatible';
  baseUrl?: string;
  apiKey: string;
  modelId: string;
  isActive: boolean;
  priority: number;
}

interface TestResult {
  providerId: string;
  success: boolean;
  latencyMs?: number;
  error?: string;
  snippet?: string;
}

const PRESETS = [
  {
    name: 'Google Gemini (Flash)',
    type: 'gemini' as const,
    baseUrl: '',
    modelId: 'gemini-1.5-flash',
    description: 'High quota free tier, official Google Generative API',
  },
  {
    name: 'Groq Cloud (Llama 3.3)',
    type: 'openai_compatible' as const,
    baseUrl: 'https://api.groq.com/openai/v1',
    modelId: 'llama-3.3-70b-versatile',
    description: 'Ultra-low latency LPU inference, OpenAI-compatible',
  },
  {
    name: 'OpenRouter (Multi-Model)',
    type: 'openai_compatible' as const,
    baseUrl: 'https://openrouter.ai/api/v1',
    modelId: 'google/gemini-flash-1.5',
    description: 'Unified gateway for DeepSeek, Gemini, Claude, Llama',
  },
  {
    name: 'DeepSeek Chat',
    type: 'openai_compatible' as const,
    baseUrl: 'https://api.deepseek.com',
    modelId: 'deepseek-chat',
    description: 'DeepSeek V3 high-intelligence reasoning endpoint',
  },
];

export default function AiKeyPoolManager() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New provider form
  const [form, setForm] = useState<Omit<AiProvider, 'id'>>({
    name: '',
    type: 'gemini',
    baseUrl: '',
    apiKey: '',
    modelId: 'gemini-1.5-flash',
    isActive: true,
    priority: 10,
  });

  const loadProviders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings/ai');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      setStatusMessage({ text: 'Failed to load AI providers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleToggleActive = async (provider: AiProvider) => {
    const updated = providers.map((p) =>
      p.id === provider.id ? { ...p, isActive: !p.isActive } : p,
    );
    setProviders(updated);
    await saveAllProviders(updated);
  };

  const saveAllProviders = async (listToSave: AiProvider[]) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providers: listToSave }),
      });
      if (!res.ok) throw new Error('Failed to save AI configuration');
      const data = await res.json();
      setProviders(data.providers || listToSave);
      setStatusMessage({ text: 'AI Key Pool configuration saved successfully', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'Error saving providers', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this AI provider?')) return;
    try {
      const res = await fetch(`/api/admin/settings/ai?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || providers.filter((p) => p.id !== id));
      }
    } catch {
      alert('Failed to delete provider');
    }
  };

  const handleTest = async (provider: AiProvider) => {
    setTestingId(provider.id);
    setTestResults((prev) => ({ ...prev, [provider.id]: undefined as any }));

    try {
      const res = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          provider,
        }),
      });

      const data = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          providerId: provider.id,
          success: data.success,
          latencyMs: data.latencyMs,
          error: data.error,
          snippet: data.responseSnippet,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider.id]: {
          providerId: provider.id,
          success: false,
          error: err?.message || 'Network test error',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.apiKey.trim() || !form.modelId.trim()) {
      alert('Please fill all required fields');
      return;
    }

    const newProvider: AiProvider = {
      id: `ai-${Date.now().toString(36)}`,
      name: form.name.trim(),
      type: form.type,
      baseUrl: form.baseUrl?.trim() || undefined,
      apiKey: form.apiKey.trim(),
      modelId: form.modelId.trim(),
      isActive: form.isActive,
      priority: Number(form.priority) || 10,
    };

    const updated = [...providers, newProvider].sort((a, b) => a.priority - b.priority);
    await saveAllProviders(updated);
    setModalOpen(false);
    setForm({
      name: '',
      type: 'gemini',
      baseUrl: '',
      apiKey: '',
      modelId: 'gemini-1.5-flash',
      isActive: true,
      priority: (providers.length + 1) * 10,
    });
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      type: preset.type,
      baseUrl: preset.baseUrl,
      modelId: preset.modelId,
    }));
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[#00E5FF]/20 bg-gradient-to-br from-[#0B1528] to-[#070F1E] p-6 lg:p-8">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#00E5FF]/10 blur-3xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00E5FF]/10 text-[#00E5FF] shadow-inner shadow-[#00E5FF]/20">
                <Bot className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-black text-white lg:text-2xl">
                Universal AI Key Pool & Failover Router
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-slate-300">
              Manage multi-provider AI endpoints (Gemini, Groq, OpenRouter, DeepSeek). If the primary provider hits a rate limit (429) or high demand (503), the engine automatically fails over to the next active key in milliseconds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProviders}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Pool
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Add AI Provider
            </Button>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs font-bold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-300 border border-red-500/20'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            {statusMessage.text}
          </div>
        )}
      </div>

      {/* Providers Table / Cards */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#00E5FF]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
              Active Routing Pool ({providers.filter((p) => p.isActive).length} / {providers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Sorted by priority: Lower number executes first
          </span>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#00E5FF]" />
          </div>
        ) : providers.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-12 text-center">
            <Bot className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-300">No AI Providers in the Pool</p>
            <p className="mt-1 text-xs text-slate-500">
              Click &quot;Add AI Provider&quot; above to connect Gemini, Groq, or OpenRouter keys.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((p, index) => {
              const test = testResults[p.id];
              const isTesting = testingId === p.id;

              return (
                <div
                  key={p.id}
                  className={`group relative flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-all lg:flex-row lg:items-center ${
                    p.isActive
                      ? 'border-white/10 bg-white/[0.03] hover:border-white/20'
                      : 'border-white/5 bg-white/[0.01] opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Priority Indicator */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-xs font-black text-white">
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white">{p.name}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            p.type === 'gemini'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}
                        >
                          {p.type === 'gemini' ? 'Google Gemini' : 'OpenAI-Compatible'}
                        </span>
                        <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-slate-300">
                          {p.modelId}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>
                          Key: <code className="font-mono text-slate-300">{p.apiKey}</code>
                        </span>
                        {p.baseUrl && (
                          <span>
                            Base: <code className="font-mono text-slate-400">{p.baseUrl}</code>
                          </span>
                        )}
                      </div>

                      {test && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          {test.success ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="h-3 w-3" />
                              Healthy ({test.latencyMs}ms)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-red-400 border border-red-500/20">
                              <AlertCircle className="h-3 w-3" />
                              Error: {test.error?.slice(0, 80)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 border-t border-white/5 pt-3 lg:border-t-0 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => handleTest(p)}
                      disabled={isTesting}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                    >
                      {isTesting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00E5FF]" />
                      ) : (
                        <Zap className="h-3.5 w-3.5 text-[#EAB308]" />
                      )}
                      Test Key
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(p)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                        p.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          : 'bg-slate-700/30 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      className="rounded-xl p-2 text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400"
                      title="Delete Provider"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Provider Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl border border-white/10 bg-[#0B1528] p-6 shadow-2xl lg:p-8">
            <h3 className="text-xl font-black text-white">Register AI Provider</h3>
            <p className="mt-1 text-xs text-slate-400">
              Select a quick preset or configure a custom OpenAI-compatible endpoint.
            </p>

            {/* Quick Presets */}
            <div className="my-5 grid grid-cols-2 gap-2">
              {PRESETS.map((pr) => (
                <button
                  key={pr.name}
                  type="button"
                  onClick={() => applyPreset(pr)}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition-all hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5"
                >
                  <p className="text-xs font-bold text-white">{pr.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{pr.modelId}</p>
                </button>
              ))}
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300">Provider Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Groq Production Llama 3.3"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300">Provider Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#070F1E] px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                  >
                    <option value="gemini">Google Gemini API</option>
                    <option value="openai_compatible">OpenAI-Compatible REST</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300">Model ID</label>
                  <input
                    type="text"
                    required
                    value={form.modelId}
                    onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                    placeholder="gemini-1.5-flash / llama-3.3-70b-versatile"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              </div>

              {form.type === 'openai_compatible' && (
                <div>
                  <label className="text-xs font-bold text-slate-300">Base URL</label>
                  <input
                    type="url"
                    required
                    value={form.baseUrl}
                    onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                    placeholder="https://api.groq.com/openai/v1"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#00E5FF]"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300">API Key</label>
                <input
                  type="password"
                  required
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder="AIzaSy... or gsk_... or sk-..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-mono text-white outline-none focus:border-[#00E5FF]"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <Button type="submit" variant="primary" size="md" loading={saving}>
                  Add to Pool
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
