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
      <div className="mx-auto max-w-lg p-6">
        <h1 className="mb-6 text-xl font-bold text-gray-900">Trip Dispatcher</h1>
        <DispatchSelector tours={tourOptions} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Trip Dispatcher</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tour ID: {tourId} — Date: {date}
        </p>
      </div>
      <TripDispatcher tourId={tourId} date={date} />
    </div>
  );
}
