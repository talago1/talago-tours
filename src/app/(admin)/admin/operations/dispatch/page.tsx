import TripDispatcher from '@/components/admin/TripDispatcher';
import DispatchSelector from './DispatchSelector';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Trip Dispatcher | Talago Tours',
  description: 'Assign crew and fleet, log trip expenses.',
};

export default async function DispatchPage({
  searchParams,
}: {
  searchParams: { tourId?: string; date?: string };
}) {
  const tourId = searchParams.tourId;
  const date = searchParams.date;

  if (!tourId || !date) {
    const tours = await prisma.tour.findMany({
      select: { id: true, translations: true },
      orderBy: { createdAt: 'desc' },
    });

    const tourOptions = tours.map((t) => {
      const translations = t.translations as Record<string, { title?: string }>;
      const title = translations?.en?.title || translations?.de?.title || 'Untitled Tour';
      return { id: t.id, title };
    });

    return (
      <div className="mx-auto max-w-xl px-6 py-10 text-[#F8FAFC]">
        <h1 className="mb-2 text-3xl font-black text-white">Trip Dispatcher Studio</h1>
        <p className="mb-6 text-sm text-slate-400">Select an active experience and departure date to manage crew, fleet, and trip expenses.</p>
        <DispatchSelector tours={tourOptions} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 text-[#F8FAFC]">
      <TripDispatcher tourId={tourId} date={date} />
    </div>
  );
}

