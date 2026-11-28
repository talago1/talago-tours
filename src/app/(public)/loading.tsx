export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative h-[70vh] min-h-[480px] w-full bg-[#0B1528] border-b border-white/5 flex items-center justify-center px-6">
        <div className="max-w-3xl w-full space-y-5 text-center">
          <div className="mx-auto h-5 w-44 rounded-full bg-white/10" />
          <div className="mx-auto h-12 w-3/4 rounded-2xl bg-white/10" />
          <div className="mx-auto h-5 w-2/3 rounded-xl bg-white/5" />
          <div className="mx-auto h-14 w-full max-w-xl rounded-2xl bg-white/10 mt-6" />
        </div>
      </div>

      {/* Tour Grid Skeleton */}
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-8 w-56 rounded-xl bg-white/10" />
          <div className="h-8 w-28 rounded-xl bg-white/5" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="aspect-[4/3] w-full bg-white/5" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="h-5 w-4/5 rounded bg-white/10" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
