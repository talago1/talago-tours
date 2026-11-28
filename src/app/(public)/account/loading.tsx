export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 space-y-6 animate-pulse">
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/10" />
            <div className="space-y-2">
              <div className="h-5 w-44 rounded bg-white/10" />
              <div className="h-4 w-56 rounded bg-white/5" />
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#0B1528] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-32 rounded bg-white/10" />
                <div className="h-6 w-24 rounded-full bg-white/10" />
              </div>
              <div className="h-4 w-2/3 rounded bg-white/5" />
              <div className="h-4 w-1/3 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
