import DestinationManager from '@/components/admin/DestinationManager';

export default function AdminDestinationsPage() {
  return (
    <main className="min-h-screen bg-[#070F1E] px-4 py-5 text-[#F8FAFC] sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#EAB308]">Destination Manager</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white lg:text-6xl">Destination Hub Studio</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
            Manage visual destination cards, SEO slugs, premium descriptions, and hub-level tour relationships.
          </p>
        </div>
        <DestinationManager />
      </div>
    </main>
  );
}
