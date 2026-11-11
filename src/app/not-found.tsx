import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070F1E] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center backdrop-blur-sm shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-mono text-xl font-bold">
          404
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          The page or experience you are looking for does not exist or may have been relocated.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors text-sm"
          >
            Back to Home
          </Link>
          <Link
            href="/tours"
            className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-semibold hover:bg-slate-700 transition-colors text-sm"
          >
            Explore Tours
          </Link>
        </div>
      </div>
    </div>
  );
}

