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
        <span className="text-2xl font-black uppercase tracking-[0.34em] text-white">TALAGO</span>
        <span className="h-2.5 w-2.5 rounded-full bg-[#EAB308] shadow-lg shadow-[#EAB308]/40" />
      </div>
      <style>{`@keyframes loader-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
    </div>
  );
}
