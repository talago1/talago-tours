import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const revalidate = 300;

const getNavbarDestinations = unstable_cache(
  async () => {
    return prisma.destination.findMany({
      where: { isVisible: true },
      select: {
        id: true,
        name: true,
        slug: true,
        translations: true,
      },
      orderBy: { name: 'asc' },
    });
  },
  ['navbar-destinations-v1'],
  { revalidate: 300, tags: ['destinations'] }
);

export async function GET() {
  try {
    const destinations = await getNavbarDestinations();

    return NextResponse.json(
      { destinations },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch destinations' },
      { status: 500 },
    );
  }
}
