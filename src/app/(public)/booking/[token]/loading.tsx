export default function BookingTokenLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] text-white">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-6 animate-pulse">
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-40 rounded bg-white/10" />
            <div className="h-6 w-24 rounded-full bg-white/10" />
          </div>
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="h-16 rounded-xl bg-white/5" />
            <div className="h-16 rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-3 h-56">
          <div className="h-5 w-36 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-4/5 rounded bg-white/5" />
        </div>
      </div>
    </div>
  );
}
