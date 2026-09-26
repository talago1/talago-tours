import { prisma } from '@/lib/prisma';
import UnifiedTourEditor from '@/components/admin/UnifiedTourEditor';

export const dynamic = 'force-dynamic';

export default async function NewTourPage() {
  const [zones, destinations] = await Promise.all([
    prisma.zone.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.destination.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <main className="min-h-screen bg-[#070F1E]">
      <UnifiedTourEditor zones={zones} destinations={destinations} />
    </main>
  );
}
