export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8 animate-pulse">
        <div className="h-9 w-64 rounded-lg bg-white/10" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1528]">
              <div className="aspect-[16/10] w-full bg-white/5" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-4/5 rounded bg-white/10" />
                <div className="h-4 w-full rounded bg-white/5" />
                <div className="h-4 w-2/3 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
