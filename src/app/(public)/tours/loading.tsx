export default function ToursLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-8 w-56 rounded-lg bg-white/10" />
          <div className="h-4 w-80 max-w-full rounded bg-white/5" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1528]">
              <div className="aspect-[16/10] w-full bg-white/5" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-20 rounded bg-white/10" />
                  <div className="h-8 w-24 rounded-lg bg-[#00E5FF]/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
