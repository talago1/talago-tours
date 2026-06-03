export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070F1E]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-[#00E5FF]"
            style={{
              width: '40%',
              animation: 'loader-slide 1.2s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">TALAGO</p>
      </div>
      <style>{`@keyframes loader-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
    </div>
  );
}
