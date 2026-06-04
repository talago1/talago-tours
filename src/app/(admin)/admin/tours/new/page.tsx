import { prisma } from '@/lib/prisma';
import TourBuilderForm from '@/components/admin/TourBuilderForm';

export const dynamic = 'force-dynamic';

export default async function NewTourPage() {
  const zones = await prisma.zone.findMany({
    orderBy: { name: 'asc' },
  });

  return (
    <main className="min-h-screen bg-[#070F1E] py-8 px-4">
      <TourBuilderForm zones={zones} />
    </main>
  );
}
