export default function TourDetailLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-5 w-64 rounded bg-white/5" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-[16/9] w-full rounded-2xl bg-white/5" />
            <div className="h-8 w-3/4 rounded-lg bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-full rounded bg-white/5" />
              <div className="h-4 w-5/6 rounded bg-white/5" />
              <div className="h-4 w-2/3 rounded bg-white/5" />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-4 h-fit">
            <div className="h-7 w-32 rounded bg-white/10" />
            <div className="h-11 w-full rounded-xl bg-white/5" />
            <div className="h-11 w-full rounded-xl bg-white/5" />
            <div className="h-12 w-full rounded-xl bg-[#00E5FF]/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
