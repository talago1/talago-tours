export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-[#070F1E] px-4 py-10 sm:px-6 animate-pulse">
      <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-5">
          <div className="h-8 w-48 rounded-xl bg-white/10" />
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-4">
            <div className="h-5 w-40 rounded bg-white/10" />
            <div className="h-11 w-full rounded-xl bg-white/5" />
            <div className="h-11 w-full rounded-xl bg-white/5" />
            <div className="h-11 w-full rounded-xl bg-white/5" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-4">
            <div className="h-5 w-36 rounded bg-white/10" />
            <div className="h-24 w-full rounded-xl bg-white/5" />
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-[#0B1528] p-6 space-y-4">
            <div className="h-32 w-full rounded-xl bg-white/5" />
            <div className="h-6 w-3/4 rounded bg-white/10" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
            <div className="border-t border-white/10 pt-4 flex justify-between">
              <div className="h-5 w-24 rounded bg-white/10" />
              <div className="h-6 w-20 rounded bg-white/15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
