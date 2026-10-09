import AiKeyPoolManager from '@/components/admin/AiKeyPoolManager';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function AdminSettingsAiPage() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-6 py-8 text-[#F8FAFC] lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin/settings"
            className="mb-4 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to System Settings
          </Link>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#00E5FF]">
            AI Infrastructure & Gateway
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white lg:text-5xl">
            Universal AI Key Pool & Models
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Configure dynamic multi-provider routing (Gemini, Groq, OpenRouter, DeepSeek) with automatic failover on 429 rate limits or high-load surges.
          </p>
        </div>

        <AiKeyPoolManager />
      </div>
    </main>
  );
}
