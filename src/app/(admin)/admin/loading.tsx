export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-6 py-8 text-[#F8FAFC] lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <div className="h-4 w-24 rounded bg-white/10 mb-3 animate-pulse" />
          <div className="h-10 w-72 rounded bg-white/10 mb-4 animate-pulse" />
          <div className="h-4 w-96 rounded bg-white/10 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 animate-pulse">
              <div className="h-12 w-12 rounded-2xl bg-white/10 mb-5" />
              <div className="h-3 w-20 bg-white/10 mb-2" />
              <div className="h-8 w-32 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
