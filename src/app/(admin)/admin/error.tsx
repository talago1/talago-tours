'use client';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#070F1E] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Dashboard Error</h1>
        <p className="text-slate-400 mb-6">Failed to load dashboard data. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-[#00E5FF] px-6 py-3 text-sm font-bold text-[#070F1E] hover:bg-[#00D4F0] transition-colors"
          >
            Try again
          </button>
          <a
            href="/admin"
            className="rounded-lg border border-white/10 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
